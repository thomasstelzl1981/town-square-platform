

## Analyse: Zuhause-Modul — 4 Kernprobleme

### Problem 1: Kamera-Tabelle hat kein `tenant_id` — Multi-Tenancy-Bruch

Die `cameras`-Tabelle hat nur `user_id` (mit RLS `auth.uid() = user_id`). Sie hat **kein** `tenant_id`-Feld. Das widerspricht dem Multi-Tenancy-Modell der Plattform, bei dem alle Business-Tabellen `tenant_id` haben müssen.

**Konsequenz:** Die Kamera, die im Golden Tenant angelegt wurde (`user_id: d028bc99-...`), ist für den neuen User unsichtbar. Der `useCameras`-Hook hat keinen `tenant_id`-Filter.

**Fix:**
- DB-Migration: `tenant_id UUID` zu `cameras` hinzufügen (mit Backfill aus `profiles.active_tenant_id`)
- Neue RESTRICTIVE RLS-Policies auf `tenant_id` statt nur `user_id`
- `useCameras`-Hook: `tenant_id`-Filter ergänzen
- `CameraSetupWizard` + `AddCameraDialog`: `tenant_id` beim Insert mitgeben

### Problem 2: Vertrag anlegen erzeugt kein Widget (Query-Key-Mismatch)

`ContractDrawer.tsx` invalidiert nach Speichern:
```
queryKey: ['miety-contracts', homeId]
```

Aber `useZuhauseWidgets.ts` nutzt:
```
queryKey: ['miety-contracts-all', activeTenantId]
```

**Die Keys matchen nicht.** Deshalb wird die Widget-Liste nach Vertragsanlage nicht aktualisiert — kein neues Widget erscheint.

**Fix:**
- `ContractDrawer.tsx` Zeile 76: Zusätzlich `['miety-contracts-all']` und `['miety-contracts-versorgung']` invalidieren (oder alle `miety-contracts`-Queries per Prefix invalidieren)

### Problem 3: `UebersichtTile.tsx` rendert statischen Kamera-Platzhalter

`UebersichtTile.tsx` (Zeilen 301-310) zeigt immer nur einen statischen "Kameras einrichten"-Platzhalter. Dieser Tile wird zwar nicht als Hauptseite genutzt (das ist `MietyPortalPage`), aber er wird möglicherweise an anderer Stelle referenziert. Die echten Kameras werden nur im `MietyPortalPage` via `useZuhauseWidgets` → `CameraWidget` gerendert.

**Status:** Die Hauptseite (`MietyPortalPage`) ist architektonisch korrekt — sie rendert Kamera-Widgets dynamisch aus der DB. Das Problem ist rein das fehlende `tenant_id` (Problem 1).

### Problem 4: Stammdaten-Verträge — Redundanz klären

Die `VertraegeTab` in MOD-01 aggregiert jetzt korrekt `miety_contracts` und `cameras`. Das ist eine **Lese-Übersicht** (read-only Referenz). Versorgungsverträge und Smart Home werden und sollen primär in Zuhause (MOD-20) verwaltet. In Stammdaten werden sie nur als Referenz mit Deeplink angezeigt. Das ist korrekt und kein Fehler.

---

## Reparaturplan (4 Schritte)

| # | Was | Datei(en) | Typ |
|---|-----|-----------|-----|
| 1 | `tenant_id` zu `cameras` hinzufügen + RLS-Policies umstellen | DB-Migration | Migration |
| 2 | `useCameras`-Hook: `tenant_id`-Filter + Insert mit `tenant_id` | `src/hooks/useCameras.ts` | Code |
| 3 | Query-Key-Mismatch fixen: ContractDrawer invalidiert alle relevanten Queries | `src/pages/portal/miety/components/ContractDrawer.tsx` | Code |
| 4 | `UebersichtTile.tsx` Zeile 301-310: Statischen Kamera-Platzhalter durch echte Kamera-Query ersetzen (für Kontexte wo der Tile direkt gerendert wird) | `src/pages/portal/miety/tiles/UebersichtTile.tsx` | Code |

### Migration-SQL (Schritt 1):

```sql
-- Add tenant_id to cameras
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Backfill existing cameras from profiles
UPDATE cameras c
SET tenant_id = p.active_tenant_id
FROM profiles p
WHERE c.user_id = p.id AND c.tenant_id IS NULL;

-- Make tenant_id NOT NULL after backfill
ALTER TABLE cameras ALTER COLUMN tenant_id SET NOT NULL;

-- Drop old user-only policies
DROP POLICY IF EXISTS cameras_select_own ON cameras;
DROP POLICY IF EXISTS cameras_insert_own ON cameras;
DROP POLICY IF EXISTS cameras_update_own ON cameras;
DROP POLICY IF EXISTS cameras_delete_own ON cameras;

-- New tenant-scoped RESTRICTIVE policies
CREATE POLICY cameras_tenant_select ON cameras FOR SELECT TO authenticated
  USING (tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY cameras_tenant_insert ON cameras FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY cameras_tenant_update ON cameras FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY cameras_tenant_delete ON cameras FOR DELETE TO authenticated
  USING (tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid()));
```

### Code-Änderungen:

**`useCameras.ts`:** `activeTenantId` als Parameter nutzen, bei Insert `tenant_id` mitgeben, Query nach `tenant_id` filtern (RLS macht es automatisch, aber expliziter Filter ist sauberer).

**`ContractDrawer.tsx` Zeile 76:** Ersetzen durch:
```ts
queryClient.invalidateQueries({ queryKey: ['miety-contracts'] }); // prefix match
```
Das invalidiert alle Queries die mit `miety-contracts` beginnen.

