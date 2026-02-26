
CREATE TABLE public.cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL DEFAULT 'Kamera 1',
  snapshot_url TEXT NOT NULL,
  auth_user TEXT,
  auth_pass TEXT,
  refresh_interval_sec INT NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;

-- Users can only access their own cameras
CREATE POLICY "cameras_select_own" ON public.cameras FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cameras_insert_own" ON public.cameras FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cameras_update_own" ON public.cameras FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cameras_delete_own" ON public.cameras FOR DELETE USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_cameras_updated_at
  BEFORE UPDATE ON public.cameras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
