

# Fix: User Registration Fehler

## Problem-Analyse

Bei der Registrierung neuer Benutzer schlägt der `handle_new_user()` Database-Trigger fehl, weil er `materialized_path = ''` (leerer String) setzt. Der Check-Constraint `valid_materialized_path` erlaubt jedoch nur:
- `'/'` für Root-Organisationen
- Oder UUID-Pfade im Format `/uuid/uuid/.../`

**Fehlermeldung aus Auth-Logs:**
```
new row for relation "organizations" violates check constraint "valid_materialized_path"
```

---

## Lösung

Eine einfache Migration, die den `handle_new_user()` Trigger aktualisiert.

### Änderung

| Zeile | Vorher | Nachher |
|-------|--------|---------|
| 32 | `materialized_path = ''` | `materialized_path = '/'` |

---

## Implementierung

### Neue Migration erstellen

```sql
-- Fix: materialized_path muss '/' sein für Root-Organisationen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  org_public_id text;
BEGIN
  org_public_id := generate_public_id('T');
  
  INSERT INTO public.organizations (
    id,
    name,
    slug,
    org_type,
    public_id,
    depth,
    materialized_path,  -- FIX: '/' statt ''
    settings
  ) VALUES (
    gen_random_uuid(),
    COALESCE(split_part(NEW.email, '@', 1), 'Mein Unternehmen'),
    LOWER(REPLACE(COALESCE(split_part(NEW.email, '@', 1), 'org'), '.', '-')) 
      || '-' || substr(md5(random()::text), 1, 6),
    'client',
    org_public_id,
    0,
    '/',  -- <-- FIX
    '{}'::jsonb
  )
  RETURNING id INTO new_org_id;
  
  -- Profile und Membership bleiben unverändert
  INSERT INTO public.profiles (...);
  INSERT INTO public.memberships (...);
  
  RETURN NEW;
END;
$$;
```

---

## Auswirkungen

- **Keine Datenmigration nötig** – nur die Funktion wird aktualisiert
- **Kein Downtime** – die Änderung ist sofort wirksam
- **Bestehende User unberührt** – betrifft nur neue Registrierungen

---

## Nach dem Fix

1. Zur `/auth` Seite navigieren
2. "Sign Up" Tab wählen
3. E-Mail und Passwort eingeben
4. Registrierung sollte erfolgreich sein
5. Automatische Weiterleitung zum Portal

