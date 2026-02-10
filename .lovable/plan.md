
# MOD-13 Reiter 4: Landing Page Builder — Implementierungsplan

## Machbarkeitsurteil: REALISTISCH UMSETZBAR

Ueber 70% der benoetigten Bausteine existieren bereits im Codebase. Die Investment Engine, Slider, Kacheln, Demo-Daten und DMS-Integration sind fertig und muessen nur zusammengesetzt werden.

---

## Uebersicht der Aenderungen

```text
BESTEHEND (wiederverwenden)          NEU (bauen)
─────────────────────────            ──────────────
InvestmentExposeView                 LandingPageTab.tsx (Hauptkomponente)
InvestmentResultTile                 LandingPageBuilder.tsx (Entry-State)
InvestmentSliderPanel                LandingPagePreview.tsx (4-Tab-Ansicht)
MasterGraph / Haushaltsrechnung      LandingPageInvestmentTab.tsx
useInvestmentEngine                  LandingPageProjektTab.tsx
demoProjectData.ts (24 Units)        LandingPageAnbieterTab.tsx
ProjectDocumentsBlock                LandingPageLegalTab.tsx
                                     LandingPageUnitExpose.tsx
                                     LandingPagePublishSection.tsx
```

## Schritt-fuer-Schritt-Plan

### Schritt 1: Routing + Manifest + Hauptkomponente

**routesManifest.ts** — Zeile 400 aendern:
- `"marketing"` → `"landing-page"` mit Title `"Landing Page"`

**ProjektePage.tsx** — Route anpassen:
- `marketing` Route → `landing-page` Route
- Legacy-Redirect von `/marketing` → `/landing-page`

**index.ts** — Export anpassen:
- `MarketingTab` → `LandingPageTab`

**LandingPageTab.tsx** (ersetzt MarketingTab.tsx):
- Laedt Projekte via `useDevProjects()`
- Demo-Fallback wenn keine Projekte existieren
- Zwei Zustaende: A (kein Entwurf) und B (Entwurf generiert)
- State `draftGenerated: boolean` (in Step 1 lokal, spaeter persistiert)

### Schritt 2: Entry-State (Zustand A) — Erklaerungskachel

**LandingPageBuilder.tsx** — neue Komponente:
- Grosse Kachel mit Titel "Landing Page Builder"
- 2-3 Saetze Erklaerung
- Mini-Preview der 4 Tabs (nur als Outline/Skeleton sichtbar)
- Primaer-Button "KI-Entwurf generieren"
- Sekundaer-Link "Vorschau-Struktur ansehen" (scrollt zu Outlines)
- Beim Klick auf "KI-Entwurf generieren": kurzer Ladebalken (1-2 Sek simuliert), dann State wechselt auf B

### Schritt 3: 4-Tab-Website-Ansicht (Zustand B)

**LandingPagePreview.tsx** — Superbar mit 4 Tabs:
- Tabs als horizontale Navigation (nicht Radix TabsList, sondern eigene Superbar im "Website-Look")
- Globaler Download-CTA "Verkaufsexpose downloaden" auf jedem Tab sichtbar

**Tab 1 — LandingPageInvestmentTab.tsx:**
- Hero-Bereich: Projektname, Stadt, Key Facts (aus DEMO_PROJECT / echten Daten)
- Platzhalter-Bild (Gradient oder generisches Rendering)
- Investment-Kacheln Grid (alle 24 Units):
  - Wiederverwendung von `InvestmentResultTile` mit angepasstem `linkPrefix`
  - Investment Engine wird pro Kachel mit Unit-Daten berechnet
  - Kein Such-Zwang: alle Kacheln direkt sichtbar (Grid 1-3 Spalten responsive)
- Klick auf Kachel oeffnet Unit-Expose

**Tab 2 — LandingPageProjektTab.tsx:**
- Projektbeschreibung aus `DEMO_PROJECT_DESCRIPTION` (3 Absaetze)
- Highlights als Bullet-Liste
- Bildergalerie-Platzhalter (4 Slots)
- Lagebeschreibung

**Tab 3 — LandingPageAnbieterTab.tsx:**
- Anbieterprofil aus `DEMO_DEVELOPER_CONTEXT`
- Name, Rechtsform, HRB, USt-ID, Geschaeftsfuehrer
- "Ueber uns" Text (generisch/Demo)
- Kontakt-Block (UI-only, kein Formular)

**Tab 4 — LandingPageLegalTab.tsx:**
- Disclaimer-Text (neutraler Standard)
- Download-Liste: Wiederverwendung der DMS-Logik aus `ProjectDocumentsBlock`
- Demo-Fallback: Muster-Dokumente (Expose, Preisliste, Grundrisse, Energieausweis)

### Schritt 4: Einheit-Detail (Verkaufsexpose)

**LandingPageUnitExpose.tsx:**
- Wird als Sub-View innerhalb des Landing Page Tabs angezeigt (kein separater Route-Wechsel, um im Kontext zu bleiben)
- Zurueck-Button oben
- Wiederverwendung von `InvestmentExposeView` — die komplette Expose-Komponente:
  - Bildergalerie
  - Titel, Adresse, Key Facts
  - MasterGraph (40-Jahres-Projektion)
  - Haushaltsrechnung (T-Konto)
  - InvestmentSliderPanel (ALLE Slider funktionieren)
  - FinanzierungSummary
  - DetailTable40Jahre
