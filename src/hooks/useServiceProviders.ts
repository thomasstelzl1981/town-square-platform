/**
 * useServiceProviders — Feld 18: Dienstleistersteuerung
 * 
 * Manages service providers (Handwerker, Hausmeister, etc.),
 * tracks assignments, ratings, and SLA compliance.
 * 
 * @field 18
 * @module TLC
 */

import { useState, useMemo, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────

export type ServiceProviderCategory =
  | 'handwerker'       // Handyman
  | 'sanitaer'         // Plumber
  | 'elektrik'         // Electrician
  | 'heizung'          // Heating tech
  | 'schluesseldienst' // Locksmith
  | 'maler'            // Painter
  | 'reinigung'        // Cleaning
  | 'garten'           // Landscaping
  | 'hausmeister'      // Caretaker
  | 'dachdeckerei'     // Roofer
  | 'schimmel'         // Mold specialist
  | 'schaedlinge'      // Pest control
  | 'sonstig';         // Other

export type AssignmentStatus = 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export interface ServiceProvider {
  id: string;
  name: string;
  categories: ServiceProviderCategory[];
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxId: string | null;
  averageRating: number;        // 1-5
  totalAssignments: number;
  completedOnTime: number;
  preferredForEmergency: boolean;
  notes: string | null;
  isActive: boolean;
}

export interface ServiceAssignment {
  id: string;
  providerId: string;
  propertyId: string;
  unitId: string | null;
  leaseId: string | null;
  taskId: string | null;         // links to tenancy_tasks
  category: ServiceProviderCategory;
  description: string;
  status: AssignmentStatus;
  priority: 'normal' | 'urgent' | 'emergency';
  estimatedCost: number | null;
  actualCost: number | null;
  quotedAt: string | null;
  scheduledDate: string | null;
  completedAt: string | null;
  rating: number | null;         // 1-5 tenant/owner rating
  ratingNotes: string | null;
  createdAt: string;
}

export interface QuoteRequest {
  assignmentId: string;
  providerIds: string[];
  description: string;
  deadline: string;
  quotes: Quote[];
}

export interface Quote {
  providerId: string;
  providerName: string;
  amount: number;
  validUntil: string;
  description: string;
  receivedAt: string;
}

export const CATEGORY_LABELS: Record<ServiceProviderCategory, string> = {
  handwerker: 'Handwerker (allgemein)',
  sanitaer: 'Sanitär/Klempner',
  elektrik: 'Elektriker',
  heizung: 'Heizungstechniker',
  schluesseldienst: 'Schlüsseldienst',
  maler: 'Maler/Lackierer',
  reinigung: 'Reinigung',
  garten: 'Garten-/Landschaftsbau',
  hausmeister: 'Hausmeister',
  dachdeckerei: 'Dachdeckerei',
  schimmel: 'Schimmelsanierung',
  schaedlinge: 'Schädlingsbekämpfung',
  sonstig: 'Sonstige',
};

// ─── Pure Logic ───────────────────────────────────────────────

/** Find best providers for a category, sorted by rating and on-time rate */
export function rankProviders(
  providers: ServiceProvider[],
  category: ServiceProviderCategory,
  isEmergency: boolean = false
): ServiceProvider[] {
  return providers
    .filter(p => p.isActive && p.categories.includes(category))
    .filter(p => !isEmergency || p.preferredForEmergency)
    .sort((a, b) => {
      // Primary: rating (desc)
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
      // Secondary: on-time rate (desc)
      const aRate = a.totalAssignments > 0 ? a.completedOnTime / a.totalAssignments : 0;
      const bRate = b.totalAssignments > 0 ? b.completedOnTime / b.totalAssignments : 0;
      return bRate - aRate;
    });
}

/** Calculate SLA compliance for a provider */
export function calculateSlaCompliance(assignments: ServiceAssignment[]): {
  total: number;
  onTime: number;
  late: number;
  complianceRate: number;
  averageCostDeviation: number;
} {
  const completed = assignments.filter(a => a.status === 'completed');
  const total = completed.length;
  if (total === 0) return { total: 0, onTime: 0, late: 0, complianceRate: 100, averageCostDeviation: 0 };

  let onTime = 0;
  const costDeviations: number[] = [];

  for (const a of completed) {
    if (a.scheduledDate && a.completedAt) {
      if (new Date(a.completedAt) <= new Date(a.scheduledDate)) onTime++;
    } else {
      onTime++; // no schedule = assume on time
    }
    if (a.estimatedCost && a.actualCost && a.estimatedCost > 0) {
      costDeviations.push(((a.actualCost - a.estimatedCost) / a.estimatedCost) * 100);
    }
  }

  const avgDeviation = costDeviations.length > 0
    ? costDeviations.reduce((s, d) => s + d, 0) / costDeviations.length
    : 0;

  return {
    total,
    onTime,
    late: total - onTime,
    complianceRate: Math.round((onTime / total) * 100 * 10) / 10,
    averageCostDeviation: Math.round(avgDeviation * 10) / 10,
  };
}

/** Compare quotes and recommend best option */
export function compareQuotes(quotes: Quote[]): {
  cheapest: Quote | null;
  recommended: Quote | null;
  analysis: string;
} {
  if (quotes.length === 0) return { cheapest: null, recommended: null, analysis: 'Keine Angebote vorhanden.' };

  const sorted = [...quotes].sort((a, b) => a.amount - b.amount);
  const cheapest = sorted[0];

  // Filter valid quotes (not expired)
  const today = new Date().toISOString().split('T')[0];
  const valid = sorted.filter(q => q.validUntil >= today);

  const recommended = valid.length > 0 ? valid[0] : cheapest;

  const avg = quotes.reduce((s, q) => s + q.amount, 0) / quotes.length;
  const spread = sorted[sorted.length - 1].amount - sorted[0].amount;

  const analysis = `${quotes.length} Angebote eingegangen. ` +
    `Spanne: ${spread.toFixed(2)} € (${sorted[0].amount.toFixed(2)} – ${sorted[sorted.length - 1].amount.toFixed(2)} €). ` +
    `Durchschnitt: ${avg.toFixed(2)} €. ` +
    `Empfehlung: ${recommended.providerName} (${recommended.amount.toFixed(2)} €).`;

  return { cheapest, recommended, analysis };
}

// ─── Hook ─────────────────────────────────────────────────────

export function useServiceProviders(
  providers: ServiceProvider[] = [],
  assignments: ServiceAssignment[] = []
) {
  const [selectedCategory, setSelectedCategory] = useState<ServiceProviderCategory | null>(null);

  const rankedProviders = useMemo(() => {
    if (!selectedCategory) return providers.filter(p => p.isActive);
    return rankProviders(providers, selectedCategory);
  }, [providers, selectedCategory]);

  const providerStats = useMemo(() => {
    const stats: Record<string, ReturnType<typeof calculateSlaCompliance>> = {};
    for (const p of providers) {
      const pAssignments = assignments.filter(a => a.providerId === p.id);
      stats[p.id] = calculateSlaCompliance(pAssignments);
    }
    return stats;
  }, [providers, assignments]);

  const emergencyProviders = useMemo(() => {
    return providers.filter(p => p.isActive && p.preferredForEmergency);
  }, [providers]);

  const findBestProvider = useCallback(
    (category: ServiceProviderCategory, isEmergency = false) =>
      rankProviders(providers, category, isEmergency),
    [providers]
  );

  return {
    rankedProviders,
    providerStats,
    emergencyProviders,
    selectedCategory,
    setSelectedCategory,
    findBestProvider,
    categoryLabels: CATEGORY_LABELS,
  };
}
