
# AUDIT-REPORT: MOD-10 LEADS — IST-STAND (2026-02-11)

## A) Modul-Identitaet

| Feld | Wert |
|------|------|
| Modul-Code | MOD-10 |
| Name (routesManifest) | Leads |
| Base Route | `/portal/leads` |
| Page Component | `src/pages/portal/LeadsPage.tsx` |
| Sichtbarkeit | Nur fuer `partner` Orgs, requires_activation |
| Rollen-Zugang | `platform_admin`, `super_user`, `sales_partner` |

**4 Haupt-Tiles** (Manifest):
1. `/portal/leads/inbox` -- Inbox
2. `/portal/leads/meine` -- Meine Leads
3. `/portal/leads/pipeline` -- Pipeline
4. `/portal/leads/werbung` -- Werbung

**6 Selfie-Ads-Sub-Routes** (nicht im Manifest, aber in LeadsPage.tsx registriert):
5. `/portal/leads/selfie-ads` -- Selfie Ads Studio
6. `/portal/leads/selfie-ads-planen` -- Kampagne planen (Wizard)
7. `/portal/leads/selfie-ads-summary` -- Mandat-Zusammenfassung
8. `/portal/leads/selfie-ads-kampagnen` -- Meine Kampagnen
9. `/portal/leads/selfie-ads-performance` -- Performance Dashboard
10. `/portal/leads/selfie-ads-abrechnung` -- Abrechnung

---

## B) DELIVERABLE 1 — ROUTE-BY-ROUTE STATUSREPORT

---

### B.1) Base Route: `/portal/leads`

| Punkt | Befund |
|-------|--------|
| **Datei** | `src/pages/portal/LeadsPage.tsx` |
| **Status** | **REDIRECT** -- `Navigate to="inbox" replace` |
| **Sichtbarkeit** | User wird sofort zu `/portal/leads/inbox` umgeleitet |
| **Bugs** | Keine -- funktioniert wie erwartet |

---

### B.2) Route: `/portal/leads/inbox`

| Punkt | Befund |
|-------|--------|
| **Datei** | `LeadsPage.tsx` inline Komponente `LeadsInbox()` |
| **Status** | **STUB (Empty-State only)** |
| **Was sieht der User?** | ModuleTilePage mit `status="empty"`. Headline: "Inbox". Beschreibung: "Eingehende Leads uebernehmen und priorisieren". Empty-State-Card: "Keine neuen Leads" + "Neue Leads aus Kampagnen und Anfragen erscheinen hier." |
| **Headline** | Ja, vorhanden |
| **Erklaerungstext** | Ja, vorhanden |
| **Empty-State** | Ja, sichtbar (ModuleTilePage `status="empty"` rendert immer Empty-State) |
| **Primary CTA** | Ja: "Lead manuell anlegen" -- aber `onClick` ist nur `console.log('Lead anlegen')`. **Fuehrt ins Leere.** |
| **Secondary CTA** | Ja: "So funktioniert's" -- linkt zu `/portal/leads` was sofort zurueck zu `/portal/leads/inbox` redirected = **Endlos-Redirect-Loop** (harmlos weil `replace`, aber nutzlos) |
| **DB-Abhaengigkeit** | Keine. Rein statische Empty-State-Komponente. Tabellen `leads`, `lead_assignments` existieren in DB, werden aber NICHT abgefragt. |
| **Console Errors** | Keine |

**Repro:** Seite oeffnen -> Empty-State sofort sichtbar -> "Lead manuell anlegen" klicken -> Console-Log, kein Effekt -> "So funktioniert's" klicken -> Redirect zurueck auf dieselbe Seite.

---

### B.3) Route: `/portal/leads/meine`

| Punkt | Befund |
|-------|--------|
| **Datei** | `LeadsPage.tsx` inline Komponente `MeineLeads()` |
| **Status** | **STUB (Empty-State only)** |
| **Was sieht der User?** | ModuleTilePage mit `status="empty"`. Headline: "Meine Leads". Empty-State: "Keine zugewiesenen Leads" + "Uebernehmen Sie Leads aus der Inbox, um sie hier zu sehen." |
| **Headline** | Ja |
| **Erklaerungstext** | Ja |
| **Empty-State** | Ja, sichtbar |
| **Primary CTA** | Nein -- fehlt komplett. Kein Button, keine Aktion. |
| **Secondary CTA** | Ja: "Zur Inbox" -> `/portal/leads/inbox` -- funktioniert korrekt |
| **DB-Abhaengigkeit** | Keine. Rein statisch. |
| **Console Errors** | Keine |

