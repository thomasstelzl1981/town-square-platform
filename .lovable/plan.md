

# Plan: Reference Tenant reparieren und Robyn Zugangsdaten setzen

## Offene Probleme

### Problem 1: Reference Tenant (Thomas) fehlt MOD-22
Der Reference Tenant hat nur 21 Module. MOD-22 (Pet Manager) fehlt in `tenant_tile_activation`. Ausserdem ist `tenant_mode` noch `sandbox` statt `reference`.

### Problem 2: Robyn hat kein kommuniziertes Passwort
Der Auth-Account `robyn@lennoxandfriends.app` existiert, aber es wurde kein Passwort gesetzt/mitgeteilt.

## Loesung

### 1. Reference Tenant: MOD-22 aktivieren + tenant_mode setzen

DB-Migration:
- INSERT MOD-22 in `tenant_tile_activation` fuer Tenant `a0000000-0000-4000-a000-000000000001`
- UPDATE `organizations.tenant_mode` von `sandbox` auf `reference` fuer den Golden Tenant

Nach dieser Aenderung: Reference Tenant hat alle 22 Module als kompletten Blueprint.

### 2. Robyn: Passwort setzen via Edge Function

Eine Edge Function `setup-user-password` (oder Erweiterung der bestehenden `setup-demo-account`) aufrufen, die via `supabase.auth.admin.updateUserById()` ein Passwort fuer Robyn setzt.

Vorgeschlagenes Passwort-Schema (analog zu Bernhard): `SoT-Robyn2026!`
E-Mail: `robyn@lennoxandfriends.app`

Die Edge Function muss mit dem Service Role Key arbeiten, da nur Admin-API Passwoerter setzen kann.

### Zusammenfassung

| Aenderung | Typ | Detail |
|-----------|-----|--------|
| MOD-22 fuer Reference Tenant | DB INSERT | Vervollstaendigt Blueprint auf 22/22 |
| tenant_mode auf `reference` | DB UPDATE | Formalisiert Golden Tenant |
| Robyn Passwort setzen | Edge Function | `SoT-Robyn2026!` via admin API |

### Modul-Freeze-Check
Keine Code-Dateien in Modul-Pfaden betroffen. Nur DB-Operationen und Edge Function.

