# MOD-13 — PROJEKTE (Project Management Workbench)

> **Version**: 1.2.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-24  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/projekte`  
> **SSOT-Rolle**: Source of Truth für Projektdaten, Einheiten, Preislisten, Listings und Projekt-Kampagnen

---

## 1. Executive Summary

MOD-13 "Projekte" (Display: "Projektmanager") ist die zentrale Projekt-Management-Workbench.
Sie unterstützt automatisierte Intake-Prozesse (KI-basiert aus Exposés/Preislisten), direkte
Projektaktivierung ohne Zone-1-Gate, automatische Listing-Distribution an MOD-09 und Zone 3 (Kaufy),
sowie Lead-Kampagnen für eigene Projekte über den integrierten Lead Manager.

---

## 2. FROZEN RULES

| ID | Regel |
|----|-------|
| **R1** | Jedes Projekt erhält eine `public_id` (SOT-BT-...) |
| **R2** | Aktivierung erstellt automatisch `listings` und `listing_publications` |
| **R3** | Standard-DMS-Hierarchie: `MOD_13/{project_code}` (7 Projekt- + 5 Einheiten-Ordner) |
| **R4** | Ein permanentes Demo-Projekt bleibt als Referenz in allen Views |
| **R5** | GoldenPathGuard umschließt Projekt-Detailseiten |
| **R6** | Magic Intake nutzt sequenzielle KI-Analyse: Exposé (Pro) → Kontext → Preisliste (Flash) |
| **R7** | Einheiten-Review-Tabelle ist inline-editierbar mit Validierung vor Erstellung |

---

## 3. Tiles (5)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Dashboard | `/portal/projekte/dashboard` | Projekt-Grid mit Status-KPIs, Manager-Visitenkarte und Magic Intake |
| Projekte | `/portal/projekte/projekte` | Projektliste mit Magic Intake und Verwaltung |
| Vertrieb | `/portal/projekte/vertrieb` | Vertriebsstatusreport und Verkaufssteuerung |
| Landing Page | `/portal/projekte/landing-page` | Landing-Page-Generierung für Projekte |
| Lead Manager | `/portal/projekte/lead-manager` | Projekt-Kampagnen: Lead-Generierung für eigene Projekte |

---

## 4. Magic Intake (KI-gestützter Projekt-Import)

### 4.1 Architektur

Der Magic Intake ist der zentrale Prozess für die automatisierte Projektanlage. Er nutzt eine
**zweistufige sequenzielle KI-Analyse** mit kontextübergreifender Informationsweitergabe.

### 4.2 KI-Modelle

| Stufe | Modell | Zweck |
|-------|--------|-------|
| Exposé-Analyse | `google/gemini-2.5-pro` | Maximale Dokumentverständnis-Qualität (Bilder, Tabellen, Freitext, WEG-Strukturen) |
| Preislisten-Parsing | `google/gemini-2.5-flash` | Schnelles Tool-Calling für strukturierte Tabellendaten |

### 4.3 Sequenzielle Analyse

1. **Stufe 1 — Exposé (gemini-2.5-pro + Tool-Calling)**
   - Extrahiert: Projektname, Adresse, Projekttyp (neubau/aufteilung), Baujahr, WEG-Struktur, Bauträger
   - Tool: `extract_project_data` mit 15+ Feldern inkl. `wegDetails[]`, `constructionYear`, `developer`
   - `max_tokens: 4000`

2. **Stufe 2 — Preisliste (gemini-2.5-flash + Tool-Calling MIT Exposé-Kontext)**
   - System-Prompt enthält den Exposé-Kontext (Projektname, WEGs, Typ)
   - Tool: `extract_units` mit 12 Feldern inkl. `hausgeld`, `instandhaltung`, `nettoRendite`, `weg`, `mietfaktor`
   - KI berechnet Rendite und Mietfaktor selbst wenn Kaufpreis + Miete vorhanden

### 4.4 Erweiterte Felder (Kapitalanleger-KPIs)

| Feld | Beschreibung | Quelle |
|------|-------------|--------|
| `hausgeld` | Monatliches Hausgeld (EUR) | Preisliste |
| `instandhaltung` | Instandhaltungsrücklage (EUR/Monat) | Preisliste |
| `nettoRendite` | Netto-Rendite in % | Berechnet: `((Miete×12 - Hausgeld×12) / Preis) × 100` |
| `weg` | WEG-Zuordnung | Exposé + Preisliste |
| `mietfaktor` | Kaufpreisfaktor | Berechnet: `Preis / (Miete×12)` |

### 4.5 Review-Step (Inline-Editing)

- Jede Zelle in der Einheiten-Tabelle ist click-to-edit
- "Einheit hinzufügen" Button für manuell ergänzte Einheiten
- Summenzeile: Gesamtfläche, Gesamtpreis, Gesamtmiete, Ø Rendite
- Erweiterte Spalten bei Aufteilungsobjekten: WEG, Hausgeld, Rendite, Mietfaktor

### 4.6 Validierung vor Erstellung

| Regel | Typ | Beschreibung |
|-------|-----|-------------|
| Projektname leer | Blocking Error | Erstellen nicht möglich |
| Einheiten ohne Preis | Warning | Gelbe Warnung |
| Doppelte Einheitennummern | Warning | Gelbe Warnung mit Liste |
| €/m²-Ausreißer >50% | Warning | Gelbe Warnung mit Anzahl |

### 4.7 DMS-Integration bei Erstellung

Beim Erstellen werden hochgeladene Dateien automatisch als `storage_nodes` (type: `file`)
in der Projekt-DMS-Struktur registriert:
- Exposé → `/{project_code}/01_expose/`
- Preisliste → `/{project_code}/02_preisliste/`

---

## 5. Lead Manager (Projekt-Kampagnen)

Der Lead Manager Tile rendert `<LeadManagerInline contextMode="project" />` aus MOD-10:
- Nur Projekt-Kampagnen sichtbar (keine Brand-Auswahl)
- Kampagnen/Leads gefiltert nach eigenen Projekten aus `dev_projects`
- `social_mandates.project_id` verknüpft Kampagnen mit Projekten
- Projektdaten (Name, Ort, Preisrange, Einheiten) fließen automatisch in Templates

---

## 6. Vertriebsstatusreport

- Aggregiert EUR-Werte: Volumen, Reserviert, Verkauft, Frei, Provision, Rohertrag
- 2-seitiger PDF-Export (Seite 1: Exposé + Bauträger, Seite 2: KPIs + Preisliste)
- E-Mail-Versand mit persistenten Empfängerlisten (localStorage)

---

## 7. Edge Functions

| Function | Zweck | KI-Modell |
|----------|-------|-----------|
| `sot-project-intake` | Automatisierter Projekt-Import (Analyze + Create) | gemini-2.5-pro (Exposé), gemini-2.5-flash (Preisliste) |
| `sot-listing-publish` | Listing-Veröffentlichung (Z2→Z1) | — |
| `sot-generate-landing-page` | Landing-Page-Generierung (Z2→Z3) | — |
| `sot-social-mandate-submit` | Kampagnen-Beauftragung mit `project_id` (Z2→Z1) | — |

---

## 8. Immobilienakten-Erstellung

Nach erfolgreichem Intake kann über den Button "Immobilienakten erstellen" auf der Projektdetailseite
für jede `dev_project_unit` automatisch:
1. Ein `properties`-Record in MOD-04 erstellt werden
2. Die Standard-DMS-Ordnerstruktur (`01_expose`, `02_grundrisse`, ...) angelegt werden
3. Die `property_id` in `dev_project_units` verknüpft werden

---

## 9. Tile-Catalog Eintrag

```yaml
MOD-13:
  code: "MOD-13"
  title: "Projektmanager"
  icon: "FolderKanban"
  main_route: "/portal/projekte"
  display_order: 13
  sub_tiles: [dashboard, projekte, vertrieb, landing-page, lead-manager]
```

---

## 10. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.2.0 | 2026-02-24 | Magic Intake v2: KI-Upgrade (gemini-2.5-pro für Exposé), sequenzielle Analyse mit Kontextweitergabe, erweiterte Felder (hausgeld, weg, rendite, mietfaktor), Inline-Editing Review-Tabelle, Validierung vor Erstellung, Immobilienakten-Bulk-Erstellung, DMS-Linkage bei Import. |
| 1.1.0 | 2026-02-18 | Tile "Lead Manager" hinzugefügt. Tiles komplett an Manifest angeglichen. |
| 1.0.0 | 2026-02-13 | Initial Release (Sprint S5) |