**Repro:** Seite oeffnen -> Empty-State sofort sichtbar -> kein Create-Flow moeglich.

---

### B.4) Route: `/portal/leads/pipeline`

| Punkt | Befund |
|-------|--------|
| **Datei** | `LeadsPage.tsx` inline Komponente `LeadsPipeline()` |
| **Status** | **STUB (Empty-State only)** |
| **Was sieht der User?** | ModuleTilePage mit `status="empty"`. Headline: "Pipeline". Empty-State: "Pipeline leer" + "Qualifizierte Leads werden hier nach Status gruppiert." |
| **Headline** | Ja |
| **Erklaerungstext** | Ja |
| **Empty-State** | Ja, sichtbar |
| **Primary CTA** | Nein -- fehlt komplett |
| **Secondary CTA** | Nein -- fehlt komplett |
| **DB-Abhaengigkeit** | Keine. Rein statisch. |

**Repro:** Seite oeffnen -> Empty-State -> Sackgasse. Kein CTA, kein Link, keine Aktion.

---

### B.5) Route: `/portal/leads/werbung`

| Punkt | Befund |
|-------|--------|
| **Datei** | `LeadsPage.tsx` inline Komponente `LeadsWerbung()` |
| **Status** | **STUB (Empty-State only)** |
| **Was sieht der User?** | ModuleTilePage mit `status="empty"`. Headline: "Werbung". Empty-State: "Keine Kampagnen" + "Erstellen Sie Werbekampagnen zur Lead-Generierung." |
| **Headline** | Ja |
| **Erklaerungstext** | Ja |
| **Empty-State** | Ja, sichtbar |
| **Primary CTA** | Ja: "Kampagne erstellen" -- aber `onClick` ist nur `console.log('Kampagne erstellen')`. **Fuehrt ins Leere.** |
| **Secondary CTA** | Nein -- fehlt |
| **DB-Abhaengigkeit** | Keine. Tabellen `ad_campaigns`, `ad_campaign_leads` existieren, werden nicht genutzt. |

---

### B.6) Route: `/portal/leads/selfie-ads`

| Punkt | Befund |
|-------|--------|
| **Datei** | `src/pages/portal/leads/SelfieAdsStudio.tsx` |
| **Status** | **STUB mit Hardcoded Demo-Daten** |
| **Was sieht der User?** | Vollstaendige UI mit KPI-Cards (hartcodiert: "2 Aktive Kampagnen", "5 Neue Leads", "18,50 EUR CPL", "3 Beauftragungen"). 3 Demo-Kampagnen-Eintraege. 3 Demo-Lead-Eintraege mit erfundenen Namen (Max Mueller, Anna Schmidt, Peter Weber). |
| **Primary CTA** | Ja: "Kampagne planen" -> navigiert zu `/portal/leads/selfie-ads-planen` -- funktioniert |
| **DB-Abhaengigkeit** | Keine. 100% Hardcoded Demo-Daten. |
| **Verstoesst gegen Showcase-Readiness** | JA -- zeigt erfundene Firmennamen/Leads, hartcodierte KPIs |

---

### B.7) Route: `/portal/leads/selfie-ads-planen`

| Punkt | Befund |
|-------|--------|
| **Datei** | `src/pages/portal/leads/SelfieAdsPlanen.tsx` |
| **Status** | **PARTIAL (funktionaler Mockup)** |
| **Was sieht der User?** | 5-Abschnitt-Wizard: Parameter, Templates, Personalisierung, Generierung, Zusammenfassung. Templates sind waehlbar, "Generieren" simuliert mit 1.5s Delay und erzeugt Placeholder-Slides. |
| **Speicherung** | sessionStorage -- nicht persistent. Daten gehen bei Browser-Refresh verloren. |
| **DB-Abhaengigkeit** | Keine |
| **Funktioniert ohne API** | Ja |
| **Navigation** | "Weiter zur Zusammenfassung" -> `/portal/leads/selfie-ads-summary` -- funktioniert |

---

### B.8) Route: `/portal/leads/selfie-ads-summary`

