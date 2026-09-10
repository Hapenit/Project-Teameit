"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkflowExecutions = exports.resumeWorkflowExecution = exports.executeWorkflow = exports.getWorkflow = exports.saveWorkflow = exports.getWorkflows = void 0;
const supabase_1 = require("../../config/supabase");
const automation_engine_1 = require("./automation.engine");
const getWorkflows = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { data, error } = await supabase_1.supabaseAdmin
            .from('workflows')
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
exports.getWorkflows = getWorkflows;
const saveWorkflow = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { id, name, description, trigger_type, graph_json, status = 'draft' } = req.body;
        if (!tenantId || !name || !trigger_type || !graph_json || !Array.isArray(graph_json.nodes) || !Array.isArray(graph_json.edges)) {
            return res.status(400).json({ success: false, error: { message: 'name, trigger_type, and a valid graph_json are required' } });
        }
        let result;
        if (id) {
            // Update
            result = await supabase_1.supabaseAdmin
                .from('workflows')
                .update({ name, description, trigger_type, graph_json, status, updated_at: new Date().toISOString() })
                .eq('id', id)
                .eq('tenant_id', tenantId)
                .select()
                .single();
        }
        else {
            // Create
            result = await supabase_1.supabaseAdmin
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
        if (result.error)
            throw result.error;
        return res.status(200).json({ success: true, data: result.data });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.saveWorkflow = saveWorkflow;
const getWorkflow = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { data, error } = await supabase_1.supabaseAdmin.from('workflows').select('*')
            .eq('tenant_id', tenantId).eq('id', req.params.id).single();
        if (error || !data)
            return res.status(404).json({ success: false, error: { message: 'Workflow not found' } });
        return res.json({ success: true, data });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.getWorkflow = getWorkflow;
const executeWorkflow = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { data: workflow, error } = await supabase_1.supabaseAdmin.from('workflows').select('id, graph_json')
            .eq('tenant_id', tenantId).eq('id', req.params.id).single();
        if (error || !workflow)
            return res.status(404).json({ success: false, error: { message: 'Workflow not found' } });
        const executionId = await automation_engine_1.AutomationEngine.executeGraph(tenantId, workflow.id, workflow.graph_json, req.body?.event || {});
        return res.status(202).json({ success: true, data: { executionId } });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.executeWorkflow = executeWorkflow;
const resumeWorkflowExecution = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const executionId = await automation_engine_1.AutomationEngine.resumeExecution(tenantId, req.params.executionId);
        return res.status(202).json({ success: true, data: { executionId } });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.resumeWorkflowExecution = resumeWorkflowExecution;
const getWorkflowExecutions = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        const { id } = req.params; // workflow id
        const { data, error } = await supabase_1.supabaseAdmin
            .from('workflow_executions')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('workflow_id', id)
            .order('started_at', { ascending: false });
        if (error)
            throw error;
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};
exports.getWorkflowExecutions = getWorkflowExecutions;
