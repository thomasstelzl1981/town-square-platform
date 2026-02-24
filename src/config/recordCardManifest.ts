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
  /** DMS-Unterordner, die bei Akten-Anlage automatisch erstellt werden */
  dmsFolders: string[];
}

export const RECORD_CARD_TYPES: Record<string, RecordCardTypeConfig> = {
  person: {
    label: 'Person',
    moduleCode: 'MOD_01',
    icon: User,
    keywordFields: ['first_name', 'last_name'],
    dmsFolders: [
      '01_Personalausweis',
      '02_Reisepass',
      '03_Geburtsurkunde',
      '04_Ehevertrag',
      '05_Testament',
      '06_Patientenverfuegung',
      '07_Vorsorgevollmacht',
      '08_Sonstiges',
    ],
  },
  insurance: {
    label: 'Versicherung',
    moduleCode: 'MOD_18',
    icon: Shield,
    keywordFields: ['provider_name', 'policy_number'],
    dmsFolders: [
      '01_Police',
      '02_Nachtraege',
      '03_Schaeden',
      '04_Korrespondenz',
      '05_Sonstiges',
    ],
  },
  vehicle: {
    label: 'Fahrzeug',
    moduleCode: 'MOD_17',
    icon: Car,
    keywordFields: ['license_plate', 'brand', 'model'],
    dmsFolders: [
      '01_Zulassung',
      '02_Versicherung',
      '03_Werkstatt_TUeV',
      '04_Kaufvertrag',
      '05_Sonstiges',
    ],
  },
  pv_plant: {
    label: 'PV-Anlage',
    moduleCode: 'MOD_19',
    icon: Sun,
    keywordFields: ['name', 'mastr_plant_id'],
    dmsFolders: [
      '01_Stammdaten',
      '02_MaStR_BNetzA',
      '03_Netzbetreiber',
      '04_Zaehler',
      '05_Wechselrichter_und_Speicher',
      '06_Versicherung',
      '07_Steuer_USt_BWA',
      '08_Wartung_Service',
    ],
  },
  vorsorge: {
    label: 'Vorsorge',
    moduleCode: 'MOD_18',
    icon: Heart,
    keywordFields: ['provider_name', 'contract_number'],
    dmsFolders: [
      '01_Vertrag',
      '02_Standmitteilungen',
      '03_Renteninformation',
      '04_Korrespondenz',
    ],
  },
  subscription: {
    label: 'Abonnement',
    moduleCode: 'MOD_18',
    icon: CreditCard,
    keywordFields: ['provider_name', 'contract_number'],
    dmsFolders: [],
  },
  bank_account: {
    label: 'Bankkonto',
    moduleCode: 'MOD_18',
    icon: Landmark,
    keywordFields: ['bank_name', 'iban'],
    dmsFolders: [],
  },
  pet: {
    label: 'Haustier',
    moduleCode: 'MOD_05',
    icon: PawPrint,
    keywordFields: ['name', 'breed', 'chip_number'],
    dmsFolders: [
      '01_Impfpass',
      '02_Tierarzt',
      '03_Versicherung',
      '04_Sonstiges',
    ],
  },
} as const;

export type RecordCardEntityType = keyof typeof RECORD_CARD_TYPES;
