

# Strategie: Systemweite Bereinigung ohne Kontextverlust

## Das Kernproblem

Jede Chat-Session hat ein begrenztes Kontextfenster. Grosse Audit-Plaene werden erstellt, aber nur teilweise umgesetzt. Die naechste Session weiss nichts von den offenen Punkten und startet ein neues Audit -- ein Teufelskreis.

## Die Loesung: Ein maschinenlesbarer Issue-Backlog im Code

Statt Findings nur in Freitext-Markdown zu dokumentieren (wie bisher in `audit-tracker.md`), erstellen wir eine **strukturierte JSON-Datei** als zentralen Backlog. Diese Datei ist:

- **Persistent** -- sie lebt im Code und ueberlebt jede Session
- **Maschinenlesbar** -- ich kann sie bei jedem Gespraechsstart sofort parsen
- **Priorisiert** -- jedes Issue hat Schwere, Kategorie und geschaetzten Aufwand
- **Abarbeitbar** -- ich kann Issues der Reihe nach abhaken, ohne den Ueberblick zu verlieren

## Dateistruktur: `src/docs/backlog.json`

```text
{
  "meta": { "version": "1.0", "last_scan": "2026-02-12", "total": 47, "done": 12 },
  "issues": [
    {
      "id": "CI-001",
      "zone": "z2",
      "module": "MOD-20",
      "category": "architecture",
      "severity": "medium",
      "title": "Miety TileShell nicht auf PageShell migriert",
      "fix": "TileShell.tsx durch PageShell ersetzen",
      "effort": "S",
      "status": "open"
    },
    ...
  ]
}
```

## Kategorien fuer den Komplett-Scan

Der initiale Scan deckt **alle Ebenen** systematisch ab:

| Kategorie | Was wird geprueft | Beispiele |
|-----------|-------------------|-----------|
| `architecture` | PageShell, Lazy-Loading, Router-Pattern | MOD-20 TileShell, fehlende Suspense |
| `ci` | Farben, Spacing, Header, Typografie, Icons | Falsche Ueberschriften-Groesse, fehlende ModulePageHeader |
| `manifest` | routesManifest, areaConfig, armstrongManifest | Fehlende Routen, verwaiste Eintraege |
| `spec` | API-Contracts, Golden Paths, Zone-Dokumente | Contracts ohne Implementation, veraltete Specs |
| `data` | DB-Schema, RLS, fehlende Indizes | Fehlender tenant_id Index |
| `ux` | Empty States, Placeholder-Texte, Mobile | Hardcoded Demo-Daten, fehlende Responsive-Breakpoints |
| `code-hygiene` | console.log, TODO, unused imports, deprecated | Verbleibende console.log-Aufrufe |

## Ablauf: 3-Phasen-Modell

### Phase 1: Komplett-Scan (1 Session)
Ich scanne systematisch alle Dateien und fuege jedes Finding als Issue in `backlog.json` ein. Kein Fix in dieser Phase -- nur Erfassung. Am Ende steht ein vollstaendiger Backlog mit geschaetztem Aufwand.

### Phase 2: Sprint-Abarbeitung (mehrere Sessions)
Jede folgende Session beginnt mit:
1. Lesen von `backlog.json`
2. Filtern nach `status: "open"`, sortiert nach Severity
3. Abarbeitung der naechsten 5-10 Issues (je nach Groesse)
4. Setzen von `status: "done"` fuer jedes erledigte Issue

So geht **nichts verloren** -- selbst nach Kontextwechsel oder Tagen Pause.

### Phase 3: Validierung
Nach Abschluss aller Issues ein finaler Durchlauf: Sind alle `done`? Gibt es neue Findings?

## Aufwandsschaetzungen (T-Shirt Sizes)

| Size | Bedeutung | Typisches Beispiel |
|------|-----------|-------------------|
| XS | 1-2 Zeilen aendern | Typo, fehlender Import |
| S | 5-20 Zeilen | Header hinzufuegen, Wrapper ersetzen |
| M | 20-100 Zeilen | Neue Komponente, Contract anlegen |
| L | 100+ Zeilen | Modul-Refactoring, neues Feature |

## Erwarteter Umfang

Basierend auf den bisherigen Audits schaetze ich **40-60 Issues** im initialen Scan, davon:
- ~15 bereits erledigt (aus Sprint 1+2)
- ~20 XS/S Issues (schnelle Fixes, 2-3 Sessions)
- ~10 M Issues (je 1 Session)
- ~5 L Issues (MOD-18, MOD-20 PageShell, E2E-Tests etc.)

## Warum das funktioniert

1. **Kein Kontextverlust**: Der Backlog ist eine Datei im Projekt -- nicht im Chat-Verlauf
2. **Fortschritt ist sichtbar**: `done: 12/47` zeigt sofort den Stand
3. **Keine Doppelarbeit**: Jedes Issue hat eine eindeutige ID
4. **Priorisierung**: Kritische Issues zuerst, Kosmetik zuletzt
5. **Jede Session ist produktiv**: Kein erneutes Audit noetig, direkter Einstieg in Fixes

## Technische Umsetzung

### Schritt 1 (diese Session)
- `src/docs/backlog.json` erstellen mit Meta-Schema
- Komplett-Scan starten: alle 21 Module, 3 Zonen, Manifeste, Specs, Contracts
- Jedes Finding als Issue mit ID, Kategorie, Severity und geschaetztem Aufwand eintragen

### Schritt 2 (Folgesessions)
- Jede Session beginnt mit: "Lies backlog.json und arbeite die naechsten offenen Issues ab"
- Du kannst auch nach Kategorie filtern: "Nur CI-Issues" oder "Nur Zone 3"

