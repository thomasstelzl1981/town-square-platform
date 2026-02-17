/**
 * Demo Data Engine — Hardcoded Constants
 * 
 * SSOT für alle Demo-Daten der Familie Mustermann.
 * Alle UUIDs sind fest definiert für Idempotenz.
 * 
 * @demo-data
 */

import type {
  DemoPersona,
  DemoInsuranceContract,
  DemoVorsorgeContract,
  DemoSubscription,
  DemoKVContract,
  DemoPrivateLoan,
  DemoPortfolioRefs,
  DemoAcqMandate,
  DemoDevProject,
  DemoSelbstauskunft,
  DemoMietyHome,
  DemoMietyContract,
  DemoDataSpec,
} from './spec';
import { DEMO_PM_CUSTOMERS, DEMO_PM_PETS, DEMO_PM_BOOKINGS, ALL_PM_DEMO_IDS } from './petManagerDemo';

// ─── FESTE IDs ─────────────────────────────────────────────
/** Re-exported from constants.ts for backward compatibility */
import { DEMO_PRIMARY_PERSON_ID, DEMO_TENANT_ID, DEMO_USER_ID, DEMO_PET_PROVIDER_LENNOX } from './constants';
export { DEMO_PRIMARY_PERSON_ID, DEMO_TENANT_ID, DEMO_USER_ID, DEMO_PET_PROVIDER_LENNOX } from './constants';

// Neue Personen
const ID_LISA  = 'e0000000-0000-4000-a000-000000000101';
const ID_FELIX = 'e0000000-0000-4000-a000-000000000102';
const ID_EMMA  = 'e0000000-0000-4000-a000-000000000103';

// Versicherungen
const ID_INS_HAFTPFLICHT = 'e0000000-0000-4000-a000-000000000201';
const ID_INS_HAUSRAT     = 'e0000000-0000-4000-a000-000000000202';
const ID_INS_GEBAEUDE    = 'e0000000-0000-4000-a000-000000000203';
const ID_INS_RECHT       = 'e0000000-0000-4000-a000-000000000204';
const ID_INS_KFZ1        = 'e0000000-0000-4000-a000-000000000205';
const ID_INS_KFZ2        = 'e0000000-0000-4000-a000-000000000206';
const ID_INS_BU          = 'e0000000-0000-4000-a000-000000000207';

// Vorsorge
const ID_VS_RUERUP  = 'e0000000-0000-4000-a000-000000000301';
const ID_VS_BAV     = 'e0000000-0000-4000-a000-000000000302';
const ID_VS_RIESTER = 'e0000000-0000-4000-a000-000000000303';
const ID_VS_ETF     = 'e0000000-0000-4000-a000-000000000304';
const ID_VS_BU_MAX  = 'e0000000-0000-4000-a000-000000000305';
const ID_VS_BU_LISA = 'e0000000-0000-4000-a000-000000000306';

// Abonnements
const ID_SUB_NETFLIX   = 'e0000000-0000-4000-a000-000000000401';
const ID_SUB_SPOTIFY   = 'e0000000-0000-4000-a000-000000000402';
const ID_SUB_AMAZON    = 'e0000000-0000-4000-a000-000000000403';
const ID_SUB_MS365     = 'e0000000-0000-4000-a000-000000000404';
const ID_SUB_ZEIT      = 'e0000000-0000-4000-a000-000000000405';
const ID_SUB_TELEKOM   = 'e0000000-0000-4000-a000-000000000406';
const ID_SUB_VODAFONE  = 'e0000000-0000-4000-a000-000000000407';
const ID_SUB_FITX      = 'e0000000-0000-4000-a000-000000000408';

// KV-Verträge (DB-geseedet)
const ID_KV_MAX    = 'e0000000-0000-4000-a000-000000000501';
const ID_KV_LISA   = 'e0000000-0000-4000-a000-000000000502';
const ID_KV_FELIX  = 'e0000000-0000-4000-a000-000000000503';
const ID_KV_EMMA   = 'e0000000-0000-4000-a000-000000000504';

// Pension Records (DB-geseedet)
const ID_PENSION_LISA = 'e0000000-0000-4000-a000-000000000701';

// Privatkredite
const ID_PL_AUTO   = 'e0000000-0000-4000-a000-000000000601';
const ID_PL_MOEBEL = 'e0000000-0000-4000-a000-000000000602';

