# MOD-16: Services

## Übersicht

| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | `/portal/services` |
| **Icon** | `Wrench` |
| **Org-Types** | `client`, `partner` |
| **Default Visible** | Ja |
| **Display Order** | 16 |

## Beschreibung

Das Services-Modul ist der zentrale Marktplatz für zusätzliche Dienstleistungen rund um Immobilien: Handwerker, Gutachter, Rechtsberatung, Energieberatung und mehr.

## Tiles (4-Tile-Pattern)

### 1. Katalog
- **Route:** `/portal/services/katalog`
- **Beschreibung:** Verfügbare Dienstleistungen
- **Kategorien:**
  - Handwerk & Sanierung
  - Gutachten & Bewertung
  - Recht & Steuern
  - Energie & Umwelt
  - Versicherungen

### 2. Anfragen
- **Route:** `/portal/services/anfragen`
- **Beschreibung:** Offene Anfragen
- **Funktionen:**
  - Anfrage erstellen
  - Angebote vergleichen
  - Kommunikation mit Anbietern

### 3. Aufträge
- **Route:** `/portal/services/auftraege`
- **Beschreibung:** Aktive Aufträge
- **Funktionen:**
  - Auftrags-Tracking
  - Termin-Management
  - Abnahme-Protokolle
  - Bewertungen

### 4. Einstellungen
- **Route:** `/portal/services/einstellungen`
- **Beschreibung:** Service-Präferenzen
- **Funktionen:**
  - Bevorzugte Anbieter
  - Benachrichtigungen
  - Objekt-Verknüpfungen

## Datenmodell

### Primäre Tabellen
- `service_catalog` — Dienstleistungen (zu erstellen)
- `service_requests` — Anfragen
- `service_orders` — Aufträge
- `service_reviews` — Bewertungen

## Workflows

### Service-Lifecycle (WorkflowSubbar)
```
request_created → offers_received → offer_accepted → 
in_progress → completed → reviewed
```

## Integration

### Abhängigkeiten
- **MOD-04 (Immobilien):** Objekt-Verknüpfung
- **MOD-13 (Projekte):** Projekt-Integration
- **MOD-19 (Photovoltaik):** PV-Installateure
