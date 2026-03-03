/**
 * Europace Consumer Loan Adapter
 * 
 * Calls the sot-europace-proxy Edge Function for all Europace API interactions.
 */
import { supabase } from '@/integrations/supabase/client';

export interface EuropaceCaseData {
  caseId: string;
  applicant: {
    net_income_monthly?: number;
    birth_date?: string;
    equity_amount?: number;
    purchase_price?: number;
    object_type?: string;
    address_postal_code?: string;
    address_city?: string;
    employment_type?: string;
    employed_since?: string;
    contract_type?: string;
    other_regular_income_monthly?: number;
    max_monthly_rate?: number;
  };
  property: {
    purchase_price?: number;
    object_type?: string;
    postal_code?: string;
    city?: string;
  };
}

export interface EuropaceVorschlag {
  finanzierungsVorschlagId: string;
  annahmeFrist?: string;
  darlehensSumme: number;
  sollZins: number;
  effektivZins: number;
  gesamtRateProMonat: number;
  zinsbindungInJahrenMinMax?: string;
  machbarkeit?: number;
  rank?: number;
  kennung?: string;
  finanzierungsbausteine?: Array<{
    '@type': string;
    darlehensbetrag: number;
    sollZins: number;
    effektivZins: number;
    rateMonatlich: number;
    produktAnbieter: string;
    tilgungssatzInProzent?: number;
    annuitaetendetails?: {
      zinsbindungInJahren: number;
      sondertilgungJaehrlich?: number;
    };
  }>;
}

export interface EuropaceLeadRating {
  successRating?: string;  // A-F
  feasibilityRating?: number;  // 0-100
  effortRating?: {
    rating: boolean;
    explanations: string[];
  };
}

export interface EuropaceVorschlaegeResult {
  vorschlaege: EuropaceVorschlag[];
  leadRating?: EuropaceLeadRating;
}

/** Request Vorschlaege (async) — returns anfrageId */
export async function europace_request_vorschlaege(caseData: EuropaceCaseData): Promise<string> {
  const { data, error } = await supabase.functions.invoke('sot-europace-proxy', {
    body: { action: 'request-vorschlaege', caseData },
  });

  if (error) throw new Error(`Europace request failed: ${error.message}`);
  if (!data?.anfrageId) throw new Error('No anfrageId received from Europace');
  return data.anfrageId;
}

/** Poll Vorschlaege — returns null if still pending, result when done */
export async function europace_poll_vorschlaege(anfrageId: string): Promise<EuropaceVorschlaegeResult | null> {
  const { data, error } = await supabase.functions.invoke('sot-europace-proxy', {
    body: { action: 'poll-vorschlaege', anfrageId },
  });

  if (error) throw new Error(`Europace poll failed: ${error.message}`);

  // 202 = still processing
  if (data?.status === 'pending') return null;

  return data as EuropaceVorschlaegeResult;
}

/** Bookmark a Vorschlag into an Europace Vorgang */
export async function europace_bookmark_vorschlag(
  anfrageId: string,
  finanzierungsVorschlagId: string,
  vorgangId: string,
): Promise<{ message: string }> {
  const { data, error } = await supabase.functions.invoke('sot-europace-proxy', {
    body: { action: 'bookmark-vorschlag', anfrageId, finanzierungsVorschlagId, vorgangId },
  });

  if (error) throw new Error(`Europace bookmark failed: ${error.message}`);
  return data;
}