// Pets (DB-geseedet)
export const DEMO_PET_LUNA  = 'd0000000-0000-4000-a000-000000000010';
export const DEMO_PET_BELLO = 'd0000000-0000-4000-a000-000000000011';

// Pet Provider + Services (DB-geseedet)
// DEMO_PET_PROVIDER_LENNOX is now in constants.ts
const ID_PET_SVC_GROOMING  = 'd0000000-0000-4000-a000-000000000060';
const ID_PET_SVC_WALKING   = 'd0000000-0000-4000-a000-000000000061';
const ID_PET_SVC_DAYCARE   = 'd0000000-0000-4000-a000-000000000062';
const ID_PET_SVC_BOARDING  = 'd0000000-0000-4000-a000-000000000063';

// Miety Zuhause (DB-geseedet)
const ID_MIETY_HOME       = 'e0000000-0000-4000-a000-000000000801';
const ID_MIETY_STROM      = 'e0000000-0000-4000-a000-000000000811';
const ID_MIETY_GAS        = 'e0000000-0000-4000-a000-000000000812';
const ID_MIETY_WASSER     = 'e0000000-0000-4000-a000-000000000813';
const ID_MIETY_INTERNET   = 'e0000000-0000-4000-a000-000000000814';

// ─── PERSONEN ──────────────────────────────────────────────

export const DEMO_FAMILY: readonly DemoPersona[] = [
  {
    id: DEMO_PRIMARY_PERSON_ID,
    role: 'hauptperson',
    salutation: 'Herr',
    firstName: 'Max',
    lastName: 'Mustermann',
    birthDate: '1982-03-15',
    email: 'max@mustermann-demo.de',
    phone: '+49 170 1234567',
    employmentStatus: 'selbstaendig',
    employerName: 'IT-Beratung Mustermann',
    kvType: 'PKV',
    sortOrder: 0,
    isPrimary: true,
  },
  {
    id: ID_LISA,
    role: 'partner',
    salutation: 'Frau',
    firstName: 'Lisa',
    lastName: 'Mustermann',
    birthDate: '1985-07-22',
    email: 'lisa@mustermann-demo.de',
    phone: '+49 170 7654321',
    employmentStatus: 'angestellt',
    employerName: 'MediaCorp GmbH',
    kvType: 'GKV',
    sortOrder: 1,
    isPrimary: false,
  },
  {
    id: ID_FELIX,
    role: 'kind',
    salutation: 'Herr',
    firstName: 'Felix',
    lastName: 'Mustermann',
    birthDate: '2014-09-03',
    kvType: 'familienversichert',
    sortOrder: 2,
    isPrimary: false,
  },
  {
    id: ID_EMMA,
    role: 'kind',
    salutation: 'Frau',
    firstName: 'Emma',
    lastName: 'Mustermann',
    birthDate: '2017-11-28',
    kvType: 'familienversichert',
    sortOrder: 3,
    isPrimary: false,
  },
] as const;

// ─── SACHVERSICHERUNGEN ────────────────────────────────────

