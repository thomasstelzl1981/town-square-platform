

# Lennox Domain-Korrektur: `.de` / `.com` → `.app`

## Problem

Die offizielle Domain ist **lennoxandfriends.app**. An mehreren Stellen im Code und in der Datenbank wurde faelschlicherweise `.de` oder `.com` verwendet.

## Betroffene Stellen

| Stelle | Aktuell (FALSCH) | Korrektur |
|--------|-----------------|-----------|
| Auth-User (DB) | `robyn@lennoxandfriends.de` | `robyn@lennoxandfriends.app` |
| `src/pages/admin/petmanager/PetDeskKunden.tsx` Z.152 | `lennoxandfriends.de` | `lennoxandfriends.app` |
| `src/pages/zone3/lennox/LennoxLayout.tsx` Z.137 | `info@lennoxandfriends.com` | `info@lennoxandfriends.app` |
| `src/engines/demoData/petManagerDemo.ts` Z.34 | `info@lennoxandfriends.com` | `info@lennoxandfriends.app` |

## Umsetzung

### Schritt 1: Auth-User E-Mail in der Datenbank korrigieren

SQL-Migration:
```sql
UPDATE auth.users
SET email = 'robyn@lennoxandfriends.app'
WHERE email = 'robyn@lennoxandfriends.de';
```

Plus: Profil-Tabelle und ggf. `manager_applications` pruefen und dort ebenfalls korrigieren.

### Schritt 2: Code-Dateien korrigieren (3 Dateien)

1. **`src/pages/admin/petmanager/PetDeskKunden.tsx`** (Zeile 152)
   - `lennoxandfriends.de` → `lennoxandfriends.app`

2. **`src/pages/zone3/lennox/LennoxLayout.tsx`** (Zeile 137)
   - `info@lennoxandfriends.com` → `info@lennoxandfriends.app`

3. **`src/engines/demoData/petManagerDemo.ts`** (Zeile 34)
   - `info@lennoxandfriends.com` → `info@lennoxandfriends.app`

### Modul-Freeze-Check

- `PetDeskKunden.tsx` liegt in `src/pages/admin/` → kein Modul-Pfad, nicht frozen
- `LennoxLayout.tsx` liegt in `src/pages/zone3/` → kein Modul-Pfad, nicht frozen
- `petManagerDemo.ts` liegt in `src/engines/` → kein Modul-Pfad, nicht frozen

Alle Aenderungen sind in nicht-gefrorenen Bereichen.

