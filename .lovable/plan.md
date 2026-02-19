

# Lead Manager (MOD-10) — Komplett-Ueberarbeitung der UI

## Problem (IST-Zustand)

Basierend auf den Screenshots und dem Code:

1. **Leer und unverstaendlich**: Alle Bereiche zeigen "0" oder "Noch keine Kampagnen/Leads" — keine Demo-Inhalte
2. **Template-Slots viel zu klein**: Winzige 48px hohe Platzhalter-Karten mit nur einem Icon — kein Bild, keine Vorschau
3. **Kein erklaerter Flow**: Schritte als trockene UPPERCASE-Labels ohne Beschreibung, was passiert
4. **Kontext-Auswahl unklar**: Brand-Badges sind kleine Textpillen — kein visuelles Branding, keine Bilder
5. **Alles wirkt blockiert/leer**: Man sieht nicht, wie das Modul funktioniert, weil es null Vorbefuellung gibt
6. **Sub-Tabs oben stehen noch**: UEBERSICHT, KAMPAGNEN, STUDIO, LEADS — obwohl alles inline sein sollte

## Loesung (SOLL-Zustand)

Kompletter visueller Umbau mit drei Saeulen:

### A) Marken-Vorlagen als grosse, visuelle Karten (statt Badges)

Statt kleiner Badge-Pillen fuer "Kaufy / FutureRoom / Acquiary" werden **grosse Brand-Karten** mit Gradient-Hintergrund, Icon und Beschreibung gezeigt (wie die bestehenden `BrandLinkWidget`-Karten). Man klickt eine Brand-Karte, um den Kontext zu waehlen. Dazu ein freier "Eigene Kampagne"-Slot.

### B) Template-Vorlagen gross und mit Beispielinhalt

Statt 48px hoher leerer Karten werden die Templates als **grosse Vorschaukarten** (mind. 200px hoch) dargestellt. Jede Karte zeigt:
- Einen farbigen Gradient-Header als Bild-Platzhalter
- Den Template-Namen gross
- Eine klare Beschreibung
- Bei Demo-Kampagnen: Vorausgefuellte Beispieltexte

### C) 3 Demo-Kampagnen vorgeneriert

Das Modul startet mit 3 hardcoded Demo-Kampagnen (je eine pro Brand), damit der User sofort sieht, wie fertige Kampagnen aussehen:

| Demo | Brand | Budget | Status | Templates |
|------|-------|--------|--------|-----------|
| 1 | Kaufy | 2.500 EUR | Live | Rendite-Highlight, Objekt-Showcase |
| 2 | FutureRoom | 3.000 EUR | Eingereicht | Berater-Portrait, Region-Focus |
| 3 | Acquiary | 1.800 EUR | Entwurf | Objekt-Showcase, Testimonial |

Jede Demo-Kampagne hat vorgenerierte Captions und CTAs, die zu den jeweiligen Brands passen.

## Detaillierte UI-Struktur (Top-to-Bottom)

