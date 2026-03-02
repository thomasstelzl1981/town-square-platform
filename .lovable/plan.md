

# TLC Komplett-Check: 30 Aufgabenfelder — UI/UX Analyse

## Zusammenfassung

Die Implementierung ist strukturell solide. 16 Collapsible-Sections in der TenancyTab, alle 15 Hooks eingebunden, Engine v1.5 mit 44 Tests, Edge Function synchron. Es gibt **1 Bug** und **mehrere UX-Schwachstellen**, aber keine kritischen Architekturprobleme.

---

## 30-Punkte-Check

| # | Aufgabenfeld | Hook | UI | Status | Befund |
|---|---|---|---|---|---|
| 01 | Mietakte (SSOT) | useLeaseLifecycle | TenancyTab | OK | Lease-CRUD + Inline-Edit + Briefgenerator |
| 02 | DMS/Versionen | — | — | N/A | Nicht Teil von TLC, DMS-Modul existiert separat |
| 03 | Rollen & Rechte | — | — | N/A | RLS tenant_id-basiert, kein eigenes UI noetig |
| 04 | Kommunikationshub | useTenancyCommunication | TLCCommunicationSection | OK | Template-Picker, Verlauf, Protokollierung |
| 05 | Ticketing/Service Desk | useDefectReport | TLCDefectSection | OK | Auto-Triage mit Keywords, SLA-Anzeige |
| 06 | Bewerbermanagement | useTenancyApplicants | TLCApplicantSection | OK | 8-Stufen-Pipeline, Status-Farben |
| 07 | Besichtigungsplanung | useTenancyApplicants | TLCApplicantSection | OK | Stufe "viewing_scheduled/done" enthalten |
| 08 | Vertragsgenerator | useLeaseContractGenerator | TLCContractSection | WARNUNG | Generiert nur wenn landlordName gesetzt — aktuell wird leerer String uebergeben, d.h. "Vertragsdaten unvollstaendig" wird immer angezeigt |
| 09 | Uebergabeprotokoll | useHandoverProtocol | TLCHandoverSection | OK | Einzug/Auszug, Protokollfuehrer, Status |
| 10 | Kuendigung/Auszug | useLeaseLifecycle | TenancyTab | OK | Kuendigungs-Brief via Briefgenerator |
| 11 | Zahlungsmanagement | — | — | PARTIAL | Kein dediziertes Zahlungs-UI, nur Ratenplan + Mahnwesen |
| 12 | Mahnwesen | useLeaseLifecycle | TLCEventsSection | OK | Events vom Typ dunning_* werden angezeigt |
| 13 | Ratenplan | usePaymentPlans | TLCPaymentPlanSection | OK | CRUD, Raten-Tracking, Status |
| 14 | Kaution | — | TenancyTab | PARTIAL | Kaution-Feld + Status in Lease-Card, aber Zinsgutschrift-Berechnung (calculateDepositInterest) hat kein UI |
| 15 | Nebenkosten | useMeterReadings | TLCMeterSection | OK | Zaehlerstaende pro Einheit |
| 16 | Vorauszahlungsanpassung | usePrepaymentAdjustment | TLCPrepaymentSection | OK | §560 Rechner + Anschreiben-Generator |
| 17 | Maengelmanagement | useDefectReport | TLCDefectSection | OK | Identisch mit #05 |
| 18 | Dienstleistersteuerung | useServiceProviders | TLCServiceProviderSection | OK | Ranking, SLA, Notfall-Kontakte |
| 19 | Rechnungspruefung | useInvoiceVerification | TLCInvoiceSection | OK | SKR04-Zuordnung, Budget-Check |
| 20 | Schadenmanagement | useDefectReport | TLCDefectSection | OK | Schaeden ueber Defect-Report abgedeckt |
| 21 | Versicherungskoordination | useInsuranceCoordination | TLCInsuranceSection | OK | Policen, Renewals, Claims |
| 22 | Mieterhoehungen | Engine | TenancyTab | OK | Briefgenerator-Link fuer Mieterhoehung |
| 23 | 3-Jahres-Check | Engine | — | FEHLT | `performThreeYearCheck()` existiert in Engine, aber kein UI zeigt das Ergebnis an |
| 24 | Mietminderung | useRentReductions | TLCRentReductionSection | BUG | `val.label` wird verwendet, aber das Objekt hat `description` — Richtwerte werden als "undefined" angezeigt |
| 25 | Owner-Cockpit | TLCWidget | Dashboard | OK | Ampel-Logik, Aggregationen, Category-Chips |
| 26 | Reporting/Exporte | useTenancyReport | TLCReportSection | OK | KPIs + CSV-Export |
| 27 | Audit-Trail | useLeaseLifecycle | TLCEventsSection | OK | Chronologische Event-Liste |
| 28 | Fristen-Management | useTenancyDeadlines | TLCDeadlinesSection | OK | Urgenz-Anzeige, Erledigung |
| 29 | Automations/Rules | Edge Function | CRON | OK | sot-tenancy-lifecycle v1.5 deployed |
| 30 | KI-Assistenz | Edge Function | — | OK | AI Summary via gemini-2.5-flash in Edge Function |

