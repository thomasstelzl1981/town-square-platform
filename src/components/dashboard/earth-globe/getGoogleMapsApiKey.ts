import { supabase } from "@/integrations/supabase/client";

export async function getGoogleMapsApiKey(): Promise<string> {
  const fromEnv = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (fromEnv) return fromEnv;

  const { data, error } = await supabase.functions.invoke("sot-google-maps-key");
  if (error) throw error;

  const key = (data as { key?: string } | null)?.key;
  if (!key) throw new Error("Google Maps API Key nicht verfügbar");

  return key;
}
