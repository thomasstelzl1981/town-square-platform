/**
 * ENG-MKTDIR — Market Directory Engine
 * engine.ts — Pure Functions (keine Seiteneffekte, kein DB-Zugriff, kein React)
 * 
 * Version: 1.0.0
 */

import {
  type NormalizationResult,
  type ConfidenceComponents,
  type QualityStatus,
  type DedupeCandidate,
  type DedupeMatchType,
  type MergeDecision,
  type DiscoveryRunMetrics,
  type ContactRecord,
  CONFIDENCE_WEIGHTS,
  QUALITY_THRESHOLDS,
  DEDUPE_PRIORITY,
  CATEGORY_REGISTRY,
  type CategoryGroupCode,
} from './spec';

// ═══════════════════════════════════════════════════════════════
// 1. NAME SPLITTING
// ═══════════════════════════════════════════════════════════════

const SALUTATION_PATTERNS: Record<string, string> = {
  'herr': 'Herr',
  'hr.': 'Herr',
  'hr': 'Herr',
  'frau': 'Frau',
  'fr.': 'Frau',
  'fr': 'Frau',
  'dr.': 'Herr',  // default, refined later
  'prof.': 'Herr',
};

/**
 * Intelligentes Name-Splitting mit Anreden-Erkennung.
 * Pure function — keine Seiteneffekte.
 */
export function splitName(fullName: string): {
  salutation?: string;
  firstName?: string;
  lastName?: string;
} {
  if (!fullName || !fullName.trim()) return {};
  
  const parts = fullName.trim().replace(/\s+/g, ' ').split(' ');
  let salutation: string | undefined;
  let startIdx = 0;

  // Check for salutation prefix
  const firstLower = parts[0].toLowerCase();
  if (SALUTATION_PATTERNS[firstLower]) {
    salutation = SALUTATION_PATTERNS[firstLower];
    startIdx = 1;
  }

  const remaining = parts.slice(startIdx);
  if (remaining.length === 0) {
    return { salutation };
  }
  if (remaining.length === 1) {
    return { salutation, lastName: remaining[0] };
  }

  const firstName = remaining[0];
  const lastName = remaining.slice(1).join(' ');
  return { salutation, firstName, lastName };
}

// ═══════════════════════════════════════════════════════════════
// 2. PHONE NORMALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Normalisiert eine Telefonnummer Richtung E.164.
 * Deutsche Nummern: 0xxx → +49xxx
 */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return '';
  
  // Strip everything except digits and leading +
  let cleaned = raw.trim();
  const hasPlus = cleaned.startsWith('+');
  cleaned = cleaned.replace(/[^\\d]/g, '');
  
  if (hasPlus) {
    return '+' + cleaned;
  }
  
  // German: leading 0 → +49
  if (cleaned.startsWith('0') && cleaned.length >= 6) {
    return '+49' + cleaned.slice(1);
  }
  
  // If starts with 49 and is long enough, assume German
  if (cleaned.startsWith('49') && cleaned.length >= 10) {
    return '+' + cleaned;
  }
  
  return cleaned || '';
}

// ═══════════════════════════════════════════════════════════════
// 3. DOMAIN NORMALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Extrahiert und canonicalisiert eine Domain aus einer URL.
 */
export function normalizeDomain(url: string | null | undefined): string {
  if (!url) return '';
  
  let cleaned = url.trim().toLowerCase();
  
  // Remove protocol
  cleaned = cleaned.replace(/^https?:\/\//, '');
  // Remove www.
  cleaned = cleaned.replace(/^www\./, '');
  // Remove path/query/fragment
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];
  // Remove trailing dot
  cleaned = cleaned.replace(/\.$/, '');
  
  return cleaned;
}

// ═══════════════════════════════════════════════════════════════
// 4. CONTACT NORMALIZATION (komplett)
// ═══════════════════════════════════════════════════════════════

interface RawContactInput {
  salutation?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  company?: string | null;
  contact_person_name?: string | null;
  phone?: string | null;
  phone_mobile?: string | null;
  email?: string | null;
  website_url?: string | null;
  address_line?: string | null;
  street?: string | null;
  postal_code?: string | null;
  city?: string | null;
  [key: string]: unknown;
}

/**
 * Normalisiert einen Rohkontakt:
 * - Name-Splitting (wenn nur contact_person_name vorhanden)
 * - Phone zu E.164
 * - Domain-Extraktion
 * - Email lowercase + trim
 * - Adress-Parsing
 */
