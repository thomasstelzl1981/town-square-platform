/**
 * Demo Data Engine — Pet Manager (MOD-22) Demo Container
 * 
 * Eigenständiger Demo-Datenbereich für die Hundepension/Pet-Service-Lösung.
 * 3 Kunden, 3 Hunde, 5 Buchungen (2 Pension + 3 Service).
 * Alle UUIDs im Nummernkreis d0000000-0000-4000-a000-000000001xxx.
 * 
 * @demo-data
 */

import type { DemoPMCustomer, DemoPMPet, DemoPMBooking } from './spec';
import type { SearchProvider } from '@/hooks/usePetProviderSearch';
import { DEMO_TENANT_ID, DEMO_PET_PROVIDER_LENNOX } from './constants';

// ─── DEMO GALLERY IMAGES ──────────────────────────────────
import pmGalleryPension1 from '@/assets/demo/pm-gallery-pension-1.jpg';
import pmGalleryPension2 from '@/assets/demo/pm-gallery-pension-2.jpg';
import pmGalleryGrooming1 from '@/assets/demo/pm-gallery-grooming-1.jpg';
import pmGalleryGrooming2 from '@/assets/demo/pm-gallery-grooming-2.jpg';

export const DEMO_PM_GALLERY_IMAGES: readonly string[] = [
  pmGalleryPension1,
  pmGalleryPension2,
  pmGalleryGrooming1,
  pmGalleryGrooming2,
] as const;

// ─── DEMO SEARCH PROVIDER (Fallback für Zone 3 Suche) ─────
export const DEMO_LENNOX_SEARCH_PROVIDER: SearchProvider = {
  id: DEMO_PET_PROVIDER_LENNOX,
  company_name: 'Lennox & Friends Dog Resorts',
  address: 'Rathausstr. 12, 85521 Ottobrunn',
  phone: '+49 176 64 12 68 69',
  email: 'info@lennoxandfriends.app',
  bio: 'Naturverbundene Hundebetreuung mit Herz — Pension, Tagesstätte und Hundesalon in Ottobrunn bei München.',
  rating_avg: 4.9,
  cover_image_url: pmGalleryPension1,
  service_area_postal_codes: ['85521', '85540', '85622', '81671', '81673'],
  services: ['boarding', 'daycare', 'grooming', 'walking'],
};

// ─── FESTE IDs ─────────────────────────────────────────────

// Kunden
export const ID_PM_CUSTOMER_BERGER  = 'd0000000-0000-4000-a000-000000001001';
export const ID_PM_CUSTOMER_RICHTER = 'd0000000-0000-4000-a000-000000001002';
export const ID_PM_CUSTOMER_STEIN   = 'd0000000-0000-4000-a000-000000001003';

// Hunde
export const ID_PM_PET_ROCKY = 'd0000000-0000-4000-a000-000000001010';
export const ID_PM_PET_MIA   = 'd0000000-0000-4000-a000-000000001011';
export const ID_PM_PET_OSKAR = 'd0000000-0000-4000-a000-000000001012';

// Buchungen
export const ID_PM_BOOKING_1 = 'd0000000-0000-4000-a000-000000001020';
export const ID_PM_BOOKING_2 = 'd0000000-0000-4000-a000-000000001021';
export const ID_PM_BOOKING_3 = 'd0000000-0000-4000-a000-000000001022';
export const ID_PM_BOOKING_4 = 'd0000000-0000-4000-a000-000000001023';
export const ID_PM_BOOKING_5 = 'd0000000-0000-4000-a000-000000001024';

// Staff (echte DB-IDs aus pet_staff)
const STAFF_ANNA  = '935e7dd4-3d93-4170-9022-0b0148c90811';
const STAFF_MAX_K = 'c198ffb0-1b16-4cfa-b582-a86fa0fbf097';
const STAFF_LISA  = '847b65f8-6f2e-432c-8d3e-cf54a97e4707';

// Z1-Customer-IDs (Lead-Pool)
export const ID_PM_Z1_CUSTOMER_RICHTER = 'd0000000-0000-4000-a000-000000001040';
export const ID_PM_Z1_CUSTOMER_STEIN   = 'd0000000-0000-4000-a000-000000001041';

