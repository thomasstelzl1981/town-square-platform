# A2 — ZONE 1: ADMIN / GOVERNANCE

**Version:** A2_Zone1_Admin_Governance_v2.0  
**Status:** FROZEN  
**Bezug:** A1_SystemOverview_v2.0 (FROZEN)  
**Changelog:** v2.0 — 10-Modul-Architektur; Lead Pool Management für MOD-10; Kaufy-Korrektur.

---

## Beschreibung

Zone 1 ist die **Admin- und Governance-Ebene** von „System of a Town".  
Sie ist die zentrale Steuerungsinstanz der Plattform — kein Arbeitsbereich für Endnutzer.

---

## A) Rolle von Zone 1

### Zone 1 IST:

- **Admin- & Governance-Ebene** der gesamten Plattform
- **Source of Truth** für Struktur, Rechte, IDs und Aktivierungen
- **Steuernd**, nicht operativ
- **Plattformweit** gültig (nicht tenant-fachlich)
- **Lesend** auf Zone 2 Daten (Oversight)
- **Lead Pool Manager** für Zone 3 Inbound-Leads

### Zone 1 ist NICHT:

- Kein User-Portal
- Kein Arbeitsbereich für Vertrieb, Eigentümer oder Kunden
- Kein Ort für Geschäftsprozesse oder Business-Workflows
- Keine Schnittstelle für Endnutzer-Interaktionen

---

## B) Kern-Verantwortlichkeiten

### 1. Organisationen & Tenants

Zone 1 verwaltet die gesamte Organisationsstruktur der Plattform:

- **Organisationstypen:** Platform, Partner, Client, Renter
- **Sub-Partner:** Sub-Partner entstehen ausschließlich durch Parent/Child-Beziehungen innerhalb des Typs „Partner".
- **Mandantenfähigkeit:** Jede Organisation ist ein isolierter Tenant
- **Parent/Child-Strukturen:** Hierarchische Beziehungen via `parent_id` und `materialized_path`
- **Lockdown-Regeln:** Child-Organisationen können Parent-Zugriff blockieren (`parent_access_blocked`)
- **Delegationen:** Explizite Rechteweitergabe zwischen Organisationen via `org_delegations`

**Prinzip:** Die hierarchische Position (materialized_path) ist append-only und wird nie verkürzt. Zugriffsbeziehungen werden ausschließlich über Delegationen und Lockdown-Regeln gesteuert.

---

### 2. User, Rollen & Mitgliedschaften

Zone 1 definiert das gesamte Rechte- und Zugriffssystem:

- **User vs. Organisation:** User existieren unabhängig, Zugriff erfolgt über Memberships
- **Memberships:** Ein User kann mehreren Organisationen angehören (eine Rolle pro Tenant)
- **Rollen:**
  - `platform_admin` — Plattformweiter Vollzugriff (God Mode)
  - `org_admin` — Tenant-Admin
  - `internal_ops` — Interne Operationen
  - `sales_partner` — Vertriebspartner (Zugang zu MOD-09/10)
  - `renter_user` — Mieter
- **Delegations-Logik:** Organisationen können Rechte an andere Organisationen delegieren
- **Plattform-Admin (God Mode):** Bypassed alle RLS-Regeln, sieht alles, kann alles

**Prinzip:** Rechte werden niemals direkt am User gespeichert, sondern über Memberships und Delegationen. Alle Rollen außer `platform_admin` sind tenant-gebunden und gelten ausschließlich innerhalb einer Organisation.

---

### 3. ID-System (Zentrales Fundament)

Zone 1 ist der **Hüter des Public-ID-Systems** (ADR-036):

**Entitäten mit Public IDs:**

| Entität | Präfix | Beispiel |
|---------|--------|----------|
| Tenant/Organization | T | SOT-T-8XK29 |
| Partner | V | SOT-V-3MN47 |
| Kunde/Client | K | SOT-K-9PL82 |
| Immobilie/Property | I | SOT-I-2QR56 |
| Einheit/Unit | E | SOT-E-7WS31 |
| Lead | L | SOT-L-4YT68 |
| Dokument | D | SOT-D-1ZU94 |
| Integration | X | SOT-X-5CV73 |
| Finance Package | F | SOT-F-6BN15 |
| Listing | LS | SOT-LS-2AB34 |

**Prinzipien:**

- **Eindeutigkeit:** Jede Public ID ist systemweit einmalig
- **Lesbarkeit:** Format `SOT-{PREFIX}-{BASE32}` ist URL-sicher und menschenlesbar
- **Lebenszyklus:** IDs werden bei Erstellung generiert und sind unveränderlich
- **Beziehung zur UUID:** Public ID ist Fassade, interne UUID bleibt Primärschlüssel
- **Zentrale Generierung:** Die Generierung von Public IDs erfolgt ausschließlich zentral über Zone 1 Logik und ist nicht von Client- oder Modulcode steuerbar.

**Prinzip:** Externe Kommunikation nutzt ausschließlich Public IDs, niemals interne UUIDs.

---

### 4. Tile- & Feature-Aktivierung

Zone 1 steuert die Verfügbarkeit von Zone-2-Modulen:

- **Tile Catalog:** Zentrale Liste aller verfügbaren Module
- **Aktivierung pro Tenant:** Via `tenant_tile_activation`
- **Regel:** Kein Modul existiert ohne definierten Tile
- **Sichtbarkeit vs. Logik:** Zone 1 steuert nur Sichtbarkeit, nicht die Modul-Logik selbst

