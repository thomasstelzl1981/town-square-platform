# Zone 1 Fertigstellungsplan v1.1

**Version:** 1.1  
**Status:** AKTIV  
**Erstellt:** 2026-02-08  
**Bezug:** A2_Zone1_Admin_Governance_v3.0

---

## Oberste Governance-Regeln

### Regel 1: Zone 2 ist SSOT für Business-Daten
Zone 1 darf Zone 2 Daten **niemals verändern** ohne explizite Freigabe.
- Immobilien-Daten → MOD-04 ist SSOT
- Selbstauskunft-Daten → MOD-07 ist SSOT
- Kontakte (Tenant-Scope) → MOD-02 ist SSOT

### Regel 2: Zone 1 steuert durch Konfiguration
Zone 1 verändert **eigene Governance-Daten**:
- Tile-Aktivierungen (`tenant_tile_activation`)
- Partner-Verifizierung (`organizations.verified_at`)
- Mandats-Zuweisung (`finance_mandates.assigned_manager_id`)
- Lead-Zuweisung (`leads.assigned_to`)

### Regel 3: Masterdata = Read-Only Spiegel
Die Masterdata-Vorlagen in Zone 1 sind **Viewer**, keine Editoren.
Sie zeigen die aktuelle Struktur aus Zone 2 Code als Referenz.

### Regel 4: Entwicklungs-Account zeigt alles
Im Development-Mode ist `tenant_tile_activation` deaktiviert.
Alle Module sind sichtbar für vollständige Entwicklung.

---

## Sidebar-Struktur (10 Gruppen)

| Prio | Gruppe | Module | Phase |
|------|--------|--------|-------|
| 1 | Tenants & Access | Dashboard, Organisationen, Benutzer, Delegationen | 2 |
| 2 | Masterdata | Immobilienakte Vorlage (RO), Selbstauskunft Vorlage (RO) | 3 |
| 3 | KI Office | E-Mail, Kontakte, Kommunikation | 8 |
| 4 | Armstrong Zone 1 | Console, Actions, Logs, Knowledge, Billing, Policies, Test | 6 |
| 5 | Feature Activation | Tile-Katalog, Partner-Verifizierung | 4 |
| 6 | Backbone | Vereinbarungen, Posteingang | 9 |
| 7 | Operative Desks | FutureRoom, Sales Desk, Finance Desk, Acquiary, LeadPool, Provisionen | 7 |
| 8 | AI Agents | Dashboard, Katalog, Instanzen, Runs, Policies | 10 |
| 9 | System | Integrationen, Oversight, Audit Log | 5 |
| 10 | Platform Admin | Support, (Rechnungsstellung - später) | 11 |

---

## Phasenplan

### Phase 1: Dokumentation und Datenbereinigung ✅
**Ziel:** Repo und DB synchronisieren

| Schritt | Aufgabe | Status |
|---------|---------|--------|
| 1.1 | MOD-00 in tile_catalog einfügen | ✅ |
| 1.2 | integration_registry: OPENAI nicht vorhanden (korrekt) | ✅ |
| 1.3 | ZONE1_ADMIN_ROUTES.md aktualisieren | 🔄 |
| 1.4 | A2_Zone1_Admin_Governance.md auf v3.0 | 🔄 |
| 1.5 | ZONE1_COMPLETION_ROADMAP.md erstellen | ✅ |

---

### Phase 2: Tenants & Access (Gruppe 1)
**Status:** ✅ Abgeschlossen

| Modul | Aufgabe | Status |
|-------|---------|--------|
| Dashboard | KPI-Queries + Breakdown nach Typ/Rolle | ✅ |
| Organisationen | Typ-Filter + Suchfeld | ✅ |
| Benutzer | Rollen-Badge mit Varianten | ✅ |
| Delegationen | Status-Filter | ✅ |

---

### Phase 3: Masterdata (Gruppe 2)
**Status:** Read-Only Viewer (SSOT = Zone 2)

| Modul | Aufgabe |
|-------|---------|
| Immobilienakte Vorlage | Als Read-Only Referenz aus Zone 2 Types |
| Selbstauskunft Vorlage | Als Read-Only Referenz aus Zone 2 Types |

**Regel:** Zone 1 verändert diese Strukturen NICHT. Sie dienen der Dokumentation.

---

### Phase 4: Feature Activation (Gruppe 5)
**Status:** Infrastruktur bereit, Wirkung erst bei echten Tenants

| Modul | Aufgabe | Wann relevant |
|-------|---------|---------------|
| Tile-Katalog | MOD-00 anzeigen, als Doku nutzen | Jetzt (Dokumentation) |
| Tile-Katalog | Tenant-Aktivierung Tab | Phase 11 (echte Tenants) |
| Rollen & Berechtigungen | Rollen-Katalog + Matrix (Read-Only) | ✅ Implementiert |
| Partner-Verifizierung | Status-Workflow UI | Phase 11 (echte Partner) |

**Wichtig:** Im Entwicklungs-Account (`isDevelopmentMode = true`) zeigt Zone 2 ALLE Module.
`tenant_tile_activation` wird erst bei echtem Tenant-Onboarding relevant.

---

### Phase 5: System (Gruppe 9)
**Status:** ✅ Abgeschlossen

