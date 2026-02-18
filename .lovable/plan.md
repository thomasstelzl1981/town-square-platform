
# GP-COMMISSION — Einheitliche Systemgebühr (25%) für alle Manager-Module

## Status: ✅ IMPLEMENTIERT

### Umgesetzte Änderungen

#### 1. Engine erweitert (`src/engines/provision/`)
- **spec.ts**: `SystemFeeInput`, `SystemFeeResult`, `SystemFeeConfig` Typen + `SYSTEM_FEE_CONFIGS` (SSOT für alle 3 Manager)
- **engine.ts**: `calcSystemFee()` Funktion — berechnet Systemgebühr (25%) und Manager-Netto
- Standard-Systemgebühr: **25% einheitlich** für alle Module

#### 2. Shared Component (`src/components/shared/ManagerSystemgebuehr.tsx`)
- Wiederverwendbare Komponente für MOD-09, MOD-11, MOD-12
- Agreement-Card (laden + akzeptieren via `user_consents`)
- KPI-Cards: Provision gesamt, Systemgebühr (25%), Netto
- Abrechnungshistorie mit Engine-Berechnung

#### 3. Manager-Module integriert
- **MOD-11 Finance**: `FMProvisionen.tsx` → refactored auf `ManagerSystemgebuehr`
- **MOD-09 Immo**: `ImmoSystemgebuehr.tsx` → neuer Tile "Systemgebühr"
- **MOD-12 Akquise**: `AkquiseSystemgebuehr.tsx` → neuer Tile "Systemgebühr"

#### 4. Manifest + Router + Routes
- `routesManifest.ts`: Tiles für MOD-09 + MOD-12 um "systemgebuehr" ergänzt
- `VertriebspartnerPage.tsx`: Route "systemgebuehr" hinzugefügt
- `AkquiseManagerPage.tsx`: Route "systemgebuehr" hinzugefügt

#### 5. Golden Path (`src/manifests/goldenPaths/GP_COMMISSION.ts`)
- 6 Phasen: lead_received → lead_assigned → terms_accepted → deal_closed → system_fee_invoiced → system_fee_paid
- Fail-States: timeout, rejected, error
- Registriert in `index.ts` unter 'GP-COMMISSION'
- Ledger Events: commission.agreement.accepted/rejected, commission.record.created, commission.invoiced, commission.paid, commission.cancelled

#### 6. Agreement Templates (DB)
- `IMMO_SYSTEM_FEE_AGREEMENT`: Systemgebühr 25% für Immomanager
- `ACQ_SYSTEM_FEE_AGREEMENT`: Systemgebühr 25% für Akquisemanager
- `FINANCE_TIPP_AGREEMENT`: Text aktualisiert (Terminologie: "Systemgebühr" statt "Tippgeberprovision")

#### 7. Terminologie korrigiert
- MOD_07_11 Golden Path: "30% Plattformgebühr" → "25% Plattformgebühr"
- UI: "Tippgeber-Vereinbarung" → "Systemgebühr-Vereinbarung"
- UI: "Provisionshistorie" → "Abrechnungshistorie"
- UI: "25% SoT" → "Systemgebühr"

### Brand-zu-Manager Mapping (SSOT)

| Zone 3 Surface | Zone 1 Desk      | Zone 2 Manager    | commission_type      | Systemgebühr |
|----------------|-------------------|-------------------|----------------------|:------------:|
| Kaufy          | Sales Desk        | MOD-09 Immo       | `immo_vermittlung`   | 25%          |
| FutureRoom     | Finance Desk      | MOD-11 Finance    | `finance_tipp`       | 25%          |
| Acquiary       | Acquiary Desk     | MOD-12 Akquise    | `acq_erfolgsgebuehr` | 25%          |

### Offene Punkte (Future Work)
- [ ] LEGAL-01: Signup-Consent, Cookie-Banner, Art. 15/17 Flows
- [ ] Security: Leaked Password Protection aktivieren, OTP-Expiry anpassen
- [ ] Security: Permissive RLS Policies prüfen
