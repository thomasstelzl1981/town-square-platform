
# MOD-04 Immobilien — Vollständiger Implementierungsplan

## Projektübersicht

Dieser Plan adressiert die vollständige Überarbeitung des MOD-04 Immobilien-Moduls mit folgenden Kernzielen:
- **Kontexte** als Basis für steuerliche Vermietereinheiten
- **Portfolio-Dashboard** mit Summenzeile und kumulierten Visualisierungen
- **Investment-Simulation** für Bestandsimmobilien (Wertzuwachs/Mietsteigerung)
- **Synchronisation** mit Zone 1 Master-Vorlagen und Tile-Katalog

---

## Phase 1: P0 Sofort-Fixes (Query-Reparatur)

### 1.1 loans-Query korrigieren
**Datei:** `src/pages/portal/immobilien/PortfolioTab.tsx`

Das aktuelle Problem: Die Query filtert nach `.eq('is_active', true)`, aber die `loans`-Tabelle hat keine `is_active`-Spalte.

**Änderungen:**
- Zeile 205: `.eq('is_active', true)` entfernen
- Zeile 314: `.eq('is_active', true)` entfernen

**Ergebnis:** Finanzierungsspalten (Restschuld, Annuität, Zins, Tilgung) werden sofort angezeigt.

### 1.2 PropertyDetailPage Query-Fix
**Datei:** `src/pages/portal/immobilien/PropertyDetailPage.tsx`

Zeile 129 verwendet ebenfalls `is_active` für die loans-Query → entfernen.

**Betroffene Dateien:**
| Datei | Änderung |
|-------|----------|
| `src/pages/portal/immobilien/PortfolioTab.tsx` | Zeilen 205, 314: `.eq('is_active', true)` entfernen |
| `src/pages/portal/immobilien/PropertyDetailPage.tsx` | Zeile 129: `.eq('is_active', true)` entfernen |

---

## Phase 2: Portfolio-Dashboard Erweiterungen

### 2.1 Summenzeile in der Portfolio-Tabelle
**Datei:** `src/pages/portal/immobilien/PortfolioTab.tsx`

