
# Systemweiter Scan: Ergebnisse und Freigabe-Bewertung

---

## 1. Account-Status (alle 3 Accounts)

| Account | Rolle | Org-Typ | Tenant-Mode | Aktive Module | Soll |
|---------|-------|---------|-------------|---------------|------|
| Thomas Stelzl | platform_admin | internal | sandbox | 21 | 21 (korrekt) |
| test-beta-check | org_admin | client | production | 14 | 14 (korrekt) |
| Bernhard Marchner | org_admin | client | production | 14 | 14 (korrekt) |

Die 14 Module fuer `org_admin` entsprechen exakt der `get_tiles_for_role('org_admin')` Funktion:
MOD-00 bis MOD-08, MOD-15 bis MOD-18, MOD-20. Das ist **korrekt** — MOD-09 bis MOD-14 und MOD-19 sind Spezialrollen-Module (Vertrieb, Leads, Finanzierungsmanager, Akquise, Projekte, CommPro, PV).

---

## 2. Identifizierte Probleme

### 2.1 MOD-05 Namens-Inkonsistenz (Mittel)

Die `tile_catalog` Datenbank zeigt:
- **MOD-05**: Titel = "Pets", Beschreibung = "KI-gestuetzter Website-Baukasten" (WIDERSPRUCH)
- **MOD-22**: Titel = "Pet Manager", Beschreibung = "Tierpensions-Management fuer Partner"

Im Code ist MOD-05 tatsaechlich das **Pets-Modul** (Route: `/portal/pets`). Die Beschreibung im `tile_catalog` ist ein Relikt vom ehemaligen Website-Builder (MOD-21, entfernt). Dies sollte korrigiert werden.

**Massnahme:** Beschreibung von MOD-05 in `tile_catalog` auf "Haustier-Management und Tierpension" aktualisieren.

### 2.2 Verwaiste Organisation "FutureRoom Website" (Niedrig)

- Org-ID: `b0309ac6-6243-4913-84a2-d078b84656ed`
- Org-Typ: `internal`, Tenant-Mode: `production`
- **0 Mitglieder, 0 aktivierte Tiles**
- Keine zugeordneten User

Dies ist eine verwaiste Organisation ohne Funktion. Kann bereinigt werden.

**Massnahme:** Organisation loeschen oder als Platzhalter fuer Zone-3-FutureRoom-Website dokumentieren.

### 2.3 Linter-Warnungen (6 Stueck)

| Warnung | Schwere | Status |
|---------|---------|--------|
| Extension in Public Schema | WARN | Bekannt, nicht kritisch |
| 3x "Always True" RLS Policies | WARN | Alle durch RESTRICTIVE Policies abgesichert |
| OTP Expiry zu lang | WARN | Backend-Setting, nicht via Lovable aenderbar |
| Leaked Password Protection deaktiviert | WARN | Backend-Setting, nicht via Lovable aenderbar |

Die 3 "Always True" Policies betreffen:
- `mail_campaign_*` (3 Tabellen): `service_role` only — sicher
- `pet_z3_sessions`: Jetzt durch RESTRICTIVE Policy abgesichert
- `user_outbound_identities`: `service_role` only — sicher

**Alle durch die in Phase 1-3 implementierten RESTRICTIVE Policies als zweiter Sicherheitsgurt geschuetzt.**

### 2.4 MOD-22 (Pet Manager) nicht aktiviert fuer Test-Accounts

MOD-22 existiert im `tile_catalog`, ist aber weder fuer Marchner noch test-beta aktiviert. Das ist **korrekt**, da MOD-22 ein Spezialmodul fuer Franchise-Partner ist und nicht zum Standard-`org_admin`-Paket gehoert.

---

## 3. Zone-3-Websites (Oeffentlich)

Zone 3 ist im Code vollstaendig implementiert mit:
- **/kaufy2026/** — Immobilien-Investment-Website
- **/sot/** — System of a Town Hauptwebsite
- **/futureroom/** — Finanzierungs-Portal
- **/lennox/** — Lennox & Friends (Pet-Website, eigenes Z3-Auth)
- **/acquiary/** — Investment-House Website

Zone 3 hat ein eigenstaendiges Auth-System (Z3-Sessions, getrennt vom Portal). Kein Handlungsbedarf.

---

## 4. Tenant-Isolation: Zusammenfassung

| Massnahme | Status |
|-----------|--------|
| 39 RESTRICTIVE Policies (Phase 1-3) | Implementiert |
| pet_z3_sessions gehaertet | Implementiert |
| 68 Tabellen ohne tenant_id auditiert | Dokumentiert |
| Cross-Tenant-Isolation verifiziert | Bestaetigt |
| Alle 209+ tenant_id-Tabellen mit RLS | Bestaetigt |

---

## 5. Freigabe-Empfehlung

### Bereit fuer Test-Freigabe: JA (mit 2 kleinen Korrekturen)

Die Accounts sind **testbereit**. Die Tenant-Isolation ist vollstaendig gehaertet. Beide Test-Accounts (Marchner + test-beta) haben die korrekten 14 Module aktiviert.

### Empfohlene Korrekturen vor Freigabe

1. **MOD-05 Beschreibung korrigieren** — Falsche Beschreibung "Website-Baukasten" auf "Haustier-Management" aendern (1 SQL UPDATE)
2. **FutureRoom Website Org entscheiden** — Loeschen oder als Zone-3-Platzhalter belassen

### Pre-Go-Live Checklist (spaeter, nicht fuer Test)

- OTP Expiry auf 60 Sekunden reduzieren (Cloud-Setting)
- Leaked Password Protection aktivieren (Cloud-Setting)
- Extension aus Public Schema verschieben (optional)

---

## Implementierung

### Migration 1: MOD-05 Beschreibung Fix

```text
UPDATE tile_catalog 
SET description = 'Haustier-Management und Tierpension'
WHERE tile_code = 'MOD-05';
```

### Migration 2 (Optional): FutureRoom Org bereinigen

```text
DELETE FROM organizations 
WHERE id = 'b0309ac6-6243-4913-84a2-d078b84656ed'
AND NOT EXISTS (SELECT 1 FROM memberships WHERE tenant_id = 'b0309ac6-6243-4913-84a2-d078b84656ed');
```
