

# Plan: Option A — thomas.stelzl nur als Platform Admin

## Zusammenfassung

Die Client-Membership von `thomas.stelzl` wird entfernt. Dadurch hat dieser User nur noch **eine einzige Rolle** (`platform_admin` in der internen Organisation) und der Org-Switcher zeigt nur noch einen Eintrag.

## Änderungen

### 1. Datenbank: Client-Membership entfernen

**Migration SQL:**
```sql
-- Entferne die Client-Membership von thomas.stelzl
DELETE FROM memberships 
WHERE id = '72ace7cd-a28e-4fb1-b6b2-89f2ebebd690';
```

**Ergebnis:**
- thomas.stelzl hat nur noch: `platform_admin` in `System of a Town`
- test@example.com bleibt: `org_admin` in `test` (unser Test-Kunde)

### 2. UI: Org-Switcher vereinfachen (AdminLayout)

Da ein Platform Admin in der Regel nur eine interne Membership hat, wird der Switcher-Button vereinfacht:

- **Wenn nur 1 Org verfügbar**: Zeige nur den Badge ohne Dropdown-Pfeil
- **Wenn mehrere Orgs verfügbar**: Zeige Dropdown wie bisher (für Zukunft)

**Datei:** `src/components/admin/AdminLayout.tsx`

```text
Änderung in Zeile 109:
- {canSwitch && <ChevronDown className="h-3 w-3" />}
+ (bleibt, aber canSwitch wird jetzt false sein)

Optional: Button vereinfachen wenn canSwitch=false
```

### 3. Keine Code-Änderung nötig

Die bestehende Logik funktioniert bereits korrekt:
- `useOrgContext.canSwitch` gibt `false` zurück wenn nur 1 Org
- Der Dropdown zeigt dann nur 1 Eintrag
- Der ChevronDown wird nur bei `canSwitch=true` angezeigt

## Ergebnis nach Implementierung

| User | Org | Type | Role |
|------|-----|------|------|
| thomas.stelzl | System of a Town | internal | platform_admin |
| test@example.com | test | client | org_admin |

**Admin Portal zeigt:**
- Badge: `Internal / System of a Town`
- Kein Dropdown-Pfeil (nur 1 Org)
- Klarer, eindeutiger Kontext

## Technische Details

- **Migration-Typ:** DELETE (Daten-Änderung)
- **Betroffene Tabelle:** `memberships`
- **Betroffene User:** thomas.stelzl (d028bc99-...)
- **Risiko:** Niedrig (Membership kann bei Bedarf neu erstellt werden)