**Neue Komponente am Ende der Tabelle:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Code   │ Adresse           │ Miete p.a. │ Restschuld │ Annuität │ Zins p.a.│
├──────────────────────────────────────────────────────────────────────────────┤
│  DEMO-1 │ Leipziger Str. 42 │   8.160€   │  152.000€  │  8.964€  │ 5.472€   │
├──────────────────────────────────────────────────────────────────────────────┤
│  ΣΣΣΣΣΣ │ 1 Objekt(e)       │   8.160€   │  152.000€  │  8.964€  │ 5.472€   │ ← SUMME
└──────────────────────────────────────────────────────────────────────────────┘
```

**Eigenschaften:**
- Nutzt die bereits berechneten `totals` (Zeilen 349-394)
- Summenzeile ist nicht klickbar (keine Navigation zu einer Immobilie)
- Klick auf Summenzeile öffnet Modal mit kumulierter Grafik + EÜR
- Styling: `font-bold bg-muted/50 border-t-2`

### 2.2 Kumulierte Investment-Visualisierung (Modal bei Klick auf Summenzeile)
**Neue Datei:** `src/components/portfolio/PortfolioSummaryModal.tsx`

**Inhalte:**
1. **30-Jahres-Tilgungsverlauf** (bereits implementiert in `amortizationData`)
   - Verkehrswert (steigend)
   - Restschuld (sinkend)  
   - Netto-Vermögen (Differenz)

2. **Kumulierte EÜR (Einnahmen-Überschuss-Rechnung)**
   - Mieteinnahmen p.a. (alle Objekte)
   - Zinskosten p.a. (alle Objekte)
   - Nicht umlagefähige NK (geschätzt 0,5% vom Wert)
   - Tilgung p.a.
   - **NEU: Steuervorteil** (basierend auf Kontext-Steuersatz)
   - Netto-Überschuss nach Steuer

### 2.3 Kontexte-Integration im Portfolio
**Datei:** `src/pages/portal/immobilien/PortfolioTab.tsx`

**Änderungen:**
- Bei Auswahl eines spezifischen Kontexts (z.B. "Familie Mustermann") werden nur die diesem Kontext zugeordneten Immobilien angezeigt
- Summenzeile aggregiert dann nur diese Teilmenge
- Steuerberechnung nutzt den Grenzsteuersatz des gewählten Kontexts

**Betroffene Dateien:**
| Datei | Änderung |
|-------|----------|
| `src/pages/portal/immobilien/PortfolioTab.tsx` | Summenzeile + Modal-Trigger |
| `src/components/portfolio/PortfolioSummaryModal.tsx` | NEU: Kumulierte Ansicht |

---

## Phase 3: Kontexte-Erweiterungen

### 3.1 Property-Zuordnung zu Kontexten
**Datei:** `src/pages/portal/immobilien/KontexteTab.tsx`

**Neue Funktionalität:**
- Button "Objekte zuordnen" pro Kontext-Karte
- Öffnet Dialog mit Multi-Select aller Properties des Tenants
- Speichert Zuordnungen in `context_property_assignment`

### 3.2 Seed-Daten für Context-Property-Assignment
**Neue Migration:** Verknüpfung der Demo-Property mit "Familie Mustermann"

```sql
INSERT INTO context_property_assignment (
  id, tenant_id, context_id, property_id, assigned_at
) VALUES (
  '00000000-0000-4000-a000-000000000120',
  'a0000000-0000-4000-a000-000000000001',
  '00000000-0000-4000-a000-000000000110',  -- Familie Mustermann
  '00000000-0000-4000-a000-000000000001',  -- Leipzig Property
  NOW()
) ON CONFLICT DO NOTHING;
```

### 3.3 Kontext-Details erweitern
**Datei:** `src/pages/portal/immobilien/KontexteTab.tsx`

**Zusätzliche Anzeige pro Kontext:**
- Anzahl zugeordneter Objekte
- Kumulierter Verkehrswert
- Steuerliche Kennzahlen (zvE, Grenzsteuersatz)

**Neue Dialog-Komponente:** `src/components/shared/PropertyContextAssigner.tsx`

**Betroffene Dateien:**
| Datei | Änderung |
|-------|----------|
| `src/pages/portal/immobilien/KontexteTab.tsx` | Property-Zuordnung Button + Anzeige |
| `src/components/shared/PropertyContextAssigner.tsx` | NEU: Zuordnungs-Dialog |
| `supabase/migrations/YYYYMMDDHHMMSS_seed_context_assignment.sql` | Seed-Daten |

---

## Phase 4: Bestandsimmobilien-Simulation

### 4.1 Neue Simulationskomponente
**Neue Datei:** `src/components/immobilienakte/InventoryInvestmentSimulation.tsx`

**Slider (nur 2, da Bestandsimmobilie mit existierendem Darlehen):**
- Wertzuwachs p.a.: 0% – 3%
- Mietsteigerung p.a.: 0% – 3%

**NICHT einstellbar (fest aus Datenbank):**
- Eigenkapital (Darlehen existiert)
- Zinsbindung (aus `loans.fixed_interest_end_date`)
- Tilgungsrate (aus `loans.repayment_rate_percent`)

**Visualisierungen:**
1. **40-Jahres-Chart** (Recharts AreaChart)
   - Verkehrswert (steigend)
   - Restschuld (sinkend)
   - Netto-Vermögen (Differenz)
   - Tooltip bei Mouse-over mit exakten Werten

2. **10-Jahres-Tabelle**
   | Jahr | Verkehrswert | Restschuld | Netto-Vermögen |
   |------|--------------|------------|----------------|
   | 2026 | 180.000€ | 152.000€ | 28.000€ |
   | 2036 | 219.000€ | 89.000€ | 130.000€ |
   | 2046 | 267.000€ | 15.000€ | 252.000€ |
   | 2056 | 325.000€ | 0€ | 325.000€ |

3. **Steuer-Info-Box**
   - Vermieter-Kontext anzeigen (Name, Typ)
   - Grenzsteuersatz (aus `landlord_contexts`)
   - Berechneter Steuervorteil Jahr 1

### 4.2 Integration in Immobilienakte
**Datei:** `src/pages/portal/immobilien/PropertyDetailPage.tsx`

**Neuer Tab "Simulation"** oder Integration in bestehenden "Akte"-Tab:
- Lädt Daten aus:
  - `properties` (Kaufpreis, Verkehrswert)
  - `loans` (Restschuld, Zinssatz, Annuität)
  - `property_accounting` (AfA-Werte)
  - `landlord_contexts` via `context_property_assignment` (Steuersatz)

### 4.3 Datenfluss-Mapping
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DATENQUELLEN (alle dynamisch aus DB)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  properties.purchase_price          → Kaufpreis                             │
│  properties.market_value            → Aktueller Verkehrswert                │
│  loans.outstanding_balance_eur      → Restschuld                            │
│  loans.interest_rate_percent        → Zinssatz                              │
│  loans.annuity_monthly_eur          → Monatliche Rate                       │
│  property_accounting.building_share_percent → Gebäudeanteil (AfA-Basis)     │
│  property_accounting.afa_rate_percent       → AfA-Satz (2-4%)               │
│  property_accounting.afa_method             → linear/denkmal/sonder         │
│  landlord_contexts.marginal_tax_rate        → Grenzsteuersatz               │
│  landlord_contexts.taxable_income_yearly    → zvE                           │
│  leases.rent_cold_eur               → Kaltmiete (Summe aller aktiven)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Betroffene Dateien:**
| Datei | Änderung |
|-------|----------|
| `src/components/immobilienakte/InventoryInvestmentSimulation.tsx` | NEU |
| `src/pages/portal/immobilien/PropertyDetailPage.tsx` | Simulation-Tab hinzufügen |
| `src/hooks/useUnitDossier.ts` | property_accounting + landlord_context laden |

---

## Phase 5: Seed-Daten Ergänzung

### 5.1 property_accounting Seed
**Migration:** `YYYYMMDDHHMMSS_seed_property_accounting.sql`

```sql
INSERT INTO property_accounting (
  id, tenant_id, property_id,
  land_share_percent, building_share_percent, book_value_eur,
  afa_rate_percent, afa_method, afa_start_date, remaining_useful_life_years
) VALUES (
  '00000000-0000-4000-a000-000000000130',
  'a0000000-0000-4000-a000-000000000001',
  '00000000-0000-4000-a000-000000000001',
  20.0,   -- 20% Grundstück
  80.0,   -- 80% Gebäude
  144000, -- 180k × 80%
  2.0,    -- 2% linear
  'linear',
  '2020-01-15',
  48      -- 50 - 2 Jahre seit Kauf
) ON CONFLICT DO NOTHING;
```

### 5.2 Erweiterung useGoldenPathSeeds
**Datei:** `src/hooks/useGoldenPathSeeds.ts`

Die `seed_golden_path_data()` Funktion muss erweitert werden um:
- `property_accounting` Eintrag für Demo-Property
- `context_property_assignment` für Verknüpfung

**Betroffene Dateien:**
| Datei | Änderung |
|-------|----------|
| `supabase/migrations/YYYYMMDDHHMMSS_seed_property_accounting.sql` | NEU |
| `src/hooks/useGoldenPathSeeds.ts` | property_accounting in Seed-Logik |

---

## Phase 6: Zone 1 Master-Vorlagen Synchronisation

### 6.1 Immobilienakte-Vorlage aktualisieren
**Datei:** `src/pages/admin/MasterTemplates.tsx`

**Änderungen:**
- Block I (Accounting) als aktiv markieren (nicht mehr "UI pending")
- Neue Felder dokumentieren:
  - `land_share_percent`, `building_share_percent`
  - `afa_rate_percent`, `afa_method`, `afa_start_date`
  - `remaining_useful_life_years`

### 6.2 AfA-Modell-Referenz ergänzen
**Datei:** `src/pages/admin/MasterTemplates.tsx` → Tab "Berechnungsparameter"

**Neue Tabelle mit AfA-Modellen:**
| Modell | Satz | Anwendung |
|--------|------|-----------|
| Linear (§7.4 EStG) | 2-4% | Standard Bestandsimmobilien |
| Denkmal (§7i/7h) | 9%/7% + 2% | Drei-Komponenten-Modell |
| Sonder-AfA (§7b) | 5% (4 Jahre) | Neubau EH40/QNG |
| Degressiv (§7.5a) | 5% vom Restwert | Neubau 2023-2029 |

### 6.3 Link zur Detail-Dokumentation
**Neue Datei oder existierend erweitern:** `src/pages/admin/MasterTemplateImmobilienakte.tsx`

Diese Seite zeigt die vollständige Feld-Katalog-Referenz für MOD-04 mit allen 106 Feldern in 10 Blöcken (A–J).

**Betroffene Dateien:**
| Datei | Änderung |
|-------|----------|
| `src/pages/admin/MasterTemplates.tsx` | Block I aktivieren, AfA-Tabelle |
| Ggf. Detail-Page für Immobilienakte-Felder | Feld-Katalog-Referenz |

---

## Phase 7: Tile-Katalog Aktualisierung

### 7.1 tile_catalog.yaml prüfen
**Datei:** `manifests/tile_catalog.yaml`

MOD-04 Tiles sind bereits korrekt definiert:
- Kontexte ✓
- Portfolio ✓
- Sanierung ✓
- Bewertung ✓

**Keine Änderungen erforderlich**, da die 4-Tile-Struktur bereits korrekt ist.

### 7.2 routes_manifest.yaml prüfen
**Datei:** `manifests/routes_manifest.yaml`

MOD-04 Routes sind bereits vollständig:
- `/kontexte` ✓
- `/portfolio` ✓
- `/sanierung` ✓
- `/bewertung` ✓
- Dynamic Routes (`/:id`, `/:id/edit`, `/neu`, `/vorlage`) ✓

**Keine Änderungen erforderlich**.

### 7.3 zone2_modules.json aktualisieren (Audit-Artefakt)
**Datei:** `artifacts/audit/zone2_modules.json`

Das Label für MOD-04 Tiles sollte synchron mit dem aktuellen Stand sein:
```json
{
  "code": "MOD-04",
  "name": "Immobilien",
  "base": "immobilien",
  "tiles": ["kontexte", "portfolio", "sanierung", "bewertung"],
  "tile_count": 4
}
```

**Betroffene Dateien:**
| Datei | Änderung |
|-------|----------|
| `manifests/tile_catalog.yaml` | Keine Änderung (bereits korrekt) |
| `manifests/routes_manifest.yaml` | Keine Änderung (bereits korrekt) |
| `artifacts/audit/zone2_modules.json` | Optional: Labels prüfen |

---

## Phase 8: Immobilienakte Erweiterungen

### 8.1 Block I (Accounting) aktivieren
**Datei:** `src/components/immobilienakte/EditableUnitDossierView.tsx`

**Neuer Block hinzufügen:**
- EditableAccountingBlock mit Feldern:
  - Grundstücksanteil (%)
  - Gebäudeanteil (%)
  - AfA-Satz (%)
  - AfA-Methode (Select: linear, denkmal_7i, denkmal_7h, sonder_7b, degressiv)
  - AfA-Beginn (Date)
  - Restnutzungsdauer (Jahre)
  - Buchwert (€)

### 8.2 useUnitDossier erweitern
**Datei:** `src/hooks/useUnitDossier.ts`

**Neue Query:**
```typescript
// Load property_accounting
const { data: accountingData } = await supabase
  .from('property_accounting')
  .select('*')
  .eq('property_id', property.id)
  .eq('tenant_id', activeTenantId)
  .maybeSingle();
