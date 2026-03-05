export interface ExtractedProfile {
  client_name?: string;
  region?: string;
  asset_focus: string[];
  price_min?: number | null;
  price_max?: number | null;
  yield_target?: number | null;
  exclusions?: string;
  notes?: string;
  profile_text_long?: string;
}
