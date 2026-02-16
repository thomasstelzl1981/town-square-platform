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
  DemoPortfolioRefs,
  DemoDataSpec,
} from './spec';

// ─── FESTE IDs ─────────────────────────────────────────────
/** Bestehende Hauptperson (wird per UPDATE umbenannt) */
export const DEMO_PRIMARY_PERSON_ID = 'b1f6d204-05ac-462f-9dae-8fba64ab9f88';
export const DEMO_TENANT_ID = 'a0000000-0000-4000-a000-000000000001';
export const DEMO_USER_ID = 'd028bc99-6e29-4fa4-b038-d03015faf222';

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

// Abonnements
const ID_SUB_NETFLIX   = 'e0000000-0000-4000-a000-000000000401';
const ID_SUB_SPOTIFY   = 'e0000000-0000-4000-a000-000000000402';
const ID_SUB_AMAZON    = 'e0000000-0000-4000-a000-000000000403';
const ID_SUB_MS365     = 'e0000000-0000-4000-a000-000000000404';
const ID_SUB_ZEIT      = 'e0000000-0000-4000-a000-000000000405';
const ID_SUB_TELEKOM   = 'e0000000-0000-4000-a000-000000000406';
const ID_SUB_VODAFONE  = 'e0000000-0000-4000-a000-000000000407';
const ID_SUB_FITX      = 'e0000000-0000-4000-a000-000000000408';

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
  },
  {
    id: ID_VS_RIESTER,
    personId: ID_LISA,
    provider: 'DWS',
    contractNo: 'DWS-RIE-2018-001',
    contractType: 'Riester-Rente',
    startDate: '2018-01-01',
    premium: 162.17,
    paymentInterval: 'monatlich',
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

// ─── KV-DATEN (clientseitig, kein DB-Insert) ──────────────

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

// ─── PORTFOLIO-REFERENZEN (bestehende IDs) ─────────────────

export const DEMO_PORTFOLIO: DemoPortfolioRefs = {
  propertyIds: [
    'a0000000-0000-4000-a000-000000000010', // BER-01
    'a0000000-0000-4000-a000-000000000020', // MUC-01
    'a0000000-0000-4000-a000-000000000030', // HH-01
  ],
  vehicleIds: [
    'a0000000-0000-4000-a000-000000000050', // Porsche 911
    'a0000000-0000-4000-a000-000000000051', // BMW M5
  ],
  pvPlantIds: [
    'a0000000-0000-4000-a000-000000000060', // PV 32.4 kWp
  ],
  landlordContextId: 'a0000000-0000-4000-a000-000000000040',
};

// ─── ALLE IDs (flach) ──────────────────────────────────────

export const ALL_DEMO_IDS: readonly string[] = [
  // Personen
  DEMO_PRIMARY_PERSON_ID, ID_LISA, ID_FELIX, ID_EMMA,
  // Versicherungen
  ID_INS_HAFTPFLICHT, ID_INS_HAUSRAT, ID_INS_GEBAEUDE, ID_INS_RECHT,
  ID_INS_KFZ1, ID_INS_KFZ2, ID_INS_BU,
  // Vorsorge
  ID_VS_RUERUP, ID_VS_BAV, ID_VS_RIESTER, ID_VS_ETF,
  // Abonnements
  ID_SUB_NETFLIX, ID_SUB_SPOTIFY, ID_SUB_AMAZON, ID_SUB_MS365,
  ID_SUB_ZEIT, ID_SUB_TELEKOM, ID_SUB_VODAFONE, ID_SUB_FITX,
  // Portfolio (bestehend)
  ...DEMO_PORTFOLIO.propertyIds,
  ...DEMO_PORTFOLIO.vehicleIds,
  ...DEMO_PORTFOLIO.pvPlantIds,
  DEMO_PORTFOLIO.landlordContextId,
] as const;

// ─── GESAMTPAKET ───────────────────────────────────────────

export const DEMO_DATA_SPEC: DemoDataSpec = {
  personas: DEMO_FAMILY,
  insurances: DEMO_INSURANCES,
  vorsorge: DEMO_VORSORGE,
  subscriptions: DEMO_SUBSCRIPTIONS,
  kvContracts: DEMO_KV_CONTRACTS,
  portfolio: DEMO_PORTFOLIO,
};