```text
+====================================================================+
|  ModulePageHeader: LEAD MANAGER                                    |
|  "Social-Media-Kampagnen planen, Creatives gestalten, Leads        |
|   verwalten — alles an einem Ort."                                 |
+====================================================================+

+--------------------------------------------------------------------+
| KACHEL 1: UEBERSICHT (KPIs) — mit Demo-Daten vorbefuellt          |
|                                                                    |
|  [7.300 EUR]   [23 Leads]   [317 EUR CPL]   [2 Aktive]            |
|  Gesamtausg.   Generiert    Cost per Lead    Kampagnen             |
|                                                                    |
|  Filter-Badges: [Alle] [Kaufy] [FutureRoom] [Acquiary] [Projekte] |
+--------------------------------------------------------------------+

+--------------------------------------------------------------------+
| KACHEL 2: MEINE KAMPAGNEN — 3 Demo-Kampagnen vorgeladen           |
|                                                                    |
|  +--------------------------------------------------------------+  |
|  | [gradient: Kaufy-blau]                        [DEMO] [Live]  |  |
|  | Kaufy Fruehjahrs-Kampagne                                    |  |
|  | Budget: 2.500 EUR  |  01.03 - 31.03.2026  |  Muenchen        |  |
|  | "Kapitalanlage ab 289.000 EUR — Jetzt beraten lassen"         |  |
|  +--------------------------------------------------------------+  |
|  | [gradient: FutureRoom-gruen]                [DEMO] [Eingereicht]|
|  | FutureRoom Finanzierungs-Kampagne                             |  |
|  | Budget: 3.000 EUR  |  15.03 - 15.04.2026  |  Berlin, Hamburg  |  |
|  +--------------------------------------------------------------+  |
|  | [gradient: Acquiary-blau]                   [DEMO] [Entwurf]  |  |
|  | Acquiary Sourcing-Kampagne                                    |  |
|  | Budget: 1.800 EUR  |  01.04 - 30.04.2026  |  Frankfurt        |  |
|  +--------------------------------------------------------------+  |
+--------------------------------------------------------------------+

+--------------------------------------------------------------------+
| KACHEL 3: NEUE KAMPAGNE ERSTELLEN                                  |
|                                                                    |
|  "Waehlen Sie eine Vorlage oder erstellen Sie eine freie           |
|   Kampagne. Sie koennen alles anpassen."                           |
|                                                                    |
|  SCHRITT 1: Fuer wen moechten Sie werben?                          |
|  +------------------+ +------------------+ +------------------+    |
|  | [Kaufy-Gradient] | | [FR-Gradient]    | | [Acq-Gradient]   |   |
|  | KAUFY            | | FutureRoom       | | ACQUIARY         |   |
|  | Marktplatz &     | | Finanzierung     | | Sourcing &       |   |
|  | Investment       | |                  | | Akquisition      |   |
|  |                  | |                  | |                  |   |
|  | 4 Vorlagen       | | 4 Vorlagen       | | 4 Vorlagen       |   |
|  +------------------+ +------------------+ +------------------+    |
|                                                                    |
|  +------------------+ +--------------------------------------+     |
|  | [Projekt-Icon]   | | [Upload-Icon]                        |     |
|  | Mein Projekt     | | Eigene Kampagne                      |     |
|  | Waehlen Sie ein  | | Laden Sie eigene Bilder hoch und     |     |
|  | Projekt aus Ihrem| | gestalten Sie Ihre Kampagne frei.    |     |
|  | Portfolio        | |                                      |     |
|  +------------------+ +--------------------------------------+     |
|                                                                    |
|  SCHRITT 2: Kampagnen-Details                                      |
|  (Zwei-Spalten-Grid: Laufzeit, Budget, Regionen, Zielgruppe)      |
|  - Beschreibungstext unter jedem Feld                              |
|                                                                    |
|  SCHRITT 3: Anzeigen gestalten                                     |
|  "Waehlen Sie bis zu 5 Vorlagen. Jede Vorlage wird als            |
|   4-Slide-Anzeige fuer Facebook & Instagram generiert."            |
|                                                                    |
|  +---------------------------+ +---------------------------+       |
|  | [Gradient-BG 200px hoch]  | | [Gradient-BG 200px hoch]  |       |
|  | Bild-Bereich               | | Bild-Bereich              |       |
|  | (Upload oder Platzhalter)  | | (Upload oder Platzhalter) |       |
|  |                            | |                           |       |
|  | T1: Rendite-Highlight      | | T2: Berater-Portrait      |       |
|  | Renditezahlen und Fakten   | | Persoenliche Vorstellung  |       |
|  | im Fokus. Zeigen Sie       | | des Beraters. Schaffen    |       |
|  | Investoren, was moeglich   | | Sie Vertrauen durch       |       |
|  | ist.                       | | Kompetenz und Naehe.      |       |
|  |                            | |                           |       |
|  | Caption: [editierbar]      | | Caption: [editierbar]     |       |
|  | CTA: [editierbar]          | | CTA: [editierbar]         |       |
|  | [Eigenes Bild hochladen]   | | [Eigenes Bild hochladen]  |       |
|  +---------------------------+ +---------------------------+       |
|  (... weitere Templates im 2-Spalten-Grid)                         |
|                                                                    |
|  SCHRITT 4: Personalisierung                                       |
|  (Portrait-Upload groesser: 80x80px, mit Beispiel-Avatar)         |
|                                                                    |
|  SCHRITT 5: Vorschau & Beauftragen                                 |
|  (Zusammenfassung + grosser Beauftragen-Button)                    |
+--------------------------------------------------------------------+

+--------------------------------------------------------------------+
| KACHEL 4: MEINE LEADS — mit Demo-Leads vorbefuellt                |
|                                                                    |
|  5 Demo-Leads mit Status, Name, Datum, Brand-Zuordnung             |
+--------------------------------------------------------------------+
```

## Technische Umsetzung

### 1. `LeadManagerInline.tsx` — Komplett umschreiben (~800 Zeilen)

**Aenderungen im Detail:**

**a) Brand-Auswahl als visuelle Karten:**
- Wiederverwendung der Gradient-Farben aus `BrandLinkWidget` (`BRAND_CONFIGS`)
- 5 Karten in einem Grid: Kaufy, FutureRoom, Acquiary, "Mein Projekt", "Eigene Kampagne"
- Klick waehlt den Kontext; ausgewaehlte Karte bekommt `ring-2 ring-primary`
- "Eigene Kampagne" hat keinen Brand-Kontext — der User kann frei gestalten