// Z1-Pet-IDs
export const ID_PM_Z1_PET_MIA   = 'd0000000-0000-4000-a000-000000001051';
export const ID_PM_Z1_PET_OSKAR = 'd0000000-0000-4000-a000-000000001052';

// ─── KUNDEN ────────────────────────────────────────────────

export const DEMO_PM_CUSTOMERS: readonly DemoPMCustomer[] = [
  {
    id: ID_PM_CUSTOMER_BERGER,
    tenantId: DEMO_TENANT_ID,
    providerId: DEMO_PET_PROVIDER_LENNOX,
    firstName: 'Sabine',
    lastName: 'Berger',
    email: 'sabine.berger@demo.de',
    phone: '+49 171 2223344',
    address: 'Rosenheimer Str. 5, 85521 Ottobrunn',
    notes: 'Stammkundin, Rocky hat Futtermittelallergie (kein Huhn)',
    source: 'manual',
    originZone: 'Z2',
    status: 'active',
    createdAt: '2025-09-15T10:00:00Z',
  },
  {
    id: ID_PM_CUSTOMER_RICHTER,
    tenantId: DEMO_TENANT_ID,
    providerId: DEMO_PET_PROVIDER_LENNOX,
    firstName: 'Thomas',
    lastName: 'Richter',
    email: 'thomas.richter@demo.de',
    phone: '+49 172 5556677',
    address: 'Münchner Str. 44, 85540 Haar',
    notes: 'Über Website-Anfrage gekommen, zwei Hunde',
    source: 'lead',
    originZone: 'Z3',
    z1CustomerId: 'd0000000-0000-4000-a000-000000001040',
    status: 'active',
    createdAt: '2025-11-02T14:30:00Z',
  },
  {
    id: ID_PM_CUSTOMER_STEIN,
    tenantId: DEMO_TENANT_ID,
    providerId: DEMO_PET_PROVIDER_LENNOX,
    firstName: 'Claudia',
    lastName: 'Stein',
    email: 'claudia.stein@demo.de',
    phone: '+49 176 8889900',
    address: 'Bahnhofstr. 21, 85622 Feldkirchen',
    notes: 'Bucht für Freundin Sabine Berger (Rocky). Keine eigenen Hunde.',
    source: 'lead',
    originZone: 'Z3',
    z1CustomerId: 'd0000000-0000-4000-a000-000000001041',
    status: 'active',
    createdAt: '2026-01-10T09:15:00Z',
  },
] as const;

// ─── HUNDE ─────────────────────────────────────────────────

export const DEMO_PM_PETS: readonly DemoPMPet[] = [
  {
    id: ID_PM_PET_ROCKY,
    customerId: ID_PM_CUSTOMER_BERGER,
    name: 'Rocky',
    species: 'Hund',
    breed: 'Labrador Retriever',
    birthDate: '2022-05-10',
    gender: 'männlich',
    weight: 32,
    color: 'Goldgelb',
    chipNumber: '276098102345678',
    notes: 'Futtermittelallergie (kein Huhn), sehr freundlich, verträgt sich gut mit anderen Hunden',
  },
  {
    id: ID_PM_PET_MIA,
    customerId: ID_PM_CUSTOMER_RICHTER,
    name: 'Mia',
    species: 'Hund',
    breed: 'Golden Retriever',
    birthDate: '2024-01-15',
    gender: 'weiblich',
    weight: 28,
    color: 'Creme',
    chipNumber: '276098102345679',
    notes: 'Junghund, noch etwas schüchtern bei neuen Hunden',
  },
  {
    id: ID_PM_PET_OSKAR,
    customerId: ID_PM_CUSTOMER_RICHTER,
    name: 'Oskar',
    species: 'Hund',
    breed: 'Dackel',
    birthDate: '2019-08-22',
    gender: 'männlich',
    weight: 9,
    color: 'Rot',
    chipNumber: '276098102345680',
    notes: 'Senior, Arthrose in Hinterläufen, braucht Rampe',
  },
] as const;

// ─── BUCHUNGEN ─────────────────────────────────────────────

