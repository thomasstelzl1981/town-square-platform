
# Akquise-Manager: Doppelte Navigation Fix + Testdaten

## 1. Problem: Doppelte Menüstruktur

Die Navigation erscheint zweimal:
- **Sidebar (PortalNav):** Dashboard, Mandate, Objekteingang, Tools
- **WorkflowSubbar (AkquiseManagerPage Zeile 48-53 + 470):** Identisch horizontal

**Lösung:** `WorkflowSubbar` komplett entfernen.

---

## 2. Technische Änderungen

### Schritt 1: WorkflowSubbar aus AkquiseManagerPage entfernen

**Datei:** `src/pages/portal/AkquiseManagerPage.tsx`

```text
- Zeile 11: Import "WorkflowSubbar" entfernen
- Zeilen 48-53: AKQUISE_MANAGER_WORKFLOW_STEPS Definition entfernen
- Zeile ~470: <WorkflowSubbar .../> Aufruf entfernen
- Layout vereinfachen: Direktes Rendering der <Routes> ohne Wrapper
```

### Schritt 2: Testmandat in Datenbank einfügen

**Tabelle:** `acq_mandates`

| Feld | Wert |
|------|------|
| code | ACQ-2026-00001 |
| client_display_name | Familie Investorius |
| search_area | Schleswig-Holstein (Rendsburg, Kiel, Neumünster) |
| asset_focus | MFH, Wohnanlage |
| price_min | 2.000.000 € |
| price_max | 5.000.000 € |
| yield_target | 6,0% |
| status | active |

### Schritt 3: Rendsburg-Exposé als Offer (E-Mail-Eingang)

**Tabelle:** `acq_offers`

| Feld | Wert |
|------|------|
| mandate_id | → Testmandat |
| source_type | email |
| title | Faktor 14,7: Aufgeteilte Rotklinkeranlage mit 40 Einheiten |
| address | Breslauer Straße 73-81 |
| postal_code | 24768 |
| city | Rendsburg |
| price_asking | 3.200.000 € |
| units_count | 40 |
| area_sqm | 2.550 |
| yield_indicated | 6,8% |
| status | new |
| extracted_data | { source: "Dr. Hofeditz Real Estate GmbH", contact_email: "marcel@dr-hofeditz.de", commission: "6.25% inkl. MwSt." } |
| notes | Eingang per E-Mail von Dr. Hofeditz Real Estate GmbH |

---

## 3. Erwartetes Ergebnis

Nach Umsetzung:

| Was | Vorher | Nachher |
|-----|--------|---------|
| Navigation | Doppelt (Sidebar + Subbar) | Einfach (nur Sidebar) |
| /portal/akquise-manager/mandate | Leer | 1 aktives Testmandat |
| /portal/akquise-manager/objekteingang | Leer | 1 Offer (Rendsburg) |
| Kalkulation-Tab | Keine Daten | 3,2M € Kaufpreis, 40 Einheiten, 2.550 m² |

### Klickpfad zum Testen:

```
1. /portal/akquise-manager
   → Dashboard zeigt 1 aktives Mandat

2. Klick "Mandate" (Sidebar)
   → Liste mit ACQ-2026-00001 "Familie Investorius"

3. Klick auf Mandat → Detail-Workbench
   → 5 Tabs (Sourcing, Outreach, Inbound, Analysis, Delivery)

4. Alternative: Klick "Objekteingang" (Sidebar)
   → Liste mit Rendsburg-Exposé (Badge: "E-Mail")

5. Klick auf Offer → ObjekteingangDetail
   → 6 Tabs inkl. "Kalkulation"

6. Tab "Kalkulation" → Toggle "Bestand (Hold)"
   → 30-Jahres-Chart mit echten Daten
   → EK-Slider, Zins, Tilgung etc.

7. Toggle auf "Aufteiler (Flip)"
   → Gewinnanalyse, Sensitivität
```

---

## 4. Technische Details

### Bestandskalkulation-Datenfluss

