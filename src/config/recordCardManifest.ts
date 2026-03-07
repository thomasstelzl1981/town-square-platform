/**
 * RecordCard Manifest — Zentrale Konfiguration für alle Akten-Typen
 * 
 * Definiert pro Entitätstyp:
 * - Modul-Code für DMS-Ordner
 * - Icon
 * - Label
 */

import { User, Shield, Car, Heart, CreditCard, Landmark, Sun, PawPrint, Zap, Home, Camera, Bot } from 'lucide-react';
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
  utility_contract: {
    label: 'Versorgungsvertrag',
    moduleCode: 'MOD_20',
    icon: Zap,
    keywordFields: ['provider_name', 'contract_number'],
    dmsFolders: [
      '01_Vertrag',
      '02_Rechnung',
      '03_Zaehlerstand',
      '04_Sonstiges',
    ],
  },
  rental_contract: {
    label: 'Mietvertrag',
    moduleCode: 'MOD_20',
    icon: Home,
    keywordFields: ['provider_name', 'contract_number'],
    dmsFolders: [
      '01_Mietvertrag',
      '02_Nebenkostenabrechnung',
      '03_Uebergabeprotokoll',
      '04_Korrespondenz',
      '05_Sonstiges',
    ],
  },
  kv_contract: {
    label: 'Krankenversicherung',
    moduleCode: 'MOD_18',
    icon: Heart,
    keywordFields: ['provider_name', 'policy_number'],
    dmsFolders: [
      '01_Police',
      '02_Abrechnungen',
      '03_Korrespondenz',
    ],
  },
  private_loan: {
    label: 'Privatkredit',
    moduleCode: 'MOD_18',
    icon: CreditCard,
    keywordFields: ['bank_name', 'loan_purpose'],
    dmsFolders: [
      '01_Vertrag',
      '02_Tilgungsplan',
      '03_Korrespondenz',
    ],
  },
  camera: {
    label: 'Smart Home Kamera',
    moduleCode: 'MOD_20',
    icon: Camera,
    keywordFields: ['name'],
    dmsFolders: [],
  },
  armstrong_project: {
    label: 'Armstrong Workspace',
    moduleCode: 'MOD_00',
    icon: Bot,
    keywordFields: ['title'],
    dmsFolders: [
      '01_Uploads',
      '02_Recherche',
      '03_Exporte',
      '04_Sonstiges',
    ],
  },
  acq_module: {
    label: 'Akquise-Datenraum',
    moduleCode: 'MOD_12',
    icon: Home,
    keywordFields: [],
    dmsFolders: [
      '01_Exposes',
      '02_Recherche',
      '03_Korrespondenz',
      '04_Sonstiges',
    ],
  },
  acq_offer: {
    label: 'Akquise-Objekt',
    moduleCode: 'MOD_12',
    icon: Home,
    keywordFields: ['title', 'address'],
    dmsFolders: [
      '01_Expose',
      '02_Unterlagen',
      '03_Bewertung',
    ],
  },
} as const;

export type RecordCardEntityType = keyof typeof RECORD_CARD_TYPES;
