import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';

export const getMedia = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { data, error } = await supabaseAdmin
      .from('media_assets')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const uploadMedia = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    }

    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = `${tenantId}/${filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('tenant-media')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('tenant-media')
      .getPublicUrl(filePath);

    // Save metadata to DB
    const { data, error } = await supabaseAdmin
      .from('media_assets')
      .insert({
        tenant_id: tenantId,
        filename: file.originalname,
        file_url: publicUrl,
        mime_type: file.mimetype,
        size_bytes: file.size
      })
      .select()
      .single();

    if (error) {
      // Rollback storage upload
      await supabaseAdmin.storage.from('tenant-media').remove([filePath]);
      throw error;
    }

    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    console.error('Media upload error:', error);
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const deleteMedia = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { id } = req.params;

    // Get the file URL to extract the path
    const { data: media, error: fetchError } = await supabaseAdmin
      .from('media_assets')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !media) {
      return res.status(404).json({ success: false, error: { message: 'Media not found' } });
    }

    // Extract path from public URL
    const pathParts = media.file_url.split('/tenant-media/');
    if (pathParts.length > 1) {
      const filePath = pathParts[1];
      // Delete from storage
      await supabaseAdmin.storage.from('tenant-media').remove([filePath]);
    }

    // Delete from DB
    const { error: deleteError } = await supabaseAdmin
      .from('media_assets')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (deleteError) throw deleteError;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};
