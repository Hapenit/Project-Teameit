"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationEngine = void 0;
const supabase_1 = require("../../config/supabase");
const inbox_engine_1 = require("../inbox/inbox.engine");
class AutomationEngine {
    static async resumeDueExecutions() {
        const { data: due, error } = await supabase_1.supabaseAdmin.from('workflow_executions')
            .select('id, tenant_id').eq('status', 'suspended').lte('resume_at', new Date().toISOString()).limit(100);
        if (error)
            throw error;
        for (const execution of due || []) {
            try {
                await this.resumeExecution(execution.tenant_id, execution.id);
            }
            catch (err) {
                console.error(`[AutomationEngine] Resume ${execution.id} failed`, err);
            }
        }
    }
    static async triggerWorkflows(tenantId, triggerType, eventPayload) {
        const { data: workflows, error } = await supabase_1.supabaseAdmin.from('workflows')
            .select('id, graph_json').eq('tenant_id', tenantId)
            .eq('trigger_type', triggerType).eq('status', 'active');
        if (error)
            throw error;
        for (const workflow of workflows || [])
            await this.executeGraph(tenantId, workflow.id, workflow.graph_json, eventPayload);
    }
    static async executeGraph(tenantId, workflowId, graph, eventPayload) {
        const start = (graph?.nodes || []).find((n) => n.type === 'triggerNode');
        if (!start)
            throw new Error('Workflow has no trigger node');
        const { data: execution, error } = await supabase_1.supabaseAdmin.from('workflow_executions').insert({
            tenant_id: tenantId, workflow_id: workflowId, trigger_event: eventPayload,
            status: 'running', execution_context: { event: eventPayload }
        }).select('id').single();
        if (error || !execution)
            throw error || new Error('Could not create workflow execution');
        await this.processExecution(tenantId, execution.id, graph, start.id, eventPayload, []);
        return execution.id;
    }
    static async resumeExecution(tenantId, executionId) {
        const { data: execution, error } = await supabase_1.supabaseAdmin.from('workflow_executions')
            .select('id, workflow_id, trigger_event, next_node_id, execution_log, status, workflows!inner(graph_json)')
            .eq('id', executionId).eq('tenant_id', tenantId).single();
        if (error || !execution)
            throw new Error('Execution not found');
        if (!['suspended', 'failed'].includes(execution.status))
            return execution;
        const { data: claimed, error: claimError } = await supabase_1.supabaseAdmin.from('workflow_executions')
            .update({ status: 'running' }).eq('id', executionId).eq('tenant_id', tenantId)
            .in('status', ['suspended', 'failed']).select('id').maybeSingle();
        if (claimError || !claimed)
            return execution;
        const graph = execution.workflows.graph_json;
        await this.processExecution(tenantId, execution.id, graph, execution.next_node_id, execution.trigger_event, execution.execution_log || []);
        return execution.id;
    }
    static async processExecution(tenantId, executionId, graph, nodeId, event, log) {
        const nodes = graph.nodes || [], edges = graph.edges || [];
        let current = nodes.find(n => n.id === nodeId);
        try {
            while (current) {
                const entry = { nodeId: current.id, type: current.type, startedAt: new Date().toISOString() };
                log.push(entry);
                if (current.type === 'delayNode') {
                    const seconds = Number(current.data?.delayPayload?.seconds ?? current.data?.delaySeconds ?? 0);
                    const resumeAt = new Date(Date.now() + Math.max(0, seconds) * 1000).toISOString();
                    entry.status = 'suspended';
                    entry.resumeAt = resumeAt;
                    await this.recordStep(executionId, current.id, 'suspended', entry);
                    await this.persist(tenantId, executionId, { status: 'suspended', next_node_id: this.nextNode(current, edges, nodes)?.id || null, resume_at: resumeAt, execution_log: log });
                    return;
                }
                if (current.type === 'conditionNode') {
                    const expected = String(current.data?.conditionPayload?.containsText || '').toLowerCase();
                    const actual = String(event.messageContent || event.content || '').toLowerCase();
                    const passed = Boolean(expected) && actual.includes(expected);
                    entry.evaluation = passed;
                    entry.status = 'success';
                    current = this.nextNode(current, edges, nodes, passed ? 'true' : 'false');
                }
                else {
                    if (current.type === 'actionNode') {
                        const content = String(current.data?.actionPayload?.message || '').trim();
                        if (!content)
                            throw new Error(`Action ${current.id} has no message`);
                        let conversationId = event.conversationId;
                        if (!conversationId && event.contactId) {
                            const { data } = await supabase_1.supabaseAdmin.from('conversations').select('id')
                                .eq('tenant_id', tenantId).eq('contact_id', event.contactId).eq('status', 'open').maybeSingle();
                            conversationId = data?.id;
                        }
                        if (!conversationId)
                            throw new Error('No open conversation for action message');
                        await inbox_engine_1.InboxEngine.sendMessage({ tenantId, conversationId, senderId: event.senderId, content });
                    }
                    entry.status = 'success';
                    current = this.nextNode(current, edges, nodes);
                }
                entry.completedAt = new Date().toISOString();
                await this.recordStep(executionId, entry.nodeId, 'success', entry);
            }
            await this.persist(tenantId, executionId, { status: 'completed', completed_at: new Date().toISOString(), next_node_id: null, resume_at: null, execution_log: log });
        }
        catch (error) {
            const { data } = await supabase_1.supabaseAdmin.from('workflow_executions').select('retry_count, max_retries').eq('id', executionId).single();
            const retry = (data?.retry_count || 0) + 1;
            if (retry <= (data?.max_retries ?? 3)) {
                await this.recordStep(executionId, current?.id || 'unknown', 'failed', { error: error.message, retry });
                await this.persist(tenantId, executionId, { status: 'suspended', retry_count: retry, resume_at: new Date(Date.now() + Math.min(300000, 1000 * 2 ** retry)).toISOString(), next_node_id: current?.id || null, execution_log: [...log, { nodeId: current?.id, status: 'retrying', error: error.message, retry }] });
            }
            else {
                await this.recordStep(executionId, current?.id || 'unknown', 'failed', { error: error.message });
                await this.persist(tenantId, executionId, { status: 'failed', completed_at: new Date().toISOString(), error_log: error.message, execution_log: [...log, { nodeId: current?.id, status: 'failed', error: error.message }] });
            }
        }
    }
    static nextNode(node, edges, nodes, handle) {
        const edge = edges.find(e => e.source === node.id && (handle ? e.sourceHandle === handle : true));
        return edge ? nodes.find(n => n.id === edge.target) : undefined;
    }
    static async persist(tenantId, id, values) {
        const { error } = await supabase_1.supabaseAdmin.from('workflow_executions').update(values).eq('id', id).eq('tenant_id', tenantId);
        if (error)
            throw error;
    }
    static async recordStep(executionId, nodeId, status, logs) {
        const { error } = await supabase_1.supabaseAdmin.from('workflow_execution_steps')
            .insert({ execution_id: executionId, node_id: nodeId, status, logs });
        if (error)
            throw error;
    }
}
exports.AutomationEngine = AutomationEngine;
