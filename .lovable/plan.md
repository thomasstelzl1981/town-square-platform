
# Komplett-Aktualisierung: Tile Catalog, Manifeste, Specs — Diskrepanz-Audit

## Uebersicht

Nach vollstaendiger Analyse aller Manifest-Dateien, der `tile_catalog`-Datenbanktabelle, der Engine Registry und der Spec-Dateien gibt es **23 konkrete Diskrepanzen**, gruppiert in 5 Kategorien.

---

## A) tile_catalog (Datenbank) vs. routesManifest.ts

Die `tile_catalog`-Tabelle in der Datenbank ist an mehreren Stellen veraltet gegenueber `routesManifest.ts`.

### A1: MOD-03 DMS — sub_tiles veraltet
**DB:** `storage, posteingang, sortieren, einstellungen` (4 Tiles)
**Manifest:** `intelligenz (default), storage, posteingang, sortieren, intake` (5 Tiles)
**Fix:** `intelligenz` fehlt als Default-Tile, `intake` (Magic Intake) fehlt, `einstellungen` ist veraltet (heisst jetzt `intelligenz`)

### A2: MOD-04 Immobilien — sub_tiles-Titel veraltet
**DB:** `verwaltung` hat Titel "Verwaltung"
**Manifest:** `verwaltung` hat Titel "Steuer"
**Fix:** Titel in tile_catalog auf "Steuer" aktualisieren

### A3: MOD-05 Pets — Icon veraltet
**DB:** `icon_key: 'globe'` (falsch!)
**Manifest:** `icon: 'PawPrint'`
**Fix:** Icon auf `PawPrint` aktualisieren

### A4: MOD-09 Immomanager — sub_tiles veraltet
**DB:** `katalog, beratung, kunden, netzwerk, leadeingang` (Titel "Leadeingang" mit Route `/leads`)
**Manifest:** `katalog, beratung, kunden, network, systemgebuehr` (5 Tiles, "Provisionen" statt "Leadeingang")
**Fix:** `leadeingang` durch `systemgebuehr` (Provisionen) ersetzen, `leads`-Route entfernen

### A5: MOD-10 Lead Manager — sub_tiles komplett veraltet
**DB:** `uebersicht, kampagnen, studio, leads` (4 alte Tiles)
**Manifest:** `kampagnen (default), kaufy, futureroom, acquiary, projekte` (5 Tiles)
**Fix:** Komplette sub_tiles ersetzen

### A6: MOD-18 Finanzen — sub_tiles fehlen
**DB:** Kein Eintrag fuer MOD-18 in tile_catalog gefunden
**Manifest:** 9 Tiles (dashboard, konten, investment, kv, sachversicherungen, vorsorge, darlehen, abonnements, vorsorgedokumente)
**Fix:** MOD-18 Eintrag in tile_catalog einfuegen

### A7: MOD-20 Miety/Zuhause — sub_tiles fehlen
**DB:** Kein Eintrag fuer MOD-20 in tile_catalog gefunden
**Manifest:** 4 Tiles (uebersicht, versorgung, smarthome, kommunikation)
**Fix:** MOD-20 Eintrag in tile_catalog einfuegen

### A8: MOD-22 Pet Manager — sub_tiles veraltet
**DB:** `uebersicht, kunden, kalender` (3 Tiles, Route `/portal/pet-manager`)
**Manifest:** `dashboard (default), profil, pension, services, mitarbeiter, kunden, finanzen` (7 Tiles, Route `/portal/petmanager`)
**Fix:** sub_tiles komplett aktualisieren, Route von `/portal/pet-manager` auf `/portal/petmanager` korrigieren

### A9: MOD-01 Stammdaten — sub_tile "Rechtliches" fehlt
**DB:** `profil, vertraege, abrechnung, sicherheit, demo-daten` (5)
**Manifest:** `profil, vertraege, abrechnung, sicherheit, rechtliches, demo-daten` (6)
**Fix:** `rechtliches` Tile hinzufuegen

---

## B) storageManifest.ts — Naming-Inkonsistenzen

### B1: MOD-05 root_name falsch
**Ist:** `root_name: 'Mietverwaltung'`
**Soll:** `root_name: 'Pets'` (oder 'Haustiere')

### B2: MOD-18 root_name veraltet
**Ist:** `root_name: 'Finanzanalyse'`
**Soll:** `root_name: 'Finanzen'` (Label-Override in areaConfig)

### B3: MOD-22 fehlt komplett
**Fix:** MOD_22 Eintrag fuer Pet Manager hinzufuegen

---

## C) Engine Registry (ENGINE_REGISTRY.md)

