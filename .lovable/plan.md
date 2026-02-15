
# Tenant Isolation + Sicherheitshaertung

## Was wird gemacht

1. ~~**Demo-Daten Sub-Tile in Navigation hinzufuegen**~~ ✅ Erledigt
2. ~~**Leaked-Password-Protection aktivieren**~~ ✅ Erledigt
3. **OTP-Expiry wird NICHT geaendert** -- Wie gewuenscht
4. ~~**Tenant Isolation Phase 1: Vollstaendige Haertung**~~ ✅ Erledigt

## Phase 1 — Erledigt (2026-02-15)

- 18 dev_mode-Policies entfernt (kein unauthentifizierter Zugriff mehr)
- 180 RESTRICTIVE tenant_id-Policies erstellt (alle Tabellen mit tenant_id)
- Backlog-Datei: `spec/audit/tenant_isolation_backlog.json`

## Offene Phasen

Siehe `spec/audit/tenant_isolation_backlog.json` fuer Phase 2 (Modul-Verfeinerung) und Phase 3 (Pre-Go-Live).
