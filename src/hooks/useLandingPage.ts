/**
 * useLandingPage — CRUD hook for landing_pages table
 * Provides create, read, update operations + slug generation
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LandingPage {
  id: string;
  project_id: string;
  organization_id: string;
  slug: string;
  status: 'draft' | 'preview' | 'active' | 'locked';
  developer_website_url: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  location_description: string | null;
  about_text: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  published_at: string | null;
  preview_expires_at: string | null;
  locked_at: string | null;
  booked_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface CreateLandingPageInput {
  project_id: string;
  organization_id: string;
  slug: string;
  hero_headline?: string;
  hero_subheadline?: string;
  location_description?: string;
  about_text?: string;
  developer_website_url?: string;
  contact_email?: string;
  contact_phone?: string;
}

interface UpdateLandingPageInput {
  id: string;
  hero_headline?: string;
  hero_subheadline?: string;
  location_description?: string;
  about_text?: string;
  contact_email?: string;
  contact_phone?: string;
  developer_website_url?: string;
  status?: 'draft' | 'preview' | 'active' | 'locked';
  published_at?: string;
  preview_expires_at?: string;
  locked_at?: string;
  booked_at?: string;
}

/** Generate a URL-safe slug from a project name */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

/** Fetch landing page by project_id */
export function useLandingPageByProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['landing-page', 'project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data as LandingPage | null;
    },
    enabled: !!projectId,
  });
}

/** Fetch landing page by slug (public route) */
export function useLandingPageBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['landing-page', 'slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data as LandingPage | null;
    },
    enabled: !!slug,
  });
}

/** Fetch all landing pages (admin view) */
export function useLandingPages() {
  return useQuery({
    queryKey: ['landing-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as LandingPage[];
    },
  });
}

/** Create a new landing page */
export function useCreateLandingPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLandingPageInput) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('landing_pages')
        .insert({
          ...input,
          created_by: user?.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as LandingPage;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['landing-page'] });
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast.success('Landing Page erstellt', { description: `Slug: ${data.slug}` });
    },
    onError: (err: Error) => {
      toast.error('Fehler beim Erstellen', { description: err.message });
    },
  });
}

/** Update an existing landing page */
export function useUpdateLandingPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateLandingPageInput) => {
      const { data, error } = await supabase
        .from('landing_pages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as LandingPage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page'] });
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
    },
    onError: (err: Error) => {
      toast.error('Fehler beim Aktualisieren', { description: err.message });
    },
  });
}

/** Publish a landing page (sets status to preview + 36h expiry) */
export function usePublishLandingPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 36 * 60 * 60 * 1000);
      const { data, error } = await supabase
        .from('landing_pages')
        .update({
          status: 'preview',
          published_at: now.toISOString(),
          preview_expires_at: expiresAt.toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as LandingPage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page'] });
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast.success('Website veröffentlicht', { description: '36-Stunden-Vorschau aktiv' });
    },
    onError: (err: Error) => {
      toast.error('Fehler beim Veröffentlichen', { description: err.message });
    },
  });
}

/** Book a landing page (permanent activation) */
export function useBookLandingPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('landing_pages')
        .update({
          status: 'active',
          booked_at: new Date().toISOString(),
          locked_at: null,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as LandingPage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page'] });
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast.success('Website dauerhaft freigeschaltet');
    },
    onError: (err: Error) => {
      toast.error('Fehler bei der Buchung', { description: err.message });
    },
  });
}

/** Lock/unlock a landing page (admin action) */
export function useToggleLandingPageLock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, lock }: { id: string; lock: boolean }) => {
      const updates = lock
        ? { status: 'locked' as const, locked_at: new Date().toISOString() }
        : { status: 'active' as const, locked_at: null };
      const { data, error } = await supabase
        .from('landing_pages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as LandingPage;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['landing-page'] });
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast.success(vars.lock ? 'Website gesperrt' : 'Website entsperrt');
    },
    onError: (err: Error) => {
      toast.error('Fehler', { description: err.message });
    },
  });
}
