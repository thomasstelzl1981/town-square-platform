-- Create widget_preferences table for storing user dashboard widget settings
CREATE TABLE public.widget_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  widget_code TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  config_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_widget UNIQUE (user_id, widget_code)
);

-- Create index for fast lookups by user
CREATE INDEX idx_widget_preferences_user_id ON public.widget_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE public.widget_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own preferences
CREATE POLICY "Users can read own widget preferences" 
  ON public.widget_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own widget preferences" 
  ON public.widget_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own widget preferences" 
  ON public.widget_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own widget preferences" 
  ON public.widget_preferences 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_widget_preferences_updated_at
  BEFORE UPDATE ON public.widget_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();