### C1: ENG-KONTOMATCH — recurring.ts fehlt in Dateipfaden
**Ist:** `spec.ts, engine.ts`
**Soll:** `spec.ts, engine.ts, recurring.ts`
**Fix:** `recurring.ts` in Dateipfade aufnehmen

### C2: Engine-Zaehlung lueckenhaft
Die Registry zaehlt 10 Calc-Engines (ENG-AKQUISE bis ENG-KONTOMATCH) aber die Nummerierung in `engines/index.ts` springt von "Engine 10" auf "Engine 17".
**Fix:** Kommentare in `index.ts` bereinigen (Engines 11-16 sind Daten/KI/Infra-Engines, keine Calc-Engines)

---

## D) goldenPathProcesses.ts — Compliance-Luecken

### D1: GP-SIMULATION — widgetGrid + widgetCell = false
Einziger Portal-Prozess mit Compliance-Luecken (4/6 statt 6/6). Phase ist aber "done".
**Fix:** Entweder Compliance nachziehen oder Phase auf "2C" zuruecksetzen

### D2: GP-BROWSER-SESSION — demoWidget.compliance = false
`compliance.demoWidget: false` aber ein demoWidget-Objekt existiert trotzdem.
**Fix:** demoWidget-Badge auf 'Neu' belassen, aber compliance auf false (korrekt, da noch in Phase 1)

---

## E) recordCardManifest.ts — Modul-Code Zuordnung

### E1: insurance, vorsorge, subscription, bank_account → MOD_11 falsch
Diese Aktentypen verweisen auf `MOD_11` (Finanzierungsmanager), sollten aber auf `MOD_18` (Finanzen) zeigen, da dort die Tabellen verwaltet werden.
**Fix:** moduleCode auf `MOD_18` aendern fuer insurance, vorsorge, subscription, bank_account

---

## F) modules_freeze.json — Konsistenz

### F1: MOD-18 ist frozen, wurde aber per User-Anweisung unfrozen
Der User hat "UNFREEZE MOD-18" gesagt, aber die Datei zeigt noch `"frozen": true`.
**Fix:** `frozen: false` setzen, `unfrozen_at: "2026-02-24"` hinzufuegen

### F2: MOD-03 ist frozen, wurde aber per User-Anweisung unfrozen
**Fix:** `frozen: false` setzen, `unfrozen_at: "2026-02-24"` hinzufuegen

---

## G) Demo-Daten Registry (demoDataRegistry.ts)

### G1: demo_miety_homes.csv fehlt
Die CSV existiert in `public/demo-data/demo_miety_homes.csv`, ist aber nicht in `DEMO_DATA_SOURCES` registriert.
**Fix:** Eintrag fuer MOD-20 miety_homes hinzufuegen

### G2: demo_miety_contracts.csv fehlt
Ebenfalls nicht registriert.
**Fix:** Eintrag fuer MOD-20 miety_contracts hinzufuegen

### G3: demo_household_persons.csv fehlt
Existiert aber ist nicht registriert.
**Fix:** Eintrag fuer MOD-01 household_persons hinzufuegen

### G4: demo_vehicles.csv fehlt
**Fix:** Eintrag fuer MOD-17 vehicles hinzufuegen

### G5: demo_pv_plants.csv fehlt
**Fix:** Eintrag fuer MOD-19 pv_plants hinzufuegen

### G6: demo_vorsorge_contracts.csv fehlt
**Fix:** Eintrag hinzufuegen

### G7: demo_private_loans.csv fehlt
**Fix:** Eintrag hinzufuegen

---

## Zusammenfassung der Aenderungen

| Datei | Anzahl Fixes |
|-------|-------------|
| `tile_catalog` (DB Migration) | 9 Updates/Inserts |
| `src/config/storageManifest.ts` | 3 Fixes |
| `spec/current/06_engines/ENGINE_REGISTRY.md` | 2 Fixes |
| `src/manifests/goldenPathProcesses.ts` | Info-only (keine Aenderung noetig) |
| `src/config/recordCardManifest.ts` | 4 moduleCode-Fixes |
| `spec/current/00_frozen/modules_freeze.json` | 2 Unfreeze-Updates |
| `src/config/demoDataRegistry.ts` | 7 fehlende Eintraege |
| `src/engines/index.ts` | Kommentar-Bereinigung |

**Gesamt: 27 Fixes**, davon 9 in der Datenbank (tile_catalog), 18 in Code/Config-Dateien.

Keine Modul-Pfade betroffen (alle Aenderungen liegen in `src/config/`, `src/engines/`, `spec/` oder DB) — kein Modul-Unfreeze noetig ausser fuer die bereits freigegebenen MOD-03 und MOD-18.
