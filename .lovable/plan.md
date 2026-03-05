

# Fix: Properties INSERT schlaegt fehl — RLS-Blockade durch Trigger

## Root Cause

Beim INSERT in `properties` feuert der Datenbank-Trigger `trg_property_create_default_unit`, der automatisch eine `units`-Zeile erstellt:

```sql
INSERT INTO units (tenant_id, property_id, unit_number, area_sqm)
VALUES (NEW.tenant_id, NEW.id, 'MAIN', NEW.total_area_sqm);
```

Dieser Trigger laeuft im RLS-Kontext des Users. Die INSERT-Policy auf `units` erlaubt aber nur die Rollen `org_admin` und `internal_ops`. Der aktuelle User hat die Rolle `super_manager` — die zwar Properties erstellen darf, aber nicht Units.

Ergebnis: Jeder Property-INSERT schlaegt mit 403 fehl, obwohl der Fehler eigentlich vom `units`-Trigger kommt. Daher die verwirrende Fehlermeldung "violates row-level security policy for table **units**" bei einem Request an `/properties`.

## Loesung

Eine DB-Migration, die die Trigger-Funktion `create_default_unit` auf `SECURITY DEFINER` setzt. Dadurch laeuft der Trigger mit den Rechten des Funktions-Owners (postgres) und umgeht RLS — was korrekt ist, da es sich um eine interne System-Aktion handelt.

```sql
CREATE OR REPLACE FUNCTION create_default_unit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO units (tenant_id, property_id, unit_number, area_sqm)
  VALUES (NEW.tenant_id, NEW.id, 'MAIN', NEW.total_area_sqm);
  RETURN NEW;
END;
$$;
```

Keine Code-Aenderung noetig — nur die eine Migration. Danach funktioniert der Vertriebsauftrag-Flow und erstellt die 72 Properties + Listings korrekt.

