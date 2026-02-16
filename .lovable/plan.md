
I will expand the "Vorsorgeverträge" data model and UI to support full capturing of Life and Occupational Disability Insurance (BU) contracts, as requested. This involves adding fields for insurance end dates and benefit/sum amounts, and updating the demo data for the Mustermann family.

### 1. Database Schema Extension
I will add the following columns to the `vorsorge_contracts` table:
- `end_date` (DATE): To capture "Versicherungsende".
- `monthly_benefit` (NUMERIC): To capture the "BU-Rente" (monthly benefit).
- `insured_sum` (NUMERIC): To capture the "Versicherungssumme" (insured sum for life insurance).
- `dynamics_percent` (NUMERIC): To capture the common "Dynamik" (percentage increase).

### 2. Demo Data Updates
I will update the demo persona "Mustermann" to include the requested BU contracts:
- **Max Mustermann (Primary)**:
  - BU Rente: 3.000 €/Mo
  - End Date: 2047-03-15 (age 65)
  - Start Date: 2017-07-01
  - Provider: 'Alte Leipziger'
- **Lisa Mustermann (Partner)**:
  - BU Rente: 1.500 €/Mo
  - End Date: 2047-07-22 (age 62)
  - Start Date: 2019-10-01
  - Provider: 'Hallesche'
- I will move the existing `ID_INS_BU` from the "Insurance" category to the "Vorsorge" category in the demo engine to align with the new structure.

### 3. UI Enhancements (Vorsorge-Tab)
I will modify `src/pages/portal/finanzanalyse/VorsorgeTab.tsx`:
- **Contract Types**: Add 'Berufsunfähigkeit' and 'Lebensversicherung' to the selection list.
- **Form Fields**:
  - Add "Versicherungsende" (Date input).
  - Add "Monatliche Rente (€)" (Numeric input).
  - Add "Versicherungssumme (€)" (Numeric input).
  - Add "Dynamik (%)" (Numeric input).
- **Display**: Update the contract cards to show the end date and the relevant benefit/sum values.
- **Mutation Logic**: Update the create/update functions to handle these new fields.

### 4. Hook Updates
I will update `src/hooks/useFinanzmanagerData.ts` to ensure the central `useVorsorgeContractMutations` hook supports these new fields for consistency across the app.

---

### Technical Details

#### SQL Migration
```sql
ALTER TABLE public.vorsorge_contracts 
ADD COLUMN end_date DATE,
ADD COLUMN monthly_benefit NUMERIC,
ADD COLUMN insured_sum NUMERIC,
ADD COLUMN dynamics_percent NUMERIC;
```

#### Demo Data Mapping
I'll update `src/engines/demoData/spec.ts` to include these fields in the `DemoVorsorgeContract` interface and then update `src/engines/demoData/data.ts` with the new contracts.

#### UI Logic
In `VorsorgeTab.tsx`, I will implement conditional visibility or labeling where it makes sense (e.g., show "BU-Rente" if type is BU, "Versicherungssumme" if type is Life Insurance).