export function normalizeContact(raw: RawContactInput): NormalizationResult {
  const changes: Array<{ field: string; from: string; to: string }> = [];
  const warnings: string[] = [];
  
  // Name handling
  let salutation = raw.salutation?.trim() || undefined;
  let firstName = raw.first_name?.trim() || undefined;
  let lastName = raw.last_name?.trim() || undefined;
  
  // If no first/last name but contact_person_name, split it
  if (!firstName && !lastName && raw.contact_person_name) {
    const split = splitName(raw.contact_person_name);
    if (!salutation && split.salutation) salutation = split.salutation;
    firstName = split.firstName;
    lastName = split.lastName;
    changes.push({ field: 'name', from: raw.contact_person_name, to: `${firstName || ''} ${lastName || ''}`.trim() });
  }
  
  // Company
  const company = (raw.company_name || raw.company || '').trim() || undefined;
  
  // Phone normalization
  const phoneRaw = raw.phone || '';
  const phoneE164 = normalizePhone(phoneRaw);
  if (phoneRaw && phoneE164 !== phoneRaw.trim()) {
    changes.push({ field: 'phone', from: phoneRaw, to: phoneE164 });
  }
  
  // Domain
  const domain = normalizeDomain(raw.website_url);
  
  // Email
  const emailRaw = raw.email || '';
  const email = emailRaw.trim().toLowerCase() || undefined;
  if (emailRaw && email !== emailRaw) {
    changes.push({ field: 'email', from: emailRaw, to: email || '' });
  }
  
  // Address parsing
  let street = raw.street?.trim() || undefined;
  let postalCode = raw.postal_code?.trim() || undefined;
  let city = raw.city?.trim() || undefined;
  
  // If address_line given but no structured fields, try basic parsing
  if (!street && !postalCode && raw.address_line) {
    const addrParts = raw.address_line.trim().split(',').map(p => p.trim());
    if (addrParts.length >= 1) {
      street = addrParts[0];
    }
    if (addrParts.length >= 2) {
      const plzCity = addrParts[addrParts.length - 1];
      const plzMatch = plzCity.match(/^(\d{5})\s+(.+)$/);
      if (plzMatch) {
        postalCode = plzMatch[1];
        city = plzMatch[2];
      } else {
        city = plzCity;
      }
    }
    changes.push({ field: 'address', from: raw.address_line, to: `${street || ''}, ${postalCode || ''} ${city || ''}`.trim() });
  }
  
  // Warnings
  if (!firstName && !lastName && !company) {
    warnings.push('Kein Name und keine Firma vorhanden');
  }
  if (!email && !phoneE164) {
    warnings.push('Weder E-Mail noch Telefon vorhanden');
  }
  
  return {
    normalized: {
      salutation,
      firstName,
      lastName,
      company,
      phoneE164: phoneE164 || undefined,
      domain: domain || undefined,
      street,
      postalCode,
      city,
      email,
    },
    changes,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════
// 5. CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════════

/**
 * Berechnet einen explainable Confidence Score.
 * Rein funktional, deterministisch.
 */
export function calcConfidence(
  contact: {
    firstName?: string;
    lastName?: string;
    company?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    phoneE164?: string;
    domain?: string;
    email?: string;
  },
  sourceCount: number = 1,
): { score: number; components: ConfidenceComponents; explanation: string } {
  
  const components: ConfidenceComponents = {
    identityMatch: 0,
    addressQuality: 0,
    phoneValidity: 0,
    domainValidity: 0,
    sourceCount: 0,
    consistency: 0.5, // default neutral
  };
  
  // Identity
  if (contact.company) components.identityMatch += 0.4;
  if (contact.firstName && contact.lastName) components.identityMatch += 0.6;
  else if (contact.lastName) components.identityMatch += 0.3;
  
  // Address
  if (contact.city) components.addressQuality += 0.3;
  if (contact.postalCode) components.addressQuality += 0.3;
  if (contact.street) components.addressQuality += 0.4;
  
  // Phone
  if (contact.phoneE164 && contact.phoneE164.startsWith('+') && contact.phoneE164.length >= 10) {
    components.phoneValidity = 1.0;
  } else if (contact.phoneE164 && contact.phoneE164.length >= 6) {
    components.phoneValidity = 0.5;
  }
  
  // Domain
  if (contact.domain && contact.domain.includes('.')) {
    components.domainValidity = 1.0;
  } else if (contact.email && contact.email.includes('@')) {
    components.domainValidity = 0.6;
  }
  
  // Source count
  if (sourceCount >= 3) components.sourceCount = 1.0;
  else if (sourceCount >= 2) components.sourceCount = 0.6;
  else components.sourceCount = 0.3;
  
  // Consistency (heuristic: more fields filled = more consistent data)
  const filledFields = [contact.firstName, contact.lastName, contact.company, contact.email, contact.phoneE164, contact.domain, contact.city].filter(Boolean).length;
  components.consistency = Math.min(1.0, filledFields / 5);
  
  // Weighted score
  const score = Object.entries(CONFIDENCE_WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + components[key as keyof ConfidenceComponents] * weight;
  }, 0);
  
  // Clamp to 0..1
  const clampedScore = Math.max(0, Math.min(1, score));
  
  // Build explanation
  const parts: string[] = [];
  if (components.identityMatch >= 0.6) parts.push('Name vollständig');
  else if (components.identityMatch >= 0.3) parts.push('Name teilweise');
  else parts.push('Name fehlt');
  
  if (components.addressQuality >= 0.7) parts.push('Adresse vollständig');
  else if (components.addressQuality >= 0.3) parts.push('Adresse teilweise');
  
  if (components.phoneValidity >= 0.8) parts.push('Telefon gültig');
  if (components.domainValidity >= 0.8) parts.push('Domain vorhanden');
  
  return {
    score: Math.round(clampedScore * 100) / 100,
    components,
    explanation: parts.join(', '),
  };
}

// ═══════════════════════════════════════════════════════════════
// 6. QUALITY GATE
// ═══════════════════════════════════════════════════════════════

/**
 * Wendet Quality Gate an: Score → Status.
 */
export function applyQualityGate(score: number): QualityStatus {
  if (score >= QUALITY_THRESHOLDS.autoApprove) return 'approved';
  if (score >= QUALITY_THRESHOLDS.needsReview) return 'needs_review';
  return 'candidate'; // not 'rejected' — candidates below threshold can be enriched
}

// ═══════════════════════════════════════════════════════════════
// 7. DEDUPLIZIERUNG
// ═══════════════════════════════════════════════════════════════

interface DedupePoolEntry {
  id: string;
  email?: string | null;
  phone?: string | null;
  domain?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  postalCode?: string | null;
  street?: string | null;
}

/**
 * Prüft alle 5 Dedupe-Regeln, sortiert nach Stärke.
 * Pure function — arbeitet auf übergebenem Pool.
 */
export function findDedupeMatches(
  candidate: {
    email?: string;
    phoneE164?: string;
    domain?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    postalCode?: string;
    street?: string;
  },
  pool: DedupePoolEntry[],
): DedupeCandidate[] {
  const matches: DedupeCandidate[] = [];
  
  for (const existing of pool) {
    // Rule 2: domain match
    if (candidate.domain && existing.domain && candidate.domain === existing.domain) {
      matches.push({
        existingContactId: existing.id,
        matchType: 'domain',
        matchField: candidate.domain,
        score: 0.85,
        explanation: `Domain-Match: ${candidate.domain}`,
      });
      continue;
    }
    
    // Rule 3: phone match
    if (candidate.phoneE164 && existing.phone) {
      const existingNorm = normalizePhone(existing.phone);
      if (candidate.phoneE164 === existingNorm && candidate.phoneE164.length >= 10) {
        matches.push({
          existingContactId: existing.id,
          matchType: 'phone',
          matchField: candidate.phoneE164,
          score: 0.80,
          explanation: `Telefon-Match: ${candidate.phoneE164}`,
        });
        continue;
      }
    }
    
    // Rule 2.5: email match (strongest practical)
    if (candidate.email && existing.email && candidate.email.toLowerCase() === existing.email.toLowerCase()) {
      matches.push({
        existingContactId: existing.id,
        matchType: 'domain',
        matchField: candidate.email,
        score: 0.95,
        explanation: `E-Mail-Match: ${candidate.email}`,
      });
      continue;
    }
    
    // Rule 4: name + postalCode + street
    if (candidate.lastName && existing.lastName && candidate.postalCode && existing.postalCode) {
      const nameMatch = candidate.lastName.toLowerCase() === existing.lastName.toLowerCase();
      const plzMatch = candidate.postalCode === existing.postalCode;
      const streetMatch = candidate.street && existing.street && 
        candidate.street.toLowerCase().replace(/\s+/g, '') === existing.street.toLowerCase().replace(/\s+/g, '');
      
      if (nameMatch && plzMatch && streetMatch) {
        matches.push({
          existingContactId: existing.id,
          matchType: 'name_address',
          matchField: `${candidate.lastName}, ${candidate.postalCode}`,
          score: 0.70,
          explanation: `Name+PLZ+Straße: ${candidate.lastName} in ${candidate.postalCode}`,
        });
        continue;
      }
    }
    
    // Rule 5: fuzzy — company + city
    if (candidate.company && existing.company) {
      const companyMatch = candidate.company.toLowerCase().replace(/\s+/g, '') === existing.company.toLowerCase().replace(/\s+/g, '');
      if (companyMatch) {
        matches.push({
          existingContactId: existing.id,
          matchType: 'fuzzy',
          matchField: candidate.company,
          score: 0.50,
          explanation: `Firmenname-Match: ${candidate.company}`,
        });
      }
    }
  }
  
  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score);
}

