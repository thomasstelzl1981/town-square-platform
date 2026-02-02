
# Plan: Saubere Zonen-Trennung mit 2 Entwicklungs-Kontexten

## Ziel-Architektur

### Zone 1: Admin-Portal (`/admin/*`)
- **User:** thomas.stelzl
- **Organisation:** System of a Town (internal)
- **Rolle:** platform_admin
- **Zweck:** Governance, Konfiguration, Oversight

### Zone 2: Portal (`/portal/*`)
- **Entwicklungs-Muster:** thomas.stelzl (client) - leere Module als Vorlage
- **Test-Sandbox:** test (client) - für Datenarbeit

---

## Änderungen

### 1. Datenbank-Korrekturen

**a) `active_tenant_id` korrigieren:**
```sql
UPDATE profiles 
SET active_tenant_id = 'a0000000-0000-4000-a000-000000000001'
WHERE email = 'thomas.stelzl@systemofadown.com';
```
→ thomas.stelzl startet jetzt im **internen** Kontext

**b) Client-Membership für thomas.stelzl wiederherstellen:**
```sql
INSERT INTO memberships (user_id, tenant_id, role)
VALUES (
  'd028bc99-6e29-4fa4-b038-d03015faf222',
  'e808a01b-728e-4ac3-88fe-6edeeae69d6e',
  'org_admin'
);
```
→ thomas.stelzl kann auch in Zone 2 arbeiten

### 2. Resultat nach Implementierung

| User | Memberships | Aktiver Kontext |
|------|-------------|-----------------|
| thomas.stelzl | `platform_admin` in System of a Town + `org_admin` in thomas.stelzl | System of a Town (internal) |
| test@example.com | `org_admin` in test | test (client) |

### 3. UI-Verhalten

**Zone 1 (`/admin/*`):**
- thomas.stelzl sieht: `Internal / System of a Town`
- Kein Org-Switcher nötig (nur eine interne Org)

**Zone 2 (`/portal/*`):**
- thomas.stelzl sieht Org-Switcher mit 2 Optionen:
  - `thomas.stelzl` (Entwicklungs-Muster)
  - `test` (wenn auch dort Membership) oder via God-Mode sichtbar

### 4. Optional: Client-Org umbenennen

Für Klarheit könnte `thomas.stelzl` (client) umbenannt werden:
```sql
UPDATE organizations 
SET name = 'Muster-Kunde' 
WHERE id = 'e808a01b-728e-4ac3-88fe-6edeeae69d6e';
```

---

## Zusammenfassung

| Zone | Pfad | Kontext | Switcher |
|------|------|---------|----------|
| Zone 1 | `/admin/*` | System of a Town (internal) | Nein |
| Zone 2 | `/portal/*` | thomas.stelzl ODER test (client) | Ja (2 Orgs) |

**Vorteil des Setups:**
- Klare Trennung: Admin ≠ Entwickler-Portal
- Entwicklungs-Muster bleibt sauber (leere Daten)
- Test-Sandbox für echte Datenarbeit
- Org-Switcher in Zone 2 für flexibles Testen
