import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { AutomationEngine } from './automation.engine';

export const getWorkflows = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { data, error } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const saveWorkflow = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { id, name, description, trigger_type, graph_json, status = 'draft' } = req.body;
    if (!tenantId || !name || !trigger_type || !graph_json || !Array.isArray(graph_json.nodes) || !Array.isArray(graph_json.edges)) {
      return res.status(400).json({ success: false, error: { message: 'name, trigger_type, and a valid graph_json are required' } });
    }

    let result;
    if (id) {
      // Update
      result = await supabaseAdmin
        .from('workflows')
        .update({ name, description, trigger_type, graph_json, status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();
    } else {
      // Create
      result = await supabaseAdmin
        .from('workflows')
        .insert({
          tenant_id: tenantId,
          name,
          description,
          trigger_type,
          graph_json,
          status
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;
    return res.status(200).json({ success: true, data: result.data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const getWorkflow = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { data, error } = await supabaseAdmin.from('workflows').select('*')
      .eq('tenant_id', tenantId).eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ success: false, error: { message: 'Workflow not found' } });
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const executeWorkflow = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { data: workflow, error } = await supabaseAdmin.from('workflows').select('id, graph_json')
      .eq('tenant_id', tenantId).eq('id', req.params.id).single();
    if (error || !workflow) return res.status(404).json({ success: false, error: { message: 'Workflow not found' } });
    const executionId = await AutomationEngine.executeGraph(tenantId, workflow.id, workflow.graph_json, req.body?.event || {});
    return res.status(202).json({ success: true, data: { executionId } });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const resumeWorkflowExecution = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const executionId = await AutomationEngine.resumeExecution(tenantId, req.params.executionId);
    return res.status(202).json({ success: true, data: { executionId } });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const getWorkflowExecutions = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { id } = req.params; // workflow id

    const { data, error } = await supabaseAdmin
      .from('workflow_executions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('workflow_id', id)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};
