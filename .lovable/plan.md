
# Fix: Pet-Provider-Suche in Zone 2 (Cross-Tenant Discovery)

## Problem

Die `pet_providers`- und `pet_services`-Tabellen haben eine **RESTRICTIVE** RLS-Policy (`tenant_isolation_restrictive`), die ALLE Operationen auf den eigenen Tenant beschraenkt. Das verhindert, dass eingeloggte User Provider anderer Tenants sehen koennen — auch wenn diese veroeffentlicht sind.

- Zone 3 funktioniert, weil dort der anonyme Zugriff (ohne Auth-Token) greift und die restrictive Policy nicht anschlaegt.
- Zone 2 scheitert, weil der Auth-Token den Tenant identifiziert und die restrictive Policy den Lennox-Tenant (`eac1778a-...`) fuer den Unitys-User (`406f5f7a-...`) blockiert.

## Loesung

Die RESTRICTIVE Policy auf beiden Tabellen muss fuer **lesende** Zugriffe auf veroeffentlichte Provider eine Ausnahme erlauben. Die sicherste Methode:

### Schritt 1: RESTRICTIVE Policy auf `pet_providers` anpassen

Die bestehende Policy `tenant_isolation_restrictive` (cmd: ALL) wird ersetzt durch granulare Policies:

1. **Neue RESTRICTIVE Policy fuer INSERT/UPDATE/DELETE** — bleibt wie bisher: `tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid())`
2. **Neue RESTRICTIVE Policy fuer SELECT** — erweitert: Eigener Tenant ODER (veroeffentlicht UND aktiv)

```sql
-- Alte ALL-Policy droppen
DROP POLICY IF EXISTS tenant_isolation_restrictive ON pet_providers;

-- Schreib-Isolation bleibt strikt
CREATE POLICY tenant_isolation_write_restrictive ON pet_providers
  AS RESTRICTIVE FOR ALL
  USING (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

-- Aber: Fuer SELECT erlauben wir auch published Providers anderer Tenants
DROP POLICY IF EXISTS tenant_isolation_write_restrictive ON pet_providers;

CREATE POLICY tenant_isolation_restrictive_write ON pet_providers
  AS RESTRICTIVE FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

CREATE POLICY tenant_isolation_restrictive_update ON pet_providers
  AS RESTRICTIVE FOR UPDATE
  USING (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

CREATE POLICY tenant_isolation_restrictive_delete ON pet_providers
  AS RESTRICTIVE FOR DELETE
  USING (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

CREATE POLICY tenant_isolation_restrictive_select ON pet_providers
  AS RESTRICTIVE FOR SELECT
  USING (
    tenant_id = get_user_tenant_id()
    OR is_platform_admin(auth.uid())
    OR (is_published = true AND status = 'active')
  );
```

### Schritt 2: Gleiche Anpassung fuer `pet_services`

Gleiche Aufspaltung: Schreibende Policies bleiben tenant-isoliert, lesende Policy erlaubt Zugriff auf Services von veroeffentlichten Providern.

```sql
DROP POLICY IF EXISTS tenant_isolation_restrictive ON pet_services;

CREATE POLICY tenant_isolation_restrictive_write ON pet_services
  AS RESTRICTIVE FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

CREATE POLICY tenant_isolation_restrictive_update ON pet_services
  AS RESTRICTIVE FOR UPDATE
  USING (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

CREATE POLICY tenant_isolation_restrictive_delete ON pet_services
  AS RESTRICTIVE FOR DELETE
  USING (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

CREATE POLICY tenant_isolation_restrictive_select ON pet_services
  AS RESTRICTIVE FOR SELECT
  USING (
    tenant_id = get_user_tenant_id()
    OR is_platform_admin(auth.uid())
    OR (is_active = true AND EXISTS (
      SELECT 1 FROM pet_providers pp
      WHERE pp.id = pet_services.provider_id
        AND pp.is_published = true
        AND pp.status = 'active'
    ))
  );
```

### Sicherheitsbewertung

- **Schreibzugriffe** bleiben vollstaendig tenant-isoliert (keine Aenderung)
- **Lesezugriffe** werden nur fuer explizit freigegebene (published + active) Provider geoeffnet
- Dies entspricht dem gleichen Pattern wie die "Cross-Tenant Discovery" bei Immobilien-Listings (vgl. `v_public_listings`)
- Keine Daten-Leaks: Nur bewusst publizierte Provider-Daten werden sichtbar

### Keine Code-Aenderungen noetig

Der Hook `usePetProviderSearch.ts` fragt bereits korrekt nach `status = 'active'` und `is_published = true`. Die UI in `PetsCaring.tsx` funktioniert ebenfalls bereits richtig. Nur die RLS-Policies muessen angepasst werden.

### Betroffene Module

Keine Module werden editiert — nur eine DB-Migration. Kein Unfreeze erforderlich.
