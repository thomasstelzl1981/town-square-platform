
## Plan: Projekt-Datenblatt — Vollständig editierbares Projektformular mit KI-Befüllung

### Konzept

Die bisherige "ProjectOverviewCard" wird zum **Projekt-Datenblatt** — einem vollständig editierbaren, speicherbaren Formular, das die gesetzlich vorgeschriebene Objektübersicht abbildet. Die KI-Extraktion (Magic Intake) liefert Vorschläge, die der Nutzer prüfen, korrigieren und dann per "Speichern" bestätigen kann.

### UI-Layout (Skizze)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [H3] Projektname (editierbar)                     [Gesamtpreis]      │
│  [MapPin] Adresse, PLZ Stadt                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─── BILDER (4 Slots) ────────────────────────────────────────────┐   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │   │
│  │  │  HERO    │  │  AUßEN   │  │  INNEN   │  │ UMGEBUNG │       │   │
│  │  │  (groß)  │  │          │  │          │  │          │       │   │
│  │  │ Upload/  │  │ Upload/  │  │ Upload/  │  │ Upload/  │       │   │
│  │  │ Vorschau │  │ Vorschau │  │ Vorschau │  │ Vorschau │       │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── LINKS: Objektdaten (editierbar) ──┬── RECHTS: Beschreibung ───┐ │
│  │                                       │                           │ │
│  │  Wohneinheiten    [___72___]          │  [Textarea / Markdown]    │ │
│  │  Wohnfläche       [___m²___]          │                           │ │
│  │  Baujahr          [__1980__]          │  Objektbeschreibung       │ │
│  │  Zustand          [__gepfl_]          │  (150-250 Wörter)         │ │
│  │  WEG-Struktur     [________]          │                           │ │
│  │  Stockwerke       [___3____]          │  ── Lagebeschreibung ──   │ │
│  │  Heizung          [________]          │  (100-150 Wörter)         │ │
│  │  Energieträger    [________]          │                           │ │
│  │  Energieklasse    [________]          │  [🤖 KI-Beschreibung      │ │
│  │  Stellplätze      [________]          │   generieren]             │ │
│  │  Verkäufer        [________]          │                           │ │
│  │  Anlagetyp        [________]          │  [↻ Neu generieren]       │ │
│  │  Bundesland       [NRW_____] ← NEU   │                           │ │
│  │                                       │                           │ │
│  ├─── Erwerbsnebenkosten ────────────────┤                           │ │
│  │  Grunderwerbsteuer [_6.5_%] (NRW)     │                           │ │
│  │  Notar/Gericht     [_2.0_%] (fest)    │                           │ │
│  │  Gesamt            = 8.5%             │                           │ │
│  │                                       │                           │ │
│  ├─── Steuerliche Parameter ─────────────┤                           │ │
│  │  AfA-Satz     [_2.0_%]               │                           │ │
│  │  AfA-Modell   [Linear §7.4]          │                           │ │
│  │  Grundanteil  [_20__%]               │                           │ │
│  │  Einkunftsart [V+V §21 EStG]         │                           │ │
│  │  WEG-Verwalt. [___EUR/WE___]          │                           │ │
│  │                                       │                           │ │
│  │  [💾 Projekt-Datenblatt speichern]    │                           │ │
│  └───────────────────────────────────────┴───────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Kernprinzipien

1. **KI = Vorschlag, Mensch = Entscheidung**: Jeder KI-extrahierte Wert ist editierbar
2. **Ein Speichern-Button für alles**: Alle Felder werden zusammen gespeichert
3. **Grunderwerbsteuer immer separat**: Wird nach Bundesland automatisch vorgeschlagen
4. **Notar/Gericht immer 2%**: Fester Pauschalsatz, nicht editierbar
5. **Bundesland = Pflichtfeld**: Steuert GrESt-Satz automatisch

### Bildbereich — 4 kategorisierte Upload-Slots

| Slot | Kategorie | Storage-Pfad | Beschreibung |
|---|---|---|---|
| 1 | `hero` | `{tenant}/{project}/images/hero.*` | Hauptbild für Exposés, Landingpages, Kaufy |
| 2 | `exterior` | `{tenant}/{project}/images/exterior.*` | Außenansicht des Gebäudes |
| 3 | `interior` | `{tenant}/{project}/images/interior.*` | Innenansicht (Musterwohnung) |
| 4 | `surroundings` | `{tenant}/{project}/images/surroundings.*` | Umgebung, Lage, Infrastruktur |

- Upload via Drag & Drop oder Klick
- Gespeichert in `tenant-documents` Bucket unter Projekt-Pfad
- Pfade werden in `dev_projects.project_images` (JSONB) gespeichert
- Format: `{ hero: "path", exterior: "path", interior: "path", surroundings: "path" }`

### Neue/Geänderte DB-Spalten

