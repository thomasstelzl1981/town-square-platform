

# Befund: MOD-05 Identitaetskrise + MSV-Altlasten

## Das Problem

MOD-05 hat in der Entwicklungsgeschichte **drei verschiedene Identitaeten** durchlaufen:

| Phase | MOD-05 war | Status heute |
|-------|-----------|--------------|
| Frueh | **MSV (Mietsonderverwaltung)** | Funktionalitaet nach MOD-04 verschoben |
| Mitte | **Website Builder** | Nach MOD-21 umgezogen, MOD-21 dann geloescht |
| Jetzt | **Pets (Haustiere)** | Aktuell aktiv im routesManifest |

**Das Ergebnis:** Ueberall im Code stehen noch alte MOD-05-Referenzen, die auf "MSV" oder "Website Builder" zeigen, obwohl MOD-05 heute "Pets" ist.

## Gefundene Altlasten (46+ Stellen)

### 1. Verwaiste Komponenten: `src/components/msv/` (9 Dateien)

Diese Dateien werden **nirgends importiert** — 0 Treffer fuer `from.*components/msv`:

- `CreditsDisplay.tsx`
- `LeaseFormDialog.tsx`
- `PaywallBanner.tsx`
- `PremiumLockBanner.tsx`
- `ReadinessChecklist.tsx`
- `RentalListingWizard.tsx`
- `RentalPublishDialog.tsx`
- `TemplateWizard.tsx`
- `index.ts`

→ **Komplett loeschen** (Dead Code)

### 2. Falsche MOD-05-Bezeichnungen im Code

| Datei | Problem |
|-------|---------|
| `src/constants/rolesMatrix.ts` | `MOD-05: "Website Builder"` — muss "Pets" sein |
| `src/components/presentation/MermaidDiagram.tsx` | `MOD-05 MSV` in 2 Diagrammen |
| `src/pages/presentation/PresentationPage.tsx` | `MOD-05 MSV` im ASCII-Diagramm |
| `src/docs/audit-tracker.md` | `MOD-05 Website Builder` |

### 3. Falsche MOD-05-Bezeichnungen in Specs

| Datei | Problem |
|-------|---------|
| `spec/current/01_platform/ZONE_OVERVIEW.md` | `MOD-05: MSV` |
| `spec/current/01_platform/ACCESS_MATRIX.md` | `MOD-05 MSV` |
| `spec/current/06_api_contracts/module_api_overview.md` | `MOD-05: MSV` — kompletter API-Block fuer ein nicht-existentes Modul |
| `spec/current/02_modules/mod-04_immobilien.md` | Referenziert `MOD-05 MSV` und `MOD-05 Website-Builder` |
| `spec/current/08_testing/E2E_TEST_BACKLOG.md` | `MOD-05 MSV/Pets` Mischbezeichnung |
| `spec/current/00_frozen/AUDIT_PASS_2026-02-02.txt` | `MOD-05 MSV` mit alten Tiles |

### 4. Legacy-Datenbank-Referenzen

- `msv_bank_accounts` wird in `KontenTab.tsx` und `FMUebersichtTab.tsx` referenziert — das ist aber **MOD-18 Finanzanalyse**, nicht MSV. Die Tabelle traegt nur noch den falschen Namens-Praefix.

### 5. IS24-Klarstellung

Die RentalPublishDialog in `src/components/msv/` ist Dead Code. Die IS24-Integration betrifft:
- **MOD-04 Immobilien** → Verwaltung-Tab (Vermietung, Publishing)
- **MOD-06 Verkauf** → VerkaufsauftragTab (Kauf-Inserate)
- **NICHT** eine separate "MSV" oder "Mietverwaltung"

Research Engines (Apify-basiertes Scraping) sind davon komplett getrennt und werden in einer eigenen Phase behandelt.

---

## Bereinigungsplan

### Schritt 1: Dead Code loeschen
- `src/components/msv/` — kompletter Ordner (9 Dateien, 0 Imports)
- `src/pages/portal/immobilien/RentalExposeDetail.tsx` — Stub-Redirect auf ein nicht-existentes Modul
- Route `vermietung/:id` aus routesManifest MOD-04 dynamic_routes entfernen
- `src/docs/backlog-v6.2-reparatur-msv.json` — historisches Backlog fuer MSV-Neubau (obsolet)

### Schritt 2: MOD-05 Referenzen korrigieren (Code)
- `rolesMatrix.ts`: `MOD-05 Website Builder` → `MOD-05 Pets`
- `MermaidDiagram.tsx`: `MOD-05 MSV` → `MOD-05 Pets` (2 Stellen)
- `PresentationPage.tsx`: `MOD-05 MSV` → `MOD-05 Pets`
- `audit-tracker.md`: Richtigstellung

### Schritt 3: MOD-05 Referenzen korrigieren (Specs)
- `ZONE_OVERVIEW.md`: `MOD-05: MSV` → `MOD-05: Pets`
- `ACCESS_MATRIX.md`: dto.
- `module_api_overview.md`: MSV-API-Block entfernen oder durch Pets ersetzen
- `mod-04_immobilien.md`: Cross-Module-References aktualisieren
- `E2E_TEST_BACKLOG.md`: Klarstellung
- `AUDIT_PASS_2026-02-02.txt`: Historisch, aber korrigieren

### Schritt 4: Tabellen-Praefix pruefen
- `msv_bank_accounts`: Gehoert funktional zu MOD-18 Finanzanalyse — Rename evaluieren oder als Legacy-Name dokumentieren

### Schritt 5: IS24-Integration korrekt planen
- Nur MOD-04 (Immobilien) und MOD-06 (Verkauf) betroffen
- Kein MSV-Modul involviert
- Research Engines als separate Phase

---

## Ergebnis

Nach dieser Bereinigung:
- MOD-05 = Pets (eindeutig, ueberall konsistent)
- Vermietungsfunktionen = Teil von MOD-04 Immobilien (Verwaltung-Tab)
- IS24 Publishing = MOD-04 + MOD-06
- Research = eigene Phase, eigene Engines
- 0 verwaiste MSV-Komponenten im Code

