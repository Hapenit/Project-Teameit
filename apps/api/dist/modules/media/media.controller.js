"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMedia = exports.uploadMedia = exports.getMedia = void 0;
const supabase_1 = require("../../config/supabase");
const getMedia = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { data, error } = await supabase_1.supabaseAdmin
            .from('media_assets')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.getMedia = getMedia;
const uploadMedia = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
        }
        const filename = `${Date.now()}-${file.originalname}`;
        const filePath = `${tenantId}/${filename}`;
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase_1.supabaseAdmin
            .storage
            .from('tenant-media')
            .upload(filePath, file.buffer, {
            contentType: file.mimetype,
        });
        if (uploadError)
            throw uploadError;
        // Get public URL
        const { data: { publicUrl } } = supabase_1.supabaseAdmin
            .storage
            .from('tenant-media')
            .getPublicUrl(filePath);
        // Save metadata to DB
        const { data, error } = await supabase_1.supabaseAdmin
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
            await supabase_1.supabaseAdmin.storage.from('tenant-media').remove([filePath]);
            throw error;
        }
        return res.status(201).json({ success: true, data });
    }
    catch (error) {
        console.error('Media upload error:', error);
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.uploadMedia = uploadMedia;
const deleteMedia = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { id } = req.params;
        // Get the file URL to extract the path
        const { data: media, error: fetchError } = await supabase_1.supabaseAdmin
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
            await supabase_1.supabaseAdmin.storage.from('tenant-media').remove([filePath]);
        }
        // Delete from DB
        const { error: deleteError } = await supabase_1.supabaseAdmin
            .from('media_assets')
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenantId);
        if (deleteError)
            throw deleteError;
        return res.status(200).json({ success: true });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.deleteMedia = deleteMedia;
