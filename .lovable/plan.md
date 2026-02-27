

## Analyse: Finanzierungsmanager gesperrt fuer Bernhard Marchner

### Ursache gefunden

**Datenbankseite ist korrekt** — Bernhard hat alle 22 Tiles aktiv (inkl. MOD-11). Seine Rolle: `membership_role = org_admin`, `app_role = super_user`.

**Problem ist im Frontend-Code** in `FinanzierungsmanagerPage.tsx`, Zeile 35-37:

```typescript
const canAccess = isPlatformAdmin || memberships.some(m => 
  m.role === 'finance_manager' || m.role === 'super_manager'
);
```

Dieser Check prueft nur `finance_manager` und `super_manager` als membership_role. Bernhard hat aber `org_admin` + app_role `super_user`. Die Pruefung ignoriert:
- `super_user` (app_role)
- `org_admin` mit super_user Override

Ralph Reinhold funktioniert, weil sein membership_role `super_manager` ist — das steht im Check.

### Warum Pet Manager sichtbar ist

MOD-22 (PetManager) hat **keinen** solchen Frontend-Gate. Die Sichtbarkeit wird ausschliesslich ueber `tenant_tile_activation` in der PortalNav gesteuert. Alle 22 Tiles sind aktiv → MOD-22 erscheint in der Navigation.

Das Problem ist also: MOD-22 ist korrekt sichtbar (weil kein Extra-Gate), aber MOD-11 hat einen redundanten hardcoded Access-Check der `super_user` nicht beruecksichtigt.

### Fix

**Datei: `src/pages/portal/FinanzierungsmanagerPage.tsx`** — Zeile 33-37

Den `canAccess`-Check erweitern um `super_user` app_role Pruefung. Der `useAuth`-Hook liefert bereits `appRole` oder die Rolle kann aus dem AuthContext gelesen werden. Alternativ (und architektonisch sauberer): den gesamten Frontend-Gate entfernen, da die Tile-Aktivierung bereits in der DB ueber `tenant_tile_activation` + PortalNav gesteuert wird. Wer die Route erreicht, hat bereits Zugriff.

**Option A (minimal):** `super_user` zur Pruefung hinzufuegen
```typescript
const canAccess = isPlatformAdmin || memberships.some(m => 
  m.role === 'finance_manager' || m.role === 'super_manager'
) || appRole === 'super_user';
```

**Option B (sauberer):** Frontend-Gate komplett entfernen — die DB-Tile-Aktivierung ist die SSOT. Wenn ein User die Route erreicht (via PortalNav), hat er bereits Zugriff.

| Datei | Aenderung |
|-------|----------|
| `src/pages/portal/FinanzierungsmanagerPage.tsx` | canAccess-Check fixen oder entfernen |

