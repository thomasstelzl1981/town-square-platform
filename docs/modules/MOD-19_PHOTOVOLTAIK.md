# MOD-19: Photovoltaik

## Übersicht

| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | `/portal/photovoltaik` |
| **Icon** | `Sun` |
| **Org-Types** | `client` |
| **Default Visible** | Ja |
| **Display Order** | 19 |

## Beschreibung

Das Photovoltaik-Modul begleitet Immobilienbesitzer bei der Planung, Installation und Betrieb von PV-Anlagen auf ihren Objekten.

## Tiles (4-Tile-Pattern)

### 1. Angebot
- **Route:** `/portal/photovoltaik/angebot`
- **Beschreibung:** PV-Angebote einholen
- **Funktionen:**
  - Objekt-Auswahl
  - Dachflächen-Analyse
  - Ertragsprognose
  - Anbieter-Anfragen

### 2. Checkliste
- **Route:** `/portal/photovoltaik/checkliste`
- **Beschreibung:** Installationsvorbereitung
- **Prüfpunkte:**
  - Dachzustand
  - Elektrik-Kapazität
  - Genehmigungen
  - Netzbetreiber-Anmeldung

### 3. Projekt
- **Route:** `/portal/photovoltaik/projekt`
- **Beschreibung:** Laufende PV-Projekte
- **Funktionen:**
  - Projekt-Status
  - Installations-Termine
  - Abnahme-Protokolle
  - Inbetriebnahme

### 4. Einstellungen
- **Route:** `/portal/photovoltaik/einstellungen`
- **Beschreibung:** PV-Konfiguration
- **Funktionen:**
  - Präferenzen
  - Benachrichtigungen
  - Förderprogramme

## Workflows

### PV-Projekt-Lifecycle (WorkflowSubbar)
```
inquiry_created → offers_compared → offer_accepted → 
checklist_completed → installation_scheduled → 
installed → commissioned → operational
```

## Datenmodell

### Primäre Tabellen
- `pv_projects` — PV-Projekte (zu erstellen)
- `pv_offers` — Angebote
- `pv_installations` — Installationen
- `cases` / `case_events` — Workflow-Tracking

## Integration

### Abhängigkeiten
- **MOD-04 (Immobilien):** Objekt-Verknüpfung
- **MOD-13 (Projekte):** Projekt-Management
- **MOD-16 (Services):** Installateure
- **MOD-18 (Finanzanalyse):** ROI-Berechnung
