# MOD-17: Car-Management

## Übersicht

| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | `/portal/cars` |
| **Icon** | `Car` |
| **Org-Types** | `partner` |
| **Requires Activation** | Ja |
| **Display Order** | 17 |

## Beschreibung

Car-Management ist ein Add-on-Modul für Partner zur Verwaltung von Firmenfahrzeugen, Leasing-Verträgen und Fuhrpark-Services.

## Tiles (4-Tile-Pattern)

### 1. Übersicht
- **Route:** `/portal/cars/uebersicht`
- **Beschreibung:** Fuhrpark-Dashboard
- **Metriken:**
  - Aktive Fahrzeuge
  - Anstehende Services
  - Kosten-Übersicht
  - Kilometer-Tracking

### 2. Fahrzeuge
- **Route:** `/portal/cars/fahrzeuge`
- **Beschreibung:** Fahrzeugverwaltung
- **Funktionen:**
  - Fahrzeug-Liste
  - Leasing-Details
  - Versicherungs-Dokumente
  - Zulassungs-Daten

### 3. Service
- **Route:** `/portal/cars/service`
- **Beschreibung:** Wartung & Reparatur
- **Funktionen:**
  - Service-Termine
  - Werkstatt-Buchungen
  - Service-Historie
  - Reifenwechsel-Tracking

### 4. Einstellungen
- **Route:** `/portal/cars/einstellungen`
- **Beschreibung:** Fuhrpark-Konfiguration
- **Funktionen:**
  - Benachrichtigungen
  - Service-Intervalle
  - Kosten-Budgets

## Datenmodell

### Primäre Tabellen
- `vehicles` — Fahrzeuge (zu erstellen)
- `vehicle_leases` — Leasing-Verträge
- `vehicle_services` — Service-Termine
- `vehicle_costs` — Kosten-Tracking

## Integration

### Abhängigkeiten
- **MOD-02 (KI Office):** Kalender-Sync
- **MOD-03 (DMS):** Dokumente
