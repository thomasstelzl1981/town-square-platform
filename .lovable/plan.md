

# Engine-Dokumentation: Konsolidierte Registry + Zone-1-Uebersicht

## Ausgangslage

Die Engine-Dokumentation ist aktuell fragmentiert:
- **UI-only**: `ArmstrongEngines.tsx` enthaelt ein hardcoded `ENGINE_REGISTRY` Array (15 Engines)
- **Einzel-Backlog**: `spec/current/06_engines/DATA_ENGINE_BACKLOG.md` (nur DocInt)
- **Code-Specs**: `src/engines/*/spec.ts` (10 Calculation Engines)
- **Keine konsolidierte Datei** fuer Governance, Audit oder menschliche Referenz

## Massnahmen

### 1. Konsolidierte ENGINE_REGISTRY.md erstellen

Neue Datei: `spec/current/06_engines/ENGINE_REGISTRY.md`

Inhalt:
- Alle 15 registrierten Engines in einer Uebersichtstabelle
- Pro Engine: Code, Name, Kategorie, Modul-Zuordnung, Status, Billing, Dateipfade
- 4 Kategorien: Kalkulation (9), Daten (2), KI (2), Infrastruktur (2)
- Governance-Regeln (pure functions, Tenant-Scope, Credit-Preflight)
- Changelog fuer Versionierung

Engines die dokumentiert werden:

**Kalkulation (9 Engines, alle Live, alle Free/Client-side):**

| Code | Name | Modul | Beschreibung |
|------|------|-------|-------------|
| ENG-AKQUISE | Akquise-Kalkulation | MOD-04/12 | Bestand (Hold) 30-Jahres-Projektion, Aufteiler (Flip) Gewinnermittlung |
| ENG-FINANCE | Finanzierungs-Engine | MOD-07/11 | Haushaltsueberschuss, Annuitaet, Bonitaetspruefung (LTV/DSCR) |
| ENG-PROVISION | Provisions-Engine | MOD-09 | Kaeuer/Verkaeufer-Split, Partner-Anteile, Tippgeber |
| ENG-BWA | Bewirtschaftungs-Engine | MOD-04 | BWA/NOI, Peters'sche Formel, Leerstandsanalyse |
| ENG-PROJEKT | Projekt-Kalkulation | MOD-13 | Bautraeger-Margen, Einheitspreise, Vertriebsstatus |
| ENG-NK | NK-Abrechnungs-Engine | MOD-04 | BetrKV-konforme Nebenkostenabrechnung, 18 Kostenarten |
| ENG-FINUEB | Finanzuebersicht-Engine | MOD-18 | Portfolio-Aggregation, 40-Jahres-Projektion, Vermoegensanalyse |
| ENG-VORSORGE | Vorsorgeluecke-Rechner | MOD-08 | Rentenluecke, BU-Luecke, DRV/Beamte/Selbststaendige |
| ENG-VVSTEUER | V+V Steuer-Engine | MOD-04 | Anlage V, AfA-Berechnung, Werbungskosten, Ueberschussermittlung |

**Daten (2 Engines):**

| Code | Name | Status | Billing |
|------|------|--------|---------|
| ENG-DOCINT | Document Intelligence | Teilweise | 1 Credit/PDF |
| ENG-RESEARCH | Research Engine (SOAT) | Teilweise | 2-4 Credits/Run |

**KI (2 Engines):**

| Code | Name | Status | Billing |
|------|------|--------|---------|
| ENG-ARMSTRONG | Armstrong KI-Copilot | Live | 0-12 Credits/Action |
| ENG-FILEINTEL | File Intelligence | Teilweise | 1 Credit/Research |

**Infrastruktur (2 Engines):**

| Code | Name | Status | Billing |
|------|------|--------|---------|
| ENG-DEMO | Demo-Daten Engine | Live | Free |
| ENG-GOLDEN | Golden Path Engine | Teilweise | Free |

### 2. ArmstrongEngines.tsx aktualisieren

Die UI-Komponente wird so angepasst, dass sie die `ENG-VVSTEUER` Engine korrekt anzeigt (ist bereits enthalten) und ein Hinweis auf die Spec-Datei als SSOT verweist.

### 3. Menschenlesbare Kurzreferenz in Zone 1

Zusaetzlich zur technischen Registry wird in der `ENGINE_REGISTRY.md` ein Abschnitt "Fuer Menschen" eingefuegt:
- Was macht jede Engine in einem Satz?
- Wo finde ich die Engine im Portal? (Modul-Zuordnung)
- Was kostet die Nutzung? (Free vs. Credits)
- Was ist der aktuelle Stand? (Live/Teilweise/Geplant)

---

## Technische Details

### Dateien die erstellt werden
- `spec/current/06_engines/ENGINE_REGISTRY.md` — Konsolidierte SSOT-Dokumentation

### Dateien die aktualisiert werden
- Keine Code-Aenderungen noetig — die UI liest bereits aus dem hardcoded Array

### Umfang
- 1 neue Markdown-Datei (~200 Zeilen)
- Abgleich mit allen 10 `spec.ts` Dateien und der UI-Registry

