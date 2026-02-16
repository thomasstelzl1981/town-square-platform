
-- 1. Primary: Max Mustermann Selbstauskunft befüllen
UPDATE applicant_profiles SET
  salutation = 'Herr', first_name = 'Max', last_name = 'Mustermann',
  birth_date = '1982-03-15', birth_place = 'München', birth_country = 'DE',
  nationality = 'DE', address_street = 'Leopoldstraße 42',
  address_postal_code = '80802', address_city = 'München',
  address_since = '2015-06-01', phone = '+49 89 12345678',
  phone_mobile = '+49 170 1234567', email = 'max@mustermann-demo.de',
  tax_id = '12 345 678 901', marital_status = 'verheiratet',
  property_separation = false, adults_count = 2, children_count = 2,
  children_birth_dates = '2014-09-03, 2017-11-28',
  employment_type = 'selbststaendig', company_name = 'IT-Beratung Mustermann',
  company_legal_form = 'Einzelunternehmen', company_founded = '2010-01-01',
  company_industry = 'IT / Software-Beratung', company_managing_director = true,
  company_ownership_percent = 100, vehicles_count = 2,
  iban = 'DE89370400440532013000', bic = 'COBADEFFXXX',
  self_employed_income_monthly = 8500, rental_income_monthly = 2800,
  has_rental_properties = true, child_benefit_monthly = 500,
  current_rent_monthly = 0, living_expenses_monthly = 2200,
  health_insurance_monthly = 685, car_leasing_monthly = 890,
  other_fixed_costs_monthly = 350, bank_savings = 85000,
  securities_value = 120000, life_insurance_value = 45000,
  completion_score = 92
WHERE id = 'a23366ab-e769-46b0-8d44-f8117f901c15';

-- 2. Co-Applicant: Lisa Mustermann Selbstauskunft befüllen
UPDATE applicant_profiles SET
  salutation = 'Frau', first_name = 'Lisa', last_name = 'Mustermann',
  birth_date = '1985-07-22', birth_place = 'Hamburg', birth_country = 'DE',
  nationality = 'DE', address_street = 'Leopoldstraße 42',
  address_postal_code = '80802', address_city = 'München',
  phone_mobile = '+49 170 7654321', email = 'lisa@mustermann-demo.de',
  employment_type = 'unbefristet', employer_name = 'MediaCorp GmbH',
  employer_location = 'München', employer_industry = 'Marketing',
  position = 'Marketing Managerin', employed_since = '2012-03-01',
  contract_type = 'unbefristet', employer_in_germany = true,
  net_income_monthly = 3200, bonus_yearly = 5000,
  iban = 'DE72100110012345678901', bic = 'NTSBDEB1XXX',
  completion_score = 78
WHERE id = '703e1648-5dbf-40da-8f5f-040dc04bbc31';
