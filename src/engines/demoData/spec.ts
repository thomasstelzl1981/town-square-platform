/**
 * Demo Data Engine — Type Specifications
 * 
 * Zentrale Interfaces für die Familie Mustermann Demo-Persona
 * und alle zugehörigen Finanzverträge.
 * 
 * @module SYSTEM
 * @see spec/current/08_data_provenance/DPR_V1.md
 */

/** Rolle einer Person im Haushalt */
export type DemoPersonRole = 'hauptperson' | 'partner' | 'kind';

/** Krankenversicherungstyp */
export type DemoKVType = 'PKV' | 'GKV' | 'familienversichert';

/** Demo-Person im Haushalt */
export interface DemoPersona {
  readonly id: string;
  readonly role: DemoPersonRole;
  readonly salutation: 'Herr' | 'Frau';
  readonly firstName: string;
  readonly lastName: string;
  readonly birthDate: string;
  readonly email?: string;
  readonly phone?: string;
  readonly employmentStatus?: string;
  readonly employerName?: string;
  readonly kvType: DemoKVType;
  readonly sortOrder: number;
  readonly isPrimary: boolean;
}

/** Demo-Sachversicherungsvertrag */
export interface DemoInsuranceContract {
  readonly id: string;
  readonly category: 'haftpflicht' | 'hausrat' | 'wohngebaeude' | 'rechtsschutz' | 'kfz' | 'berufsunfaehigkeit' | 'unfall' | 'sonstige';
  readonly insurer: string;
  readonly policyNo: string;
  readonly policyholder: string;
  readonly startDate: string;
  readonly premium: number;
  readonly paymentInterval: 'monatlich' | 'vierteljährlich' | 'halbjährlich' | 'jährlich';
  readonly details?: Record<string, unknown>;
}

/** Demo-Vorsorgevertrag */
export interface DemoVorsorgeContract {
  readonly id: string;
  readonly personId: string;
  readonly provider: string;
  readonly contractNo: string;
  readonly contractType: string;
  readonly startDate: string;
  readonly endDate?: string;
  readonly premium: number;
  readonly paymentInterval: 'monatlich' | 'vierteljährlich' | 'halbjährlich' | 'jährlich';
  readonly category: 'vorsorge' | 'investment';
  readonly currentBalance?: number;
  readonly balanceDate?: string;
  readonly monthlyBenefit?: number;
  readonly buMonthlyBenefit?: number;
  readonly insuredSum?: number;
  readonly dynamicsPercent?: number;
}

/** Demo-Abonnement */
export interface DemoSubscription {
  readonly id: string;
  readonly merchant: string;
  readonly category: string;
  readonly amount: number;
  readonly frequency: 'monatlich' | 'jaehrlich';
  readonly customName?: string;
}

/** KV-Daten für den KV-Tab */
export interface DemoKVContract {
  readonly personId: string;
  readonly personName: string;
  readonly type: DemoKVType;
  readonly provider: string;
  readonly monthlyPremium: number;
  readonly employerContribution?: number;
  readonly details: Record<string, string | number | boolean | readonly { year: number; alt: number; neu: number }[]>;
}

/** Referenzen auf bestehende Demo-Daten (Properties, Vehicles, PV) */
export interface DemoPortfolioRefs {
  readonly propertyIds: readonly string[];
  readonly vehicleIds: readonly string[];
  readonly pvPlantIds: readonly string[];
  readonly landlordContextId: string;
}

/** Demo-Akquise-Mandat */
export interface DemoAcqMandate {
  readonly id: string;
  readonly code: string;
  readonly clientDisplayName: string;
  readonly assetFocus: string[];
  readonly region: string;
  readonly priceMin: number;
  readonly priceMax: number;
  readonly yieldTarget: number;
}

/** Demo-Projekt (Developer/Aufteiler) */
export interface DemoDevProject {
  readonly projectId: string;
  readonly developerContextId: string;
  readonly developerContextName: string;
  readonly projectName: string;
  readonly city: string;
}

