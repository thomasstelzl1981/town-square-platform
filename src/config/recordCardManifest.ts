/**
 * RecordCard Manifest — Zentrale Konfiguration für alle Akten-Typen
 * 
 * Definiert pro Entitätstyp:
 * - Modul-Code für DMS-Ordner
 * - Icon
 * - Label
 */

import { User, Shield, Car, Heart, CreditCard, Landmark, Sun, PawPrint } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface RecordCardTypeConfig {
  label: string;
  moduleCode: string;
  icon: LucideIcon;
  /** Sortier-Keywords Felder, die aus der Akte extrahiert werden */
  keywordFields: string[];
}

export const RECORD_CARD_TYPES: Record<string, RecordCardTypeConfig> = {
  person: {
    label: 'Person',
    moduleCode: 'MOD_01',
    icon: User,
    keywordFields: ['first_name', 'last_name'],
  },
  insurance: {
    label: 'Versicherung',
    moduleCode: 'MOD_11',
    icon: Shield,
    keywordFields: ['provider_name', 'policy_number'],
  },
  vehicle: {
    label: 'Fahrzeug',
    moduleCode: 'MOD_17',
    icon: Car,
    keywordFields: ['license_plate', 'brand', 'model'],
  },
  pv_plant: {
    label: 'PV-Anlage',
    moduleCode: 'MOD_19',
    icon: Sun,
    keywordFields: ['name', 'mastr_plant_id'],
  },
  vorsorge: {
    label: 'Vorsorge',
    moduleCode: 'MOD_11',
    icon: Heart,
    keywordFields: ['provider_name', 'contract_number'],
  },
  subscription: {
    label: 'Abonnement',
    moduleCode: 'MOD_11',
    icon: CreditCard,
    keywordFields: ['provider_name', 'contract_number'],
  },
  bank_account: {
    label: 'Bankkonto',
    moduleCode: 'MOD_11',
    icon: Landmark,
    keywordFields: ['bank_name', 'iban'],
  },
  pet: {
    label: 'Haustier',
    moduleCode: 'MOD_05',
    icon: PawPrint,
    keywordFields: ['name', 'breed', 'chip_number'],
  },
} as const;

export type RecordCardEntityType = keyof typeof RECORD_CARD_TYPES;
