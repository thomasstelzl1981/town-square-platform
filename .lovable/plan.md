

## Super-User Rolle für deinen Account setzen

### Ist-Zustand

- **User:** thomas.stelzl@ncore.online (`b0d2bf55-887f-4678-878b-863af63c06b9`)
- **Tenant:** `66175861-db5b-4997-8a13-9994c17136b3`
- **membership_role:** `org_admin` ✓
- **app_role:** keiner — fehlt `super_user` in `user_roles`

### Änderung: Eine Migration

```sql
-- 1. Super-User Rolle einfügen
INSERT INTO user_roles (user_id, role)
VALUES ('b0d2bf55-887f-4678-878b-863af63c06b9', 'super_user')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Tiles synchronisieren (damit alle 21 Module freigeschaltet werden)
SELECT sync_tiles_for_user('b0d2bf55-887f-4678-878b-863af63c06b9');
```

### Ergebnis

- `org_admin` + `super_user` → Zugriff auf alle 21 Module inkl. MOD-09 bis MOD-19
- Tiles werden automatisch durch `sync_tiles_for_user` aktiviert
- Kein Code-Change nötig, nur ein DB-Insert

