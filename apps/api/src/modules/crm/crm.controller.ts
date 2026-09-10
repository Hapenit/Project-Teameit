import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';

export const getContacts = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    
    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select(`
        *,
        contact_identities(provider, provider_id),
        contact_tags(tags(name, color)),
        pipeline_stages(name, pipeline_id),
        notes:contact_notes(*),
        tasks:contact_tasks(*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { id } = req.params;
    const { first_name, last_name, custom_fields, tags, pipeline_stage_id } = req.body;

    // 1. Update the contact basic info and custom_fields
    const updateData: any = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (custom_fields !== undefined) updateData.custom_fields = custom_fields;
    if (pipeline_stage_id !== undefined) updateData.pipeline_stage_id = pipeline_stage_id;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('contacts')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (updateError) throw updateError;
    }

    // 2. Handle Tags (Replace entire tag set for simplicity)
    if (tags && Array.isArray(tags)) {
      // Clear existing tags
      await supabaseAdmin
        .from('contact_tags')
        .delete()
        .eq('contact_id', id);

      for (const tagName of tags) {
        // Find or create tag
        let { data: tag, error: tagError } = await supabaseAdmin
          .from('tags')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('name', tagName)
          .single();

        if (!tag) {
          const { data: newTag, error: newTagError } = await supabaseAdmin
            .from('tags')
            .insert({ tenant_id: tenantId, name: tagName })
            .select('id')
            .single();
          
          if (newTagError) throw newTagError;
          tag = newTag;
        }

        // Link tag to contact
        await supabaseAdmin
          .from('contact_tags')
          .insert({ contact_id: id, tag_id: tag!.id });
      }
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const getPipelines = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    
    // Auto-create default pipeline if none exists
    let { data: pipelines, error } = await supabaseAdmin
      .from('pipelines')
      .select('*, pipeline_stages(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!pipelines || pipelines.length === 0) {
      // Create Default Pipeline
      const { data: newPipeline, error: createError } = await supabaseAdmin
        .from('pipelines')
        .insert({ tenant_id: tenantId, name: 'Sales Pipeline' })
        .select('*')
        .single();
      
      if (createError) throw createError;

      const stages = [
        { pipeline_id: newPipeline.id, name: 'New', color: 'bg-blue-100', stage_order: 1 },
        { pipeline_id: newPipeline.id, name: 'Contacted', color: 'bg-yellow-100', stage_order: 2 },
        { pipeline_id: newPipeline.id, name: 'Demo', color: 'bg-purple-100', stage_order: 3 },
        { pipeline_id: newPipeline.id, name: 'Won', color: 'bg-green-100', stage_order: 4 },
        { pipeline_id: newPipeline.id, name: 'Lost', color: 'bg-red-100', stage_order: 5 }
      ];

      const { error: stageError } = await supabaseAdmin
        .from('pipeline_stages')
        .insert(stages);
        
      if (stageError) throw stageError;

      // Re-fetch
      const { data: refetched } = await supabaseAdmin
        .from('pipelines')
        .select('*, pipeline_stages(*)')
        .eq('tenant_id', tenantId);
        
      pipelines = refetched;
    }

    return res.status(200).json({ success: true, data: pipelines });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const addNote = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { id: contactId } = req.params;
    const { content } = req.body;

    if (!content) throw new Error('Content is required');

    const { data, error } = await supabaseAdmin
      .from('contact_notes')
      .insert({
        tenant_id: tenantId,
        contact_id: contactId,
        content
      })
      .select('*')
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const addTask = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { id: contactId } = req.params;
    const { title } = req.body;

    if (!title) throw new Error('Title is required');

    const { data, error } = await supabaseAdmin
      .from('contact_tasks')
      .insert({
        tenant_id: tenantId,
        contact_id: contactId,
        title
      })
      .select('*')
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const completeTask = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { taskId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('contact_tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const importContacts = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;
    const { contacts } = req.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      throw new Error('No valid contacts provided for import');
    }

    // Map payload to DB schema
    const mappedContacts = contacts.map((c: any) => ({
      tenant_id: tenantId,
      first_name: c.first_name || '',
      last_name: c.last_name || '',
      email: c.email || null,
      phone: c.phone || null,
    }));

    // Perform bulk insert
    const { error } = await supabaseAdmin
      .from('contacts')
      .insert(mappedContacts);

    if (error) throw error;

    return res.status(201).json({ success: true, message: `Successfully imported ${mappedContacts.length} contacts.` });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { message: error.message } });
  }
};