export const DEMO_INSURANCES: readonly DemoInsuranceContract[] = [
  {
    id: ID_INS_HAFTPFLICHT,
    category: 'haftpflicht',
    insurer: 'HUK-COBURG',
    policyNo: 'HUK-PHV-2019-4711',
    policyholder: 'Max Mustermann',
    startDate: '2019-01-01',
    premium: 8.50,
    paymentInterval: 'monatlich',
    details: { deckungssumme: 50_000_000, selbstbeteiligung: 0, familientarif: true },
  },
  {
    id: ID_INS_HAUSRAT,
    category: 'hausrat',
    insurer: 'Allianz',
    policyNo: 'AZ-HR-2020-0815',
    policyholder: 'Max Mustermann',
    startDate: '2020-04-01',
    premium: 15.90,
    paymentInterval: 'monatlich',
    details: { versicherungssumme: 65_000, wohnflaeche_qm: 120, elementar: true },
  },
  {
    id: ID_INS_GEBAEUDE,
    category: 'wohngebaeude',
    insurer: 'ERGO',
    policyNo: 'ERGO-WG-2018-3344',
    policyholder: 'Max Mustermann',
    startDate: '2018-06-01',
    premium: 42.00,
    paymentInterval: 'monatlich',
    details: { wohnflaeche_qm: 180, elementar: true, gleitender_neuwert: true },
  },
  {
    id: ID_INS_RECHT,
    category: 'rechtsschutz',
    insurer: 'ARAG',
    policyNo: 'ARAG-RS-2021-9922',
    policyholder: 'Max Mustermann',
    startDate: '2021-01-01',
    premium: 28.50,
    paymentInterval: 'monatlich',
    details: { selbstbeteiligung: 150, bereiche: 'Privat+Beruf+Verkehr+Miete' },
  },
  {
    id: ID_INS_KFZ1,
    category: 'kfz',
    insurer: 'HUK-COBURG',
    policyNo: 'HUK-KFZ-2022-P911',
    policyholder: 'Max Mustermann',
    startDate: '2022-03-01',
    premium: 89.00,
    paymentInterval: 'monatlich',
    details: { fahrzeug: 'Porsche 911 Carrera', vollkasko: true, selbstbeteiligung_vk: 300, selbstbeteiligung_tk: 150 },
  },
  {
    id: ID_INS_KFZ2,
    category: 'kfz',
    insurer: 'Allianz',
    policyNo: 'AZ-KFZ-2023-BMW5',
    policyholder: 'Lisa Mustermann',
    startDate: '2023-01-01',
    premium: 62.00,
    paymentInterval: 'monatlich',
    details: { fahrzeug: 'BMW M5 Competition', teilkasko: true, selbstbeteiligung_tk: 150 },
  },
  {
    id: ID_INS_BU,
    category: 'berufsunfaehigkeit',
    insurer: 'Alte Leipziger',
    policyNo: 'AL-BU-2017-MM01',
    policyholder: 'Max Mustermann',
    startDate: '2017-07-01',
    premium: 95.00,
    paymentInterval: 'monatlich',
    details: { monatliche_rente: 3000, laufzeit_bis: '2047-03-15', nachversicherung: true },
  },
] as const;

// ─── VORSORGEVERTRÄGE ──────────────────────────────────────

export const DEMO_VORSORGE: readonly DemoVorsorgeContract[] = [
  {
    id: ID_VS_RUERUP,
    personId: DEMO_PRIMARY_PERSON_ID,
    provider: 'Alte Leipziger',
    contractNo: 'AL-RUE-2019-001',
    contractType: 'Rürup (Basisrente)',
    startDate: '2019-01-01',
    premium: 250.00,
    paymentInterval: 'monatlich',
    category: 'vorsorge',
    currentBalance: 21000,
    balanceDate: '2025-12-31',
  },
  {
    id: ID_VS_BAV,
    personId: ID_LISA,
    provider: 'Allianz',
    contractNo: 'AZ-BAV-2020-001',
    contractType: 'bAV (Entgeltumwandlung)',
    startDate: '2020-04-01',
    premium: 200.00,
    paymentInterval: 'monatlich',
    category: 'vorsorge',
    currentBalance: 14400,
    balanceDate: '2025-12-31',
  },
  {
    id: ID_VS_RIESTER,
    personId: ID_LISA,
    provider: 'DWS',
    contractNo: 'DWS-FSP-2018-001',
    contractType: 'Fonds-Sparplan',
    startDate: '2018-01-01',
    premium: 162.17,
    paymentInterval: 'monatlich',
    category: 'investment',
    currentBalance: 15600,
    balanceDate: '2025-12-31',
  },
  {
    id: ID_VS_ETF,
    personId: DEMO_PRIMARY_PERSON_ID,
    provider: 'Vanguard',
    contractNo: 'VG-ETF-2021-001',
    contractType: 'Privater ETF-Sparplan',
    startDate: '2021-06-01',
    premium: 300.00,
    paymentInterval: 'monatlich',
    category: 'investment',
    currentBalance: 16200,
    balanceDate: '2025-12-31',
  },
  {
    id: ID_VS_BU_MAX,
    personId: DEMO_PRIMARY_PERSON_ID,
    provider: 'Alte Leipziger',
    contractNo: 'AL-BU-2017-MM01',
    contractType: 'Berufsunfähigkeit',
    startDate: '2017-07-01',
    endDate: '2047-03-15',
    premium: 95.00,
    paymentInterval: 'monatlich',
    category: 'vorsorge',
    monthlyBenefit: 3000,
    buMonthlyBenefit: 3000,
    dynamicsPercent: 3,
  },
  {
    id: ID_VS_BU_LISA,
    personId: ID_LISA,
    provider: 'Hallesche',
    contractNo: 'HL-BU-2019-LM01',
    contractType: 'Berufsunfähigkeit',
    startDate: '2019-10-01',
    endDate: '2047-07-22',
    premium: 62.00,
    paymentInterval: 'monatlich',
    category: 'vorsorge',
    monthlyBenefit: 1500,
    buMonthlyBenefit: 1500,
    dynamicsPercent: 3,
  },
] as const;