- Investment Engine Aufruf via `useInvestmentEngine` mit den Unit-Daten
- Bei Demo-Daten: "Beispielberechnung" Badge sichtbar
- Download-CTA bleibt sichtbar

### Schritt 5: Editierbarkeit (MVP)

Inline-Editing ueber einfache Edit-Dialoge (kein CMS):
- Jeder editierbare Textblock bekommt einen Stift-Icon-Button
- Klick oeffnet ein Sheet/Dialog mit Textarea
- Aenderungen werden im lokalen State gespeichert (Step 1)
- Spaeter: Persistierung in einer `landing_page_drafts`-Tabelle
- Armstrong-Buttons ("Text verbessern", "kuerzen") werden als Phase-2 markiert (disabled Buttons mit "Coming Soon" Badge)

Editierbare Bereiche:
- Hero-Headline + Subheadline
- Projektbeschreibung (Tab 2)
- Highlights-Liste (Tab 2)
- Anbieter "Ueber uns" Text (Tab 3)

### Schritt 6: Publishing/Domain UI-Section

**LandingPagePublishSection.tsx:**
- Unterhalb der 4-Tab-Ansicht
- 3 Optionen als Cards:
  - "Domain verbinden" (Cloudflare) — Platzhalter
  - "Domain buchen" — Platzhalter
  - "kaufy.app Subdomain" — Platzhalter
- Status-Badges: "Nicht konfiguriert"
- Keine echte Funktionalitaet in Step 1

---

## Technische Details

### Routing (Manifest-konform)

```text
routesManifest.ts MOD-13 tiles:
  - dashboard (ProjekteDashboard)
  - projekte (PortfolioTab)
  - vertrieb (VertriebTab)
  - landing-page (LandingPageTab)    ← NEU (ersetzt "marketing")
```

Unit-Expose wird NICHT als separate Route implementiert, sondern als State-gesteuerte Sub-View innerhalb des Landing Page Tabs. Das haelt den Kontext und vermeidet Route-Konflikte.

### Investment Engine Integration

Fuer jede Unit-Kachel wird die Edge Function `sot-investment-engine` aufgerufen mit:
- `purchasePrice` = Unit `list_price`
- `monthlyRent` = Unit `rent_monthly`
- `equity` + `taxableIncome` = globale Slider-Werte (aus einem uebergeordneten State)

Optimierung: Batch-Berechnung fuer alle 24 Units mit einem globalen Parametersatz, nicht 24 einzelne API-Calls. Alternativ: Client-seitige Approximation fuer die Kacheln, volle Engine nur im Detail.

### Demo-Daten Strategie

- `DEMO_PROJECT` → Hero, Key Facts
- `DEMO_UNITS` (24 Stueck) → Investment-Kacheln
- `DEMO_PROJECT_DESCRIPTION` → Tab 2 Texte
- `DEMO_DEVELOPER_CONTEXT` → Tab 3 Anbieter
- `DEMO_UNIT_DETAIL` → Unit-Expose Fallback
- Alle Demo-Elemente erhalten ein dezentes "Beispieldaten" Badge (halbtransparent)

### Neue Dateien (8-9 Dateien)

```text
src/pages/portal/projekte/LandingPageTab.tsx          (~80 Zeilen)
src/components/projekte/landing-page/
  LandingPageBuilder.tsx        (~120 Zeilen, Entry-State)
  LandingPagePreview.tsx        (~60 Zeilen, Superbar + Tab-Router)
  LandingPageInvestmentTab.tsx  (~150 Zeilen, Hero + Kacheln)
  LandingPageProjektTab.tsx     (~100 Zeilen, Beschreibung)
  LandingPageAnbieterTab.tsx    (~80 Zeilen, Anbieterprofil)
  LandingPageLegalTab.tsx       (~80 Zeilen, Dokumente)
  LandingPageUnitExpose.tsx     (~100 Zeilen, Wrapper um InvestmentExposeView)
  LandingPagePublishSection.tsx (~60 Zeilen, Domain-Platzhalter)
```

### Geaenderte Dateien (3 Dateien)

```text
src/manifests/routesManifest.ts     — 1 Zeile aendern (marketing → landing-page)
src/pages/portal/ProjektePage.tsx   — Route-Name aendern + Legacy-Redirect
src/pages/portal/projekte/index.ts  — Export-Name aendern
```

### Geloeschte Dateien (1 Datei)

```text
src/pages/portal/projekte/MarketingTab.tsx  — ersetzt durch LandingPageTab.tsx
```

---

## Umsetzungsreihenfolge (3-4 Nachrichten)

**Nachricht 1:** Routing + LandingPageTab + Entry-State (Builder) + Tab-Superbar-Grundgeruest
**Nachricht 2:** Tab 1 Investment (Hero + Kacheln) + Tab 2 Projekt + Tab 3 Anbieter + Tab 4 Legal
**Nachricht 3:** Unit-Expose mit Investment Engine + Inline-Editing MVP + Publishing Section

---

## Nicht enthalten (spaetere Phasen)

- Echte KI-Generierung aus PDF (Phase 2)
- Armstrong-Editing-Integration (Phase 2)
- Domain-Anbindung / Billing (Phase 2)
- Persistierung der Drafts in DB (Phase 2)
- Social Media Tab als Reiter 5 (separater Auftrag)
