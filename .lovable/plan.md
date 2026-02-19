
# Stale Data Bereinigung — ABGESCHLOSSEN ✅

## Was wurde gemacht

### 1. DB-Bereinigung (8 Records gelöscht)
- 3× `household_persons` (b1f6d204, 327dd944, a1839417)
- 1× `pension_records` (2618b959)
- 1× `miety_homes` (da78ca31 "Villa Mustermann")
- 1× `finance_requests` (32695673)
- 2× `applicant_profiles` (703e1648, a23366ab)
- 1× `miety_loans` (6db3e303)

### 2. Auto-Create Guard (UebersichtTile.tsx)
Auto-Create von Homes nur bei `demoEnabled === true`. Bei Demo-OFF bleibt das Modul leer.

### 3. Audit-Trigger Fix (fn_audit_pii_change)
Bug behoben: Trigger versuchte `OLD.active_tenant_id` auf Tabellen ohne dieses Feld. Jetzt dynamisch per IF/EXECUTE gelöst.

## Ergebnis
Bei ausgeschaltetem Demo-Button: 0 non-demo Records in allen relevanten Tabellen. Account ist komplett leer außer Login, E-Mail und Kennwort.