```text
ObjekteingangDetail.tsx
    └── Zeilen 336-345: <BestandCalculation 
            initialData={{
              purchasePrice: offer.price_asking || 0,    → 3.200.000
              monthlyRent: offer.noi_indicated / 12,     → Jahresmiete/12
              units: offer.units_count || 1,             → 40
              areaSqm: offer.area_sqm || 0,              → 2.550
            }}
        />

BestandCalculation.tsx
    └── React.useMemo() berechnet:
        - Gesamtinvestition (Kaufpreis + 10% NK)
        - 30-Jahres-Projektion (Debt, Value, Equity)
        - ROI auf Eigenkapital
```

### Aufteilerkalkulation-Datenfluss

```text
ObjekteingangDetail.tsx
    └── Zeilen 347-355: <AufteilerCalculation
            initialData={{
              purchasePrice: offer.price_asking || 0,    → 3.200.000
              yearlyRent: offer.noi_indicated || 0,      → Jahresmiete
              units: offer.units_count || 1,             → 40
              areaSqm: offer.area_sqm || 0,              → 2.550
            }}
        />

AufteilerCalculation.tsx
    └── React.useMemo() berechnet:
        - Netto-Kosten (Ankauf + Zinsen - Mieteinnahmen)
        - Verkaufserlös (Jahresmiete / Zielrendite)
        - Gewinn = Erlös - Kosten
        - Sensitivitätsanalyse (±0,5% Rendite)
```

---

## 5. Datenbank-Migration (SQL)

```sql
-- Testmandat für Akquise-Manager Demo
INSERT INTO acq_mandates (
  id, code, tenant_id, created_by_user_id,
  client_display_name, search_area, asset_focus,
  price_min, price_max, yield_target,
  status, notes
) VALUES (
  gen_random_uuid(),
  'ACQ-2026-00001',
  (SELECT id FROM organizations LIMIT 1),
  auth.uid(),
  'Familie Investorius (Demo)',
  '{"region": "Schleswig-Holstein", "cities": ["Rendsburg", "Kiel", "Neumünster"]}',
  ARRAY['MFH', 'Wohnanlage'],
  2000000, 5000000, 6.0,
  'active',
  'Testmandat für Demonstration der Akquise-Funktionen'
);

-- Rendsburg-Exposé als E-Mail-Eingang
INSERT INTO acq_offers (
  id, mandate_id, source_type,
  title, address, postal_code, city,
  price_asking, yield_indicated, units_count, area_sqm,
  status, notes, extracted_data
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM acq_mandates WHERE code = 'ACQ-2026-00001'),
  'email',
  'Faktor 14,7: Aufgeteilte Rotklinkeranlage mit 40 Einheiten',
  'Breslauer Straße 73-81',
  '24768',
  'Rendsburg',
  3200000,
  6.8,
  40,
  2550,
  'new',
  'Eingang per E-Mail von Dr. Hofeditz Real Estate GmbH. Provision: 6,25% inkl. MwSt. Heizung 2023.',
  '{
    "source": "Dr. Hofeditz Real Estate GmbH",
    "contact_email": "marcel@dr-hofeditz.de",
    "contact_phone": "+49 151 50467537",
    "object_type": "Wohnanlage",
    "factor": 14.7,
    "commission": "6.25% inkl. MwSt.",
    "heating_year": 2023
  }'::jsonb
);
```

---

## 6. Fehlende Daten-Anmerkung

Das PDF enthält keine explizite **Jahresmiete (NOI)**. Für die Kalkulation wird berechnet:

```
Faktor 14,7 → Rendite = 100 / 14,7 = 6,8%
Rendite = Jahresmiete / Kaufpreis
Jahresmiete = 3.200.000 × 6,8% = 217.687 €
Monatsmiete = 18.141 € (gesamt) → 454 €/Einheit
```

Diese Werte werden als `noi_indicated` (Jahres-IST-Miete) im Offer gespeichert.
