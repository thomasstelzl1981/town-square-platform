

# V + V Anlage V: Vollstaendiger Implementierungsplan

## Ueberblick

Der V+V Tab wird zu einem 3-stufigen Flow umgebaut:

```text
STUFE 1: Vermietereinheit waehlen (WidgetGrid mit landlord_contexts)
           |
           v
STUFE 2: Objekt-Widgets der VE erscheinen darunter + Jahresauswahl
         Jedes Objekt einzeln oeffnen, Anlage-V-Daten pruefen/eingeben/speichern
         Toggle "Bestaetigt" pro Objekt
           |
           v  (wenn ALLE Objekte bestaetigt)
STUFE 3: Klick auf Vermietereinheit -> Entwurf der V+V-Erklaerung
         Akten-Ansicht (read-only Zusammenfassung aller Objekte)
         Export-Buttons: PDF + CSV
```

## Datenfeld-Abgleich: Was existiert, was fehlt

### Bereits vorhanden (KEINE Aenderung noetig)

| Anlage-V Feld | Quelle | Tabelle |
|---|---|---|
| Objektart | `property_type` | properties |
| Adresse komplett | `address, address_house_no, postal_code, city` | properties |
| Baujahr | `year_built` | properties |
| Kaufpreis | `purchase_price` | properties |
| Erwerbsnebenkosten | `acquisition_costs` | properties |
| Steuernummer Eigentuemer | `tax_number` | landlord_contexts |
| Darlehensdaten | `bank_name, loan_number, interest_rate, current_balance, annual_interest` | property_financing |
| Kaltmiete p.a. | `rent_cold_eur * 12` (berechenbar) | leases |
| NK-Vorauszahlungen | `nk_advance_eur * 12` (berechenbar) | leases |
| Grundsteuer | nk_cost_items (category=grundsteuer) | nk_cost_items |
| NK-Nachzahlungen | nk_tenant_settlements | nk_tenant_settlements |
| Nicht umlagef. Kosten | nk_cost_items (is_apportionable=false) | nk_cost_items |

### Neue Spalten auf `properties` (Steuer-Stammdaten, einmalig pro Objekt)

| Feld | Spalte | Typ | Default |
|---|---|---|---|
| Finanzamt-Aktenzeichen | `tax_reference_number` | text | null |
| Eigentumsanteil % | `ownership_share_percent` | numeric | 100 |
| Gebaeudeanteil % | `building_share_percent` | numeric | 70 |
| AfA-Satz % | `afa_rate_percent` | numeric | 2 |
| AfA-Beginn | `afa_start_date` | date | null |

### Neue Tabelle `vv_annual_data` (nur Felder, die NICHT aus bestehenden Tabellen kommen)

| Feld | Spalte | Erklaerung |
|---|---|---|
| Sonstige Einnahmen | `income_other` | Garagenmiete, Werbung etc. |
| Versicherungsentschaedigungen | `income_insurance_payout` | |
| Disagio | `cost_disagio` | Anteilig |
| Finanzierungskosten | `cost_financing_fees` | Kontogebuehren Darlehen |
| Instandhaltung/Reparaturen | `cost_maintenance` | |
| Verwalterkosten | `cost_management_fee` | WEG-Verwalter |
| Rechts-/Beratungskosten | `cost_legal_advisory` | |
| Versicherungen (nicht umlf.) | `cost_insurance_non_recoverable` | |
| Fahrtkosten | `cost_travel` | |
| Kontogebuehren Mietkonto | `cost_bank_fees` | |
| Sonstige Werbungskosten | `cost_other` | |
| Leerstand (Tage) | `vacancy_days` | |
| Vermietungsabsicht | `vacancy_intent_confirmed` | Boolean |
| Angehoerigenvermietung | `relative_rental` | Boolean |
| Denkmalschutz-AfA | `heritage_afa_amount` | |
| Sonder-AfA | `special_afa_amount` | |
| Bestaetigt-Toggle | `confirmed` | Boolean, Default false |
| Status | `status` | draft / confirmed / locked |
| Notizen | `notes` | Freitext |

Die Ergebniswerte (Einnahmen gesamt, Kosten gesamt, Ueberschuss) werden NICHT in der DB gespeichert, sondern im Frontend durch die Engine berechnet — aus den hier gespeicherten manuellen Werten PLUS den automatisch aggregierten Werten aus properties, leases, property_financing und nk_cost_items.

## UI-Flow im Detail

### Stufe 1: Vermietereinheit-Auswahl

- ModulePageHeader: "V + V" / "Vermietung + Verwaltung — Steuererklaerung Anlage V"
- WidgetGrid zeigt `landlord_contexts` (ueber `properties.landlord_context_id`)
- Jedes Widget zeigt: Name, Typ (Privat/GmbH), Anzahl Objekte, Gesamtstatus (alle bestaetigt? / offen)

### Stufe 2: Objekt-Bearbeitung (nach Klick auf VE)

- Darunter erscheint: **Jahresauswahl** (Dropdown, Default: Vorjahr)
- Darunter: **WidgetGrid mit den Objekten** dieser VE
- Jedes Objekt-Widget zeigt: Adresse, Objektart, Status (bestaetigt/offen)
- Bei Klick auf ein Objekt: Darunter oeffnet sich die **TabularForm** (Selbstauskunft-Pattern) mit 6 Sektionen

#### Die 6 Sektionen (TabularFormWrapper + TabularFormRow)

**Sektion 1: Identifikation**
- Objektart (read-only)
- Adresse (read-only)
- Finanzamt-Aktenzeichen (editierbar, speichert in properties.tax_reference_number)
- Steuernummer Eigentuemer (read-only, aus landlord_contexts.tax_number)
- Eigentumsanteil % (editierbar)
- Baujahr (read-only)

