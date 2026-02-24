/**
 * ENG-MKTDIR — Market Directory Engine
 * engine.ts — Pure Functions (keine Seiteneffekte, kein DB-Zugriff, kein React)
 * 
 * Version: 2.0.0
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
  type RegionQueueEntry,
  type DiscoveryBudget,
  type ComplianceFlags,
  type InboundClassification,
  type InboundType,
  type OutreachSegmentFilter,
  type SequenceStep,
  CONFIDENCE_WEIGHTS,
  QUALITY_THRESHOLDS,
  DEDUPE_PRIORITY,
  CATEGORY_REGISTRY,
  DAILY_TARGET,
  OUTREACH_LIMITS,
  TOP_REGIONS_DE,
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
  'dr.': 'Herr',
  'prof.': 'Herr',
};

export function splitName(fullName: string): {
  salutation?: string;
  firstName?: string;
  lastName?: string;
} {
  if (!fullName || !fullName.trim()) return {};
  
  const parts = fullName.trim().replace(/\s+/g, ' ').split(' ');
  let salutation: string | undefined;
  let startIdx = 0;

  const firstLower = parts[0].toLowerCase();
  if (SALUTATION_PATTERNS[firstLower]) {
    salutation = SALUTATION_PATTERNS[firstLower];
    startIdx = 1;
  }

  const remaining = parts.slice(startIdx);
  if (remaining.length === 0) return { salutation };
  if (remaining.length === 1) return { salutation, lastName: remaining[0] };

  const firstName = remaining[0];
  const lastName = remaining.slice(1).join(' ');
  return { salutation, firstName, lastName };
}

// ═══════════════════════════════════════════════════════════════
// 2. PHONE NORMALIZATION
// ═══════════════════════════════════════════════════════════════

export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return '';
  let cleaned = raw.trim();
  const hasPlus = cleaned.startsWith('+');
  cleaned = cleaned.replace(/[^\d]/g, '');
  
  if (hasPlus) return '+' + cleaned;
  if (cleaned.startsWith('0') && cleaned.length >= 6) return '+49' + cleaned.slice(1);
  if (cleaned.startsWith('49') && cleaned.length >= 10) return '+' + cleaned;
  return cleaned || '';
}

// ═══════════════════════════════════════════════════════════════
// 3. DOMAIN NORMALIZATION
// ═══════════════════════════════════════════════════════════════

export function normalizeDomain(url: string | null | undefined): string {
  if (!url) return '';
  let cleaned = url.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/^www\./, '');
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];
  cleaned = cleaned.replace(/\.$/, '');
  return cleaned;
}

// ═══════════════════════════════════════════════════════════════
// 4. CONTACT NORMALIZATION
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

export function normalizeContact(raw: RawContactInput): NormalizationResult {
  const changes: Array<{ field: string; from: string; to: string }> = [];
  const warnings: string[] = [];
  
  let salutation = raw.salutation?.trim() || undefined;
  let firstName = raw.first_name?.trim() || undefined;
  let lastName = raw.last_name?.trim() || undefined;
  
  if (!firstName && !lastName && raw.contact_person_name) {
    const split = splitName(raw.contact_person_name);
    if (!salutation && split.salutation) salutation = split.salutation;
    firstName = split.firstName;
    lastName = split.lastName;
    changes.push({ field: 'name', from: raw.contact_person_name, to: `${firstName || ''} ${lastName || ''}`.trim() });
  }
  
  const company = (raw.company_name || raw.company || '').trim() || undefined;
  const phoneRaw = raw.phone || '';
  const phoneE164 = normalizePhone(phoneRaw);
  if (phoneRaw && phoneE164 !== phoneRaw.trim()) {
    changes.push({ field: 'phone', from: phoneRaw, to: phoneE164 });
  }
  
  const domain = normalizeDomain(raw.website_url);
  const emailRaw = raw.email || '';
  const email = emailRaw.trim().toLowerCase() || undefined;
  if (emailRaw && email !== emailRaw) {
    changes.push({ field: 'email', from: emailRaw, to: email || '' });
  }
  
  let street = raw.street?.trim() || undefined;
  let postalCode = raw.postal_code?.trim() || undefined;
  let city = raw.city?.trim() || undefined;
  
  if (!street && !postalCode && raw.address_line) {
    const addrParts = raw.address_line.trim().split(',').map(p => p.trim());
    if (addrParts.length >= 1) street = addrParts[0];
    if (addrParts.length >= 2) {
      const plzCity = addrParts[addrParts.length - 1];
      const plzMatch = plzCity.match(/^(\d{5})\s+(.+)$/);
      if (plzMatch) { postalCode = plzMatch[1]; city = plzMatch[2]; }
      else { city = plzCity; }
    }
    changes.push({ field: 'address', from: raw.address_line, to: `${street || ''}, ${postalCode || ''} ${city || ''}`.trim() });
  }
  
  if (!firstName && !lastName && !company) warnings.push('Kein Name und keine Firma vorhanden');
  if (!email && !phoneE164) warnings.push('Weder E-Mail noch Telefon vorhanden');
  
  return {
    normalized: { salutation, firstName, lastName, company, phoneE164: phoneE164 || undefined, domain: domain || undefined, street, postalCode, city, email },
    changes,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════
// 5. CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════════

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
    identityMatch: 0, addressQuality: 0, phoneValidity: 0,
    domainValidity: 0, sourceCount: 0, consistency: 0.5,
  };
  
  if (contact.company) components.identityMatch += 0.4;
  if (contact.firstName && contact.lastName) components.identityMatch += 0.6;
  else if (contact.lastName) components.identityMatch += 0.3;
  
  if (contact.city) components.addressQuality += 0.3;
  if (contact.postalCode) components.addressQuality += 0.3;
  if (contact.street) components.addressQuality += 0.4;
  
  if (contact.phoneE164 && contact.phoneE164.startsWith('+') && contact.phoneE164.length >= 10) components.phoneValidity = 1.0;
  else if (contact.phoneE164 && contact.phoneE164.length >= 6) components.phoneValidity = 0.5;
  
  if (contact.domain && contact.domain.includes('.')) components.domainValidity = 1.0;
  else if (contact.email && contact.email.includes('@')) components.domainValidity = 0.6;
  
  if (sourceCount >= 3) components.sourceCount = 1.0;
  else if (sourceCount >= 2) components.sourceCount = 0.6;
  else components.sourceCount = 0.3;
  
  const filledFields = [contact.firstName, contact.lastName, contact.company, contact.email, contact.phoneE164, contact.domain, contact.city].filter(Boolean).length;
  components.consistency = Math.min(1.0, filledFields / 5);
  
  const score = Object.entries(CONFIDENCE_WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + components[key as keyof ConfidenceComponents] * weight;
  }, 0);
  
  const clampedScore = Math.max(0, Math.min(1, score));
  
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

export function applyQualityGate(score: number): QualityStatus {
  if (score >= QUALITY_THRESHOLDS.autoApprove) return 'approved';
  if (score >= QUALITY_THRESHOLDS.needsReview) return 'needs_review';
  return 'candidate';
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

export function findDedupeMatches(
  candidate: {
    email?: string; phoneE164?: string; domain?: string;
    firstName?: string; lastName?: string; company?: string;
    postalCode?: string; street?: string;
  },
  pool: DedupePoolEntry[],
): DedupeCandidate[] {
  const matches: DedupeCandidate[] = [];
  
  for (const existing of pool) {
    if (candidate.email && existing.email && candidate.email.toLowerCase() === existing.email.toLowerCase()) {
      matches.push({ existingContactId: existing.id, matchType: 'domain', matchField: candidate.email, score: 0.95, explanation: `E-Mail-Match: ${candidate.email}` });
      continue;
    }
    if (candidate.domain && existing.domain && candidate.domain === existing.domain) {
      matches.push({ existingContactId: existing.id, matchType: 'domain', matchField: candidate.domain, score: 0.85, explanation: `Domain-Match: ${candidate.domain}` });
      continue;
    }
    if (candidate.phoneE164 && existing.phone) {
      const existingNorm = normalizePhone(existing.phone);
      if (candidate.phoneE164 === existingNorm && candidate.phoneE164.length >= 10) {
        matches.push({ existingContactId: existing.id, matchType: 'phone', matchField: candidate.phoneE164, score: 0.80, explanation: `Telefon-Match: ${candidate.phoneE164}` });
        continue;
      }
    }
    if (candidate.lastName && existing.lastName && candidate.postalCode && existing.postalCode) {
      const nameMatch = candidate.lastName.toLowerCase() === existing.lastName.toLowerCase();
      const plzMatch = candidate.postalCode === existing.postalCode;
      const streetMatch = candidate.street && existing.street && 
        candidate.street.toLowerCase().replace(/\s+/g, '') === existing.street.toLowerCase().replace(/\s+/g, '');
      if (nameMatch && plzMatch && streetMatch) {
        matches.push({ existingContactId: existing.id, matchType: 'name_address', matchField: `${candidate.lastName}, ${candidate.postalCode}`, score: 0.70, explanation: `Name+PLZ+Straße: ${candidate.lastName} in ${candidate.postalCode}` });
        continue;
      }
    }
    if (candidate.company && existing.company) {
      const companyMatch = candidate.company.toLowerCase().replace(/\s+/g, '') === existing.company.toLowerCase().replace(/\s+/g, '');
      if (companyMatch) {
        matches.push({ existingContactId: existing.id, matchType: 'fuzzy', matchField: candidate.company, score: 0.50, explanation: `Firmenname-Match: ${candidate.company}` });
      }
    }
  }
  
  return matches.sort((a, b) => b.score - a.score);
}

// ═══════════════════════════════════════════════════════════════
// 8. MERGE
// ═══════════════════════════════════════════════════════════════

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
      merged[key] = incomingVal;
      decisions.push({ field: key, winnerSource: 'incoming', reason: 'Master-Feld leer, übernehme Incoming', oldValue: String(masterVal ?? ''), newValue: String(incomingVal) });
    }
  }
  
  return { merged, decisions };
}

// ═══════════════════════════════════════════════════════════════
// 9. KATEGORIE-KLASSIFIZIERUNG
// ═══════════════════════════════════════════════════════════════

export function classifyCategory(
  companyName: string | null | undefined,
  description: string | null | undefined,
): { primary: string; secondary: string[] } {
  if (!companyName && !description) return { primary: 'Sonstige', secondary: [] };
  
  const text = `${companyName || ''} ${description || ''}`.toLowerCase();
  const matches: Array<{ code: string; score: number }> = [];
  
  for (const cat of CATEGORY_REGISTRY) {
    const keywords = cat.providerMappings.apify || [];
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        matches.push({ code: cat.code, score: kw.length });
        break;
      }
    }
  }
  
  if (matches.length === 0) return { primary: 'Sonstige', secondary: [] };
  matches.sort((a, b) => b.score - a.score);
  return { primary: matches[0].code, secondary: matches.slice(1, 3).map(m => m.code) };
}

// ═══════════════════════════════════════════════════════════════
// 10. DEDUPE KEY
// ═══════════════════════════════════════════════════════════════

export function buildDedupeKey(contact: {
  email?: string; phoneE164?: string; lastName?: string; postalCode?: string;
}): string {
  return [
    contact.email?.toLowerCase().trim() || '',
    contact.phoneE164 || '',
    contact.lastName?.toLowerCase().trim() || '',
    contact.postalCode || '',
  ].join('|');
}

// ═══════════════════════════════════════════════════════════════
// 11. RUN METRICS
// ═══════════════════════════════════════════════════════════════

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

export function getCategoriesByGroup(group?: CategoryGroupCode): typeof CATEGORY_REGISTRY {
  if (!group) return CATEGORY_REGISTRY;
  return CATEGORY_REGISTRY.filter(c => c.group === group);
}

// ═══════════════════════════════════════════════════════════════
// 13. REGION SCORING (Spec 3.1)
// ═══════════════════════════════════════════════════════════════

/**
 * Berechnet die Priorität einer Region basierend auf Population,
 * letztem Scan und Abdeckung (approved contacts / population).
 * Pure function — kein DB-Zugriff.
 */
