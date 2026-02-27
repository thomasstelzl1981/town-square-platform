

## Analyse: Toggle "Dokumenten-Auslesung" funktioniert nicht

### Root Cause

Das Problem liegt in der **RLS-Policy** auf der Tabelle `organizations`. Die UPDATE-Policy erlaubt nur:
- `org_admin` (via `org_update_org_admin`)  
- `platform_admin` (via `org_update_platform_admin`)

Ralph Reinhold (`rr@unitys.com`) hat die Rolle **`super_manager`** — diese Rolle ist in keiner UPDATE-Policy enthalten. 

**Ablauf des Bugs:**
1. User klickt Toggle → Supabase `.update()` wird ausgeführt
2. RLS blockiert den UPDATE → 0 Zeilen geändert, aber **kein Fehler** (Supabase gibt bei 0 betroffenen Zeilen keinen Error)
3. `onSuccess` feuert → Toast "Dokumenten-Auslesung aktiviert" erscheint
4. Query wird invalidiert → liest den **unveränderten** Wert `false` aus der DB
5. Toggle springt zurück → Posteingang bleibt gesperrt

### Fix (2 Teile)

**1. RLS-Policy erweitern** — `super_manager` (und `org_manager`) dürfen Organizations updaten:

```sql
DROP POLICY IF EXISTS org_update_org_admin ON organizations;
CREATE POLICY org_update_org_admin ON organizations FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.tenant_id = organizations.id
      AND m.role IN ('org_admin', 'org_manager', 'super_manager')
  )
);
```

**2. Frontend: Stille Fehler abfangen** — In `PosteingangAuslesungCard.tsx` nach dem Update prüfen, ob die Änderung tatsächlich persistiert wurde:

```typescript
const { error, count } = await supabase
  .from('organizations')
  .update({ ai_extraction_enabled: enabled })
  .eq('id', activeTenantId)
  .select('id', { count: 'exact', head: true });
if (error) throw error;
if (count === 0) throw new Error('Keine Berechtigung für diese Änderung');
```

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| DB Migration | RLS-Policy `org_update_org_admin` erweitern |
| `src/components/dms/PosteingangAuslesungCard.tsx` | Silent-failure Guard |