// ═══════════════════════════════════════════════════════════════
// 8. MERGE
// ═══════════════════════════════════════════════════════════════

/**
 * Feldweiser Merge: bevorzugt den neueren/vollständigeren Wert.
 */
export function mergeContacts(
  master: Record<string, unknown>,
  incoming: Record<string, unknown>,
): { merged: Record<string, unknown>; decisions: MergeDecision[] } {
  const decisions: MergeDecision[] = [];
  const merged = { ...master };
  
  for (const [key, incomingVal] of Object.entries(incoming)) {
    if (incomingVal === null || incomingVal === undefined || incomingVal === '') continue;
    
    const masterVal = master[key];
    
    if (masterVal === null || masterVal === undefined || masterVal === '') {
      // Master empty, take incoming
      merged[key] = incomingVal;
      decisions.push({
        field: key,
        winnerSource: 'incoming',
        reason: 'Master-Feld leer, übernehme Incoming',
        oldValue: String(masterVal ?? ''),
        newValue: String(incomingVal),
      });
    }
    // If both have values, keep master (stability)
  }
  
  return { merged, decisions };
}

// ═══════════════════════════════════════════════════════════════
// 9. KATEGORIE-KLASSIFIZIERUNG
// ═══════════════════════════════════════════════════════════════

/**
 * Erkennt Kategorie aus Firmennamen/Beschreibung.
 * Source-backed, keine KI-Halluzination.
 */