export function scoreRegion(
  region: RegionQueueEntry,
  history: { lastScannedDaysAgo?: number; totalRuns?: number },
): { priority: number; reason: string } {
  const now = Date.now();
  let score = 0;
  const reasons: string[] = [];

  // Population factor (0..40 Punkte)
  const popFactor = Math.min(40, (region.population || 100000) / 100000 * 10);
  score += popFactor;
  reasons.push(`Pop: ${popFactor.toFixed(0)}`);

  // Freshness factor: longer since scan = higher priority (0..30)
  const daysSinceLastScan = history.lastScannedDaysAgo ?? 999;
  const freshness = Math.min(30, daysSinceLastScan * 2);
  score += freshness;
  reasons.push(`Frische: ${freshness.toFixed(0)}`);

  // Coverage gap: fewer approved = higher priority (0..20)
  const coverage = region.population
    ? Math.max(0, 20 - (region.approvedContacts / region.population) * 10000)
    : 10;
  score += Math.min(20, coverage);
  reasons.push(`Abdeckung: ${coverage.toFixed(0)}`);

  // Cooldown penalty
  if (region.cooldownUntil) {
    const cooldownEnd = new Date(region.cooldownUntil).getTime();
    if (now < cooldownEnd) {
      score = score * 0.1;
      reasons.push('Cooldown aktiv');
    }
  }

  return {
    priority: Math.round(score * 100) / 100,
    reason: reasons.join(', '),
  };
}

