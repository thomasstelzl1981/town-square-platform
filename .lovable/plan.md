

# Werner Schilcher → Super-Manager Upgrade

## Ist-Zustand
- **User:** Werner Schilcher (`werner.schilcher@acquiary.com`)
- **User-ID:** `b91a9127-83a9-4d06-a76e-f1311d333785`
- **Tenant-ID:** `a946e51b-2c19-4a9b-9b9e-97694ec42a14`
- **Aktuelle Rolle:** `org_admin` (Standard-Client), keine `app_role`
- **Aktive Module:** 14 Basis-Module, 7 Spezial-Module fehlen

## Ziel
Werner Schilcher wird **Super-Manager** — alle Zone-2-Module **außer MOD-22 (Pet Manager)** = 21 Module.

## DB-Migration

### 1. App-Role setzen
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('b91a9127-83a9-4d06-a76e-f1311d333785', 'super_manager');
```

### 2. Fehlende Spezial-Module aktivieren
```sql
INSERT INTO tenant_tile_activation (tenant_id, tile_code, status, activated_at, activated_by)
VALUES
  ('a946e51b-2c19-4a9b-9b9e-97694ec42a14', 'MOD-09', 'active', now(), 'b91a9127-83a9-4d06-a76e-f1311d333785'),
  ('a946e51b-2c19-4a9b-9b9e-97694ec42a14', 'MOD-10', 'active', now(), 'b91a9127-83a9-4d06-a76e-f1311d333785'),
  ('a946e51b-2c19-4a9b-9b9e-97694ec42a14', 'MOD-11', 'active', now(), 'b91a9127-83a9-4d06-a76e-f1311d333785'),
  ('a946e51b-2c19-4a9b-9b9e-97694ec42a14', 'MOD-12', 'active', now(), 'b91a9127-83a9-4d06-a76e-f1311d333785'),
  ('a946e51b-2c19-4a9b-9b9e-97694ec42a14', 'MOD-13', 'active', now(), 'b91a9127-83a9-4d06-a76e-f1311d333785'),
  ('a946e51b-2c19-4a9b-9b9e-97694ec42a14', 'MOD-14', 'active', now(), 'b91a9127-83a9-4d06-a76e-f1311d333785'),
  ('a946e51b-2c19-4a9b-9b9e-97694ec42a14', 'MOD-19', 'active', now(), 'b91a9127-83a9-4d06-a76e-f1311d333785');
```

**Kein MOD-22** (Pet Manager) — wie gewünscht.

## Kein Code-Change nötig
Die Tile-Sichtbarkeit wird runtime aus `tenant_tile_activation` + `user_roles` gelesen. Nach den DB-Inserts sieht Werner beim nächsten Login alle 21 Module.

## Plan-Datei
Die `.lovable/plan.md` wird mit diesem neuen Plan überschrieben (der alte Landing-Page-Plan wurde bereits umgesetzt).

