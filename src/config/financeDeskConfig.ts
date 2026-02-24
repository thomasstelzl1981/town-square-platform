/**
 * Finance Desk Config — SSOT für Beratungsfelder
 * Ausgelagert aus FinanceDeskDashboard.tsx (B2)
 */
import { Landmark, Shield, HeartHandshake, Building2, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Beratungsfeld {
  icon: LucideIcon;
  label: string;
  desc: string;
}

export const BERATUNGSFELDER: Beratungsfeld[] = [
  { icon: Landmark, label: 'Stiftungen', desc: 'Stiftungsgründung & -verwaltung' },
  { icon: Shield, label: 'Vermögensschutz', desc: 'Asset Protection & Strukturierung' },
  { icon: HeartHandshake, label: 'Generationenvermögen', desc: 'Generationsübergreifender Vermögenserhalt' },
  { icon: Building2, label: 'Gewerbliche Versicherungen', desc: 'Betriebliche Versicherungskonzepte' },
  { icon: TrendingUp, label: 'Finanzierungen', desc: 'Privat- & Investitionsfinanzierungen' },
];

/** Plattform-Domains für Go-live Übersicht */
export const PLATFORM_DOMAINS = [
  'kaufy.app',
  'systemofatown.app',
  'miety.app',
  'futureroom.app',
] as const;

/** Zone 3 PIN-Gate Code */
export const PIN_GATE_CODE = '2710';
