

## Pet Manager -- 10 Zimmer, 3 Mitarbeiter + Arbeitszeiten/Urlaub

### 1. Demodaten: 10 Zimmer anlegen

SQL INSERT in `pet_rooms` fuer Provider `d0000000-...0050`, Tenant `a0000000-...0001`:

| # | Name | Typ | Kapazitaet |
|---|------|-----|------------|
| 1 | Zimmer 1 - Einzelzimmer | zimmer | 1 |
| 2 | Zimmer 2 - Komfort | zimmer | 2 |
| 3 | Zimmer 3 - Komfort | zimmer | 2 |
| 4 | Zimmer 4 - Familienzimmer | zimmer | 3 |
| 5 | Zimmer 5 - Familienzimmer | zimmer | 3 |
| 6 | Zimmer 6 - Suite | zimmer | 4 |
| 7 | Box 1 - Klein | box | 1 |
| 8 | Box 2 - Klein | box | 1 |
| 9 | Auslauf 1 - Garten | auslauf | 4 |
| 10 | Auslauf 2 - Wiese | auslauf | 3 |

Gesamtkapazitaet: 24 Tiere.

### 2. Neue Tabelle: `pet_staff_vacations`

Fuer Urlaubserfassung wird eine eigene Tabelle erstellt:

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | |
| staff_id | uuid FK -> pet_staff | Mitarbeiter |
| tenant_id | uuid | Mandant |
| start_date | date | Urlaubsbeginn |
| end_date | date | Urlaubsende |
| vacation_type | text | urlaub / krank / frei |
| notes | text | Notizen |
| created_at | timestamptz | |

RLS: Tenant-Isolation analog zu `pet_staff`.

### 3. Demodaten: 3 Mitarbeiter anlegen

| # | Name | Rolle | E-Mail | Telefon | Services | Arbeitszeiten |
|---|------|-------|--------|---------|----------|---------------|
| 1 | Anna Mueller | Hundefriseur | anna@lennox-dogs.de | 0171 1234567 | Hundesalon, Training | Mo-Fr 08:00-17:00 |
| 2 | Max Krause | Gassigeher | max@lennox-dogs.de | 0172 9876543 | Gassi, Tagesstaette | Mo-Sa 07:00-15:00 |
| 3 | Lisa Schmidt | Betreuer | lisa@lennox-dogs.de | 0173 5551234 | Tagesstaette, Training, Tierarzt | Mo-Fr 09:00-18:00 |

Die `work_hours` werden als strukturiertes JSON gespeichert:
```json
{
  "mon": { "start": "08:00", "end": "17:00" },
  "tue": { "start": "08:00", "end": "17:00" },
  ...
  "sat": null,
  "sun": null
}
```

### 4. Mitarbeiterakte erweitern (PMPersonal.tsx)

Zwei neue Sektionen in der Inline-Akte:

**Sektion: Arbeitszeiten**
- 7 Zeilen (Mo-So), je mit Start- und End-Uhrzeit (Input type="time")
- Switch pro Tag um aktiv/inaktiv zu setzen
- Wird in `work_hours` JSONB gespeichert

**Sektion: Urlaub / Abwesenheiten**
- Liste bestehender Urlaube (Start - Ende, Typ, Notiz)
- Plus-Button fuer neuen Urlaubseintrag (Inline-Zeile, kein Dialog)
- Loeschen-Button pro Eintrag

### 5. Hook-Erweiterung (usePetStaff.ts)

- Neuer Hook `useStaffVacations(staffId)` -- Liest Urlaube eines Mitarbeiters
- Neuer Hook `useCreateVacation()` -- Legt Urlaub an
- Neuer Hook `useDeleteVacation()` -- Loescht Urlaub

### Technische Umsetzung

| Datei | Aenderung |
|-------|-----------|
| Migration | 10 Zimmer INSERT + `pet_staff_vacations` Tabelle + RLS + 3 Mitarbeiter INSERT |
| `src/hooks/usePetStaff.ts` | Vacation-Hooks hinzufuegen |
| `src/pages/portal/petmanager/PMPersonal.tsx` | Arbeitszeiten-Sektion + Urlaubs-Sektion in Inline-Akte |

### Datenfluss-Uebersicht

```text
pet_staff (work_hours JSONB)
    │
    ├── Arbeitszeiten-Sektion: Lese/Schreibe work_hours
    │
    └── pet_staff_vacations (1:n)
            │
            └── Urlaubs-Sektion: CRUD ueber eigene Hooks
```

Die Verfuegbarkeits-Berechnung (Kalender-Darstellung) wird im naechsten Schritt implementiert -- hier werden erst die Basisdaten erfasst.
