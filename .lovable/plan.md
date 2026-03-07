

# MOD-04 Immobilien — Gesamtanalyse & Reparaturplan

## 1. Sprengnetter / GeoMap Reste

**Befund:** Keine Reste in MOD-04 Code (Immobilien-Seiten, Immobilienakte, Hooks, Edge Functions). Die einzigen Vorkommen sind in **MOD-12 (Akquise-Manager)** — dort als Legacy-Kommentare markiert:
- `src/hooks/useAcqOffers.ts` — `geomap_data` Feld im AcqOffer-Interface
- `src/pages/portal/akquise-manager/components/AnalysisTab.tsx` — Kommentar "GeoMap/Sprengnetter entfernt"
- `src/pages/portal/akquise-manager/components/DeliveryTab.tsx` — `hasGeo = offer.geomap_data`
- `src/integrations/supabase/types.ts` — DB-Spalte `geomap_data` in `acq_offers` (auto-generiert)

**Aktion:** MOD-12 ist frozen. Die `geomap_data`-Spalte existiert in der DB und wird als Legacy-Container genutzt. Kein Handlungsbedarf in MOD-04.

---

## 2. Tote Dateien (Dead Code)

### 2a. Read-Only Dossier-Blöcke (7 Dateien, ~600 Zeilen)
Diese Komponenten sind in `index.ts` exportiert, aber **nirgends importiert**:
- `src/components/immobilienakte/IdentityBlock.tsx`
- `src/components/immobilienakte/CoreDataBlock.tsx`
- `src/components/immobilienakte/TenancyBlock.tsx`
- `src/components/immobilienakte/NKWEGBlock.tsx`
- `src/components/immobilienakte/InvestmentKPIBlock.tsx`
- `src/components/immobilienakte/FinancingBlock.tsx`
- `src/components/immobilienakte/LegalBlock.tsx`

**Grund:** Die Akte verwendet nur noch die `Editable*`-Varianten. Die Read-Only-Blöcke sind Relikte aus der Zeit vor dem Inline-Edit-Umbau.

**Aktion:** Alle 7 Dateien löschen, Exporte aus `index.ts` entfernen.

### 2b. KontexteTab.tsx (1 Datei, 214 Zeilen)
- `src/pages/portal/immobilien/KontexteTab.tsx` — existiert als Datei, wird aber nirgends importiert
- Die Route `/kontexte` redirected zu `/portfolio`
- Die `index.ts` enthält bereits den Kommentar "KontexteTab removed"

**Aktion:** Datei löschen.

---

## 3. Daten-Persistenz-Bugs

### 3a. `landRegisterOf` wird nicht gespeichert
- **UI:** `EditableLegalBlock` zeigt Feld "Grundbuch von" und ruft `onFieldChange('landRegisterOf', value)` auf
- **Form:** `useDossierForm.ts` hat `landRegisterOf` **nicht** in `propertyFields` (Zeile 53-61)
- **Mutation:** `useDossierMutations.ts` hat kein Mapping für `landRegisterOf`
- **DB:** Kein `land_register_of` Feld in `properties` — der Wert wird aus `land_register_refs.of` (JSON) gelesen

**Aktion:** 
1. Entweder DB-Spalte `land_register_of` anlegen und Mapping in Form + Mutation ergänzen
2. Oder die JSON-Spalte `land_register_refs` als Speicherort nutzen und in Mutations aktualisieren
3. `landRegisterOf` in die `propertyFields`-Liste in `useDossierForm.ts` aufnehmen

### 3b. `meaShare` lebt auf `units`, wird aber als Property-Feld in der Akte behandelt
- `EditableLegalBlock` zeigt `meaShare` und schreibt über `onFieldChange('meaShare', ...)`
- `useDossierForm.ts` hat `meaShare` in `unitFields` (korrekt, Zeile 125) — das passt, denn es wird auf `units.mea_share` gemappt
- Aber: `EditableLegalBlock` nimmt `meaShare` als Prop entgegen und zeigt es im Grundbuch-Block — **Positions-Verwirrung**, kein Datenverlust

### 3c. Edge Function: `energy_certificate_value` fehlt im Snapshot
- Die Edge Function mappt jetzt `energy_certificate_value: p.energy_certificate_value || null` (seit letztem Fix)
- Aber die `properties`-Tabelle hat **kein** `energy_certificate_value` Feld — das lebt auf `units`
- Im Snapshot wird `p.energy_certificate_value` also immer `null` sein
- **Fix:** Muss von Units gelesen werden: `units[0]?.energy_certificate_value`

---

## 4. Feld-Mapping-Konsistenz

### Vollständige Kette: Akte-UI → useDossierForm → useDossierMutations → DB

