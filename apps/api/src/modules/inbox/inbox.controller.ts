import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { InboxEngine } from './inbox.engine';

export const getConversations = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { status = 'open', assignee_id } = req.query;
    
    let query = supabaseAdmin
      .from('conversations')
      .select(`
        *,
        contacts(first_name, last_name, phone, email),
        users!conversations_assigned_to_fkey(first_name, last_name, email, avatar_url)
      `)
      .eq('tenant_id', tenantId)
      .eq('status', status)
      .order('last_message_at', { ascending: false });

    if (assignee_id) {
      if (assignee_id === 'unassigned') {
        query = query.is('assigned_to', null);
      } else {
        query = query.eq('assigned_to', assignee_id);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { conversationId } = req.params;
    
    // Check if conversation belongs to tenant
    const { data: conv, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single();

    if (convError || !conv) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const assignAgent = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { conversationId } = req.params;
    const { assignee_id } = req.body; // Can be null to unassign

    // If assigned, verify the user is part of the tenant
    if (assignee_id) {
      const { data: member, error: memberError } = await supabaseAdmin
        .from('tenant_members')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', assignee_id)
        .single();
        
      if (memberError || !member) {
        return res.status(400).json({ success: false, error: { message: 'User is not a member of this tenant' } });
      }
    }

    const { error } = await supabaseAdmin
      .from('conversations')
      .update({ assigned_to: assignee_id || null })
      .eq('id', conversationId)
      .eq('tenant_id', tenantId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const getTenantMembers = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    
    const { data, error } = await supabaseAdmin
      .from('tenant_members')
      .select(`
        user_id,
        users(first_name, last_name, email, avatar_url)
      `)
      .eq('tenant_id', tenantId);

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const senderId = req.user?.sub;
    const { conversationId } = req.params;
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!content || content.length > 10000) {
      return res.status(400).json({ success: false, error: { message: 'Message content is required and must be at most 10,000 characters' } });
    }
    if (!senderId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const message = await InboxEngine.sendMessage({ tenantId, conversationId, senderId, content });
    return res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    const notFound = error.message === 'Conversation not found';
    return res.status(notFound ? 404 : 400).json({ success: false, error: { message: error.message } });
  }
};
