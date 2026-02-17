

## Pet Manager -- Neue Menuestruktur: 6 Kernbereiche

### Ist-Zustand

Der Pet Manager hat aktuell folgende Routen und Sidebar-Eintraege:

| Sidebar-Eintrag | Route | Seite | Status |
|-----------------|-------|-------|--------|
| Pension | `/portal/petmanager/pension` | PMPension.tsx | Funktional (Zimmer-Widgets + Belegungskalender) |
| Services | `/portal/petmanager/services` | PMServices.tsx | Funktional (Mitarbeiter-Widgets + Terminkalender) |
| Kalender | `/portal/petmanager/kalender` | PMKalender.tsx | Funktional (Wochen-/Monatsansicht) |

Nicht in der Sidebar, aber als Routen vorhanden:
- Dashboard, Buchungen (redirect -> Kalender), Leistungen, Kunden, Finanzen

### Soll-Zustand (neue Menuestruktur)

```text
Pet Manager
  1. Dashboard     -- Gesamtuebersicht (KPIs, naechste Termine)
  2. Pension       -- Zimmer anlegen + Belegungskalender (existiert bereits)
  3. Services      -- Mitarbeiter + Terminkalender (existiert bereits)
  4. Mitarbeiter   -- Eigene Seite: Mitarbeiterverwaltung (aus Services extrahiert)
  5. Kunden        -- Kundenuebersicht + Tier-Dossiers (existiert bereits)
  6. Finanzen      -- Rechnungen + Umsatz (existiert bereits)
```

### Aenderungen im Detail

#### 1. Neue Seite: Mitarbeiter (PMPersonal.tsx)
Die Mitarbeiterverwaltung wird aus PMServices.tsx herausgeloest in eine eigene Seite. Diese zeigt:
- Mitarbeiter-Widgets (Kacheln mit Name, Rolle, Services, Kontaktdaten)
- "+"-Kachel zum Anlegen neuer Mitarbeiter
- CRUD-Dialog (bestehende Logik aus PMServices)

PMServices.tsx behaelt den Terminkalender und zeigt die Mitarbeiter als Zeilen, aber die Verwaltung (Anlegen/Bearbeiten/Loeschen) erfolgt ueber die neue Mitarbeiter-Seite.

#### 2. Sidebar aktualisieren (moduleContents.ts)
MOD-22 subTiles auf 6 Eintraege erweitern:
- Dashboard (`/portal/petmanager/dashboard`)
- Pension (`/portal/petmanager/pension`)
- Services (`/portal/petmanager/services`)
- Mitarbeiter (`/portal/petmanager/mitarbeiter`)
- Kunden (`/portal/petmanager/kunden`)
- Finanzen (`/portal/petmanager/finanzen`)

#### 3. Routing aktualisieren (PetManagerPage.tsx)
- Neue Route `mitarbeiter` -> PMPersonal hinzufuegen
- Entfernen: Legacy-Redirects fuer `buchungen` und `raeume`
- "Kalender" als Route bleibt bestehen, aber ohne eigenen Sidebar-Eintrag (erreichbar ueber Dashboard-Link und direkt-URL)
- "Leistungen" bleibt als Route erreichbar (kein Sidebar-Eintrag)

#### 4. PMServices.tsx vereinfachen
- Mitarbeiter-Widgets und CRUD-Dialog entfernen (liegt jetzt in PMPersonal)
- Nur noch Terminkalender anzeigen mit Zeilen pro Mitarbeiter (read-only Ansicht der Mitarbeiter)
- "Mitarbeiter verwalten"-Link zur neuen Seite

### Technische Umsetzung

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/petmanager/PMPersonal.tsx` | **Neu** -- Mitarbeiter-Widgets + CRUD (aus PMServices extrahiert) |
| `src/pages/portal/petmanager/PMServices.tsx` | Vereinfachen: nur Terminkalender, kein Mitarbeiter-CRUD |
| `src/pages/portal/PetManagerPage.tsx` | Route `mitarbeiter` hinzufuegen, Legacy-Redirects bereinigen |
| `src/components/portal/HowItWorks/moduleContents.ts` | MOD-22 subTiles auf 6 Eintraege: Dashboard, Pension, Services, Mitarbeiter, Kunden, Finanzen |
| `src/pages/portal/petmanager/PMFinanzen.tsx` | PageShell-Wrapper hinzufuegen (fehlt aktuell) |