// ─── ABONNEMENTS ───────────────────────────────────────────

export const DEMO_SUBSCRIPTIONS: readonly DemoSubscription[] = [
  { id: ID_SUB_NETFLIX,  merchant: 'Netflix',              category: 'streaming_video',       amount: 17.99,  frequency: 'monatlich' },
  { id: ID_SUB_SPOTIFY,  merchant: 'Spotify Family',       category: 'streaming_music',       amount: 16.99,  frequency: 'monatlich' },
  { id: ID_SUB_AMAZON,   merchant: 'Amazon Prime',         category: 'ecommerce_membership',  amount: 89.90,  frequency: 'jaehrlich' },
  { id: ID_SUB_MS365,    merchant: 'Microsoft 365 Family', category: 'software_saas',         amount: 99.00,  frequency: 'jaehrlich' },
  { id: ID_SUB_ZEIT,     merchant: 'ZEIT Digital',          category: 'news_media',            amount: 19.99,  frequency: 'monatlich' },
  { id: ID_SUB_TELEKOM,  merchant: 'Telekom Magenta L',    category: 'telecom_mobile',        amount: 49.95,  frequency: 'monatlich' },
  { id: ID_SUB_VODAFONE, merchant: 'Vodafone Kabel 1000',  category: 'internet',              amount: 39.99,  frequency: 'monatlich' },
  { id: ID_SUB_FITX,     merchant: 'FitX Familie',         category: 'fitness',               amount: 29.98,  frequency: 'monatlich' },
] as const;

// ─── KV-DATEN (DB-geseedet in kv_contracts) ───────────────
// Kept for backward compatibility — consumers should migrate to DB queries

export const DEMO_KV_CONTRACTS: readonly DemoKVContract[] = [
  {
    personId: DEMO_PRIMARY_PERSON_ID,
    personName: 'Max Mustermann',
    type: 'PKV',
    provider: 'DKV Deutsche Krankenversicherung',
    monthlyPremium: 685.00,
    details: {
      tarif: 'BestMed Komfort',
      selbstbeteiligung: 600,
      beitragsentlastung_ab_67: true,
      krankentagegeld: 150,
      zahnersatz_prozent: 90,
      einbettzimmer: true,
      chefarzt: true,
      vertragsbeginn: '2015-01-01',
      versicherungsnummer: 'PKV-DKV-2015-MM-4711',
      ihl_ambulant_prozent: 100,
      ihl_stationaer_prozent: 100,
      ihl_psychotherapie_sitzungen: 50,
      ihl_alternativmedizin: true,
      ihl_sehhilfen_budget: 400,
      ihl_hoergeraete_budget: 1500,
      ihl_reha: 'Ambulant + Stationär, Anschlussheilbehandlung',
      beitragsanpassungen: [
        { year: 2020, alt: 620, neu: 645 },
        { year: 2022, alt: 645, neu: 668 },
        { year: 2024, alt: 668, neu: 685 },
      ],
    },
  },
  {
    personId: ID_LISA,
    personName: 'Lisa Mustermann',
    type: 'GKV',
    provider: 'Techniker Krankenkasse',
    monthlyPremium: 423.50,
    employerContribution: 423.50,
    details: {
      beitragssatz: '14,6% + 1,2% Zusatzbeitrag',
      beitragsbemessungsgrenze: 62_100,
      bruttoeinkommen: 65_000,
      familienversichert_kinder: 2,
      krankengeld_ab_tag: 43,
      vertragsbeginn: '2010-09-01',
      versicherungsnummer: 'TK-1985072200102',
    },
  },
  {
    personId: ID_FELIX,
    personName: 'Felix Mustermann',
    type: 'familienversichert',
    provider: 'Techniker Krankenkasse',
    monthlyPremium: 0,
    details: { ueber: 'Lisa Mustermann', bis_alter: 25 },
  },
  {
    personId: ID_EMMA,
    personName: 'Emma Mustermann',
    type: 'familienversichert',
    provider: 'Techniker Krankenkasse',
    monthlyPremium: 0,
    details: { ueber: 'Lisa Mustermann', bis_alter: 25 },
  },
] as const;

