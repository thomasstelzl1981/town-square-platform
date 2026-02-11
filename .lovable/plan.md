

# Fehlende CI-Ueberschriften in Portfolio, Sanierung und Bewertung

## Problem

Die drei Tabs **Portfolio**, **Sanierung** und **Bewertung** im Modul Immobilien starten direkt mit ihrem Inhalt, ohne die standardisierte CI-Ueberschrift. Der Tab **Kontexte** hat sie bereits korrekt implementiert:

```text
VERMIETEREINHEITEN                          ← text-2xl font-bold tracking-tight uppercase
Verwalten Sie Ihre steuerlichen Kontexte... ← text-sm text-muted-foreground mt-1
```

Portfolio, Sanierung und Bewertung haben diesen Block nicht.

## Loesung

In allen drei Dateien wird direkt nach dem aeusseren `<div>` (dem `max-w-7xl`-Wrapper) ein Header-Block eingefuegt — exakt im selben Stil wie bei KontexteTab:

### 1. PortfolioTab.tsx (Zeile 622)

Einfuegen nach `<div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">`:

```text
PORTFOLIO
Uebersicht und Verwaltung Ihrer Immobilien und Einheiten
```

### 2. SanierungTab.tsx (Zeile 79)

Einfuegen nach dem aeusseren Wrapper:

```text
SANIERUNG
Ausschreibungen, Angebote und Dokumentation Ihrer Sanierungsprojekte
```

### 3. BewertungTab.tsx (Zeile 65)

Einfuegen nach dem aeusseren Wrapper:

```text
BEWERTUNG
Marktwertermittlung und Gutachten fuer Ihre Liegenschaften
```

## Technische Details

- **Geaenderte Dateien:** 3 Dateien (PortfolioTab.tsx, SanierungTab.tsx, BewertungTab.tsx)
- **Aenderung pro Datei:** Einfuegen eines `<div>` mit `<h1>` (uppercase, bold, tracking-tight) und `<p>` (text-muted-foreground) — jeweils 4 Zeilen
- **Keine neuen Abhaengigkeiten**, keine Imports noetig
- Das bestehende `ModulePageHeader`-Shared-Component koennte alternativ verwendet werden, da es exakt dieses Pattern implementiert — das haelt den Code DRY