| Spalte | Typ | Beschreibung |
|---|---|---|
| `federal_state` | TEXT | Bundesland (z.B. "NRW", "BY") — steuert GrESt |
| `grest_rate_percent` | NUMERIC | Grunderwerbsteuersatz (automatisch nach Bundesland) |
| `notary_rate_percent` | NUMERIC | Notar/Gericht (Standard 2.0%) |
| `project_images` | JSONB | `{ hero, exterior, interior, surroundings }` |
| `management_company` | TEXT | WEG-Verwaltung Firma |
| `management_cost_per_unit` | NUMERIC | EUR/WE monatlich netto |
| `investment_type` | TEXT | Anlagetyp |
| `income_type` | TEXT | Einkunftsart |
| `condition_text` | TEXT | Zustand (Freitext) |
| `floors_count` | INTEGER | Stockwerke |
| `seller_name` | TEXT | Verkäufer |

Bereits vorhanden: `full_description`, `location_description`, `features`, `heating_type`, `energy_source`, `energy_class`, `renovation_year`, `parking_type`, `afa_rate_percent`, `afa_model`, `land_share_percent`

### GrESt nach Bundesland (Lookup-Tabelle im Code)

| Bundesland | Kürzel | GrESt |
|---|---|---|
| Baden-Württemberg | BW | 5.0% |
| Bayern | BY | 3.5% |
| Berlin | BE | 6.0% |
| Brandenburg | BB | 6.5% |
| Bremen | HB | 5.0% |
| Hamburg | HH | 5.5% |
| Hessen | HE | 6.0% |
| Mecklenburg-Vorpommern | MV | 6.0% |
| Niedersachsen | NI | 5.0% |
| Nordrhein-Westfalen | NW | 6.5% |
| Rheinland-Pfalz | RP | 5.0% |
| Saarland | SL | 6.5% |
| Sachsen | SN | 5.5% |
| Sachsen-Anhalt | ST | 5.0% |
| Schleswig-Holstein | SH | 6.5% |
| Thüringen | TH | 5.0% |

### KI-Beschreibungs-Button

**Edge Function: `sot-project-description`**

| Aspekt | Detail |
|---|---|
| Input | `{ projectId: string }` |
| Ablauf | 1. PDF-Pfad aus `intake_data.files.expose` lesen |
| | 2. PDF aus `tenant-documents` laden |
| | 3. An Gemini 3 Flash senden mit strukturiertem Prompt |
| | 4. Ergebnis zurückgeben (NICHT direkt speichern — Nutzer entscheidet) |
| Output | `{ description: string, location_description: string }` |
| Modell | `google/gemini-3-flash-preview` via Lovable AI Gateway |

**Prompt-Vorgaben:**
- Objektbeschreibung: 150-250 Wörter, 3 Absätze, professionell für Kapitalanleger
- Lagebeschreibung: 100-150 Wörter, Infrastruktur, Anbindung, Mikrolage
- Keine Superlative, sachlich-ansprechend

**UI-Flow:**
1. Button "KI-Beschreibung generieren" → Loading-State
2. Ergebnis wird in Textarea eingefüllt (editierbar!)
3. Nutzer korrigiert bei Bedarf
4. Erst beim Klick auf "Projekt-Datenblatt speichern" wird alles persistiert

### Komponenten-Architektur

| Datei | Beschreibung |
|---|---|
| `ProjectDataSheet.tsx` | Hauptkomponente (ersetzt ProjectOverviewCard) |
| `ProjectImageUpload.tsx` | 4-Slot Bildupload mit Kategorien |
| `ProjectFactsForm.tsx` | Editierbare Objektdaten (linke Spalte) |
| `ProjectDescriptionPanel.tsx` | Beschreibung + KI-Button (rechte Spalte) |
| `ProjectAcquisitionCosts.tsx` | GrESt + Notar separat mit Bundesland |
| `ProjectAfaFields.tsx` | Bleibt (bereits vorhanden), wird integriert |

### Speicher-Logik

Ein einziger `handleSave()` in `ProjectDataSheet.tsx`:
```
1. Alle Formularfelder sammeln
2. supabase.from('dev_projects').update({ ...allFields }).eq('id', projectId)
3. Bei Bildern: Upload zu tenant-documents, Pfade in project_images speichern
4. Toast "Projekt-Datenblatt gespeichert"
5. QueryClient invalidieren
```

### Implementierungsreihenfolge

| # | Schritt | Dateien |
|---|---|---|
| 1 | DB-Migration: Neue Spalten | SQL |
| 2 | ProjectDataSheet.tsx (Hauptformular) | Neue Datei |
| 3 | ProjectImageUpload.tsx (4-Slot Upload) | Neue Datei |
| 4 | ProjectFactsForm.tsx (editierbare Felder) | Neue Datei |
| 5 | ProjectDescriptionPanel.tsx + KI-Button | Neue Datei |
| 6 | ProjectAcquisitionCosts.tsx (GrESt/Notar) | Neue Datei |
| 7 | Edge Function sot-project-description | Neue Datei |
| 8 | Integration in Projekt-Detailansicht | Bestehende Datei |

### Nicht betroffen

- Keine Änderung an `sot-project-intake` (bleibt für initialen Import)
- Keine Änderung an MOD-04 (Immobilienakte)
- ProjectAfaFields.tsx wird in das neue Formular integriert (kein separater Save-Button mehr)