// ─── PRIVATKREDITE ─────────────────────────────────────────

export const DEMO_PRIVATE_LOANS: readonly DemoPrivateLoan[] = [
  {
    id: ID_PL_AUTO,
    personId: DEMO_PRIMARY_PERSON_ID,
    bankName: 'BMW Bank',
    loanPurpose: 'autokredit',
    loanAmount: 35_000,
    remainingBalance: 22_400,
    interestRate: 3.49,
    monthlyRate: 520,
    startDate: '2022-06-01',
    endDate: '2027-05-31',
    status: 'aktiv',
  },
  {
    id: ID_PL_MOEBEL,
    personId: ID_LISA,
    bankName: 'Santander',
    loanPurpose: 'moebel',
    loanAmount: 12_000,
    remainingBalance: 4_800,
    interestRate: 5.99,
    monthlyRate: 250,
    startDate: '2023-01-15',
    endDate: '2026-12-31',
    status: 'aktiv',
  },
] as const;

// ─── PORTFOLIO-REFERENZEN (bestehende IDs) ─────────────────

export const DEMO_PORTFOLIO: DemoPortfolioRefs = {
  propertyIds: [
    'd0000000-0000-4000-a000-000000000001', // BER-01
    'd0000000-0000-4000-a000-000000000002', // MUC-01
    'd0000000-0000-4000-a000-000000000003', // HH-01
  ],
  vehicleIds: [
    '00000000-0000-4000-a000-000000000301', // Porsche 911
    '00000000-0000-4000-a000-000000000302', // BMW M5
  ],
  pvPlantIds: [
    '00000000-0000-4000-a000-000000000901', // PV 32.4 kWp
  ],
  landlordContextId: 'd0000000-0000-4000-a000-000000000010',
};

// ─── AKQUISE-MANDAT ────────────────────────────────────────

export const DEMO_ACQ_MANDATE_ID = 'e0000000-0000-4000-e000-000000000001';
export const DEMO_ACQ_OFFER_ID = 'f0000000-0000-4000-f000-000000000001';

export const DEMO_ACQ_MANDATE: DemoAcqMandate = {
  id: DEMO_ACQ_MANDATE_ID,
  code: 'ACQ-DEMO-001',
  clientDisplayName: 'Mustermann Projektentwicklung GmbH',
  assetFocus: ['MFH', 'Aufteiler'],
  region: 'München / Oberbayern',
  priceMin: 1_000_000,
  priceMax: 5_000_000,
  yieldTarget: 4.5,
};

// ─── DEVELOPER / PROJEKTE ──────────────────────────────────

export const DEMO_DEVELOPER_CONTEXT_ID = 'f5071801-351a-4067-849b-f042af5a247a';

export const DEMO_DEV_PROJECT: DemoDevProject = {
  projectId: 'demo-project-001',
  developerContextId: DEMO_DEVELOPER_CONTEXT_ID,
  developerContextName: 'Mustermann Projektentwicklung GmbH',
  projectName: 'Residenz am Stadtpark',
  city: 'München',
};

// ─── SELBSTAUSKUNFT (persistente DB-Einträge) ──────────────

export const DEMO_SELBSTAUSKUNFT_PRIMARY_ID = 'a23366ab-e769-46b0-8d44-f8117f901c15';
export const DEMO_SELBSTAUSKUNFT_CO_ID = '703e1648-5dbf-40da-8f5f-040dc04bbc31';

export const DEMO_SELBSTAUSKUNFT: DemoSelbstauskunft = {
  primaryProfileId: DEMO_SELBSTAUSKUNFT_PRIMARY_ID,
  coApplicantProfileId: DEMO_SELBSTAUSKUNFT_CO_ID,
};