// ═══════════════════════════════════════════════════════════════
// 14. DAILY BUDGET PLANNING (Spec 3.2)
// ═══════════════════════════════════════════════════════════════

/**
 * Plant die Tagesaufteilung: 70% Top-Regionen, 30% Exploration.
 * Sortiert Regionen nach Priority und teilt Budget auf.
 */
export function planDailyBudget(
  regions: RegionQueueEntry[],
  target: DiscoveryBudget = DAILY_TARGET,
): {
  topRegions: RegionQueueEntry[];
  exploration: RegionQueueEntry[];
  budget: DiscoveryBudget;
  totalSlots: number;
} {
  // Sort by priority descending
  const sorted = [...regions].sort((a, b) => b.priorityScore - a.priorityScore);

  const topCount = Math.ceil(sorted.length * target.topRegionsPct);
  const topRegions = sorted.slice(0, topCount);
  const exploration = sorted.slice(topCount);

  return {
    topRegions,
    exploration,
    budget: target,
    totalSlots: Math.ceil(target.rawTarget / 25), // ~25 contacts per slot
  };
}

// ═══════════════════════════════════════════════════════════════
// 15. PROVIDER CATEGORY MAPPING (Spec 1.2)
// ═══════════════════════════════════════════════════════════════

/**
 * Mappt eine Provider-spezifische Kategorie (z.B. Google Places type)
 * auf interne CATEGORY_REGISTRY Codes.
 */
