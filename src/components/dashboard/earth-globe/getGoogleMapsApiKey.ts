import { supabase } from "@/integrations/supabase/client";

export async function getGoogleMapsApiKey(): Promise<string> {
  // Prefer runtime resolution via backend function (avoids Vite build-time env caching).
  const { data, error } = await supabase.functions.invoke("sot-google-maps-key");

  const key = (data as { key?: string } | null)?.key;
  if (key) return key;

  // Fallback for local/dev setups only
  const fromEnv = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (fromEnv) return fromEnv;

  if (error) throw error;
  throw new Error("Google Maps API Key nicht verfügbar");
}