| Modul | Aufgabe | Status |
|-------|---------|--------|
| Integrationen | Status-Sync mit Secrets, Webhook-Section entfernt | ✅ |
| Oversight | 6 KPI-Blöcke, 4 Tabs, Detail-Dialoge | ✅ |
| Audit Log | Filter nach Typ/Org/Suche (Modul-Filter entfernt) | ✅ |

---

### Phase 6: Armstrong Zone 1 (Gruppe 4)
**Status:** Nur Mock-Daten

#### 6A: Datenbank-Schema erstellen

| Tabelle | Zweck | Priorität |
|---------|-------|-----------|
| armstrong_action_runs | Jede Ausführung protokollieren | Hoch |
| armstrong_knowledge_items | Wissensbasis-Einträge | Mittel |
| armstrong_policies | Guardrails, Risk-Levels | Mittel |
| armstrong_billing_events | Credit-Verbrauch | Niedrig |

#### 6B: Module mit DB verbinden

| Modul | Aktuelle Datenquelle | Ziel-Datenquelle |
|-------|---------------------|------------------|
| Console | mockKPIs | armstrong_action_runs aggregiert |
| Actions-Katalog | armstrongManifest.ts | armstrongManifest.ts (SSOT, ok) |
| Action Logs | mockLogs | armstrong_action_runs |
| Knowledge Base | mockItems | armstrong_knowledge_items |
| Billing | mockBilling | armstrong_billing_events |
| Policies | mockPolicies | armstrong_policies |
| Test Harness | - | Dry-Run ohne DB-Write (ok) |

---

### Phase 7: Operative Desks (Gruppe 7)
**Status:** Teilweise implementiert

| Desk | Status | Aufgaben |
|------|--------|----------|
| FutureRoom | 5 Tabs funktional | Feinarbeit |
| Acquiary | 7 Sub-Items funktional | Feinarbeit, Objekteingang |
| LeadPool | Funktional | Zone 3 Integration |
| Provisionen | Grundstruktur | Genehmigungsworkflow |
| Sales Desk | Stub | Publishing-Oversight implementieren |
| Finance Desk | Stub | Redirect zu FutureRoom oder entfernen |

---

### Phase 8: KI Office (Gruppe 3)
**Status:** Stubs

| Modul | Aufgabe |
|-------|---------|
| E-Mail | Resend-Integration für System-Mails (nicht User-IMAP) |
| Kontakte | Zone 1 Scope Filter (`scope='zone1_admin'`) |
| Kommunikation | Event-Timeline plattformweit |

---

### Phase 9: Backbone (Gruppe 6)
**Status:** Stubs

| Modul | Aufgabe |
|-------|---------|
| Vereinbarungen | Template-Liste (AGB, Datenschutz, Partner-Verträge) |
| Posteingang | Caya-Integration wenn verfügbar |

---

### Phase 10: AI Agents (Gruppe 8)
**Status:** Stubs

| Modul | Aufgabe |
|-------|---------|
| Dashboard | Agenten-Übersicht |
| Katalog | Verfügbare Agenten (Armstrong, Recherche, etc.) |
| Instanzen | Laufende Agenten pro Tenant |
| Runs | Ausführungshistorie |
| Policies | Sicherheitsregeln, Rate-Limits |

---

### Phase 11: Platform Admin, Abrechnung & Tenant-Onboarding (Gruppe 10)
**Status:** Zum Schluss

| Modul | Aufgabe |
|-------|---------|
| Support | Ticket-System |
| Rechnungsstellung (NEU) | Sidebar-Menüpunkt + Grundstruktur |
| Zahlungen (NEU) | Stripe-Integration |
| **Tenant-Onboarding** | Tile-Aktivierung wird hier relevant |

**Hier wird Feature Activation erst wirklich aktiv:**
- Neue Tenants anlegen
- Module pro Tenant freischalten
- Partner verifizieren

---

## Zusammenfassung: Reihenfolge

```
Phase 1: Dokumentation und Datengrundlagen ✅
    ↓
Phase 2: Tenants & Access (Feinarbeit)
    ↓
Phase 3: Masterdata (Read-Only Viewer)
    ↓
Phase 4: Feature Activation (Infrastruktur, Doku-Modus)
    ↓
Phase 5: System (Integrationen bereinigen)
    ↓
Phase 6: Armstrong Zone 1 (DB-Schema + Integration)
    ↓
Phase 7: Operative Desks (komplettieren)
    ↓
Phase 8: KI Office (System-Kommunikation)
    ↓
Phase 9: Backbone (Templates, Inbound)
    ↓
Phase 10: AI Agents (Governance)
    ↓
Phase 11: Platform Admin + Abrechnung + Tenant-Onboarding
          (Feature Activation wird hier AKTIV)
```

---

## Letzte Aktualisierung

- **2026-02-08:** Phase 5 abgeschlossen (Integrationen: Secret-Status-Sync, Webhooks entfernt, Audit Log vollständig)
- **2026-02-08:** Phase 2 abgeschlossen (Dashboard Breakdowns, Filter für Orgs/Users/Delegationen)
- **2026-02-08:** Phase 1 gestartet, MOD-00 eingefügt, Roadmap erstellt
