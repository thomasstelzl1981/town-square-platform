import type { GoldenPathDefinition } from './types';

/**
 * Golden Path GP-PET: Pet Manager Lifecycle (V1.0)
 *
 * Drei Einstiegspunkte:
 *   A) Eigenkunde (Z2 manuell)
 *   B) Plattform-Lead (Z3 -> Z1 -> Z2)
 *   C) Haustiere-Modul (Z2 MOD-05 -> Z1 -> Z2)
 *
 * Zwei Kundendatenbanken:
 *   - pet_z1_customers (Zone 1, globaler Pool)
 *   - pet_customers (Zone 2, Provider-lokal)
 *
 * Pet-Card SSOT (Datenstandard ueber alle Zonen):
 *   MINIMUM (Quick-Booking Z3): first_name, last_name, email, phone + pet.name, pet.species
 *   STANDARD (Z1/Z3 Profil):   + address, postal_code, city + pet.breed, gender, birth_date, weight_kg, chip_number, neutered
 *   FULL (Z2 MOD-05):          + pet.insurance_provider, insurance_policy_no, vaccinations, medical_records, caring_events
 *
 * Halter-Felder (pet_z1_customers / pet_customers):
 *   first_name, last_name, email, phone, address, postal_code, city
 *
 * Tier-Felder (pet_z1_pets / pets):
 *   name, species, breed, gender, birth_date, weight_kg, chip_number, neutered,
 *   vet_name, allergies, photo_url, notes
 *   Z2 only: insurance_provider, insurance_policy_no + Relationen
 *
 * P0 Hardening: Fail-States fuer alle Cross-Zone Steps.
 */
