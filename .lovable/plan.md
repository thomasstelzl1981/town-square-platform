

## Pet Manager — Zwei-Bereiche-Architektur: Pension + Services

### Konzept

Der Pet Manager wird in zwei klar getrennte operative Bereiche aufgeteilt, die parallel betrieben werden:

```text
Pet Manager
├── Dashboard (Gesamtübersicht)
├── Pension (zimmerbasiert)
│   ├── Zimmer-Widgets (Anlage erfassen)
│   └── Belegungskalender (entsteht aus Zimmern)
├── Services (mitarbeiterbasiert)
│   ├── Mitarbeiter-Widgets (Team verwalten)
│   └── Dienstleistungs-Kalender (pro Mitarbeiter)
└── Leistungen (Servicekatalog, beide Bereiche)
```

### Bereich 1: Pension

**Logik:** Kapazität = Anzahl Zimmer x Hunde pro Zimmer. Mitarbeiter sind hier irrelevant.

**Aufbau der Seite:**
1. **Zimmer-Widgets oben** — Jedes Zimmer ist eine Kachel (wie die CI-Kacheln). Eine "+"-Kachel erstellt ein neues Zimmer. Pro Zimmer wird definiert:
   - Name (z.B. "Zimmer 1")
   - Kapazität (1, 2, 3, 4 Hunde — frei wählbar)
   - Raumtyp (Zimmer, Auslauf, Box)
   - Status (frei/teilbelegt/voll — farbcodiert)
2. **Belegungskalender darunter** — Entsteht automatisch aus den angelegten Zimmern. Zeilen = Zimmer, Spalten = Tage. Farbige Blöcke zeigen belegte Zeiträume. Sofort erkennbar: welches Zimmer ist wann frei.

### Bereich 2: Services

**Logik:** Kapazität = Anzahl Mitarbeiter x verfügbare Zeitslots. Zimmer sind hier irrelevant.

**Aufbau der Seite:**
1. **Mitarbeiter-Widgets oben** — Jeder Mitarbeiter ist eine Kachel (wie bei der Finanzübersicht). Eine "+"-Kachel erstellt einen neuen Mitarbeiter. Pro Mitarbeiter:
   - Name, Rolle, Kontaktdaten
   - Zugewiesene Dienstleistungen (Gassi, Salon, Tagesstätte)
   - Arbeitszeiten
2. **Dienstleistungs-Kalender darunter** — Pro Mitarbeiter ein Kalender mit gebuchten Terminen. Zeigt: wer macht wann was.

### Navigation (Sidebar)

Die Sidebar-Kacheln werden auf 3 Einträge reduziert:
- **Pension** (Route: `/portal/petmanager/pension`)
- **Services** (Route: `/portal/petmanager/services`)
- **Kalender** (Route: `/portal/petmanager/kalender` — bisheriger visueller Kalender, zeigt Gesamtübersicht beider Bereiche)

"Buchungen" als separater Menüpunkt entfällt — die Buchungsverwaltung (Annehmen/Ablehnen/Check-In/Check-Out) wird in den jeweiligen Bereich integriert.

### Datenbank-Erweiterungen

Neue Tabelle `pet_staff` (Mitarbeiter):

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | PK |
| provider_id | uuid | FK auf pet_providers |
| tenant_id | uuid | Mandant |
| name | text | Name des Mitarbeiters |
| role | text | z.B. "Hundefriseur", "Gassigeher", "Betreuer" |
| email | text | Optional |
| phone | text | Optional |
| is_active | boolean | Aktiv/Inaktiv |
| services | text[] | Zugewiesene Service-Kategorien |
| work_hours | jsonb | Arbeitszeiten pro Wochentag |
| sort_order | int | Sortierung |

Erweiterung `pet_rooms`:
- Spalte `area` hinzufügen: `pension` oder `service` (Default: `pension`) — damit Zimmer klar dem Pensionsbereich zugeordnet werden.