// ─── MIETY ZUHAUSE ─────────────────────────────────────────

export const DEMO_MIETY_HOME: DemoMietyHome = {
  id: ID_MIETY_HOME,
  name: 'Mein Zuhause',
  address: 'Friedrichstraße',
  addressHouseNo: '42',
  zip: '10117',
  city: 'Berlin',
  ownershipType: 'miete',
  propertyType: 'wohnung',
  areaSqm: 120,
  roomsCount: 4,
};

export const DEMO_MIETY_CONTRACTS: readonly DemoMietyContract[] = [
  { id: ID_MIETY_STROM,    category: 'strom',    providerName: 'E.ON Grundversorgung',         contractNumber: 'EON-2024-4711',  monthlyCost: 85,    startDate: '2022-01-01' },
  { id: ID_MIETY_GAS,      category: 'gas',      providerName: 'Vattenfall',                   contractNumber: 'VF-2024-0815',   monthlyCost: 65,    startDate: '2022-01-01' },
  { id: ID_MIETY_WASSER,   category: 'wasser',   providerName: 'Berliner Wasserbetriebe',      contractNumber: 'BWB-2024-3344',  monthlyCost: 42,    startDate: '2020-06-01' },
  { id: ID_MIETY_INTERNET, category: 'internet', providerName: 'Telekom MagentaZuhause L',     contractNumber: 'TK-2023-5566',   monthlyCost: 44.95, startDate: '2023-03-01' },
] as const;

// ─── ALLE IDs (flach) ──────────────────────────────────────

// Demo-Kontakte (DB-geseedet)
const ID_CONTACT_MAX     = '00000000-0000-4000-a000-000000000101';
const ID_CONTACT_LISA    = '00000000-0000-4000-a000-000000000102';
const ID_CONTACT_BERGMANN = '00000000-0000-4000-a000-000000000103';
const ID_CONTACT_HOFFMANN = '00000000-0000-4000-a000-000000000104';
const ID_CONTACT_WEBER   = '00000000-0000-4000-a000-000000000105';

// Demo-Finance-Request (DB-geseedet)
const ID_FINANCE_REQUEST = '00000000-0000-4000-a000-000000000004';

export const ALL_DEMO_IDS: readonly string[] = [
  // Personen
  DEMO_PRIMARY_PERSON_ID, ID_LISA, ID_FELIX, ID_EMMA,
  // Versicherungen
  ID_INS_HAFTPFLICHT, ID_INS_HAUSRAT, ID_INS_GEBAEUDE, ID_INS_RECHT,
  ID_INS_KFZ1, ID_INS_KFZ2, ID_INS_BU,
  // Vorsorge
  ID_VS_RUERUP, ID_VS_BAV, ID_VS_RIESTER, ID_VS_ETF, ID_VS_BU_MAX, ID_VS_BU_LISA,
  // Abonnements
  ID_SUB_NETFLIX, ID_SUB_SPOTIFY, ID_SUB_AMAZON, ID_SUB_MS365,
  ID_SUB_ZEIT, ID_SUB_TELEKOM, ID_SUB_VODAFONE, ID_SUB_FITX,
   // KV-Verträge (DB-geseedet)
  ID_KV_MAX, ID_KV_LISA, ID_KV_FELIX, ID_KV_EMMA,
  // Privatkredite
  ID_PL_AUTO, ID_PL_MOEBEL,
  // Pension Records
  ID_PENSION_LISA,
  // Portfolio (DB-IDs)
  ...DEMO_PORTFOLIO.propertyIds,
  ...DEMO_PORTFOLIO.vehicleIds,
  ...DEMO_PORTFOLIO.pvPlantIds,
  DEMO_PORTFOLIO.landlordContextId,
  // Kontakte (DB-geseedet)
  ID_CONTACT_MAX, ID_CONTACT_LISA, ID_CONTACT_BERGMANN, ID_CONTACT_HOFFMANN, ID_CONTACT_WEBER,
  // Finance Request (DB-geseedet)
  ID_FINANCE_REQUEST,
  // Akquise + Projekte
  DEMO_ACQ_MANDATE_ID,
  DEMO_ACQ_OFFER_ID,
  DEMO_DEVELOPER_CONTEXT_ID,
  // Selbstauskunft
  DEMO_SELBSTAUSKUNFT_PRIMARY_ID,
  DEMO_SELBSTAUSKUNFT_CO_ID,
  // Pets (DB-geseedet)
  DEMO_PET_LUNA,
  DEMO_PET_BELLO,
  // Pet Provider + Services (DB-geseedet)
  DEMO_PET_PROVIDER_LENNOX,
  ID_PET_SVC_GROOMING, ID_PET_SVC_WALKING, ID_PET_SVC_DAYCARE, ID_PET_SVC_BOARDING,
  // Miety Zuhause (DB-geseedet)
  ID_MIETY_HOME,
  ID_MIETY_STROM, ID_MIETY_GAS, ID_MIETY_WASSER, ID_MIETY_INTERNET,
  // Pet Manager Demo (MOD-22)
  ...ALL_PM_DEMO_IDS,
] as const;