**10 Module in Zone 2:**

| MOD | Name | Sichtbarkeit |
|-----|------|--------------|
| 01 | Stammdaten | Alle |
| 02 | KI Office | Alle |
| 03 | DMS | Alle |
| 04 | Immobilien | Alle |
| 05 | MSV | Alle |
| 06 | Verkauf | Alle |
| 07 | Finanzierung | Alle |
| 08 | Investment-Suche / Ankauf | Alle |
| 09 | Vertriebspartner | Kaufy-Registrierte |
| 10 | Leadgenerierung | Kaufy-Registrierte |

**Sichtbarkeitsmatrix:**

| Registrierung | Module |
|---------------|--------|
| SoT | 1–8 |
| Kaufy | 1–10 |

**Prinzip:** Zone 1 aktiviert Module, Zone 2 führt sie aus.

---

### 5. Integrationen & APIs

Zone 1 ist die **Integration Registry** (ADR-037):

**Typen:**

| Typ | Präfix | Beschreibung |
|-----|--------|--------------|
| Integration | X | Externer Service (z.B. Resend, Stripe) |
| Connector | C | Variante/Konfiguration einer Integration |
| Edge Function | E | Serverless Ausführungseinheit |
| Secret | S | Geschützter API-Schlüssel (nur Referenz) |

**Registrierte Integrationen:**

- **Resend:** System-Mails (Transaktional)
- **Stripe:** Billing & Payments
- **Caya:** Post-Inbound-Digitalisierung
- **Future Room:** Datenraum-Export
- **Immobilienscout24:** Listing-Publishing
- **Lovable AI Gateway:** KI-Services

**Regeln:**

- Nur registrierte Integrationen dürfen verwendet werden
- Secrets werden nur als Referenzen gespeichert, niemals im Klartext
- Edge Functions folgen dem Namensschema `sot-{module}-{action}`

**Prinzip:** Zone 1 registriert und kontrolliert, Zone 2 nutzt.

---

### 6. Lead Pool Management (NEU)

Zone 1 verwaltet den zentralen Lead Pool:

- **Inbound:** Alle Leads aus Zone 3 (Websites) landen im Pool
- **Qualifizierung:** Platform Admins qualifizieren Leads
- **Zuweisung:** Leads werden an Partner (MOD-10) zugewiesen
- **Split-Tracking:** 1/3 Platform : 2/3 Partner bei Pool-Leads

**Flow:**
```
Zone 3 (Website) → Zone 1 (Lead Pool) → MOD-10 (Partner Inbox)
```

**Prinzip:** Leads werden nicht direkt an Partner geroutet, sondern zentral gesteuert.

---

### 7. Oversight & Monitoring

Zone 1 bietet plattformweite Transparenz:

- **Read-Only-Zugriff:** Keine Schreiboperationen auf Zone-2-Daten
- **Plattformweite Sicht:** Über alle Tenants hinweg (nur für Platform Admins)
- **Kein Eingriff:** Oversight beobachtet, greift nicht in Geschäftsprozesse ein
- **Audit & Transparenz:** Alle kritischen Aktionen werden in `audit_events` protokolliert

**Monitoring-Signale:**

- MSV aktiviert (Property-Level)
- Lease aktiv (Unit-Level)
- Finance Handoff Readiness
- Public Listing Status
- Commission Pending Count
- Lead Pool Size

**Prinzip:** Oversight sieht alles, verändert nichts.

---

## C) Abgrenzung zu Zone 2 & Zone 3

### Zone 1 tut NIEMALS:

- Geschäftsprozesse ausführen (Verkauf, Vermietung, Finanzierung)
- Leads bearbeiten oder qualifizieren (außer Pool-Management)
- Dokumente inhaltlich verarbeiten
- E-Mails an Endkunden senden
- Property-Daten erstellen oder bearbeiten
- Verträge oder Mandate verwalten

### Datenfluss-Regeln:

| Von | Nach | Art |
|-----|------|-----|
| Zone 1 | Zone 2 | Steuerung (Tile-Aktivierung, Feature-Flags) |
| Zone 2 | Zone 1 | Read-Only (Oversight, Monitoring) |
| Zone 1 | Zone 3 | Keine direkte Verbindung |
| Zone 3 | Zone 1 | Lead Capture → Lead Pool |
| Zone 1 | MOD-10 | Lead Assignment |

### Steuerung vs. Ausführung:

- **Zone 1 steuert:** WAS verfügbar ist, WER Zugriff hat, WELCHE Integrationen existieren
- **Zone 2 führt aus:** Geschäftsprozesse, Workflows, User-Interaktionen
- **Zone 3 generiert:** Leads, öffentliche Sichtbarkeit

---

## Zusammenfassung

**A2 fixiert die Governance-Schicht von „System of a Town":**

1. Zone 1 ist **Source of Truth** für Struktur, Rechte und Aktivierungen
2. Zone 1 ist **steuernd**, nicht operativ
3. Zone 1 ist **strikt getrennt** von Zone 2 Business-Logik
4. Zone 1 verwaltet das **zentrale ID-System** für alle Entitäten
5. Zone 1 kontrolliert die **Integration Registry** für externe Services
6. Zone 1 bietet **Read-Only Oversight** über die gesamte Plattform
7. Zone 1 managt den **Lead Pool** für Zone 3 Inbound-Leads

---

**Nächster Schritt:** A3 (Zone 2 Modulstruktur) baut verbindlich auf dieser Governance-Definition auf.