Erweiterung `pet_bookings`:
- Spalte `staff_id` (uuid, nullable, FK auf `pet_staff`) — ordnet eine Buchung einem Mitarbeiter zu.
- Spalte `booking_area` (text: `pension` | `service`) — kennzeichnet den Bereich.

### Technische Umsetzung

**Neue Dateien:**
| Datei | Beschreibung |
|-------|-------------|
| `src/pages/portal/petmanager/PMPension.tsx` | Pensionsbereich: Zimmer-Widgets + Belegungskalender |
| `src/pages/portal/petmanager/PMServices.tsx` | Services-Bereich: Mitarbeiter-Widgets + Terminkalender |
| `src/hooks/usePetStaff.ts` | CRUD-Hooks für Mitarbeiter |

**Geänderte Dateien:**
| Datei | Änderung |
|-------|----------|
| `PetManagerPage.tsx` | Neue Routen `pension` und `services`, Route `buchungen` entfernen |
| `moduleContents.ts` | Sidebar: "Buchungen" und "Räume" ersetzen durch "Pension" und "Services" |
| `PMKalender.tsx` | Titel von "Kalender" beibehalten, zeigt Gesamtübersicht beider Bereiche |
| `usePetRooms.ts` | Erweitern um `area`-Filter |

**Entfallende Seiten (Funktionalität wird integriert):**
- `PMBuchungen.tsx` — Buchungslogik wird in Pension und Services eingebaut
- `PMRaeume.tsx` — Zimmerverwaltung wird Teil von PMPension

### UI-Details Pension

```text
┌─────────────────────────────────────────────────────┐
│  PENSION                                            │
├─────────┬─────────┬─────────┬─────────┬─────────────┤
│ Zimmer 1│ Zimmer 2│ Zimmer 3│ Zimmer 4│  + Zimmer   │
│ 2/3 🐕  │ 0/2 🐕  │ 1/1 🐕  │ 0/4 🐕  │  anlegen    │
│ [amber] │ [green] │ [red]   │ [green] │  [dashed]   │
├─────────┴─────────┴─────────┴─────────┴─────────────┤
│  BELEGUNGSKALENDER                                  │
│  ┌──────┬──Mo──┬──Di──┬──Mi──┬──Do──┬──Fr──┬──Sa──┐│
│  │Zi. 1 │█████ │█████ │      │██████│██████│      ││
│  │Zi. 2 │      │      │      │      │      │      ││
│  │Zi. 3 │██████│██████│██████│██████│██████│██████ ││
│  │Zi. 4 │      │      │██    │██    │      │      ││
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘│
└─────────────────────────────────────────────────────┘
```

### UI-Details Services

```text
┌─────────────────────────────────────────────────────┐
│  SERVICES                                           │
├───────────┬───────────┬───────────┬─────────────────┤
│  Anna M.  │  Max K.   │  Lisa S.  │  + Mitarbeiter  │
│  Salon    │  Gassi    │  Tagesstä.│  anlegen        │
│  3 Termine│  5 Termine│  2 Termine│  [dashed]       │
├───────────┴───────────┴───────────┴─────────────────┤
│  TERMINKALENDER                                     │
│  ┌──────┬──09:00─┬──10:00─┬──11:00─┬──12:00─┬─...──┐│
│  │Anna  │ Waschen│ Schneid│        │ Schneid│      ││
│  │Max   │ Gassi  │ Gassi  │ Gassi  │        │Gassi ││
│  │Lisa  │        │Betreuun│Betreuun│Betreuun│      ││
│  └──────┴────────┴────────┴────────┴────────┴──────┘│
└─────────────────────────────────────────────────────┘
```

### Reihenfolge der Umsetzung

1. Datenbank: `pet_staff` Tabelle + Erweiterungen an `pet_rooms` und `pet_bookings`
2. `usePetStaff.ts` Hook erstellen
3. `PMPension.tsx` bauen (Zimmer-Widgets + Belegungskalender)
4. `PMServices.tsx` bauen (Mitarbeiter-Widgets + Terminkalender)
5. Routing und Sidebar aktualisieren
6. Alte Seiten (`PMBuchungen`, `PMRaeume`) entfernen oder umleiten

