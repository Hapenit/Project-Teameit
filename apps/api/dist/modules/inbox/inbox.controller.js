"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getTenantMembers = exports.assignAgent = exports.getMessages = exports.getConversations = void 0;
const supabase_1 = require("../../config/supabase");
const inbox_engine_1 = require("./inbox.engine");
const getConversations = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { status = 'open', assignee_id } = req.query;
        let query = supabase_1.supabaseAdmin
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
            }
            else {
                query = query.eq('assigned_to', assignee_id);
            }
        }
        const { data, error } = await query;
        if (error)
            throw error;
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.getConversations = getConversations;
const getMessages = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { conversationId } = req.params;
        // Check if conversation belongs to tenant
        const { data: conv, error: convError } = await supabase_1.supabaseAdmin
            .from('conversations')
            .select('id')
            .eq('id', conversationId)
            .eq('tenant_id', tenantId)
            .single();
        if (convError || !conv) {
            return res.status(404).json({ success: false, error: 'Conversation not found' });
        }
        const { data, error } = await supabase_1.supabaseAdmin
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
        if (error)
            throw error;
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.getMessages = getMessages;
const assignAgent = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { conversationId } = req.params;
        const { assignee_id } = req.body; // Can be null to unassign
        // If assigned, verify the user is part of the tenant
        if (assignee_id) {
            const { data: member, error: memberError } = await supabase_1.supabaseAdmin
                .from('tenant_members')
                .select('id')
                .eq('tenant_id', tenantId)
                .eq('user_id', assignee_id)
                .single();
            if (memberError || !member) {
                return res.status(400).json({ success: false, error: { message: 'User is not a member of this tenant' } });
            }
        }
        const { error } = await supabase_1.supabaseAdmin
            .from('conversations')
            .update({ assigned_to: assignee_id || null })
            .eq('id', conversationId)
            .eq('tenant_id', tenantId);
        if (error)
            throw error;
        return res.status(200).json({ success: true });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.assignAgent = assignAgent;
const getTenantMembers = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { data, error } = await supabase_1.supabaseAdmin
            .from('tenant_members')
            .select(`
        user_id,
        users(first_name, last_name, email, avatar_url)
      `)
            .eq('tenant_id', tenantId);
        if (error)
            throw error;
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.getTenantMembers = getTenantMembers;
const sendMessage = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const senderId = req.user?.sub;
        const { conversationId } = req.params;
        const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
        if (!content || content.length > 10000) {
            return res.status(400).json({ success: false, error: { message: 'Message content is required and must be at most 10,000 characters' } });
        }
        if (!senderId)
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        const message = await inbox_engine_1.InboxEngine.sendMessage({ tenantId, conversationId, senderId, content });
        return res.status(201).json({ success: true, data: message });
    }
    catch (error) {
        const notFound = error.message === 'Conversation not found';
        return res.status(notFound ? 404 : 400).json({ success: false, error: { message: error.message } });
    }
};
exports.sendMessage = sendMessage;