```

**Neue Felder im Return-Objekt:**
- `landSharePercent`, `buildingSharePercent`
- `afaRatePercent`, `afaMethod`, `afaStartDate`
- `remainingUsefulLifeYears`, `bookValueEur`

### 8.3 landlord_context in Dossier laden
**Datei:** `src/hooks/useUnitDossier.ts`

**Neue Query:**
```typescript
// Load landlord context for this property
const { data: contextAssignment } = await supabase
  .from('context_property_assignment')
  .select('context_id, landlord_contexts(*)')
  .eq('property_id', property.id)
  .eq('tenant_id', activeTenantId)
  .maybeSingle();
```

**Neue Felder:**
- `landlordContextId`, `landlordContextName`
- `marginalTaxRate`, `taxableIncomeYearly`

**Betroffene Dateien:**
| Datei | Änderung |
|-------|----------|
| `src/components/immobilienakte/EditableUnitDossierView.tsx` | Block I (Accounting) |
| `src/components/immobilienakte/editable/EditableAccountingBlock.tsx` | NEU |
| `src/hooks/useUnitDossier.ts` | property_accounting + context laden |
| `src/types/immobilienakte.ts` | Neue Felder im Type |

---

## Zusammenfassung: Dateien nach Phase

### Phase 1 (P0 Sofort-Fix)
| Datei | Änderung |
|-------|----------|
| `src/pages/portal/immobilien/PortfolioTab.tsx` | Query-Fix |
| `src/pages/portal/immobilien/PropertyDetailPage.tsx` | Query-Fix |

### Phase 2 (Portfolio-Dashboard)
| Datei | Änderung |
|-------|----------|
| `src/pages/portal/immobilien/PortfolioTab.tsx` | Summenzeile |
| `src/components/portfolio/PortfolioSummaryModal.tsx` | NEU |

### Phase 3 (Kontexte)
| Datei | Änderung |
|-------|----------|
| `src/pages/portal/immobilien/KontexteTab.tsx` | Property-Zuordnung |
| `src/components/shared/PropertyContextAssigner.tsx` | NEU |
| `supabase/migrations/...seed_context_assignment.sql` | NEU |

### Phase 4 (Bestandssimulation)
| Datei | Änderung |
|-------|----------|
| `src/components/immobilienakte/InventoryInvestmentSimulation.tsx` | NEU |
| `src/pages/portal/immobilien/PropertyDetailPage.tsx` | Tab-Integration |

### Phase 5 (Seed-Daten)
| Datei | Änderung |
|-------|----------|
| `supabase/migrations/...seed_property_accounting.sql` | NEU |
| `src/hooks/useGoldenPathSeeds.ts` | Erweiterung |

### Phase 6 (Zone 1 Master-Vorlagen)
| Datei | Änderung |
|-------|----------|
| `src/pages/admin/MasterTemplates.tsx` | Block I + AfA-Tabelle |

### Phase 7 (Tile-Katalog)
| Datei | Änderung |
|-------|----------|
| Keine Änderungen erforderlich | ✓ |

### Phase 8 (Immobilienakte)
| Datei | Änderung |
|-------|----------|
| `src/components/immobilienakte/editable/EditableAccountingBlock.tsx` | NEU |
| `src/components/immobilienakte/EditableUnitDossierView.tsx` | Block I |
| `src/hooks/useUnitDossier.ts` | Accounting + Context |
| `src/types/immobilienakte.ts` | Neue Felder |

---

## Technische Details

### Steuer-Berechnung (Steuervorteil)
```
Steuervorteil p.a. = Grenzsteuersatz × (Zinskosten + AfA − Mieteinnahmen)