**b) Template-Slots als grosse Vorschaukarten:**
- Mindesthoehe 200px statt 48px
- Gradient-Header-Bereich (brand-farbig) als Bild-Platzhalter
- Jeder Slot hat einen "Eigenes Bild hochladen"-Button (Dropzone)
- Vorausgefuellte Demo-Captions und CTAs je nach Brand
- 2-Spalten-Grid statt 5-Spalten (damit die Karten gross genug sind)

**c) 3 Demo-Kampagnen hardcoded:**
- Erscheinen in "Meine Kampagnen" mit `[DEMO]`-Badge (gruener Emerald-Glow)
- Haben realistische Daten (Daten, Budget, Regionen, Status)
- Werden vor den echten Kampagnen angezeigt
- Sind nicht editierbar, nur sichtbar als Referenz

**d) 5 Demo-Leads hardcoded:**
- Erscheinen in "Meine Leads" mit `[DEMO]`-Badge
- Verschiedene Status (Neu, Kontaktiert, Qualifiziert)
- Realistische deutsche Namen und Kontaktdaten

**e) Erklaerende Texte an jedem Schritt:**
- Jeder Schritt bekommt 1-2 Saetze Beschreibung unter der Ueberschrift
- Schritte heissen menschlicher: "Fuer wen moechten Sie werben?" statt "KONTEXT WAEHLEN"

**f) Sub-Tabs entfernen:**
- Die UEBERSICHT/KAMPAGNEN/STUDIO/LEADS Tabs kommen aus dem Manifest
- Da das Manifest bereits auf einen einzigen Inline-Tile umgestellt wurde, sollten die Tabs verschwinden
- Falls sie noch gerendert werden: im `routesManifest.ts` pruefen, ob `deprecated_routes` Tabs erzeugen

### 2. Brand-spezifische Demo-Vorlagen (4 pro Brand)

Jede Brand bekommt 4 vorgefertigte Template-Texte:

**Kaufy (Marktplatz):**
| Template | Caption | CTA |
|----------|---------|-----|
| Rendite-Highlight | "Bis zu 5,2% Mietrendite — Kapitalanlagen in Toplagen" | "Jetzt Objekte entdecken" |
| Berater-Portrait | "Ihr Immobilienexperte — persoenlich und kompetent" | "Kostenlose Beratung" |
| Objekt-Showcase | "Neubauwohnungen ab 289.000 EUR — bezugsfertig 2026" | "Expose anfordern" |
| Testimonial | "Ueber 200 zufriedene Investoren vertrauen Kaufy" | "Erfolgsgeschichten lesen" |

**FutureRoom (Finanzierung):**
| Template | Caption | CTA |
|----------|---------|-----|
| Rendite-Highlight | "Beste Konditionen ab 2,8% — ueber 400 Bankpartner" | "Konditionen vergleichen" |
| Berater-Portrait | "Ihr Finanzierungsexperte — digital und persoenlich" | "Beratung buchen" |
| Region-Focus | "Finanzierungsmarkt Muenchen — aktuelle Analyse" | "Marktbericht lesen" |
| Testimonial | "98% Abschlussquote bei KI-gestuetzter Aufbereitung" | "Jetzt starten" |

**Acquiary (Sourcing):**
| Template | Caption | CTA |
|----------|---------|-----|
| Rendite-Highlight | "Off-Market-Chancen — exklusive Objekte vor allen anderen" | "Portfolio ansehen" |
| Berater-Portrait | "Ihr Akquisitionspartner — strategisch und diskret" | "Kontakt aufnehmen" |
| Objekt-Showcase | "Mehrfamilienhaeuser in A-Lagen — 3-7% Rendite" | "Objektliste anfordern" |
| Region-Focus | "Sourcing-Hotspots 2026 — wo sich Investitionen lohnen" | "Analyse anfordern" |

### 3. Dateiaenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/lead-manager/LeadManagerInline.tsx` | Kompletter visueller Umbau |
| `src/manifests/routesManifest.ts` | Pruefen ob `deprecated_routes` Sub-Tabs erzeugt — ggf. bereinigen |

### 4. Umsetzungsreihenfolge

1. Demo-Daten (Kampagnen, Leads, Brand-Vorlagen) als Konstanten definieren
2. Brand-Auswahl als grosse visuelle Karten (Gradient-Cards) umbauen
3. Template-Slots als grosse Vorschaukarten mit Upload-Option
4. Erklaerende Texte und bessere Schritt-Bezeichnungen
5. KPI-Kachel mit Demo-Daten vorbefuellen
6. Lead-Kachel mit Demo-Leads
7. Sub-Tabs pruefen und bereinigen

