# MOD-01 — STAMMDATEN (Master Data & Account Settings)

> **Version**: 1.0  
> **Status**: SPEC READY  
> **Datum**: 2026-01-25  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/stammdaten`

---

## 1. Executive Summary

MOD-01 "Stammdaten" ist das zentrale Modul für Benutzer- und Organisationsverwaltung. Es umfasst persönliche Profile, Firmeneinstellungen, Abrechnung/Billing und Sicherheitseinstellungen. Dieses Modul ist für ALLE Tenant-Typen verfügbar und bildet die Grundlage für Identität und Abrechnung.

---

## 2. Route-Struktur (BINDING)

| # | Name | Route | Beschreibung |
|---|------|-------|--------------|
| 0 | Dashboard | `/portal/stammdaten` | Übersicht, Quick Actions |
| 1 | Profil | `/portal/stammdaten/profil` | Persönliche Daten, Avatar, Präferenzen |
| 2 | Firma | `/portal/stammdaten/firma` | Organisation, Team, Delegationen |
| 3 | Abrechnung | `/portal/stammdaten/abrechnung` | Billing, Credits, Invoices, Plans |
| 4 | Sicherheit | `/portal/stammdaten/sicherheit` | Passwort, 2FA, Sessions, Audit |

---

## 3. Screen Specifications

### 3.1 Dashboard (`/portal/stammdaten`)

**Purpose**: Einstiegspunkt, Schnellübersicht

**Widgets (MVP)**:
- Profilkarte (Avatar, Name, Email, Rolle)
- Organisations-Info (Name, Typ, aktiver Plan)
- Billing-Status (Credits, nächste Rechnung)
- Sicherheits-Status (2FA aktiv?, letzte Anmeldung)
- Quick Actions: Profil bearbeiten, Plan upgraden, Passwort ändern

### 3.2 Profil (`/portal/stammdaten/profil`)

**Purpose**: Persönliche Benutzerdaten verwalten

**Sections**:
- **Persönliche Daten**: display_name, email (read-only wenn SSO), avatar_url
- **Präferenzen**: Sprache, Zeitzone, Datumsformat
- **Benachrichtigungen**: Email-Präferenzen, Push-Settings (Phase 2)
- **Aktiver Tenant**: Tenant-Switcher (wenn Multi-Tenant-Zugang)

**Datenquelle**: `profiles` (Core)

### 3.3 Firma (`/portal/stammdaten/firma`)

**Purpose**: Organisationseinstellungen und Team

**Sections**:

**A) Organisationsdaten** (org_admin only):
- Name, Slug, org_type (read-only)
- Settings (JSONB): Branding, Default-Werte
- parent_id, parent_access_blocked (read-only, Platform Admin controlled)

**B) Team / Mitglieder** (org_admin only):
- Liste der `memberships` mit Rollen
- Einladen neuer Mitglieder (Email-Invite Flow)
- Rolle ändern, Mitglied entfernen
- Rollen: `org_admin`, `internal_ops`, `sales_partner`, `renter_user`

**C) Delegationen** (org_admin only):
- Aktive Delegationen VON dieser Org (target_org_id = current)
- Aktive Delegationen AN diese Org (delegate_org_id = current)
- Scopes anzeigen, Delegation widerrufen

**Datenquellen**: `organizations`, `memberships`, `org_delegations` (Core)

### 3.4 Abrechnung (`/portal/stammdaten/abrechnung`)

**Purpose**: Billing, Credits, Zahlungen

**Sections**:

**A) Aktueller Plan**:
- Plan-Name, Features, Preis
- Credits-Balance (falls Credit-System aktiv)
- "Plan ändern" → Plan-Auswahl Modal

**B) Rechnungen**:
- Liste aus `invoices` (status, amount, due_at, pdf_url)
- Download PDF

**C) Zahlungsmethode** (Phase 2 - Stripe):
- Kreditkarte hinzufügen/ändern
- Stripe Customer Portal Link

**D) Usage / Verbrauch**:
- Aktuelle Periode: Storage, Dokumente, Extraktionen
- Credits-Verbrauch (wenn aktiviert)

**Datenquellen**: `plans`, `subscriptions`, `invoices`, `billing_usage` (Billing Backbone)

**Integration**: Stripe (Phase 2)

### 3.5 Sicherheit (`/portal/stammdaten/sicherheit`)

**Purpose**: Account-Sicherheit

**Sections**:

**A) Passwort**:
- Passwort ändern (current + new + confirm)

**B) Zwei-Faktor-Authentifizierung** (Phase 2):
- 2FA aktivieren/deaktivieren
- Recovery Codes

**C) Sessions**:
- Aktive Sessions anzeigen
- Session beenden (außer aktueller)

**D) Sicherheits-Log** (read-only):
- Letzte Login-Events
- Kritische Aktionen (Passwort geändert, 2FA geändert)

**Datenquellen**: Supabase Auth, `audit_events` (gefiltert auf User)

---

## 4. Datenmodell (Existing + Extensions)

### 4.1 Existierende Tabellen (Core)

| Tabelle | Owner | Verwendung in MOD-01 |
|---------|-------|----------------------|
| `profiles` | Core | Profil-Screen |
| `organizations` | Core | Firma-Screen |
| `memberships` | Core | Team-Verwaltung |
| `org_delegations` | Core | Delegationen-Anzeige |

### 4.2 Existierende Tabellen (Billing)

| Tabelle | Owner | Verwendung in MOD-01 |
|---------|-------|----------------------|
| `plans` | Billing | Plan-Auswahl |
| `subscriptions` | Billing | Aktueller Plan |
| `invoices` | Billing | Rechnungs-Liste |

### 4.3 Erforderliche Erweiterungen

| Tabelle | Status | Beschreibung |
|---------|--------|--------------|
| `billing_usage` | NEU (aus MOD-03) | Usage-Tracking pro Tenant/Periode |

---

## 5. API Contract

### Profil
- `GET /stammdaten/profile` → eigenes Profil
- `PATCH /stammdaten/profile` → Profil aktualisieren
- `POST /stammdaten/profile/avatar` → Avatar hochladen

### Firma (org_admin only)
- `GET /stammdaten/organization` → aktuelle Org
- `PATCH /stammdaten/organization` → Org-Settings aktualisieren
- `GET /stammdaten/members` → Mitglieder-Liste
- `POST /stammdaten/members/invite` → Einladung senden
- `PATCH /stammdaten/members/:id` → Rolle ändern
- `DELETE /stammdaten/members/:id` → Mitglied entfernen
- `GET /stammdaten/delegations` → Delegationen

### Abrechnung
- `GET /stammdaten/billing/current` → aktueller Plan + Credits
- `GET /stammdaten/billing/invoices` → Rechnungen
- `GET /stammdaten/billing/usage` → Usage-Daten
- `POST /stammdaten/billing/change-plan` → Plan-Wechsel initiieren

### Sicherheit
- `POST /stammdaten/security/change-password`
- `GET /stammdaten/security/sessions`
- `DELETE /stammdaten/security/sessions/:id`
- `GET /stammdaten/security/audit-log`

---

## 6. Berechtigungen (RLS)

| Aktion | Berechtigung |
|--------|--------------|
| Eigenes Profil lesen/schreiben | Self |
| Org-Settings lesen | Tenant Members |
| Org-Settings schreiben | org_admin |
| Mitglieder verwalten | org_admin |
| Delegationen sehen | org_admin |
| Billing sehen | org_admin |
| Billing ändern | org_admin (via Stripe Portal) |

---

## 7. Cross-Module Dependencies

| Modul | Abhängigkeit |
|-------|--------------|
| Zone 1 | `tile_catalog`, `tenant_tile_activation` für Modul-Zugang |
| MOD-03 DMS | `billing_usage` für Storage-Quotas |
| MOD-06 Verkauf | Kontakte für Inquiries |
| MOD-07 Finanzierung | Kontakte für Finance Packages |
| MOD-08 Investment-Suche | Kontakte für Favoriten-Verknüpfung |
| MOD-09 Vertriebspartner | Kontakte für Partner-Pipelines |
| MOD-10 Leadgenerierung | Kontakte für Lead-Konvertierung |
| Alle Module | `profiles`, `organizations`, `memberships` als Basis |

---

## 8. MVP Acceptance Criteria

- [ ] AC1: Dashboard zeigt Profil + Org + Billing-Status
- [ ] AC2: Profil kann bearbeitet werden (Name, Avatar)
- [ ] AC3: Team-Liste wird angezeigt (org_admin)
- [ ] AC4: Mitglieder können eingeladen werden
- [ ] AC5: Aktueller Plan wird angezeigt
- [ ] AC6: Rechnungen werden gelistet
- [ ] AC7: Passwort kann geändert werden
- [ ] AC8: Sessions werden angezeigt

---

## 9. Open Questions

Siehe `ZONE2_OPEN_QUESTIONS.md` → Q1.x