export const GP_PET_GOLDEN_PATH: GoldenPathDefinition = {
  id: 'gp-pet-lifecycle',
  module: 'MOD-22 / MOD-05 / ZONE-3',
  moduleCode: 'GP-PET',
  version: '1.0.0',
  label: 'Pet Manager Lifecycle — Vom Kunden bis zur aktiven Betreuung',
  description:
    'Vollstaendiger Kunden-Lebenszyklus im Pet Manager: Erfassung (manuell, Lead, MOD-05), Z1-Profil, Zuweisung, Tierakte, erste Buchung.',

  required_entities: [
    { table: 'pet_z1_customers', description: 'Z1 Kundenprofil muss existieren (Lead/MOD-05)', scope: 'entity_id' },
    { table: 'pet_customers', description: 'Z2 Provider-Kunde muss existieren', scope: 'entity_id' },
    { table: 'pets', description: 'Mindestens ein Tier muss vorhanden/referenziert sein', scope: 'entity_id' },
  ],
  required_contracts: [
    { key: 'CONTRACT_PET_LEAD_CAPTURE', source: 'pet_z1_customers', description: 'Lead-Erfassung Z3 -> Z1' },
    { key: 'CONTRACT_PET_Z1_PROFILE_CREATE', source: 'pet_z1_customers', description: 'Z1-Profilerstellung durch Admin' },
    { key: 'CONTRACT_PET_CUSTOMER_ASSIGN', source: 'pet_customers', description: 'Zuweisung Z1 -> Z2 an Provider' },
    { key: 'CONTRACT_PET_MOD05_BOOKING', source: 'pet_z1_customers', description: 'MOD-05 Buchungsanfrage Z2 -> Z1' },
  ],
  ledger_events: [
    { event_type: 'pet.lead.captured', trigger: 'on_complete' },
    { event_type: 'pet.z1.profile.created', trigger: 'on_complete' },
    { event_type: 'pet.customer.created', trigger: 'on_complete' },
    { event_type: 'pet.customer.assigned', trigger: 'on_complete' },
    { event_type: 'pet.mod05.linked', trigger: 'on_complete' },
    { event_type: 'pet.booking.first_completed', trigger: 'on_complete' },
  ],
  success_state: {
    required_flags: ['customer_exists', 'pet_exists', 'first_booking_completed'],
    description: 'Kunde hat Tier(e) und mindestens eine abgeschlossene Buchung.',
  },
  failure_redirect: '/portal/petmanager/kunden',

  steps: [
    // ═══════════════════════════════════════════════════════════
    // PHASE 1: Lead-Erfassung (Z3 -> Z1)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'capture_lead',
      phase: 1,
      label: 'Lead-Erfassung (Website / MOD-05)',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_PET_STEP_01_CAPTURE_LEAD',
      contract_refs: [
        {
          key: 'CONTRACT_PET_LEAD_CAPTURE',
          direction: 'Z3->Z1',
          correlation_keys: ['lead_id', 'provider_id', 'source_url'],
          description: 'Lead wird via Edge Function oder MOD-05 Buchungsanfrage erfasst',
        },
      ],
      completion: [
        { key: 'lead_captured', source: 'pet_z1_customers', check: 'exists', description: 'Anfrage in pet_z1_customers oder als Eigenkunde erfasst' },
      ],
      on_duplicate: {
        ledger_event: 'pet.lead.capture.duplicate_detected',
        status_update: 'unchanged',
        recovery_strategy: 'ignore',
        description: 'Duplicate Lead erkannt (gleiche E-Mail + Provider)',
      },
      on_error: {
        ledger_event: 'pet.lead.capture.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Technischer Fehler bei Lead-Erfassung',
      },
    },

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: Z1-Profil anlegen (Admin)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'create_z1_profile',
      phase: 2,
      label: 'Kundenprofil in Zone 1 anlegen',
      type: 'action',
      routePattern: '/admin/pet-desk',
      task_kind: 'user_task',
      camunda_key: 'GP_PET_STEP_02_CREATE_Z1_PROFILE',
      preconditions: [
        { key: 'lead_captured', source: 'pet_z1_customers', description: 'Lead/Anfrage muss erfasst sein' },
      ],
      completion: [
        { key: 'z1_profile_created', source: 'pet_z1_customers', check: 'exists', description: 'pet_z1_customers Eintrag existiert' },
      ],
      on_error: {
        ledger_event: 'pet.z1.profile.create.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Fehler beim Anlegen des Z1-Profils',
      },
    },

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: Qualifizierung und Zuweisung (Z1 -> Z2)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'qualify_and_assign',
      phase: 3,
      label: 'Kunden qualifizieren und Provider zuweisen',
      type: 'action',
      routePattern: '/admin/pet-desk',
      task_kind: 'user_task',
      camunda_key: 'GP_PET_STEP_03_QUALIFY_ASSIGN',
      contract_refs: [
        {
          key: 'CONTRACT_PET_CUSTOMER_ASSIGN',
          direction: 'Z1->Z2',
          correlation_keys: ['z1_customer_id', 'provider_id', 'tenant_id'],
          description: 'Zuweisung erzeugt pet_customers Eintrag beim Provider',
        },
      ],
      preconditions: [
        { key: 'z1_profile_created', source: 'pet_z1_customers', description: 'Z1-Profil muss existieren' },
      ],
      completion: [
        { key: 'customer_exists', source: 'pet_customers', check: 'exists', description: 'pet_customers Eintrag beim Provider existiert' },
      ],
      on_timeout: {
        ledger_event: 'pet.customer.assign.timeout',
        status_update: 'stale',
        recovery_strategy: 'escalate_to_z1',
        escalate_to: 'Z1',
        description: 'Keine Zuweisung innerhalb 48h',
      },
      on_rejected: {
        ledger_event: 'pet.customer.assign.rejected',
        status_update: 'rejected',
        recovery_strategy: 'manual_review',
        description: 'Provider hat Kunden abgelehnt',
      },
      on_error: {
        ledger_event: 'pet.customer.assign.error',
        status_update: 'error',
        recovery_strategy: 'retry',
        max_retries: 3,
        description: 'Technischer Fehler bei Zuweisung',
      },
      sla_hours: 48,
    },

    // ═══════════════════════════════════════════════════════════
    // PHASE 3b: Provider-Profil vervollstaendigen (Z2)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'complete_provider_profile',
      phase: 3,
      label: 'Provider-Profil vervollstaendigen',
      type: 'action',
      routePattern: '/portal/petmanager/profil',
      task_kind: 'user_task',
      camunda_key: 'GP_PET_STEP_03B_PROFILE_COMPLETE',
      preconditions: [
        { key: 'customer_exists', source: 'pet_customers', description: 'Provider muss existieren' },
      ],
      completion: [
        { key: 'profile_has_bio', source: 'pet_providers', check: 'exists', description: 'Bio/Beschreibung ausgefuellt' },
        { key: 'profile_has_cover', source: 'pet_providers', check: 'exists', description: 'Cover-Bild hochgeladen' },
        { key: 'profile_has_services', source: 'pet_services', check: 'exists', description: 'Mindestens 1 aktiver Service definiert' },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // PHASE 4: Tierakte anlegen / verknuepfen (Z2)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'create_pet_profile',
      phase: 4,
      label: 'Tierakte anlegen oder verknuepfen',
      type: 'action',
      routePattern: '/portal/petmanager/kunden',
      task_kind: 'user_task',
      camunda_key: 'GP_PET_STEP_04_CREATE_PET',
      preconditions: [
        { key: 'customer_exists', source: 'pet_customers', description: 'Kunde muss existieren' },
      ],
      completion: [
        { key: 'pet_exists', source: 'pets', check: 'exists', description: 'Mindestens ein Tier vorhanden oder referenziert' },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // PHASE 5: Erste Buchung (Z2)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'first_booking',
      phase: 5,
      label: 'Erste Buchung durchfuehren',
      type: 'action',
      routePattern: '/portal/petmanager/kalender',
      task_kind: 'user_task',
      camunda_key: 'GP_PET_STEP_05_FIRST_BOOKING',
      preconditions: [
        { key: 'pet_exists', source: 'pets', description: 'Mindestens ein Tier muss existieren' },
      ],
      completion: [
        { key: 'first_booking_completed', source: 'pet_bookings', check: 'exists', description: 'Mindestens eine Buchung confirmed/completed' },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // PHASE 6: Aktiver Kunde (Success State)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'active_customer',
      phase: 6,
      label: 'Aktiver Kunde',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_PET_STEP_06_ACTIVE',
      preconditions: [
        { key: 'customer_exists', source: 'pet_customers', description: 'Kunde existiert' },
        { key: 'pet_exists', source: 'pets', description: 'Tier existiert' },
        { key: 'first_booking_completed', source: 'pet_bookings', description: 'Erste Buchung abgeschlossen' },
      ],
    },
  ],
};
