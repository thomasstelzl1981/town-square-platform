

# MOD-11: Design-Korrektur, Demo-Daten (Prolongation), 4. Tile "Faelle"

## 1. Klarstellung Prolongation

Bei einer Prolongation (Anschlussfinanzierung) gibt es **kein Eigenkapital und keinen Kaufpreis**. Stattdessen sind die relevanten Parameter:

| Parameter | Bedeutung |
|---|---|
| **Objektwert** | Aktueller Verkehrswert der Immobilie (fuer Beleihungswertermittlung) |
| **Restschuld** | Verbleibende Darlehensschuld zum Prolongationszeitpunkt |
| **Beleihungsauslauf** | Restschuld / Objektwert (bestimmt den Zinssatz) |
| **Sollzins** | Aus Zone 1 interest_rates Tabelle, abhaengig von Beleihungsauslauf und Zinsbindung |
| **Tilgung** | Gewuenschte Tilgungsrate |
| **Zinsbindung** | Neue Festschreibungsdauer |

Der Kalkulator im FMFallDetail muss zwischen "Neufinanzierung" (Kaufpreis/EK) und "Prolongation" (Objektwert/Restschuld) unterscheiden.

## 2. Kein Popup — Direktnavigation

- **Mandat aus Zone 1 annehmen**: Der Fall erscheint automatisch im zweiten Reiter "Finanzierungsakte". Kein Popup, kein Modal. Klick auf "Annehmen" im Dashboard navigiert direkt zur Finanzierungsakte.
- **Neuer Fall manuell anlegen**: Im zweiten Reiter "Finanzierungsakte" ist die Grundstruktur (leeres Formular) immer vorhanden. Der Nutzer befuellt die Felder und klickt unten auf "Speichern" — erst dann wird eine neue ID generiert und der Fall in der Datenbank angelegt.
- Die Finanzierungsakte ist also **immer verfuegbar** als leere Vorlage + Liste vorhandener Faelle.

## 3. Vierter Tile: "Faelle" (Archiv)

Neue Tile-Reihenfolge:

```text
Dashboard | Finanzierungsakte | Einreichung | Fälle
```

"Faelle" zeigt alle abgeschlossenen Finanzierungen (Status: `completed`, `submitted_to_bank`, `rejected`) als Widget-Cards. Klick oeffnet die Akte read-only.

## 4. Demo-Daten (Migration)

Der bestehende Demo-Kunde Max Mustermann (SOT-F-DEMO001) wird als Prolongationsfall aufbereitet:

**Schritt 1 — finance_request aktualisieren:**
- `status`: `editing` (bereits zugewiesen und in Bearbeitung)
- `purpose`: `prolongation`

**Schritt 2 — finance_mandate anlegen:**
- Feste Demo-ID, verknuepft mit finance_request, tenant_id des Demo-Tenants
- Status: `accepted`

**Schritt 3 — future_room_case anlegen:**
- Verknuepft mit finance_mandate, manager_tenant_id des Demo-Tenants
- Status: `active`

**Schritt 4 — applicant_profile ergaenzen:**
- `purpose`: `prolongation`
- Vorhandene Daten bleiben (Max Mustermann, Netto 4.800 EUR, etc.)
- `purchase_price` und `equity_amount` werden auf NULL gesetzt (bei Prolongation irrelevant)
- `loan_amount_requested` bleibt als Restschuld (176.000 EUR)

## 5. Design-Fixes in FMFallDetail

| Problem | Fix |
|---|---|
| Header `text-lg` statt `text-2xl` | Auf `text-2xl font-bold tracking-tight uppercase` anheben |
| Section-Titel `text-sm` | Auf `text-base font-semibold` anheben |
| Kalkulator zeigt KP/EK bei Prolongation | Bedingte Anzeige: bei `purpose === 'prolongation'` stattdessen Objektwert, Restschuld, Beleihungsauslauf |
| Kurzbeschreibung zeigt EK/Kaufpreis | Bedingte Anzeige anpassen |
| Einreichung-Detail zeigt EK/Kaufpreis | Bedingte Anzeige anpassen |

## 6. Dateiaenderungen

| Datei | Aenderung |
|---|---|
| `src/manifests/routesManifest.ts` | 4. Tile `archiv` (Titel: "Fälle") hinzufuegen |
| `src/pages/portal/FinanzierungsmanagerPage.tsx` | Route fuer `archiv` + Lazy Import FMArchiv |
| `src/pages/portal/finanzierungsmanager/FMFallDetail.tsx` | Design-Fixes (Header/Section-Groessen). Kalkulator: Prolongation-Modus (Objektwert/Restschuld statt KP/EK). Finanzierungsakte-Struktur als "leeres Formular" wenn kein requestId |
| `src/pages/portal/finanzierungsmanager/FMDashboard.tsx` | "Annehmen" navigiert direkt zu Finanzierungsakte (kein Popup) |
| `src/pages/portal/finanzierungsmanager/FMArchiv.tsx` | **Neu** — Widget-Cards fuer abgeschlossene Faelle |
| `src/pages/portal/finanzierungsmanager/FMEinreichungDetail.tsx` | Prolongation-bedingte Anzeige (kein KP/EK) |
| DB-Migration | finance_request Status + Purpose updaten, finance_mandate + future_room_case fuer Demo anlegen |

## 7. Keine Architektur-Aenderungen

- Keine neuen Hooks
- Keine neuen Edge Functions
- Keine Aenderungen an MOD-07, Zone 1 oder Zone 3
- DB-Migration nur fuer Demo-Daten-Seeding

