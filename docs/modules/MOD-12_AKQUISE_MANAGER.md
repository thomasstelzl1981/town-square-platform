# MOD-12: Akquise-Manager

## Übersicht

| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | `/portal/akquise-manager` |
| **Icon** | `Briefcase` |
| **Org-Types** | `partner` |
| **Requires Activation** | Ja |
| **Display Order** | 12 |

## Beschreibung

Der Akquise-Manager ist das zentrale Tool für Partner zur systematischen Kundenakquise. Er unterstützt den gesamten Prozess von der Kontaktaufnahme bis zum Vertragsabschluss.

## Tiles (4-Tile-Pattern)

### 1. Dashboard
- **Route:** `/portal/akquise-manager/dashboard`
- **Beschreibung:** Übersicht aller Akquise-Aktivitäten
- **Metriken:**
  - Offene Kontakte
  - Konversionsrate
  - Pipeline-Wert
  - Aktivitäten heute/Woche

### 2. Kunden
- **Route:** `/portal/akquise-manager/kunden`
- **Beschreibung:** Kundenakquise verwalten
- **Funktionen:**
  - Kontakt-Liste mit Filtern
  - Akquise-Status-Tracking
  - Aktivitäts-Historie
  - Notizen & Tags

### 3. Mandate
- **Route:** `/portal/akquise-manager/mandate`
- **Beschreibung:** Aktive Mandate verwalten
- **Funktionen:**
  - Mandats-Übersicht
  - Fälligkeiten
  - Dokumentation
  - Provisionsverfolgung

### 4. Tools
- **Route:** `/portal/akquise-manager/tools`
- **Beschreibung:** Akquise-Werkzeuge
- **Funktionen:**
  - E-Mail-Vorlagen
  - Präsentations-Builder
  - Kalender-Integration
  - Reporting-Export

## Datenmodell

### Primäre Tabellen
- `customer_projects` — Kundenprojekte
- `contacts` — Kontakte
- `cases` — Case-Tracking
- `case_events` — Event-Historie

### Beziehungen
- N:1 `customer_projects` → `contacts`
- 1:N `customer_projects` → `case_events`

## Workflows

### Akquise-Lifecycle
```
contact_created → qualified → meeting_scheduled → 
proposal_sent → negotiation → mandate_signed → active
```

## Integration

### Abhängigkeiten
- **MOD-01 (Stammdaten):** Kontaktdaten
- **MOD-02 (KI Office):** E-Mail, Kalender
- **MOD-09 (Vertriebspartner):** Produkt-Katalog
- **MOD-10 (Leads):** Lead-Übernahme