export function mapProviderCategory(
  providerType: string,
  providerValue: string,
): { primary: string; secondary: string[] } {
  const matches: Array<{ code: string; group: CategoryGroupCode }> = [];

  const valueLower = providerValue.toLowerCase();

  for (const cat of CATEGORY_REGISTRY) {
    const mappings = cat.providerMappings[providerType] || [];
    for (const mapping of mappings) {
      if (mapping.toLowerCase() === valueLower || valueLower.includes(mapping.toLowerCase())) {
        matches.push({ code: cat.code, group: cat.group });
        break;
      }
    }
  }

  if (matches.length === 0) return { primary: 'Sonstige', secondary: [] };

  return {
    primary: matches[0].code,
    secondary: matches.slice(1, 3).map(m => m.code),
  };
}

// ═══════════════════════════════════════════════════════════════
// 16. CONTACT COMPLETENESS VALIDATION (Spec 2)
// ═══════════════════════════════════════════════════════════════

/**
 * Prüft ob ein Kontakt alle Pflichtfelder für einen Golden Record hat.
 */
export function validateContactCompleteness(contact: {
  displayName?: string;
  company?: string;
  categoryPrimary?: string;
  phoneE164?: string;
  email?: string;
  postalCode?: string;
  city?: string;
  street?: string;
  domain?: string;
}): { isComplete: boolean; missingFields: string[]; score: number } {
  const required: Array<{ field: string; label: string; value: unknown }> = [
    { field: 'displayName', label: 'Name/Firma', value: contact.displayName || contact.company },
    { field: 'categoryPrimary', label: 'Kategorie', value: contact.categoryPrimary },
    { field: 'contact', label: 'E-Mail oder Telefon', value: contact.email || contact.phoneE164 },
    { field: 'postalCode', label: 'PLZ', value: contact.postalCode },
    { field: 'city', label: 'Stadt', value: contact.city },
  ];

  const optional: Array<{ field: string; label: string; value: unknown }> = [
    { field: 'street', label: 'Straße', value: contact.street },
    { field: 'domain', label: 'Domain/Website', value: contact.domain },
    { field: 'phoneE164', label: 'Telefon', value: contact.phoneE164 },
    { field: 'email', label: 'E-Mail', value: contact.email },
  ];

  const missingRequired = required.filter(f => !f.value).map(f => f.label);
  const filledOptional = optional.filter(f => !!f.value).length;

  const requiredScore = (required.length - missingRequired.length) / required.length;
  const optionalScore = filledOptional / optional.length;
  const score = Math.round((requiredScore * 0.7 + optionalScore * 0.3) * 100) / 100;

  return {
    isComplete: missingRequired.length === 0,
    missingFields: missingRequired,
    score,
  };
}

