

# Auto-Befuellung der Hauptperson bei Account-Eroeffnung

## Problem

Wenn ein neuer Nutzer sich registriert, wird zwar ein Profil (`profiles`) und eine Organisation erstellt, aber **keine Hauptperson** in `household_persons` angelegt. Das bedeutet, dass sowohl in MOD-18 (Finanzen) als auch in MOD-07/MOD-11 (Finanzierung/Selbstauskunft) die Personen-Liste beim ersten Besuch leer ist.

## Loesung

Den bestehenden Signup-Trigger `handle_new_user()` um einen INSERT in `household_persons` erweitern. So ist bei jedem neuen Account sofort Person #1 (Hauptperson / Accountinhaber) vorhanden — vorbefuellt mit Name und E-Mail aus der Registrierung.

## Aenderungen

### 1. Datenbank-Migration: `handle_new_user()` erweitern

Nach dem bestehenden `INSERT INTO public.memberships` wird ein neuer Block eingefuegt:

```sql
-- Create primary household person (Hauptperson) from signup data
INSERT INTO public.household_persons (
  tenant_id, user_id, role, is_primary, sort_order,
  first_name, last_name, email
) VALUES (
  new_org_id,
  NEW.id,
  'hauptperson',
  true,
  0,
  COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
  COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
  NEW.email
);
```

Das nutzt `first_name` / `last_name` aus den Signup-Metadaten (falls vorhanden), ansonsten den E-Mail-Prefix als Vorname. Die Person ist sofort als `is_primary = true` und `role = 'hauptperson'` markiert.

### 2. Frontend: Hauptperson nicht loeschbar (bereits implementiert)

In `UebersichtTab.tsx` (Zeile 175) ist bereits die Logik vorhanden:

```tsx
onDelete={!person.is_primary ? () => handleDelete(person.id) : undefined}
```

Die Hauptperson kann also nicht geloescht werden — nur editiert. Das passt zur Anforderung.

### 3. Frontend: Alle Felder bleiben editierbar (bereits implementiert)

Sowohl in MOD-18 (UebersichtTab) als auch in MOD-11 (FMUebersichtTab) sind alle Felder der Hauptperson als normale Input-Felder implementiert — vollstaendig aenderbar und speicherbar. Keine Aenderung noetig.

### 4. Bestehende Accounts: Backfill-Migration

Fuer bereits existierende Nutzer, die noch keine Hauptperson haben, wird ein einmaliger Backfill ausgefuehrt:

```sql
INSERT INTO public.household_persons (tenant_id, user_id, role, is_primary, sort_order, first_name, email)
SELECT 
  p.active_tenant_id,
  p.id,
  'hauptperson',
  true,
  0,
  COALESCE(p.display_name, split_part(p.email, '@', 1)),
  p.email
FROM public.profiles p
WHERE p.active_tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.household_persons hp 
    WHERE hp.tenant_id = p.active_tenant_id AND hp.is_primary = true
  );
```

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| Neue SQL-Migration | `handle_new_user()` erweitern + Backfill |

## Kein Frontend-Code noetig

Die UI in beiden Modulen (MOD-18 und MOD-11) liest bereits aus `household_persons` und zeigt die Hauptperson als erste RecordCard an. Durch den Trigger ist diese ab sofort bei Account-Eroeffnung vorbefuellt. Alle Felder bleiben editierbar und speicherbar.

