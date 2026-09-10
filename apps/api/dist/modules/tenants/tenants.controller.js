"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchActiveTenant = exports.getTenants = exports.createTenant = void 0;
const supabase_1 = require("../../config/supabase");
const createTenant = async (req, res) => {
    try {
        const { name, slug } = req.body;
        const userId = req.user?.sub;
        if (!userId) {
            return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User ID missing in token' } });
        }
        if (!name || !slug) {
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'Name and slug are required' } });
        }
        // 1. Create tenant
        const { data: tenant, error: tenantError } = await supabase_1.supabaseAdmin
            .from('tenants')
            .insert({ name, slug, status: 'trial' })
            .select()
            .single();
        if (tenantError) {
            // Handle unique slug violation gracefully
            if (tenantError.code === '23505') {
                return res.status(409).json({ success: false, error: { code: 'SLUG_TAKEN', message: 'This workspace URL is already taken. Please choose another.' } });
            }
            throw tenantError;
        }
        // 2. Find or seed the 'owner' role for this tenant
        // First check if a system-level owner role exists (tenant_id IS NULL for global roles)
        let { data: ownerRole } = await supabase_1.supabaseAdmin
            .from('roles')
            .select('id')
            .eq('name', 'owner')
            .is('tenant_id', null)
            .single();
        // If no global owner role, check for tenant-scoped one or create it
        if (!ownerRole) {
            const { data: newRole, error: roleError } = await supabase_1.supabaseAdmin
                .from('roles')
                .insert({ tenant_id: tenant.id, name: 'owner', description: 'Full access to all workspace features' })
                .select('id')
                .single();
            if (!roleError)
                ownerRole = newRole;
        }
        // 3. Add user as owner in tenant_members with the owner role
        const { error: memberError } = await supabase_1.supabaseAdmin
            .from('tenant_members')
            .insert({
            tenant_id: tenant.id,
            user_id: userId,
            role_id: ownerRole?.id || null,
            status: 'active'
        });
        if (memberError)
            throw memberError;
        // 4. Create onboarding record
        await supabase_1.supabaseAdmin
            .from('tenant_onboarding')
            .insert({ tenant_id: tenant.id });
        return res.status(201).json({ success: true, data: tenant });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { code: 'TENANT_CREATION_FAILED', message: error.message } });
    }
};
exports.createTenant = createTenant;
const getTenants = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const { data, error } = await supabase_1.supabaseAdmin
            .from('tenant_members')
            .select('tenants(*), role_id, status')
            .eq('user_id', userId);
        if (error)
            throw error;
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { code: 'FETCH_TENANTS_FAILED', message: error.message } });
    }
};
exports.getTenants = getTenants;
const switchActiveTenant = async (req, res) => {
    try {
        const { tenant_id } = req.body;
        const userId = req.user?.sub;
        const { data: member, error } = await supabase_1.supabaseAdmin
            .from('tenant_members')
            .select('*')
            .eq('tenant_id', tenant_id)
            .eq('user_id', userId)
            .single();
        if (error || !member) {
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this tenant.' } });
        }
        return res.status(200).json({ success: true, data: { activeTenant: tenant_id, member } });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { code: 'SWITCH_TENANT_FAILED', message: error.message } });
    }
};
exports.switchActiveTenant = switchActiveTenant;
