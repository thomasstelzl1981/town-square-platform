# Zone 2 — Open Questions

**Status:** Living Document  
**Last Updated:** 2026-01-25

---

## MOD-02: KI Office

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| Q2.1 | Email scope: Phase 1 = READ + SEND? | Ja | PENDING |
| Q2.2 | Calendar: Phase 1 = internal only? | Ja | PENDING |
| Q2.3 | Fax/Briefdienst in Phase 1 oder Phase 2? | Phase 2 (abhängig von registrierten Integrations) | PENDING |
| Q2.4 | Contacts Ownership: Core Object statt MOD-spezifisch? | Ja, in Backbone verschieben | PENDING |
| Q2.5 | `communication_events` Owner? | Backbone oder MOD-02 | PENDING |

---

## MOD-03: DMS

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| Q3.1 | Armstrong-Rolle in MOD-03: Minimal oder Aktiv? | Minimal (Dropzone + Sorting-Hints) | PENDING |
| Q3.2 | Existierende `documents`-Tabelle vs. Spec-Schema: Migration-Strategie? | Erweitern (Spalten hinzufügen) statt ersetzen | PENDING |
| Q3.3 | `inbound_items` (Memory FROZEN) vs. Spec-Architektur: Alignment? | Spec hat Vorrang, Memory aktualisieren | PENDING |
| Q3.4 | Worker-Deployment: Container vs. Edge Functions? | Container (horizontal skalierbar) | PENDING |
| Q3.5 | `audit_log` vs. existierendes `audit_events`: Naming? | `audit_events` beibehalten | PENDING |
| Q3.6 | `connectors` (MOD-03) vs. `integration_registry` (Zone 1): Overlap? | `connectors` = Tenant-Instanzen, Registry = Definitionen | PENDING |
| Q3.7 | Caya-Webhook-Format und Zone-1-Ingestion-Flow Details? | Noch zu spezifizieren | PENDING |

---

## Resolution Log

_Questions will be moved here once resolved with final decisions._