export const DEMO_PM_BOOKINGS: readonly DemoPMBooking[] = [
  // Pension 1: Rocky, 2 Wochen
  {
    id: ID_PM_BOOKING_1,
    customerId: ID_PM_CUSTOMER_BERGER,
    petId: ID_PM_PET_ROCKY,
    providerId: DEMO_PET_PROVIDER_LENNOX,
    bookingType: 'pension',
    serviceName: 'Urlaubsbetreuung',
    startDate: '2026-03-03',
    endDate: '2026-03-16',
    startTime: null,
    durationMinutes: null,
    staffName: null,
    staffId: null,
    status: 'confirmed',
    totalPrice: 560,
    notes: 'Spezialfutter mitgebracht (allergiefrei)',
  },
  // Pension 2: Mia, 2 Wochen
  {
    id: ID_PM_BOOKING_2,
    customerId: ID_PM_CUSTOMER_RICHTER,
    petId: ID_PM_PET_MIA,
    providerId: DEMO_PET_PROVIDER_LENNOX,
    bookingType: 'pension',
    serviceName: 'Urlaubsbetreuung',
    startDate: '2026-03-10',
    endDate: '2026-03-23',
    startTime: null,
    durationMinutes: null,
    staffName: null,
    staffId: null,
    status: 'confirmed',
    totalPrice: 560,
    notes: 'Eingewöhnung am Vortag gewünscht',
  },
  // Service 3: Rocky, Hundesalon
  {
    id: ID_PM_BOOKING_3,
    customerId: ID_PM_CUSTOMER_BERGER,
    petId: ID_PM_PET_ROCKY,
    providerId: DEMO_PET_PROVIDER_LENNOX,
    bookingType: 'service',
    serviceName: 'Hundesalon Komplett',
    startDate: '2026-02-25',
    endDate: null,
    startTime: '09:00',
    durationMinutes: 90,
    staffName: 'Anna Müller',
    staffId: STAFF_ANNA,
    status: 'completed',
    totalPrice: 65,
    notes: null,
  },
  // Service 4: Oskar, Gassi
  {
    id: ID_PM_BOOKING_4,
    customerId: ID_PM_CUSTOMER_RICHTER,
    petId: ID_PM_PET_OSKAR,
    providerId: DEMO_PET_PROVIDER_LENNOX,
    bookingType: 'service',
    serviceName: 'Gassi-Service (1h)',
    startDate: '2026-02-27',
    endDate: null,
    startTime: '10:00',
    durationMinutes: 60,
    staffName: 'Max Krause',
    staffId: STAFF_MAX_K,
    status: 'confirmed',
    totalPrice: 25,
    notes: 'Langsames Tempo wegen Arthrose',
  },
  // Service 5: Mia, Hundesalon
  {
    id: ID_PM_BOOKING_5,
    customerId: ID_PM_CUSTOMER_RICHTER,
    petId: ID_PM_PET_MIA,
    providerId: DEMO_PET_PROVIDER_LENNOX,
    bookingType: 'service',
    serviceName: 'Hundesalon Komplett',
    startDate: '2026-03-01',
    endDate: null,
    startTime: '14:00',
    durationMinutes: 90,
    staffName: 'Lisa Schmidt',
    staffId: STAFF_LISA,
    status: 'confirmed',
    totalPrice: 65,
    notes: null,
  },
] as const;

// ─── ALLE PM-DEMO-IDs (für ALL_DEMO_IDS) ──────────────────

export const ALL_PM_DEMO_IDS: readonly string[] = [
  // Kunden (Z2)
  ID_PM_CUSTOMER_BERGER, ID_PM_CUSTOMER_RICHTER, ID_PM_CUSTOMER_STEIN,
  // Kunden (Z1)
  ID_PM_Z1_CUSTOMER_RICHTER, ID_PM_Z1_CUSTOMER_STEIN,
  // Hunde (Z2)
  ID_PM_PET_ROCKY, ID_PM_PET_MIA, ID_PM_PET_OSKAR,
  // Hunde (Z1)
  ID_PM_Z1_PET_MIA, ID_PM_Z1_PET_OSKAR,
  // Buchungen
  ID_PM_BOOKING_1, ID_PM_BOOKING_2, ID_PM_BOOKING_3, ID_PM_BOOKING_4, ID_PM_BOOKING_5,
  // Staff (echte DB-IDs)
  STAFF_ANNA, STAFF_MAX_K, STAFF_LISA,
] as const;