| Punkt | Befund |
|-------|--------|
| **Datei** | `src/pages/portal/leads/SelfieAdsSummary.tsx` |
| **Status** | **PARTIAL (funktionaler Mockup)** |
| **Was sieht der User?** | Read-only Mandat-Zusammenfassung. Falls kein sessionStorage vorhanden: Fallback-Demo-Daten. CTA "Beauftragen & bezahlen" zeigt Toast "Stub -- Phase 4". |
| **DB-Abhaengigkeit** | Keine |

---

### B.9) Route: `/portal/leads/selfie-ads-kampagnen`

| Punkt | Befund |
|-------|--------|
| **Datei** | `src/pages/portal/leads/SelfieAdsKampagnen.tsx` |
| **Status** | **STUB mit Hardcoded Demo-Daten** |
| **Was sieht der User?** | 4 Demo-Mandate mit erfundenen Namen/Budgets/Status. "Eye"-Button hat keinen onClick-Handler (kein Navigations-Ziel). |
| **Verstoesst gegen Showcase-Readiness** | JA |
| **DB-Abhaengigkeit** | Keine. Tabelle `ad_campaigns` existiert, wird nicht benutzt. |

---

### B.10) Route: `/portal/leads/selfie-ads-performance`

| Punkt | Befund |
|-------|--------|
| **Datei** | `src/pages/portal/leads/SelfieAdsPerformance.tsx` |
| **Status** | **STUB mit Hardcoded Demo-Daten** |
| **Was sieht der User?** | Vollstaendiges Dashboard mit Recharts-Diagrammen, KPI-Cards, Region-Performance. Alles 100% hartcodiert (46 Leads, CPL 18,50, Muenchen/Berlin/Hamburg). |
| **Verstoesst gegen Showcase-Readiness** | JA |

---

### B.11) Route: `/portal/leads/selfie-ads-abrechnung`

| Punkt | Befund |
|-------|--------|
| **Datei** | `src/pages/portal/leads/SelfieAdsAbrechnung.tsx` |
| **Status** | **STUB mit Hardcoded Demo-Daten** |
| **Was sieht der User?** | 4 Demo-Zahlungen, hartcodierte Summen (9.500 EUR bezahlt, 1.500 EUR offen). Download-Button hat keinen Handler. |
| **Verstoesst gegen Showcase-Readiness** | JA |

---

## C) DELIVERABLE 2 — "HIDDEN FEATURE" LISTE

Da alle 4 Haupt-Tiles (Inbox, Meine, Pipeline, Werbung) `ModuleTilePage` mit `status="empty"` (hardcoded) nutzen, ist NICHTS versteckt im klassischen Sinn -- es gibt schlicht keine implementierte Logik hinter den Empty-States.

| # | Stelle | Ursache | Minimaler Fix-Vorschlag |
|---|--------|---------|------------------------|
| 1 | Inbox: "Lead manuell anlegen" | `onClick` = `console.log()` | Durch Navigation zu Create-Modal/Sheet ersetzen oder Selfie-Ads-Planen verlinken |
| 2 | Werbung: "Kampagne erstellen" | `onClick` = `console.log()` | Durch Navigation zu `/portal/leads/selfie-ads-planen` ersetzen |
| 3 | Pipeline: Keine CTA | Kein `primaryAction` konfiguriert | Primary CTA "Zur Inbox" hinzufuegen, Secondary CTA "So funktioniert's" |
| 4 | Meine Leads: Keine Primary CTA | Kein `primaryAction` konfiguriert | Primary CTA "Leads uebernehmen" -> Inbox |
| 5 | Inbox Secondary CTA Loop | "So funktioniert's" verlinkt auf `/portal/leads` -> redirect zurueck zu Inbox | HowItWorks-Overlay/Dialog verwenden statt Route-Link |
| 6 | Selfie Ads Studio: Demo-Daten sichtbar | Hardcoded `demoKampagnen`, `demoLeads` | Empty-State anzeigen oder DB-Query implementieren |
| 7 | DB-Tabellen `leads`, `ad_campaigns`, `lead_assignments` existieren | Werden in keiner MOD-10 Komponente abgefragt | Queries implementieren oder Clean-Empty-States nutzen |

---

## D) DELIVERABLE 3 — EMPTY-STATE STANDARD FUER MOD-10

### Vorgeschlagenes Muster (konsistent fuer alle 4 Tiles + Selfie Ads):

