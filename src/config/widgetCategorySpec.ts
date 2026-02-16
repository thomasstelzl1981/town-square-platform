/**
 * Widget Category Spec — CI-Widget-System SSOT
 * 
 * Definiert die drei Widget-Kategorien und Glow-Regeln nach Datenherkunft.
 * 
 * KATEGORIEN:
 * 1. Dashboard-Widget — System-Widgets (Armstrong, Wetter, Globe)
 * 2. Entity-Widget    — Personen, Konten (neutral, kein Glow)
 * 3. Contract-Widget  — Verträge, Fälle (Glow nach Herkunft)
 * 
 * GLOW-REGELN NACH HERKUNFT:
 * - Demo-Daten    → primary (Blau) + DEMO Badge
 * - Manuell       → emerald (Grün) — echte, vom User angelegte Verträge
 * - Shop/Angebote → neutral (kein Glow)
 * 
 * GLOW-REGELN NACH MODUL (Case-Widgets):
 * - MOD-04 Portfolio   → amber
 * - MOD-04 Sanierung   → orange
 * - MOD-07 Finanzierung→ primary
 * - MOD-07 Privatkredit→ orange
 * - MOD-08 Suche       → primary
 * - MOD-11 FM-Manager  → primary
 * - MOD-12 Akquise     → cyan
 * - MOD-13 Projekte    → amber
 * - MOD-14 CommPro     → violet
 * - MOD-17 Fahrzeuge   → teal
 * - MOD-18 Versicherung→ emerald (manuell) / primary (demo)
 * - MOD-18 Vorsorge    → emerald (manuell) / primary (demo)
 * - MOD-18 Abos        → emerald (manuell) / primary (demo)
 * - MOD-18 KV          → primary (nur demo)
 * - MOD-18 Konten      → neutral
 */

import type { ActiveWidgetVariant } from './designManifest';
import { ALL_DEMO_IDS } from '@/engines/demoData/data';

// ─── ENUMS ─────────────────────────────────────────────────

export type WidgetCategory = 'dashboard' | 'entity' | 'contract';

export type WidgetGlowSource = 'demo' | 'manual' | 'shop' | 'module';

// ─── MODULE → GLOW MAP ────────────────────────────────────

export const MODULE_GLOW_MAP: Record<string, ActiveWidgetVariant> = {
  'MOD-04-portfolio': 'amber',
  'MOD-04-sanierung': 'orange',
  'MOD-07-finanzierung': 'primary',
  'MOD-07-privatkredit': 'orange',
  'MOD-08-suche': 'primary',
  'MOD-11-fm': 'primary',
  'MOD-12-akquise': 'cyan',
  'MOD-13-projekte': 'amber',
  'MOD-14-commpro': 'violet',
  'MOD-17-fahrzeuge': 'teal',
} as const;

// ─── HELPER ────────────────────────────────────────────────

/** Prüft ob eine ID zu Demo-Daten gehört */
export function isDemoId(id: string): boolean {
  return ALL_DEMO_IDS.includes(id);
}

/**
 * Bestimmt die Glow-Variante für einen Vertrags-Widget anhand der Datenherkunft.
 * 
 * @param id - Entity-ID des Vertrags
 * @param isShopOffer - Ist es ein Shop-/Marketplace-Angebot?
 * @returns ActiveWidgetVariant oder null (kein Glow)
 */
export function getContractWidgetGlow(
  id: string,
  isShopOffer = false,
): ActiveWidgetVariant | null {
  if (isDemoId(id)) return 'emerald';
  if (isShopOffer) return null;
  return 'rose'; // manuell erfasster Vertrag → rot
}

/**
 * Universeller Glow-Resolver: Bestimmt die Glow-Variante basierend auf Quelle.
 * 
 * @param source - Datenherkunft
 * @param moduleCode - Optional: Modul-Code für modul-spezifischen Glow
 */
export function resolveWidgetGlow(
  source: WidgetGlowSource,
  moduleCode?: string,
): ActiveWidgetVariant | null {
  switch (source) {
    case 'demo': return 'emerald';
    case 'manual': return 'rose';
    case 'shop': return null;
    case 'module': return moduleCode ? (MODULE_GLOW_MAP[moduleCode] ?? null) : null;
  }
}
