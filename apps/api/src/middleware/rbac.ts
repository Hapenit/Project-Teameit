import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { requireAuth } from './auth';

// Middleware to check if user has a specific permission in the active tenant context
export const requirePermission = (moduleName: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, async () => {
      try {
        const userId = req.user?.sub;
        let tenantId = req.headers['x-tenant-id'] as string | undefined;

        if (!userId) {
          return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        // A tenant header is only a selector, never an authorization decision.
        // When omitted, resolve the sole membership server-side.
        let member: any;
        if (tenantId) {
          const { data, error } = await supabaseAdmin.from('tenant_members').select('tenant_id, role_id')
            .eq('tenant_id', tenantId).eq('user_id', userId).single();
          if (error || !data) return res.status(403).json({ success: false, error: 'Forbidden: invalid tenant membership' });
          member = data;
        } else {
          const { data: memberships, error } = await supabaseAdmin.from('tenant_members').select('tenant_id, role_id').eq('user_id', userId);
          if (error || !memberships?.length || memberships.length !== 1) {
            return res.status(400).json({ success: false, error: 'A tenant context is required' });
          }
          member = memberships[0];
        }
        tenantId = member.tenant_id;
        req.tenantId = tenantId;

        // 1. Get user's role in the tenant
        if (!member.role_id) {
          return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this tenant or lack a role.' });
        }

        // 2. Check if role has the requested permission
        const { data: permission, error: permError } = await supabaseAdmin
          .from('role_permissions')
          .select('permissions!inner(module, action)')
          .eq('role_id', member.role_id)
          .eq('permissions.module', moduleName)
          .eq('permissions.action', action)
          .single();

        if (permError || !permission) {
          return res.status(403).json({ success: false, error: 'Forbidden: Insufficient permissions.' });
        }

        // User has permission, proceed
        next();
      } catch (error) {
        console.error('Permission check failed:', error);
        return res.status(500).json({ success: false, error: 'Internal server error during authorization' });
      }
    });
  };
};
