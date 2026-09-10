"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentPerformance = exports.getDashboardStats = void 0;
const supabase_1 = require("../../config/supabase");
const getDashboardStats = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        if (!tenantId) {
            return res.status(400).json({ success: false, error: { message: 'x-tenant-id header is required' } });
        }
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = req.query.startDate ? new Date(req.query.startDate) : thirtyDaysAgo;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        // 1. Total contacts for this tenant
        const { count: totalContacts } = await supabase_1.supabaseAdmin
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
        // 2. Total messages for THIS tenant only (tenant_id filter — fixes cross-tenant leak)
        const { count: totalMessages } = await supabase_1.supabaseAdmin
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
        // 3. Total active campaigns
        const { count: activeCampaigns } = await supabase_1.supabaseAdmin
            .from('campaigns')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .neq('status', 'draft')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
        // 4. Build volume chart from real message timestamps
        const { data: messagesByDay } = await supabase_1.supabaseAdmin
            .from('messages')
            .select('created_at')
            .eq('tenant_id', tenantId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
        const dayMap = {};
        for (const msg of (messagesByDay || [])) {
            const day = new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dayMap[day] = (dayMap[day] || 0) + 1;
        }
        const volumeData = Object.entries(dayMap).map(([date, messages]) => ({ date, messages }));
        // 5. Channel distribution from real conversations
        const { data: convChannels } = await supabase_1.supabaseAdmin
            .from('conversations')
            .select('channel')
            .eq('tenant_id', tenantId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
        const channelMap = {};
        for (const conv of (convChannels || [])) {
            const ch = conv.channel || 'unknown';
            channelMap[ch] = (channelMap[ch] || 0) + 1;
        }
        const channelData = Object.entries(channelMap).map(([name, value]) => ({ name, value }));
        return res.status(200).json({
            success: true,
            data: {
                metrics: {
                    totalContacts: totalContacts || 0,
                    totalMessages: totalMessages || 0,
                    activeCampaigns: activeCampaigns || 0
                },
                volumeData,
                channelData
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: { message: error.message } });
    }
};
exports.getDashboardStats = getDashboardStats;
const getAgentPerformance = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        if (!tenantId) {
            return res.status(400).json({ success: false, error: { message: 'x-tenant-id header is required' } });
        }
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = req.query.startDate ? new Date(req.query.startDate) : thirtyDaysAgo;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        const { data: members, error: membersError } = await supabase_1.supabaseAdmin
            .from('tenant_members')
            .select('user_id, users(id, first_name, last_name)')
            .eq('tenant_id', tenantId);
        if (membersError)
            throw membersError;
        const performance = [];
        for (const member of (members || [])) {
            if (!member.users)
                continue;
            const agentId = member.users.id;
            const { count: assignedCount } = await supabase_1.supabaseAdmin
                .from('conversations')
                .select('id', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .eq('assigned_to', agentId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());
            const { count: resolvedCount } = await supabase_1.supabaseAdmin
                .from('conversations')
                .select('id', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .eq('assigned_to', agentId)
                .eq('status', 'resolved')
                .gte('updated_at', startDate.toISOString())
                .lte('updated_at', endDate.toISOString());
            // Real outbound messages sent by this agent
            const { count: messagesSent } = await supabase_1.supabaseAdmin
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .eq('sender_type', 'agent')
                .eq('sender_id', agentId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());
            const user = member.users;
            performance.push({
                agentId,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Agent',
                assigned: assignedCount || 0,
                resolved: resolvedCount || 0,
                messagesSent: messagesSent || 0
            });
        }
        return res.status(200).json({ success: true, data: performance });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: { message: error.message } });
    }
};
exports.getAgentPerformance = getAgentPerformance;