// ─── GESAMTPAKET ───────────────────────────────────────────

export { DEMO_PM_CUSTOMERS, DEMO_PM_PETS, DEMO_PM_BOOKINGS, ALL_PM_DEMO_IDS };

export const DEMO_DATA_SPEC: DemoDataSpec = {
  personas: DEMO_FAMILY,
  insurances: DEMO_INSURANCES,
  vorsorge: DEMO_VORSORGE,
  subscriptions: DEMO_SUBSCRIPTIONS,
  kvContracts: DEMO_KV_CONTRACTS,
  privateLoans: DEMO_PRIVATE_LOANS,
  portfolio: DEMO_PORTFOLIO,
  acqMandate: DEMO_ACQ_MANDATE,
  devProject: DEMO_DEV_PROJECT,
  selbstauskunft: DEMO_SELBSTAUSKUNFT,
  mietyHome: DEMO_MIETY_HOME,
  mietyContracts: DEMO_MIETY_CONTRACTS,
  pmCustomers: DEMO_PM_CUSTOMERS,
  pmPets: DEMO_PM_PETS,
  pmBookings: DEMO_PM_BOOKINGS,
};

// ─── DEMO COVERAGE MAP ────────────────────────────────────
/**
 * Dokumentation: Abdeckungsstatus aller 15 Golden Path Prozesse
 *
 * ✅ VOLLSTÄNDIG:
 * - GP-PORTFOLIO     (MOD-04) — DB: 3 Properties + Landlord Context
 * - GP-VERWALTUNG    (MOD-04) — DB: Leases, NK, V+V
 * - GP-SANIERUNG     (MOD-04) — Clientseitig: Demo-Widget
 * - GP-FINANZIERUNG  (MOD-07) — DB: Selbstauskunft Max (92%) + Lisa (78%)
 * - GP-SUCHMANDAT    (MOD-08) — Clientseitig: useDemoAcquisition
 * - GP-SIMULATION    (MOD-08) — Clientseitig: Demo-Widget
 * - GP-AKQUISE-MANDAT(MOD-12) — DB: acq_mandates + acq_offers
 * - GP-PROJEKT       (MOD-13) — Clientseitig: demoProjectData.ts
 * - GP-FAHRZEUG      (MOD-17) — DB: 2 Fahrzeuge (Porsche, BMW)
 * - GP-PV-ANLAGE     (MOD-19) — DB: PV-Anlage 32.4 kWp
 * - GP-KONTEN        (MOD-18) — Clientseitig: Demo-Bankkonto
 * - GP-ZUHAUSE       (MOD-20) — DB: 1 Home + 4 Versorgungsverträge (Strom, Gas, Wasser, Internet)
 * - GP-PETS          (MOD-05) — DB: 2 Demo-Pets + Lennox & Friends Provider + 4 Services + Availability
 * - GP-PET           (MOD-22) — Clientseitig: 3 Kunden + 3 Hunde + 5 Buchungen (Pension + Service)
 *
 * ⚠️ TEILWEISE / BEWUSST OFFEN:
 * - GP-FM-FALL       (MOD-11) — Kein Demo-Finanzierungsfall (bewusst)
 * - GP-SERIEN-EMAIL  (MOD-14) — Nur Demo-Widget, keine echte Sequenz
 * - GP-RECHERCHE     (MOD-14) — Nur Demo-Widget, keine echten Ergebnisse
 */
