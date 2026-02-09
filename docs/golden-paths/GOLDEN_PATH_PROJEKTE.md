# Golden Path: Projekte (Bauträger)

> **Pfad:** MOD-13 (Projekte) → MOD-04 (Immobilien) → MOD-06 (Verkauf)
> **Status:** FROZEN v1.0

---

## Übersicht

Der Projekt-Lifecycle führt von der Bauträger-Planung (MOD-13) über die Immobilienverwaltung (MOD-04) bis zum Vertrieb (MOD-06).

## Phasen

### Phase 1: Projekt-Anlage (MOD-13)
- Bauträger erstellt Projekt mit Basisdaten
- `dev_projects` Record mit Public ID (SOT-BT-*)
- Phasen: `planung` → `genehmigung` → `bau` → `vertrieb` → `uebergabe` → `abgeschlossen`
- ActionKey: `PROJECT_PHASE_CHANGE` bei jedem Phasenwechsel

### Phase 2: Einheiten-Planung (MOD-13)
- Einheiten (`dev_project_units`) mit Public ID (SOT-BE-*)
- Jede Einheit hat: Typ, Fläche, Preis, Etage, Status
- Status-Progression: `geplant` → `im_bau` → `fertig` → `reserviert` → `verkauft`

### Phase 3: Immobilien-Integration (MOD-04)
- Bei Fertigstellung: Einheiten werden zu `properties` / `units` konvertiert
- Verknüpfung via `dev_project_units.property_id`
- Immobilienakte wird automatisch angelegt

### Phase 4: Vertrieb (MOD-06)
- Fertige Einheiten können als Listings veröffentlicht werden
- ActionKey: `LISTING_PUBLISH` → Einheit auf Marktplatz
- Verkaufsauftrag mit Consent-System (agreement_templates)
- Partner-Zuweisung über MOD-09

### Phase 5: Übergabe & Abschluss
- Notarielle Beurkundung
- Eigentumsübergang dokumentiert
- Projekt-Status: `uebergabe` → `abgeschlossen`
- Projektakte (MOD-13 Dossier) wird archiviert

## Datenfluss

```
dev_projects (MOD-13)
  └── dev_project_units
       └── properties (MOD-04, bei Fertigstellung)
            └── listings (MOD-06, bei Vertrieb)
                 └── partner_deals (MOD-09, bei Verkauf)
```

## Camunda ActionKeys
- `PROJECT_PHASE_CHANGE` → Phasenwechsel
- `LISTING_PUBLISH` → Einheit veröffentlichen
- `LISTING_WITHDRAW` → Listing zurückziehen

## DMS-Struktur
```
MOD_13/
  └── {project_public_id}/
       ├── Baugenehmigung
       ├── Grundstück
       ├── Planung
       └── Einheiten/
            └── {unit_public_id}/
                 ├── Baubeschreibung
                 └── Kaufvertrag
```
