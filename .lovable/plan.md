
# Golden Path MOD-13: Vollstaendiger Implementierungsplan

## Zusammenfassung

Zwei kritische Fixes und fuenf funktionale Erweiterungen, um den Golden Path von der Projektanlage bis zur Kaufy-Veroeffentlichung durchgaengig zu verbinden.

---

## Fix 1: Landing Page Builder — leere Adressdaten

**Problem:** In `LandingPageBuilder.tsx` (Zeile 63-65) werden `address`, `city`, `postal_code` als leere Strings an die Edge Function `sot-generate-landing-page` uebergeben. Die KI-Lagebeschreibung kann daher keinen sinnvollen Text generieren.

**Loesung:**

- `LandingPageBuilderProps` um drei optionale Felder erweitern: `projectAddress?`, `projectCity?`, `projectPostalCode?`
- In `startGeneration()` diese Werte statt der leeren Strings einsetzen
- In `LandingPageTab.tsx` die Werte aus `rawProject` (= `dev_projects`-Datensatz) durchreichen:
  - `projectAddress={rawProject?.address}`
  - `projectCity={rawProject?.city}`
  - `projectPostalCode={rawProject?.postal_code}`

| Datei | Aenderung |
|-------|-----------|
| `LandingPageBuilder.tsx` | 3 neue Props, Body-Werte ersetzen |
| `LandingPageTab.tsx` | Props an Builder durchreichen (2 Stellen: Zeile 40-45 und 60-64) |

---

## Fix 2: ProjektLandingPage — Hardcoded DEMO_PROJECT

**Problem:** `ProjektLandingPage.tsx` (Zeile 54) uebergibt immer `project={DEMO_PROJECT}` und `LandingPageInvestmentTab.tsx` (Zeile 24) nutzt immer `const units = DEMO_UNITS`. Dadurch zeigt jede oeffentliche Projekt-Website identische Demo-Daten.

**Loesung:**

- In `ProjektLandingPage.tsx`:
  - Aus `landingPage.project_id` einen Supabase-Query auf `dev_projects` machen
  - Zusaetzlich `dev_project_units` fuer dieses Projekt laden
  - Ein `ProjectPortfolioRow`-kompatibles Objekt aus den echten Daten zusammenbauen
  - Units als neue Prop an `LandingPageWebsite` weitergeben

- In `LandingPageWebsite.tsx`:
  - Neue optionale Prop `units?: DemoUnit[]` hinzufuegen
  - An `LandingPageInvestmentTab` durchreichen

- In `LandingPageInvestmentTab.tsx`:
  - Neue optionale Prop `units?: DemoUnit[]` hinzufuegen
  - Zeile 24 aendern zu: `const displayUnits = units || DEMO_UNITS`
  - Restliche Referenzen auf `units` durch `displayUnits` ersetzen

| Datei | Aenderung |
|-------|-----------|
| `ProjektLandingPage.tsx` | DB-Queries statt DEMO_PROJECT, Units laden |
| `LandingPageWebsite.tsx` | Neue `units`-Prop, durchreichen an InvestmentTab |
| `LandingPageInvestmentTab.tsx` | `units`-Prop akzeptieren, Fallback auf DEMO_UNITS |

---

## Aenderung 3: SalesApprovalSection — Direkte Aktivierung (kein Pending)

**Problem:** `activateVertriebsauftrag()` (Zeile 158-206) erstellt einen `sales_desk_request` mit implizitem Status `pending` und zeigt "Freigabe durch Sales Desk ausstehend". Der User muss dann in Zone 1 manuell approven.

**Loesung:**

- Beim Insert den Status explizit auf `approved` setzen (kein Zwischenschritt)
- Toast aendern: "Vertriebsauftrag aktiviert" statt "Freigabe ausstehend"
- `isPending`-Hinweis entfernen (Zeile 310-315: "Wird von Zone 1 geprueft")
- `isVertriebActive` nur noch auf `approved` pruefen (nicht mehr `pending`)
- **Listing-Erstellung** direkt nach dem Insert ausfuehren:
  1. Alle `dev_project_units` des Projekts laden
  2. Fuer jede Einheit mit `sales_status != 'verkauft'`:
     - Einen `listings`-Eintrag mit `status: 'active'` erstellen
     - Einen `listing_publications`-Eintrag fuer `partner_network` mit `status: 'active'` erstellen
  3. Muster aus `VerkaufsauftragTab.tsx` (Zeile 177-248) wiederverwenden: gleiche Insert-Logik, gleiche public_id-Generierung (`city-slug + listing-id.substring(0,8)`)

| Datei | Aenderung |
|-------|-----------|
| `SalesApprovalSection.tsx` | Status direkt `approved`, Listing-Erstellung inline, Pending-UI entfernen |

---