// ═══════════════════════════════════════════════════════════════
// 17. OUTREACH SEGMENT BUILDER (Spec 7.2)
// ═══════════════════════════════════════════════════════════════

/**
 * Filtert Kontakte für Outreach: approved + nicht DNC + Kategorie/Region.
 * Pure function — arbeitet auf übergebenem Array.
 */
export function buildOutreachSegment(
  contacts: Array<{
    contactId?: string;
    qualityStatus?: string;
    categoryPrimary?: string;
    category?: string;
    city?: string;
    postalCode?: string;
    email?: string;
    doNotContactEmail?: boolean;
    do_not_contact?: boolean;
    confidenceScore?: number;
    confidence_score?: number;
  }>,
  filters: OutreachSegmentFilter,
): typeof contacts {
  return contacts.filter(c => {
    // Must be approved
    if (filters.qualityStatuses && filters.qualityStatuses.length > 0) {
      if (!filters.qualityStatuses.includes((c.qualityStatus || 'candidate') as QualityStatus)) return false;
    } else {
      if ((c.qualityStatus || 'candidate') !== 'approved') return false;
    }

    // Must have email
    if (filters.hasEmail !== false && !c.email) return false;

    // Not DNC
    if (filters.excludeDNC !== false && (c.doNotContactEmail || c.do_not_contact)) return false;

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      const cat = c.categoryPrimary || c.category;
      if (!cat || !filters.categories.includes(cat)) return false;
    }

    // Region filter (by city or postal code prefix)
    if (filters.regions && filters.regions.length > 0) {
      const cityMatch = c.city && filters.regions.some(r => c.city!.toLowerCase().includes(r.toLowerCase()));
      const plzMatch = c.postalCode && filters.regions.some(r => c.postalCode!.startsWith(r));
      if (!cityMatch && !plzMatch) return false;
    }

    // Min confidence
    if (filters.minConfidence !== undefined) {
      const score = c.confidenceScore ?? c.confidence_score ?? 0;
      if (score < filters.minConfidence) return false;
    }

    return true;
  });
}

// ═══════════════════════════════════════════════════════════════
// 18. SEND TIMING CHECK (Spec 7.2)
// ═══════════════════════════════════════════════════════════════

/**
 * Prüft ob eine Nachricht jetzt gesendet werden darf (Quiet Hours + Delay).
 */
