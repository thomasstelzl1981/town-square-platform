/**
 * R-9: Extracted helpers from BriefTab.tsx
 */
import type { BriefContact, ManualRecipientFields } from './briefTypes';

export function getEffectiveRecipient(
  manualRecipient: boolean,
  manualFields: ManualRecipientFields,
  selectedContact: BriefContact | null
): BriefContact | null {
  if (manualRecipient) {
    if (!manualFields.last_name.trim()) return null;
    return {
      id: '',
      first_name: manualFields.first_name,
      last_name: manualFields.last_name,
      email: null,
      company: manualFields.company || null,
      salutation: manualFields.salutation || null,
      street: manualFields.street || null,
      postal_code: manualFields.postal_code || null,
      city: manualFields.city || null,
    };
  }
  return selectedContact;
}

export function formatRecipientAddress(r: BriefContact | null): string | undefined {
  if (!r) return undefined;
  return [r.street, [r.postal_code, r.city].filter(Boolean).join(' ')].filter(Boolean).join('\n') || undefined;
}

export function formatRecipientName(r: BriefContact | null): string | undefined {
  if (!r) return undefined;
  return `${r.first_name} ${r.last_name}`;
}