## Aenderung 4: Kaufy-Toggle funktional machen

**Problem:** `handleFeatureToggle('kaufy_projekt')` (Zeile 241) ist ein Placeholder-Kommentar ohne Logik.

**Loesung:**

- Wenn `vertriebsfreigabe` Status `approved` ist und Kaufy-Toggle aktiviert wird:
  - Alle `listings` des Projekts (ueber `sales_desk_requests.project_id`) laden
  - Fuer jedes Listing: `listing_publications` upsert mit `channel: 'kaufy'` + `status: 'active'`
  - `dev_projects.kaufy_listed = true` setzen (falls Spalte existiert; sonst Feature-Toggle reicht)
- Beim Deaktivieren: `kaufy`-Publications auf `paused` setzen

| Datei | Aenderung |
|-------|-----------|
| `SalesApprovalSection.tsx` | `handleFeatureToggle` erweitern fuer `kaufy_projekt` |

---

## Aenderung 5: Widerrufs-Logik erweitern (Cleanup)

**Problem:** `deactivateVertriebsauftrag()` (Zeile 209-229) setzt nur den `sales_desk_request` Status auf `withdrawn`, bereinigt aber keine Listings oder Publications.

**Loesung:**

- Nach dem Status-Update auf `withdrawn`:
  1. Alle `listings` die ueber den `sales_desk_request.project_id` verknuepft sind laden
  2. Alle Listings auf `status: 'withdrawn'` setzen
  3. Alle `listing_publications` dieser Listings auf `status: 'paused'` setzen
- Muster aus `VerkaufsauftragTab.tsx` Widerrufs-Logik uebernehmen

| Datei | Aenderung |
|-------|-----------|
| `SalesApprovalSection.tsx` | `deactivateVertriebsauftrag` erweitern |

---

## Aenderung 6: Zone 1 Sales Desk — Nur Deaktivierung

**Problem:** Der SalesDesk zeigt aktuell Einzelobjekt-Listings aus `useSalesDeskListings`. Fuer Projekte (MOD-13) gibt es noch keinen eigenen Bereich, und es soll kein Approval-Gate geben, nur ein Kill-Switch.

**Loesung:**

- Neuen Abschnitt "Projekte" im `SalesDeskDashboard` hinzufuegen:
  - Query auf `sales_desk_requests` mit `status = 'approved'` und JOIN auf `dev_projects`
  - Tabelle mit Projektname, Einheiten-Count, Aktivierungsdatum
  - Einzige Aktion pro Zeile: "Deaktivieren"-Button, der:
    - `sales_desk_requests.status` auf `withdrawn` setzt
    - Alle zugehoerigen Listings auf `withdrawn` setzt
    - Alle Publications auf `paused` setzt

| Datei | Aenderung |
|-------|-----------|
| `SalesDesk.tsx` | Neuer Projekte-Abschnitt mit Deaktivierungs-Button |

---

## Aenderung 7: Hinweistext in MarketingTab anpassen

**Problem:** Falls `MarketingTab.tsx` einen Hinweis auf "Sales Desk Freigabe erforderlich" enthaelt, ist dieser veraltet.

**Loesung:**

- Hinweis aendern auf: "Aktivieren Sie den Vertriebsauftrag im Reiter Governance"
- Kein Verweis mehr auf Zone 1 Approval

| Datei | Aenderung |
|-------|-----------|
| `MarketingTab.tsx` | Hinweistext aktualisieren (falls vorhanden) |

---

## Zusammenfassung der Dateiaenderungen

| # | Datei | Typ |
|---|-------|-----|
| 1 | `LandingPageBuilder.tsx` | Fix — Adressdaten durchreichen |
| 2 | `LandingPageTab.tsx` | Fix — Props aus rawProject weiterleiten |
| 3 | `ProjektLandingPage.tsx` | Fix — Echte Daten statt DEMO_PROJECT |
| 4 | `LandingPageWebsite.tsx` | Fix — Units-Prop hinzufuegen |
| 5 | `LandingPageInvestmentTab.tsx` | Fix — Units als Prop statt DEMO_UNITS |
| 6 | `SalesApprovalSection.tsx` | Erweiterung — Direkte Aktivierung, Kaufy-Toggle, erweiterter Widerruf |
| 7 | `SalesDesk.tsx` | Erweiterung — Projekt-Deaktivierung (Kill-Switch) |
| 8 | `MarketingTab.tsx` | Kleinigkeit — Hinweistext |

## Keine Aenderungen an

- Datenbankschema (alle Tabellen existieren: `listings`, `listing_publications`, `dev_project_units`)
- Edge Functions (`sot-generate-landing-page` bleibt unveraendert)
- Routing (bestehende Routen genuegen)
- Demo-Projekt (bleibt fixiert als Muster im Demo-Account)