export function shouldSendNow(
  step: SequenceStep,
  lastSentAt: string | null,
  quietHours: { start: number; end: number } = { start: OUTREACH_LIMITS.quietHoursStart, end: OUTREACH_LIMITS.quietHoursEnd },
  now: Date = new Date(),
): boolean {
  // Check quiet hours
  const currentHour = now.getHours();
  if (quietHours.start > quietHours.end) {
    // Overnight quiet hours (e.g. 20-8)
    if (currentHour >= quietHours.start || currentHour < quietHours.end) return false;
  } else {
    if (currentHour >= quietHours.start && currentHour < quietHours.end) return false;
  }

  // Check delay since last send
  if (lastSentAt && step.delayHours > 0) {
    const lastSent = new Date(lastSentAt);
    const minNextSend = new Date(lastSent.getTime() + step.delayHours * 60 * 60 * 1000);
    if (now < minNextSend) return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════
// 19. INBOUND CLASSIFICATION (Spec 7.4)
// ═══════════════════════════════════════════════════════════════

const BOUNCE_PATTERNS = [
  'undeliverable', 'unzustellbar', 'mailer-daemon', 'delivery failed',
  'mail delivery failed', 'returned mail', 'permanent failure',
  'address rejected', 'mailbox not found', 'user unknown',
];

const UNSUBSCRIBE_PATTERNS = [
  'unsubscribe', 'abmelden', 'abbestellen', 'austragen',
  'nicht mehr erhalten', 'stop', 'remove me', 'kein interesse',
  'keine weiteren', 'bitte entfernen',
];

const COMPLAINT_PATTERNS = [
  'spam', 'abuse', 'complaint', 'beschwerde', 'unerwünscht',
  'belästigung', 'datenschutz', 'dsgvo', 'gdpr',
];

const AUTO_REPLY_PATTERNS = [
  'out of office', 'abwesenheit', 'automatische antwort', 'auto-reply',
  'automatic reply', 'vacation', 'urlaub', 'nicht im büro', 'not in office',
];

/**
 * Klassifiziert eine eingehende Nachricht (Reply, Bounce, Unsubscribe, Complaint).
 * Source-backed pattern matching, keine KI-Halluzination.
 */
export function classifyInbound(
  message: { subject?: string; bodyText?: string; fromEmail?: string },
  _thread?: { contactId?: string },
): InboundClassification {
  const text = `${message.subject || ''} ${message.bodyText || ''} ${message.fromEmail || ''}`.toLowerCase();

  // Bounce check (highest priority)
  for (const pattern of BOUNCE_PATTERNS) {
    if (text.includes(pattern)) {
      return { type: 'bounce', confidence: 0.95, reason: `Bounce-Pattern: "${pattern}"` };
    }
  }

  // Complaint check
  for (const pattern of COMPLAINT_PATTERNS) {
    if (text.includes(pattern)) {
      return { type: 'complaint', confidence: 0.85, reason: `Complaint-Pattern: "${pattern}"` };
    }
  }

  // Unsubscribe check
  for (const pattern of UNSUBSCRIBE_PATTERNS) {
    if (text.includes(pattern)) {
      return { type: 'unsubscribe', confidence: 0.90, reason: `Unsubscribe-Pattern: "${pattern}"` };
    }
  }

  // Auto-reply check
  for (const pattern of AUTO_REPLY_PATTERNS) {
    if (text.includes(pattern)) {
      return { type: 'auto_reply', confidence: 0.80, reason: `Auto-Reply-Pattern: "${pattern}"` };
    }
  }

  // Default: genuine reply
  return { type: 'reply', confidence: 0.70, reason: 'Keine Sondermuster erkannt — wahrscheinlich Antwort' };
}

// ═══════════════════════════════════════════════════════════════
// 20. SUPPRESSION RULES (Spec 7.4)
// ═══════════════════════════════════════════════════════════════

/**
 * Wendet DNC/Suppression-Regeln an basierend auf einem Event.
 * Unsubscribe/Bounce/Complaint → doNotContact + suppressionReason.
 */
export function applySuppressionRules(
  currentFlags: ComplianceFlags,
  event: { type: InboundType; messageId?: string; timestamp?: string },
): ComplianceFlags {
  const updated = { ...currentFlags };

  switch (event.type) {
    case 'unsubscribe':
      updated.doNotContactEmail = true;
      updated.suppressionReason = 'unsubscribed';
      break;
    case 'bounce':
      updated.doNotContactEmail = true;
      updated.suppressionReason = 'bounced';
      break;
    case 'complaint':
      updated.doNotContactEmail = true;
      updated.doNotContactPhone = true;
      updated.suppressionReason = 'complaint';
      break;
    case 'reply':
      // Genuine reply: update last inbound timestamp
      if (event.timestamp) updated.lastInboundAt = event.timestamp;
      break;
    default:
      break;
  }

  return updated;
}
