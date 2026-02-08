/**
 * useAdminSequences — Hook for Zone 1 Email Sequences (Drip Campaigns)
 * Manages sequences, steps, enrollments, and sequence operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

// Use loose types to match Supabase's Json type
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  category: string | null;
  variables: Json;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface SequenceStep {
  id: string;
  sequence_id: string | null;
  step_order: number;
  template_id: string | null;
  subject_override: string | null;
  body_override: string | null;
  delay_days: number | null;
  delay_hours: number | null;
  send_condition: string | null;
  stats: Json;
  created_at: string;
}

export interface EmailSequence {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Json;
  status: string | null;
  target_categories: string[] | null;
  stats: Json;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  sequence_id: string | null;
  contact_id: string | null;
  status: string | null;
  current_step: number | null;
  enrolled_at: string;
  last_sent_at: string | null;
  next_send_at: string | null;
  completed_at: string | null;
}

// Templates Hook
export function useAdminTemplates() {
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['admin-email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_email_templates')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: { 
      name: string; 
      subject: string; 
      body_html?: string; 
      body_text?: string; 
      category?: string;
      variables?: Json;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('admin_email_templates')
        .insert({
          name: template.name,
          subject: template.subject,
          body_html: template.body_html || null,
          body_text: template.body_text || null,
          category: template.category || null,
          variables: template.variables || [],
          is_active: template.is_active ?? true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string;
      name?: string; 
      subject?: string; 
      body_html?: string; 
      body_text?: string; 
      category?: string;
      variables?: Json;
      is_active?: boolean;
    }) => {
      const cleanUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) cleanUpdates.name = updates.name;
      if (updates.subject !== undefined) cleanUpdates.subject = updates.subject;
      if (updates.body_html !== undefined) cleanUpdates.body_html = updates.body_html;
      if (updates.body_text !== undefined) cleanUpdates.body_text = updates.body_text;
      if (updates.category !== undefined) cleanUpdates.category = updates.category;
      if (updates.variables !== undefined) cleanUpdates.variables = updates.variables;
      if (updates.is_active !== undefined) cleanUpdates.is_active = updates.is_active;
      
      const { error } = await supabase
        .from('admin_email_templates')
        .update(cleanUpdates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_email_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] });
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}

// Sequences Hook
export function useAdminSequences() {
  const queryClient = useQueryClient();

  const sequencesQuery = useQuery({
    queryKey: ['admin-email-sequences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_email_sequences')
        .select(`
          *,
          steps:admin_email_sequence_steps(
            *,
            template:admin_email_templates(id, name, subject)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Sort steps by step_order
      return (data || []).map(seq => ({
        ...seq,
        steps: (seq.steps || []).sort((a, b) => (a.step_order || 0) - (b.step_order || 0)),
      }));
    },
  });

  const createSequence = useMutation({
    mutationFn: async (sequence: { 
      name: string; 
      description?: string; 
      trigger_type: string; 
      target_categories?: string[];
    }) => {
      const { data, error } = await supabase
        .from('admin_email_sequences')
        .insert({
          name: sequence.name,
          description: sequence.description || null,
          trigger_type: sequence.trigger_type,
          target_categories: sequence.target_categories || [],
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-sequences'] });
    },
  });

  const updateSequence = useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string; 
      name?: string; 
      description?: string; 
      status?: string; 
      trigger_type?: string;
      target_categories?: string[];
    }) => {
      const cleanUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) cleanUpdates.name = updates.name;
      if (updates.description !== undefined) cleanUpdates.description = updates.description;
      if (updates.status !== undefined) cleanUpdates.status = updates.status;
      if (updates.trigger_type !== undefined) cleanUpdates.trigger_type = updates.trigger_type;
      if (updates.target_categories !== undefined) cleanUpdates.target_categories = updates.target_categories;
      
      const { error } = await supabase
        .from('admin_email_sequences')
        .update(cleanUpdates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-sequences'] });
    },
  });

  const deleteSequence = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_email_sequences')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-sequences'] });
    },
  });

  // Add step to sequence
  const addStep = useMutation({
    mutationFn: async (step: { 
      sequence_id: string;
      step_order: number;
      template_id?: string;
      subject_override?: string;
      body_override?: string;
      delay_days?: number;
      delay_hours?: number;
      send_condition?: string;
    }) => {
      const { data, error } = await supabase
        .from('admin_email_sequence_steps')
        .insert({
          sequence_id: step.sequence_id,
          step_order: step.step_order,
          template_id: step.template_id || null,
          subject_override: step.subject_override || null,
          body_override: step.body_override || null,
          delay_days: step.delay_days || 0,
          delay_hours: step.delay_hours || 0,
          send_condition: step.send_condition || 'always',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-sequences'] });
    },
  });

  // Update step
  const updateStep = useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string;
      step_order?: number;
      template_id?: string;
      subject_override?: string;
      body_override?: string;
      delay_days?: number;
      delay_hours?: number;
      send_condition?: string;
    }) => {
      const cleanUpdates: Record<string, unknown> = {};
      if (updates.step_order !== undefined) cleanUpdates.step_order = updates.step_order;
      if (updates.template_id !== undefined) cleanUpdates.template_id = updates.template_id;
      if (updates.subject_override !== undefined) cleanUpdates.subject_override = updates.subject_override;
      if (updates.body_override !== undefined) cleanUpdates.body_override = updates.body_override;
      if (updates.delay_days !== undefined) cleanUpdates.delay_days = updates.delay_days;
      if (updates.delay_hours !== undefined) cleanUpdates.delay_hours = updates.delay_hours;
      if (updates.send_condition !== undefined) cleanUpdates.send_condition = updates.send_condition;
      
      const { error } = await supabase
        .from('admin_email_sequence_steps')
        .update(cleanUpdates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-sequences'] });
    },
  });

  // Delete step
  const deleteStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_email_sequence_steps')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-sequences'] });
    },
  });

  return {
    sequences: sequencesQuery.data || [],
    isLoading: sequencesQuery.isLoading,
    createSequence,
    updateSequence,
    deleteSequence,
    addStep,
    updateStep,
    deleteStep,
  };
}

// Enrollments Hook
export function useAdminEnrollments(sequenceId?: string) {
  const queryClient = useQueryClient();

  const enrollmentsQuery = useQuery({
    queryKey: ['admin-email-enrollments', sequenceId],
    queryFn: async () => {
      let query = supabase
        .from('admin_email_enrollments')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, company),
          sequence:admin_email_sequences(id, name)
        `)
        .order('enrolled_at', { ascending: false });
      
      if (sequenceId) {
        query = query.eq('sequence_id', sequenceId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const enrollContact = useMutation({
    mutationFn: async ({ sequenceId, contactId }: { sequenceId: string; contactId: string }) => {
      // Calculate next_send_at based on first step's delay
      const { data: firstStep } = await supabase
        .from('admin_email_sequence_steps')
        .select('delay_days, delay_hours')
        .eq('sequence_id', sequenceId)
        .eq('step_order', 0)
        .maybeSingle();

      const delayMs = ((firstStep?.delay_days || 0) * 24 * 60 + (firstStep?.delay_hours || 0) * 60) * 60 * 1000;
      const nextSendAt = new Date(Date.now() + delayMs).toISOString();

      const { data, error } = await supabase
        .from('admin_email_enrollments')
        .insert({
          sequence_id: sequenceId,
          contact_id: contactId,
          status: 'active',
          current_step: 0,
          next_send_at: nextSendAt,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-email-sequences'] });
    },
  });

  const updateEnrollmentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('admin_email_enrollments')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-enrollments'] });
    },
  });

  const unenrollContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_email_enrollments')
        .update({ status: 'unsubscribed' })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-enrollments'] });
    },
  });

  return {
    enrollments: enrollmentsQuery.data || [],
    isLoading: enrollmentsQuery.isLoading,
    enrollContact,
    updateEnrollmentStatus,
    unenrollContact,
  };
}