```text
+---------------------------------------------------+
|  [Icon]  HEADLINE                                  |
|          1 Satz Erklaerung                         |
|                                                    |
|  [ Primary CTA Button ]                            |
|  ( Secondary Link: "So funktioniert's" )           |
|                                                    |
|  Was passiert als Naechstes?                       |
|  1. Schritt eins                                   |
|  2. Schritt zwei                                   |
|  3. Schritt drei                                   |
+---------------------------------------------------+
```

### Konkrete Texte pro Tile:

**Inbox:**
- Headline: "Ihre Lead-Inbox ist bereit"
- Erklaerung: "Hier erscheinen automatisch neue Leads aus Kampagnen, Webformularen und Partner-Zuweisungen."
- Primary CTA: "Lead manuell erfassen" (oeffnet Create-Sheet/Modal)
- Secondary: "So funktioniert's" (oeffnet HowItWorks-Overlay, kein Route-Link)
- Naechste Schritte: 1) Erstellen Sie eine Werbekampagne oder teilen Sie Ihr Kontaktformular. 2) Eingehende Leads erscheinen automatisch hier. 3) Uebernehmen und qualifizieren Sie die besten Kontakte.

**Meine Leads:**
- Headline: "Noch keine Leads uebernommen"
- Erklaerung: "Uebernehmen Sie Leads aus der Inbox, um sie persoenlich zu bearbeiten."
- Primary CTA: "Zur Inbox" -> `/portal/leads/inbox`
- Secondary: "So funktioniert's"
- Naechste Schritte: 1) Pruefen Sie eingehende Leads in der Inbox. 2) Uebernehmen Sie passende Leads. 3) Fuehren Sie sie durch Ihre Pipeline zum Abschluss.

**Pipeline:**
- Headline: "Pipeline starten"
- Erklaerung: "Qualifizierte Leads durchlaufen hier Ihre Verkaufsphasen von der Erstansprache bis zum Abschluss."
- Primary CTA: "Zur Inbox" -> `/portal/leads/inbox`
- Secondary: "So funktioniert's"
- Naechste Schritte: 1) Uebernehmen Sie Leads aus der Inbox. 2) Setzen Sie den Status je nach Gespraechsfortschritt. 3) Verfolgen Sie die Conversion pro Phase.

**Werbung:**
- Headline: "Werbung & Kampagnen"
- Erklaerung: "Beauftragen Sie Selfie Ads Kampagnen oder verwalten Sie bestehende Lead-Quellen."
- Primary CTA: "Selfie Ads Studio oeffnen" -> `/portal/leads/selfie-ads`
- Secondary: "So funktioniert's"
- Naechste Schritte: 1) Planen Sie Ihre erste Kampagne im Selfie Ads Studio. 2) Kaufy veroeffentlicht Ihre Anzeigen auf Social Media. 3) Leads erscheinen automatisch in Ihrer Inbox.

### Wichtige Regeln:
- Keine erfundenen Firmen/Leads/Namen
- Kein "Beispiel ansehen" mit Fake-Daten
- "So funktioniert's" immer als Overlay/Dialog (HowItWorks-Komponente), nicht als Route-Redirect
- ModuleTilePage `status` bleibt `"empty"` bis echte Daten via DB vorhanden

---

## E) DELIVERABLE 4 — CREATE FLOWS CHECK

| Tile | Create-Flow vorhanden? | Erreichbar via CTA? | Funktioniert ohne API? | Status |
|------|----------------------|---------------------|----------------------|--------|
| Inbox | NEIN -- `console.log()` only | Nein (Button existiert, tut nichts) | n/a | **Muss implementiert werden** (Sheet/Modal mit Name, E-Mail, Telefon, Quelle) |
| Meine Leads | NEIN -- kein CTA | n/a | n/a | Kein Create noetig (Leads werden uebernommen, nicht erstellt) |
| Pipeline | NEIN -- kein CTA | n/a | n/a | Kein Create noetig (Leads kommen aus Inbox) |
| Werbung | NEIN -- `console.log()` only | Nein | n/a | **Sollte zu Selfie Ads Studio verlinken** |
| Selfie Ads Planen | JA -- vollstaendiger Wizard | Ja, von Studio aus | Ja (sessionStorage) | **PARTIAL** -- funktioniert als Mockup, nicht persistent |
| Selfie Ads Summary | JA -- Zusammenfassung + CTA | Ja, von Planen aus | Ja | **PARTIAL** -- "Beauftragen" ist Toast-Stub |

