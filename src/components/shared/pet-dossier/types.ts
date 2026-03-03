/**
 * PetDossier — Shared types for the universal pet dossier component
 * Used across Z2 MOD-05, Z2 MOD-22, and Z3 Lennox
 */

export type PetDossierContext = 'z2-client' | 'z2-provider' | 'z3';

export interface PetOwnerData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
}

export interface PetVaccination {
  id: string;
  name: string;
  date: string;
  vet: string;
}

export interface PetTreatment {
  id: string;
  name: string;
  date: string;
  notes: string;
}

export interface PetData {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  color: string | null;
  chip_number: string | null;
  neutered: boolean | null;
  photo_url: string | null;
  // Health
  vet_name: string | null;
  vet_practice: string | null;
  vet_phone: string | null;
  allergies: string[] | null;
  intolerances: string[] | null;
  // Nutrition
  food_brand: string | null;
  food_amount: string | null;
  food_frequency: string | null;
  food_notes: string | null;
  grooming_notes: string | null;
  // Insurance
  insurance_provider: string | null;
  insurance_policy_no: string | null;
  insurance_type: string | null;
  insurance_premium_monthly: number | null;
  insurance_deductible: number | null;
  insurance_valid_until: string | null;
  // Behavior
  compatible_dogs: boolean | null;
  compatible_cats: boolean | null;
  compatible_children: boolean | null;
  leash_required: boolean | null;
  muzzle_required: boolean | null;
  training_level: string | null;
  fears: string[] | null;
  behavior_notes: string | null;
  // Notes
  notes: string | null;
  // Meta
  tenant_id: string;
  owner_user_id?: string | null;
  z3_owner_id?: string | null;
  customer_id?: string | null;
}

export interface PetDossierProps {
  petId: string;
  context: PetDossierContext;
  readOnly?: boolean;
  showOwner?: boolean;
  ownerData?: PetOwnerData | null;
  onPetUpdate?: (data: Partial<PetData>) => void;
  onOwnerUpdate?: (data: Partial<PetOwnerData>) => void;
}

export interface PetSectionProps {
  pet: PetData;
  readOnly: boolean;
  onUpdate: (data: Partial<PetData>) => void;
}
