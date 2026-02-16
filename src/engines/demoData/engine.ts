/**
 * Demo Data Engine — Pure Utility Functions
 * 
 * O(1) ID-Lookup, Datenpaket-Zugriff, Empty-State-Validierung.
 */

import type { DemoDataSpec, DemoPersona, DemoInsuranceContract, DemoVorsorgeContract, DemoSubscription, DemoKVContract } from './spec';
import {
  DEMO_DATA_SPEC,
  ALL_DEMO_IDS,
  DEMO_FAMILY,
  DEMO_INSURANCES,
  DEMO_VORSORGE,
  DEMO_SUBSCRIPTIONS,
  DEMO_KV_CONTRACTS,
  DEMO_PRIMARY_PERSON_ID,
  DEMO_TENANT_ID,
} from './data';

/** O(1) Lookup-Set für Demo-IDs */
const DEMO_ID_SET = new Set<string>(ALL_DEMO_IDS);

/** Prüft ob eine UUID zum Demo-Datensatz gehört */
export function isDemoId(id: string): boolean {
  return DEMO_ID_SET.has(id);
}

/** Liefert das vollständige Demo-Datenpaket */
export function getDemoSpec(): DemoDataSpec {
  return DEMO_DATA_SPEC;
}

/** Nur Personen */
export function getDemoPersons(): readonly DemoPersona[] {
  return DEMO_FAMILY;
}

/** Nur Versicherungen */
export function getDemoInsurances(): readonly DemoInsuranceContract[] {
  return DEMO_INSURANCES;
}

/** Nur Vorsorgeverträge */
export function getDemoVorsorge(): readonly DemoVorsorgeContract[] {
  return DEMO_VORSORGE;
}

/** Nur Abonnements */
export function getDemoSubscriptions(): readonly DemoSubscription[] {
  return DEMO_SUBSCRIPTIONS;
}

/** KV-Verträge (clientseitig) */
export function getDemoKVContracts(): readonly DemoKVContract[] {
  return DEMO_KV_CONTRACTS;
}

/** Alle Demo-IDs als Array */
export function getAllDemoIds(): readonly string[] {
  return ALL_DEMO_IDS;
}

/** Hauptperson-ID */
export function getDemoPrimaryPersonId(): string {
  return DEMO_PRIMARY_PERSON_ID;
}

/** Demo-Tenant-ID */
export function getDemoTenantId(): string {
  return DEMO_TENANT_ID;
}

/** Erwartete Zähler bei deaktiviertem Demo (alles 0) */
export function getEmptyState(): Record<string, number> {
  return {
    persons: 0,
    insurances: 0,
    vorsorge: 0,
    subscriptions: 0,
    kvContracts: 0,
    properties: 0,
    vehicles: 0,
    pvPlants: 0,
  };
}

/**
 * Filtert Demo-IDs aus einer Liste heraus.
 * Nützlich für Hooks die bei deaktiviertem Toggle keine Demo-Daten zeigen sollen.
 */
export function filterOutDemoIds<T extends { id: string }>(items: T[]): T[] {
  return items.filter(item => !isDemoId(item.id));
}
