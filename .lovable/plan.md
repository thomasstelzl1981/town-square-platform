
# Definitiver Fix-Plan: Abschluss-Status

Alle adressierbaren Befunde sind abgeschlossen. Stand: 2026-02-09.

---

## Befund-Status (Final)

| Befund-ID | Problem | Status | Verifiziert |
|-----------|---------|--------|-------------|
| DB-01 | 48 fehlende Composite-Indizes (tenant_id, status) | ✅ ERLEDIGT | check_missing_indexes() = 0 |
| DB-02 | 2 Armstrong Views ohne security_invoker | ✅ ERLEDIGT | reloptions = {security_invoker=on} |
| DB-03 | Functions ohne search_path | ✅ ERLEDIGT | Alle 31 Functions haben search_path=public |
| AUTH-01 | OTP Expiry zu lang | ⚠️ OFFEN | Plattform-Konfiguration, keine Migration moeglich |
| AUTH-02 | Leaked Password Protection deaktiviert | ⚠️ OFFEN | Plattform-Konfiguration, keine Migration moeglich |
| EXT-01 | pg_trgm in public Schema | 🔵 AKZEPTIERT | Plattform-verwaltet, kein Fix moeglich |
| CODE-01 | MOD-00 als PortalDashboard-Alias | ✅ ERLEDIGT | portalModulePageMap + areaConfig + Doku vorhanden |

---

## Verbleibende Punkte (nicht per Migration loesbar)

- **AUTH-01/AUTH-02**: OTP Expiry und Leaked Password Protection muessen ueber die Plattform-Auth-Konfiguration angepasst werden.
- **EXT-01**: pg_trgm Extension im public Schema ist ein Supabase-internes Detail.
- **Zone-3 DEFINER Views**: `v_public_listings` und `v_public_knowledge` bleiben bewusst SECURITY DEFINER fuer oeffentlichen Zugriff.
