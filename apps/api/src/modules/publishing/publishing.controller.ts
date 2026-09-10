import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { PublishingEngine, PublishingValidationError, SUPPORTED_PLATFORMS } from './publishing.engine';
import { publishPlatform } from './publishing.adapters';

const errorResponse = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : 'Publishing request failed';
  const code = error instanceof PublishingValidationError ? error.code : 'PUBLISHING_ERROR';
  return res.status(error instanceof PublishingValidationError ? 422 : 400).json({
    success: false,
    error: { code, message }
  });
};

export const getCapabilities = (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      mode: 'live-when-configured',
      canCreateDrafts: true,
      canSchedule: true,
      canPublish: true,
      supportedPlatforms: SUPPORTED_PLATFORMS
    }
  });
};

export const publishPost = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const post: any = await PublishingEngine.getPost(req.params.id, tenantId);
    if (!['draft', 'failed'].includes(post.status)) throw new PublishingValidationError('Only drafts or failed posts can be published');
    const ids: Record<string, string> = {};
    for (const platform of post.platforms) ids[platform] = await publishPlatform(platform as any, { tenantId, content: post.content, media: post.post_media || [], postType: post.post_type });
    const { data, error } = await supabaseAdmin.from('posts').update({ status: 'published', published_at: new Date().toISOString(), external_ids: ids, last_error: null }).eq('id', post.id).select().single();
    if (error) throw new Error(`Failed to record published post: ${error.message}`);
    return res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    if (req.params.id) await supabaseAdmin.from('posts').update({ status: 'failed', last_error: error instanceof Error ? error.message : 'Provider publishing failed' }).eq('id', req.params.id).eq('tenant_id', tenantId);
    return errorResponse(res, error);
  }
};

export const getPosts = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        post_media(*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    return errorResponse(res, error);
  }
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const authorId = req.user!.sub; // From JWT middleware
    const { content, platforms, scheduledFor, mediaUrls, postType } = req.body ?? {};

    const post = await PublishingEngine.createPost({
      tenantId,
      authorId,
      content,
      platforms,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      mediaUrls,
      postType
    });

    return res.status(201).json({ success: true, data: post });
  } catch (error: unknown) {
    return errorResponse(res, error);
  }
};
