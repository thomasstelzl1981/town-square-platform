/**
 * R-9: Extracted types from BriefTab.tsx
 */
import type { LetterFont } from '@/components/portal/office/LetterPreview';

export type { LetterFont };

export interface BriefContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  company: string | null;
  salutation: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
}

export interface BriefLandlordContext {
  id: string;
  name: string;
  context_type: string;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  legal_form: string | null;
}

export interface BriefProfile {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  active_tenant_id: string | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  letterhead_logo_url: string | null;
  signature_url: string | null;
}

export interface ManualRecipientFields {
  salutation: string;
  first_name: string;
  last_name: string;
  company: string;
  street: string;
  postal_code: string;
  city: string;
}

export type DeliveryChannel = 'email' | 'fax' | 'post';
