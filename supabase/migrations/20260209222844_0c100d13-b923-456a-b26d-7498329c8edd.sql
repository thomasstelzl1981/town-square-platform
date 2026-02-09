-- Add unique constraint for upsert on social_personality_profiles
ALTER TABLE public.social_personality_profiles 
ADD CONSTRAINT social_personality_profiles_tenant_owner_unique 
UNIQUE (tenant_id, owner_user_id);