| Feld | UI Block | Form | Mutation | DB-Spalte | Status |
|------|----------|------|----------|-----------|--------|
| heatingType | Building ✅ | ✅ | ✅ | properties.heating_type | ✅ OK |
| energySource | Building ✅ | ✅ | ✅ | properties.energy_source | ✅ OK |
| energyClass | Building ✅ | ✅ | ✅ | properties.energy_class | ✅ OK |
| energyCertType | Building ✅ | ✅ (unit) | ✅ | units.energy_certificate_type | ✅ OK |
| energyCertValue | Building ✅ | ✅ (unit) | ✅ | units.energy_certificate_value | ✅ OK |
| energyCertValidUntil | Building ✅ | ✅ (unit) | ✅ | units.energy_certificate_valid_until | ✅ OK |
| landRegisterCourt | Legal ✅ | ✅ | ✅ | properties.land_register_court | ✅ OK |
| landRegisterOf | Legal ✅ | ❌ FEHLT | ❌ FEHLT | ❌ kein DB-Feld | ⛔ BUG |
| landRegisterSheet | Legal ✅ | ✅ | ✅ | properties.land_register_sheet | ✅ OK |
| landRegisterVolume | Legal ✅ | ✅ | ✅ | properties.land_register_volume | ✅ OK |
| parcelNumber | Legal ✅ | ✅ | ✅ | properties.parcel_number | ✅ OK |
| teNumber | Legal ✅ | ✅ | ✅ | properties.te_number | ✅ OK |
| plotAreaSqm | Legal ✅ | ✅ | ✅ | properties.plot_area_sqm | ✅ OK |
| coreRenovated | Building ✅ | ✅ | ✅ | properties.core_renovated | ✅ OK |
| renovationYear | Building ✅ | ✅ | ✅ | properties.renovation_year | ✅ OK |
| unitCountActual | Identity ✅ | ✅ | ✅ | properties.unit_count_actual | ✅ OK |
| meaShare | Legal ✅ | ✅ (unit) | ✅ | units.mea_share | ✅ OK |
| meaTotal | Legal ✅ | ✅ | ✅ | properties.mea_total | ✅ OK |

---

## 5. Edge Function Snapshot → Gutachten-Mapping

| Snapshot-Feld | Quelle | Gutachten-Anzeige | Status |
|---------------|--------|-------------------|--------|
| energy_class | properties.energy_class | ✅ nach letztem Fix | OK |
| energy_certificate_value | ⚠️ properties (FALSCH) | sollte units sein | ⛔ BUG |
| heating_type | properties.heating_type | ✅ | OK |
| energy_source | properties.energy_source | ✅ | OK |
| land_register_court | properties → legal_title | ✅ nach camelCase Fix | OK |
| ownership_share_percent | properties | ✅ | OK |

---

## 6. Architektur-Bewertung

### Was gut ist:
- **Type-System:** `src/types/immobilienakte.ts` ist sauber strukturiert (10 Blöcke A-J)
- **Form/Mutation-Trennung:** `useDossierForm` + `useSaveDossier` Pattern ist solide
- **Multi-Lease-Support:** korrekt implementiert mit Summen-Aggregation
- **Tab-Router:** Clean separation in `PropertyTabRouter.tsx`
- **Valuation-Integration:** useValuationCase + ValuationReportReader gut orchestriert

### Was optimiert werden kann:
- **PropertyDetailPage** (188 Zeilen): Verwendet `any`-Casts für Property-Interface, obwohl ein sauberes Interface definiert ist. Das `Property`-Interface in der Datei ist redundant — es sollte aus `types/immobilienakte.ts` importiert werden
- **PropertyTabRouter:** Alle Props sind `any` — sollte getypt werden
- **`useUnitDossier.ts`:** Viele `(property as any)` Casts — deutet auf unvollständiges DB-Typing hin

---

## 7. Konkreter Reparaturplan

### Phase 1: Cleanup (Dead Code entfernen)
1. 7 Read-Only-Blöcke löschen + `index.ts` bereinigen
2. `KontexteTab.tsx` löschen
3. Geschätzt: ~800 Zeilen weniger

### Phase 2: Daten-Bugs fixen
4. DB-Migration: `ALTER TABLE properties ADD COLUMN land_register_of text`
5. `useDossierForm.ts`: `landRegisterOf` in `propertyFields` aufnehmen + Mapping ergänzen
6. `useDossierMutations.ts`: Mapping `landRegisterOf → land_register_of` hinzufügen
7. Edge Function: `energy_certificate_value` von Units statt Properties lesen

### Phase 3: Type-Hygiene (optional, für Freeze-Vorbereitung)
8. `PropertyDetailPage`: Property-Interface durch Import ersetzen, `any`-Casts eliminieren
9. `PropertyTabRouter`: Props typisieren
10. `useUnitDossier`: `as any`-Casts durch korrekte DB-Typen ersetzen

### Phase 4: Freeze
11. `modules_freeze.json`: MOD-04 auf `frozen: true` setzen
12. `infra_freeze.json`: edge_functions auf `frozen: true` setzen

### Dateien die geändert werden:

| Datei | Aktion |
|-------|--------|
| `src/components/immobilienakte/IdentityBlock.tsx` | LÖSCHEN |
| `src/components/immobilienakte/CoreDataBlock.tsx` | LÖSCHEN |
| `src/components/immobilienakte/TenancyBlock.tsx` | LÖSCHEN |
| `src/components/immobilienakte/NKWEGBlock.tsx` | LÖSCHEN |
| `src/components/immobilienakte/InvestmentKPIBlock.tsx` | LÖSCHEN |
| `src/components/immobilienakte/FinancingBlock.tsx` | LÖSCHEN |
| `src/components/immobilienakte/LegalBlock.tsx` | LÖSCHEN |
| `src/components/immobilienakte/index.ts` | Exporte entfernen |
| `src/pages/portal/immobilien/KontexteTab.tsx` | LÖSCHEN |
| `src/hooks/useDossierForm.ts` | landRegisterOf Mapping |
| `src/hooks/useDossierMutations.ts` | landRegisterOf → land_register_of |
| DB-Migration | ADD COLUMN land_register_of |
| `supabase/functions/sot-valuation-engine/index.ts` | energy_cert_value von Units lesen (UNFREEZE nötig) |
| `spec/current/00_frozen/modules_freeze.json` | MOD-04 → frozen: true (am Ende) |