---

## Gefundene Probleme

### BUG (muss gefixt werden)

**1. TLCRentReductionSection — `val.label` statt `val.description`**
- Datei: `src/components/portfolio/tlc/TLCRentReductionSection.tsx`, Zeile 127
- `RENT_REDUCTION_GUIDELINES` hat Felder `minPercent`, `maxPercent`, `description` — aber der Code greift auf `val.label` zu, was `undefined` ergibt
- Fix: `val.label` → `val.description`

### WARNUNG (sollte gefixt werden)

**2. TLCContractSection erhaelt immer leeren `landlordName`**
- Datei: `src/components/portfolio/TenancyTab.tsx`, Zeile 723
- `landlordName: ''` wird hardcoded uebergeben, daher zeigt der Vertragsgenerator immer "Vertragsdaten unvollstaendig"
- Fix: `landlordName` aus Tenant-Profil oder Property-Daten beziehen

**3. 3-Jahres-Check (`performThreeYearCheck`) hat kein UI**
- Die Engine-Funktion existiert und ist getestet, aber nirgendwo in der UI aufgerufen
- Das waere eine wertvolle Anzeige innerhalb der TenancyTab (Kappungsgrenze-Status pro Lease)

**4. Kautions-Zinsgutschrift (`calculateDepositInterest`) hat kein UI**
- Engine-Funktion existiert, aber kein UI zeigt die berechneten Zinsen an
- Koennte als kleine Info-Box in der Lease-Card oder als eigene Section

### UX-HINWEISE (nice to have)

**5. TLC-Sections nur fuer `activeLeases[0]`**
- Zeile 710-760: Alle Workflow-Sections werden nur fuer den ersten aktiven Lease gerendert
- Bei mehreren aktiven Leases (z.B. Gewerbe + Wohnung in einer Einheit) fehlen die Sections fuer die weiteren

**6. Defect-Section zeigt keine bestehenden Maengel**
- `TLCDefectSection` hat nur ein Eingabeformular, aber keine Liste bestehender Defect-Reports
- Der Hook `useDefectReport` liefert vermutlich bereits erstellte Reports, sie werden aber nicht angezeigt

**7. Collapsible-Flut**
- 16 Collapsible-Sections in einer TenancyTab koennen ueberfordernd wirken
- Ueberlegung: Gruppierung in "Kernfunktionen" (Events, Tasks, Deadlines, Zaehler) vs. "Erweitert" (Handover, Defect, Bewerber, etc.) durch eine zweite Ebene

---

## Vorgeschlagener Fix-Plan

### Sofort (1 Nachricht)
1. Bug #1 fixen: `val.label` → `val.description` in TLCRentReductionSection
2. Warnung #2 fixen: landlordName aus Property/Tenant-Daten laden
3. Bug #6: Bestehende Defect-Reports in TLCDefectSection anzeigen

### Naechste Iteration
4. 3-Jahres-Check UI als Collapsible-Section hinzufuegen
5. Deposit-Interest-Anzeige in Lease-Card
6. Multi-Lease-Support fuer TLC-Sections (Loop statt `activeLeases[0]`)

