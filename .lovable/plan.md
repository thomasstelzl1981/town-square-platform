

# Reparaturplan: UUID Cast Fehler in Seed-Funktion

## Problem-Diagnose

### Fehler
```
column "id" is of type uuid but expression is of type text
```

### Ursache
In der `seed_golden_path_data()` Funktion (Migration `20260205011342`) wird in Zeile 98-100 eine UUID dynamisch aus Text zusammengesetzt:

```sql
-- FEHLERHAFT (Zeile 100):
'00000000-0000-4000-a000-0000000003' || lpad(row_number() OVER ()::text, 2, '0')
```

Das Ergebnis ist ein **TEXT-Wert** wie `'00000000-0000-4000-a000-000000000301'`, aber die `id`-Spalte der Tabelle `document_links` erwartet einen **UUID-Typ**.

### Aktueller Datenbankstand (Demo-Tenant)

| Tabelle | Count | SOLL |
|---------|-------|------|
| contacts | 0 | 5 |
| landlord_contexts | 1 | 1 |
| context_members | 2 | 2 |
| properties | 1 | 1 |
| units | 1 | 1 |
| leases | 0 | 1 |
| loans | 1 | 1 |
| documents | 3 | 12 |
| document_links | 3 | 12 |
| storage_nodes | 29 | 19+ |
| finance_requests | 1 | 1 |
| finance_mandates | 0 | 0 |

Die Daten stammen offensichtlich von einem früheren, teilweise erfolgreichen Seed-Lauf (vor der aktuellen Cleanup-First-Logik).

---

## Reparatur

### Änderung 1: UUID Cast hinzufügen

Ersetze in der `seed_golden_path_data()` Funktion:

**Zeile 100 (VORHER):**
```sql
'00000000-0000-4000-a000-0000000003' || lpad(row_number() OVER ()::text, 2, '0'),
```

**Zeile 100 (NACHHER):**
```sql
('00000000-0000-4000-a000-0000000003' || lpad(row_number() OVER ()::text, 2, '0'))::uuid,
```

### Änderung 2: Auch Zeile 122-124 prüfen

Die Zeilen 122-124 verwenden bereits korrekte statische UUIDs als Strings, aber zur Sicherheit sollten auch diese explizit gecastet werden:

**Zeilen 122-124 (VORHER):**
```sql
INSERT INTO document_links (id, tenant_id, document_id, link_status) VALUES
  ('00000000-0000-4000-a000-000000000311', t_id, '00000000-0000-4000-a000-000000000211', 'active'),
  ('00000000-0000-4000-a000-000000000312', t_id, '00000000-0000-4000-a000-000000000212', 'active');
```

**Zeilen 122-124 (NACHHER):**
```sql
INSERT INTO document_links (id, tenant_id, document_id, link_status) VALUES
  ('00000000-0000-4000-a000-000000000311'::uuid, t_id, '00000000-0000-4000-a000-000000000211'::uuid, 'active'),
  ('00000000-0000-4000-a000-000000000312'::uuid, t_id, '00000000-0000-4000-a000-000000000212'::uuid, 'active');
```

---

## Migrations-Strategie

Da die Funktion in einer bereits deployte Migration definiert wurde, muss eine **neue Migration** erstellt werden, die die Funktion mit `CREATE OR REPLACE` aktualisiert.

### Neue Migration: Fix UUID Cast

```sql
-- Fix: UUID cast in document_links INSERT
CREATE OR REPLACE FUNCTION public.seed_golden_path_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
... (vollständige Funktion mit korrigiertem Cast)
$$;
```

---

## Erwartetes Ergebnis nach Fix

Nach erfolgreicher Migration und erneutem Seed-Aufruf:

| Tabelle | Count |
|---------|-------|
| contacts | 5 |
| landlord_contexts | 1 |
| context_members | 2 |
| properties | 1 |
| units | 1 |
| leases | 1 |
| loans | 1 |
| documents | 12 |
| document_links | 12 |
| storage_nodes | 19+ |
| finance_requests | 1 |

---

## Technische Details

### Betroffene Datei
- `supabase/migrations/20260205011342_91598a2c-1d1c-4de2-ad53-5e7c4c36dcee.sql` (Zeile 100, 122-124)

### Neuzuerstellende Datei
- Neue Migration mit `CREATE OR REPLACE FUNCTION seed_golden_path_data()`

### Geschätzte Änderungen
- ~3 Zeilen in der Funktion anpassen
- 1 neue Migration erstellen

