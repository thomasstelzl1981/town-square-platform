

# Feature-Roadmap: Was ist das und wie erstellen wir sie?

## Was ist eine Feature-Roadmap?

Eine Feature-Roadmap ist dein strategischer Fahrplan fuer die Weiterentwicklung des Systems. Waehrend die bisherigen Backlogs (backlog.json, mobile-backlog.json) sich auf **Bereinigung und technische Schulden** konzentriert haben — also darauf, das Bestehende sauber zu machen — beschreibt die Feature-Roadmap **was als Naechstes gebaut wird**.

Stell es dir so vor:
- **Backlog** = Aufraeumen, Reparieren, Optimieren (erledigt!)
- **Feature-Roadmap** = Neue Funktionen, echte Business-Logik, Live-Daten

## Ausgangslage

Nach 3 Sprints ist das System sauber: 0 offene Cleanup-Issues. Im backlog.json stehen bereits 7 "roadmap_carried_forward" Items, die den Kern der Roadmap bilden. Zusaetzlich gibt es 2 offene Issues (AUD-014, AUD-015), die Stub-Module betreffen.

## Was die Roadmap enthalten wird

### Datei: `src/docs/feature-roadmap.json`

Eine neue, strukturierte JSON-Datei mit folgenden Bereichen:

### Kategorie 1: Stub-Module live schalten
Module, die aktuell nur Platzhalter-Seiten zeigen und echte Implementierung brauchen:

| ID | Modul | Beschreibung | Aufwand |
|----|-------|-------------|---------|
| FEAT-001 | MOD-10 Leads | 4 Stubs (Inbox, Pipeline, Werbung, Meine Leads) mit echten Workflows ersetzen | L |
| FEAT-002 | MOD-18 Finanzanalyse | 4 Stubs (Dashboard, Reports, Szenarien, Einstellungen) implementieren | L |

### Kategorie 2: Datenbank-Persistenz
Features, die aktuell nur im Frontend simuliert werden und DB-Anbindung brauchen:

| ID | Modul | Beschreibung | Aufwand |
|----|-------|-------------|---------|
| FEAT-003 | MOD-08 Investments | Favoriten in DB persistieren (investment_favorites Tabelle) | M |
| FEAT-004 | MOD-03 DMS | Storage-Usage Edge Function fuer echte Speicherplatz-Anzeige | M |

### Kategorie 3: Workflows und Wizards
Komplexe Business-Logik, die noch fehlt:

| ID | Modul | Beschreibung | Aufwand |
|----|-------|-------------|---------|
| FEAT-005 | MOD-12 Akquise | MandatCreateWizard fuer Akquise-Manager implementieren | M |
| FEAT-006 | MOD-12 Akquise | Absage-E-Mail tatsaechlich versenden (Edge Function) | M |

### Kategorie 4: Dokumentation und Architektur
Systemweite Verbesserungen:

| ID | Modul | Beschreibung | Aufwand |
|----|-------|-------------|---------|
| FEAT-007 | GLOBAL | Modul-Specs fuer 15 Module ohne detaillierte Spezifikation erstellen | L |
| FEAT-008 | GLOBAL | Bundle-Analyse: ManifestRouter 80+ lazy() Imports optimieren | M |

### Kategorie 5: Integrations-Stubs
Externe Dienste, die vorbereitet aber noch nicht angebunden sind:

| ID | Modul | Beschreibung | Aufwand |
|----|-------|-------------|---------|
| FEAT-009 | MOD-14 Social | HeyGen Video-Integration (aktuell Stub-Job) | M |
| FEAT-010 | MOD-10 SelfieAds | Mandat-Checkout / Bezahl-Flow (aktuell Toast-Stub) | M |

### Priorisierung

Die Roadmap wird in 3 Phasen gegliedert:
- **Phase A (Fundament):** DB-Persistenz + fehlende Specs (FEAT-003, 004, 007)
- **Phase B (Core Features):** Stub-Module live + Wizards (FEAT-001, 002, 005, 006)
- **Phase C (Integrations):** Externe Dienste + Optimierung (FEAT-008, 009, 010)

## Technische Umsetzung

1. Neue Datei `src/docs/feature-roadmap.json` im gleichen Format wie die Backlogs erstellen
2. Die 7 bestehenden ROAD-Items aus backlog.json als Basis uebernehmen
3. Zusaetzliche Items aus dem Code-Scan (Stubs, TODOs) ergaenzen
4. Backlog.json um einen Verweis auf die Roadmap ergaenzen
5. Status-Tracking: Jedes Item bekommt `status: "planned"` und wird bei Umsetzung auf `"in_progress"` / `"done"` gesetzt