/** Demo-Selbstauskunft (persistente Applicant Profiles) */
export interface DemoSelbstauskunft {
  readonly primaryProfileId: string;
  readonly coApplicantProfileId: string;
}

/** Demo-Privatkredit */
export interface DemoPrivateLoan {
  readonly id: string;
  readonly personId: string;
  readonly bankName: string;
  readonly loanPurpose: 'autokredit' | 'konsumkredit' | 'moebel' | 'bildung' | 'umschuldung' | 'sonstiges';
  readonly loanAmount: number;
  readonly remainingBalance: number;
  readonly interestRate: number;
  readonly monthlyRate: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: 'aktiv' | 'abgeschlossen';
}

/** Demo-Miety-Home */
export interface DemoMietyHome {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly addressHouseNo: string;
  readonly zip: string;
  readonly city: string;
  readonly ownershipType: 'miete' | 'eigentum';
  readonly propertyType: string;
  readonly areaSqm: number;
  readonly roomsCount: number;
}

/** Demo-Miety-Contract (Versorgung) */
export interface DemoMietyContract {
  readonly id: string;
  readonly category: 'strom' | 'gas' | 'wasser' | 'internet';
  readonly providerName: string;
  readonly contractNumber: string;
  readonly monthlyCost: number;
  readonly startDate: string;
}

/** Demo-PM-Kunde (Pet Manager Kundenverwaltung) */
export interface DemoPMCustomer {
  readonly id: string;
  readonly tenantId: string;
  readonly providerId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly address?: string;
  readonly notes?: string;
  readonly source: 'manual' | 'lead' | 'mod05';
  readonly originZone: 'Z2' | 'Z3' | 'Z2-MOD05';
  readonly z1CustomerId?: string;
  readonly userId?: string;
  readonly status: 'active' | 'inactive' | 'archived';
  readonly createdAt: string;
}

/** Demo-PM-Tier (Pet Manager) */
export interface DemoPMPet {
  readonly id: string;
  readonly customerId: string;
  readonly name: string;
  readonly species: string;
  readonly breed: string;
  readonly birthDate: string;
  readonly gender: 'männlich' | 'weiblich';
  readonly weight: number;
  readonly color: string;
  readonly chipNumber?: string;
  readonly notes?: string;
}

/** Demo-PM-Buchung (Pet Manager) */
export interface DemoPMBooking {
  readonly id: string;
  readonly customerId: string;
  readonly petId: string;
  readonly providerId: string;
  readonly bookingType: 'pension' | 'service';
  readonly serviceName: string;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly startTime: string | null;
  readonly durationMinutes: number | null;
  readonly staffName: string | null;
  readonly staffId: string | null;
  readonly status: 'confirmed' | 'completed' | 'cancelled';
  readonly totalPrice: number;
  readonly notes: string | null;
}

/** Gesamtstruktur aller Demo-Daten */
export interface DemoDataSpec {
  readonly personas: readonly DemoPersona[];
  readonly insurances: readonly DemoInsuranceContract[];
  readonly vorsorge: readonly DemoVorsorgeContract[];
  readonly subscriptions: readonly DemoSubscription[];
  readonly kvContracts: readonly DemoKVContract[];
  readonly privateLoans: readonly DemoPrivateLoan[];
  readonly portfolio: DemoPortfolioRefs;
  readonly acqMandate: DemoAcqMandate;
  readonly devProject: DemoDevProject;
  readonly selbstauskunft: DemoSelbstauskunft;
  readonly mietyHome: DemoMietyHome;
  readonly mietyContracts: readonly DemoMietyContract[];
  readonly pmCustomers: readonly DemoPMCustomer[];
  readonly pmPets: readonly DemoPMPet[];
  readonly pmBookings: readonly DemoPMBooking[];
}