---

## F) DELIVERABLE 5 — P0 BUGS / DEAD ENDS (Top 10)

| # | Route | Problem | Root Cause | Minimaler Fix |
|---|-------|---------|-----------|---------------|
| 1 | `/portal/leads/inbox` | "Lead manuell anlegen" Button tut nichts | `onClick: () => console.log()` | Create-Sheet mit Formular oeffnen ODER Navigation zu Create-Flow |
| 2 | `/portal/leads/inbox` | "So funktioniert's" -> Endlos-Redirect | Secondary href `/portal/leads` redirected zurueck zu `/portal/leads/inbox` | HowItWorks-Dialog statt Route-Link verwenden |
| 3 | `/portal/leads/werbung` | "Kampagne erstellen" tut nichts | `onClick: () => console.log()` | Navigation zu `/portal/leads/selfie-ads-planen` |
| 4 | `/portal/leads/pipeline` | Keine CTA, reine Sackgasse | Kein `primaryAction` definiert | Primary CTA "Zur Inbox" hinzufuegen |
| 5 | `/portal/leads/meine` | Keine Primary CTA | Kein `primaryAction` definiert | Primary CTA "Leads uebernehmen" -> Inbox |
| 6 | `/portal/leads/selfie-ads` | Hardcoded Demo-Daten mit erfundenen Namen | `demoKampagnen`, `demoLeads` Arrays | Empty-State gemaess Showcase-Readiness Standard |
| 7 | `/portal/leads/selfie-ads-kampagnen` | Hardcoded Demo-Daten + Eye-Button ohne Handler | Hardcoded Array, kein onClick | Empty-State oder DB-Query |
| 8 | `/portal/leads/selfie-ads-performance` | Hardcoded Demo-Charts | Recharts mit statischen Daten | Empty-State: "Noch keine Performance-Daten" |
| 9 | `/portal/leads/selfie-ads-abrechnung` | Hardcoded Demo-Zahlungen + Download ohne Handler | Hardcoded Array | Empty-State: "Noch keine Abrechnungen" |
| 10 | `/portal/leads/selfie-ads-planen` | Daten nicht persistent | sessionStorage geht bei Refresh verloren | Akzeptabel als Mockup, aber klar kennzeichnen |

---

## G) ZUSAMMENFASSUNG

### Was existiert wirklich?
- 4 Haupt-Tiles mit korrekten Routes und Empty-States (Grundgeruest steht)
- Selfie Ads Studio mit 6 Sub-Pages (Planen-Wizard funktioniert als Mockup)
- DB-Tabellen `leads`, `lead_assignments`, `lead_activities`, `ad_campaigns`, `ad_campaign_leads`, `social_leads`, `social_lead_events` existieren -- werden aber in KEINER MOD-10 Komponente abgefragt

### Warum sieht man "nichts"?
- Die 4 Haupt-Tiles sind alle `status="empty"` (hardcoded). Sie pruefen NICHT die Datenbank. Selbst wenn Leads in der DB waeren, wuerde man sie nicht sehen.
- 2 von 4 CTAs sind `console.log()` Dead-Ends
- 1 CTA ist ein Redirect-Loop
- 1 Tile hat gar keine CTA

### Top 5 UI-Aenderungen fuer sofortige Testbarkeit:
1. **Inbox CTA reparieren**: Create-Sheet/Modal fuer manuelle Lead-Erfassung (Name, E-Mail, Telefon, Quelle -> Insert in `leads` Tabelle)
2. **Werbung CTA reparieren**: Navigation zu `/portal/leads/selfie-ads-planen`
3. **Pipeline + Meine Leads**: Primary CTAs "Zur Inbox" hinzufuegen
4. **Selfie Ads Studio/Kampagnen/Performance/Abrechnung**: Hardcoded Demo-Daten entfernen, saubere Empty-States gemaess Showcase-Readiness
5. **"So funktioniert's" Link**: HowItWorks-Dialog (bereits als Komponente vorhanden) statt Route-Redirect verwenden

### Geschaetzter Aufwand:
- P0-Fixes (CTAs reparieren, Empty-States): ca. 1 Implementierungs-Runde
- Selfie Ads Showcase-Cleanup: ca. 1 Implementierungs-Runde
- DB-Integration (Leads aus DB laden/anzeigen): ca. 2-3 Implementierungs-Runden