export function classifyCategory(
  companyName: string | null | undefined,
  description: string | null | undefined,
): { primary: string; secondary: string[] } {
  if (!companyName && !description) {
    return { primary: 'Sonstige', secondary: [] };
  }
  
  const text = `${companyName || ''} ${description || ''}`.toLowerCase();
  const matches: Array<{ code: string; score: number }> = [];
  
  for (const cat of CATEGORY_REGISTRY) {
    // Check apify mappings (keyword matching)
    const keywords = cat.providerMappings.apify || [];
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        matches.push({ code: cat.code, score: kw.length }); // longer match = higher confidence
        break;
      }
    }
  }
  
  if (matches.length === 0) {
    return { primary: 'Sonstige', secondary: [] };
  }
  
  // Sort by score (longest keyword match first)
  matches.sort((a, b) => b.score - a.score);
  
  return {
    primary: matches[0].code,
    secondary: matches.slice(1, 3).map(m => m.code),
  };
}

// ═══════════════════════════════════════════════════════════════
// 10. DEDUPE KEY
// ═══════════════════════════════════════════════════════════════

/**
 * Deterministischer Dedupe-Schlüssel für schnelle Hash-Prüfung.
 */
export function buildDedupeKey(contact: {
  email?: string;
  phoneE164?: string;
  lastName?: string;
  postalCode?: string;
}): string {
  const parts = [
    contact.email?.toLowerCase().trim() || '',
    contact.phoneE164 || '',
    contact.lastName?.toLowerCase().trim() || '',
    contact.postalCode || '',
  ];
  return parts.join('|');
}

// ═══════════════════════════════════════════════════════════════
// 11. RUN METRICS
// ═══════════════════════════════════════════════════════════════

/**
 * Aggregiert Discovery-Run-Metriken aus einem Array von Ergebnis-Statussen.
 */
export function calcRunMetrics(
  results: Array<{ qualityStatus?: string; confidenceScore?: number; isDuplicate?: boolean }>,
): DiscoveryRunMetrics {
  return {
    rawFound: results.length,
    normalized: results.length,
    enriched: results.filter(r => r.qualityStatus === 'enriched' || (r.confidenceScore && r.confidenceScore > 0.5)).length,
    duplicates: results.filter(r => r.isDuplicate).length,
    approved: results.filter(r => r.qualityStatus === 'approved').length,
    needsReview: results.filter(r => r.qualityStatus === 'needs_review').length,
    rejected: results.filter(r => r.qualityStatus === 'rejected').length,
    blocked: results.filter(r => r.qualityStatus === 'blocked').length,
  };
}

// ═══════════════════════════════════════════════════════════════
// 12. HELPER: getCategoriesByGroup
// ═══════════════════════════════════════════════════════════════

/**
 * Filtert die Kategorie-Registry nach Gruppe.
 */
export function getCategoriesByGroup(group?: CategoryGroupCode): typeof CATEGORY_REGISTRY {
  if (!group) return CATEGORY_REGISTRY;
  return CATEGORY_REGISTRY.filter(c => c.group === group);
}
