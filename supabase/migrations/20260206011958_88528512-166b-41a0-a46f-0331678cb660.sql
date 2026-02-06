-- Update Familie Mustermann context_members with complete tax data
UPDATE context_members SET
  tax_class = 'III',
  profession = 'Software-Entwickler',
  gross_income_yearly = 72000,
  church_tax = false
WHERE first_name = 'Max' AND last_name = 'Mustermann';

UPDATE context_members SET
  tax_class = 'V',
  profession = 'Marketing-Managerin',
  gross_income_yearly = 54000,
  church_tax = false
WHERE first_name = 'Lisa' AND last_name = 'Mustermann';

-- Update landlord_contexts to remove legacy tax_regime for private contexts
UPDATE landlord_contexts 
SET tax_regime = NULL 
WHERE context_type = 'PRIVATE';