**Sektion 2: Einnahmen**
- Kaltmiete p.a. (vorberechnet aus leases, editierbar/ueberschreibbar)
- NK-Umlagen vereinnahmt (vorberechnet, editierbar)
- NK-Nachzahlungen (aus nk_tenant_settlements, editierbar)
- Sonstige Einnahmen (manuell, aus vv_annual_data)
- Versicherungsentschaedigungen (manuell)
- **Summe Einnahmen** (berechnet, fett)

**Sektion 3: Werbungskosten**
Drei Untergruppen:

*A) Finanzierung*
- Schuldzinsen (vorberechnet aus property_financing.annual_interest, editierbar)
- Disagio (manuell)
- Finanzierungskosten (manuell)

*B) Laufende Bewirtschaftung*
- Grundsteuer (vorberechnet aus nk_cost_items, editierbar)
- Nicht umlagef. Hausgeld (vorberechnet aus nk_cost_items, editierbar)
- Instandhaltung/Reparaturen (manuell)
- Verwalterkosten (manuell)
- Rechts-/Beratungskosten (manuell)
- Versicherungen nicht umlagef. (manuell)
- Fahrtkosten (manuell)
- Kontogebuehren Mietkonto (manuell)
- Sonstige (manuell)

*C) Abschreibung (AfA)*
- AfA-Bemessungsgrundlage (berechnet: purchase_price x building_share_percent + anteilige acquisition_costs)
- AfA-Satz (editierbar, Default 2%)
- AfA-Betrag (berechnet)

**Summe Werbungskosten** (berechnet, fett)

**Sektion 4: AfA-Stammdaten**
- Kaufpreis gesamt (read-only aus properties)
- Gebaeudeanteil % + Betrag (editierbar)
- Grundstuecksanteil (berechnet: 100% - Gebaeudeanteil)
- Notar/GrESt anteilig Gebaeude (berechnet aus acquisition_costs x building_share_percent)
- AfA-Beginn (editierbar)

**Sektion 5: Sonderfaelle**
- Leerstand Tage (manuell)
- Vermietungsabsicht (Checkbox)
- Angehoerigenvermietung (Checkbox)
- Denkmalschutz-AfA (manuell)
- Sonder-AfA (manuell)

**Sektion 6: Ergebnis**
- Einnahmen gesamt (berechnet)
- Werbungskosten gesamt (berechnet)
- **Ueberschuss/Verlust** (berechnet, hervorgehoben)
- **Bestaetigt-Toggle** — setzt `vv_annual_data.confirmed = true`

### Stufe 3: V+V-Erklaerung (Akten-Ansicht)

Wird sichtbar, wenn ALLE Objekte einer VE bestaetigt sind und man auf die VE klickt:

- Read-only Zusammenfassung im Akten-Stil (TabularForm, nicht editierbar)
- Pro Objekt: Einnahmen, Werbungskosten, Ergebnis
- Am Ende: **Gesamtergebnis der Vermietereinheit**
- Export-Leiste: **PDF-Button** (Anlage-V-Format) + **CSV-Button** (fuer ELSTER/Steuerprogramm)

## Technische Umsetzung

### Datenbank (SQL Migration)

1. `ALTER TABLE properties` — 5 neue Spalten (tax_reference_number, ownership_share_percent, building_share_percent, afa_rate_percent, afa_start_date)
2. `CREATE TABLE vv_annual_data` — Jaehrliche manuelle Eingabewerte + confirmed-Toggle + RLS
3. Demo-Daten: UPDATE der bestehenden Demo-Properties mit Beispiel-Steuerwerten

### Neue Dateien

| Datei | Beschreibung |
|---|---|
| `src/engines/vvSteuer/spec.ts` | TypeScript-Interfaces fuer alle V+V Datenstrukturen |
| `src/engines/vvSteuer/engine.ts` | Pure Berechnungslogik: aggregiert DB-Werte + manuelle Werte -> Ergebnis |
| `src/hooks/useVVSteuerData.ts` | Daten-Hook: laedt landlord_contexts, properties (mit landlord_context_id), leases, property_financing, nk_cost_items, vv_annual_data. Bietet save/confirm Mutations |
| `src/components/vv/VVContextWidgets.tsx` | Vermietereinheit-Widgets (Stufe 1) |
| `src/components/vv/VVPropertyWidgets.tsx` | Objekt-Widgets innerhalb einer VE (Stufe 2) |
| `src/components/vv/VVAnlageVForm.tsx` | 6-Sektionen TabularForm pro Objekt (editierbar) |
| `src/components/vv/VVErklaerungView.tsx` | Read-only Akten-Ansicht + Export (Stufe 3) |
| `src/components/vv/VVCsvExport.ts` | CSV-Export-Logik (ELSTER-kompatibel) |

### Geaenderte Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/portal/immobilien/VerwaltungTab.tsx` | Komplett umbauen: 3-Stufen-Flow orchestrieren |
| `src/hooks/useVerwaltungData.ts` | Erweitern: landlord_contexts + context-basierte Property-Gruppierung |

### Demodaten-Erweiterung

Die bestehenden Demo-Properties (BER-01, MUC-01, HH-01) erhalten via SQL-Migration:
- `tax_reference_number`: Beispiel-Aktenzeichen
- `building_share_percent`: 70 (Standard)
- `afa_rate_percent`: 2 (Standard)
- `afa_start_date`: basierend auf vorhandenen Kaufdaten

Ein Demo-Eintrag in `vv_annual_data` fuer das Vorjahr wird ebenfalls angelegt mit Beispielwerten.