Beispiel Demo-Daten:
- Grenzsteuersatz: 42% (aus landlord_contexts.marginal_tax_rate)
- Zinskosten: 5.472€ (152.000€ × 3,6%)
- AfA: 2.880€ (144.000€ × 2,0%)
- Mieteinnahmen: 8.160€

→ Werbungskostenüberschuss = 5.472 + 2.880 - 8.160 = 192€
→ Steuervorteil = 42% × 192 = 80,64€
```

### AfA-Modelle (dokumentiert, Umsetzung später)
| Modell | Satz | Beschreibung |
|--------|------|--------------|
| Linear | 2-4% | Standard (3% ab 2023, 2% Altbau) |
| Denkmal §7i/7h | 9%/7% + 2% | Sanierung: 8J×9% + 4J×7% auf Sanierungsanteil; Altbau: 2% |
| Sonder-AfA §7b | 5% (4 Jahre) | Zusätzlich zu Linear/Degressiv für Neubau EH40/QNG |
| Degressiv §7.5a | 5% vom Restwert | Neubau 2023-2029 |

---

## Validierung nach Umsetzung

### Phase 1 Validierung
- [ ] Portfolio zeigt Finanzierungsspalten (Restschuld, Annuität, Zins, Tilgung)
- [ ] Immobilienakte zeigt Financing-Block mit Daten

### Phase 2 Validierung
- [ ] Summenzeile am Tabellenende sichtbar
- [ ] Klick auf Summenzeile öffnet Modal
- [ ] Modal zeigt kumulierte Grafik + EÜR

### Phase 3 Validierung
- [ ] Kontexte-Tab zeigt "Objekte zuordnen" Button
- [ ] Property-Zuordnung speichert in DB
- [ ] Portfolio filtert nach gewähltem Kontext

### Phase 4 Validierung
- [ ] Immobilienakte hat Simulation-Tab
- [ ] Slider für Wertzuwachs/Mietsteigerung funktionieren
- [ ] 40-Jahre-Chart reagiert auf Slider
- [ ] Steuervorteil wird aus Kontext berechnet

### Phase 5 Validierung
- [ ] Golden Path Seed erstellt property_accounting
- [ ] Golden Path Seed erstellt context_property_assignment

### Phase 6 Validierung
- [ ] Zone 1 Master-Vorlagen zeigt Block I (Accounting)
- [ ] AfA-Modell-Tabelle ist sichtbar

### Phase 8 Validierung
- [ ] Immobilienakte zeigt Block I (Accounting) mit editierbaren Feldern
- [ ] Speichern funktioniert für Accounting-Felder

---

## Reihenfolge der Implementierung

1. **Phase 1** (P0): Query-Fix → Finanzierungsdaten sichtbar
2. **Phase 5**: Seed-Daten erweitern (property_accounting + context_assignment)
3. **Phase 3**: Kontexte-Tab mit Property-Zuordnung
4. **Phase 2**: Portfolio Summenzeile + Modal
5. **Phase 8**: Immobilienakte Block I (Accounting)
6. **Phase 4**: Investment-Simulation für Bestandsimmobilien
7. **Phase 6**: Zone 1 Master-Vorlagen Update
8. **Phase 7**: Tile-Katalog prüfen (keine Änderungen erwartet)
