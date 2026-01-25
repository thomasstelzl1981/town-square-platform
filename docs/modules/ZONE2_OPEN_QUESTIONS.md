# Zone 2 — Open Questions

**Status:** Living Document  
**Last Updated:** 2026-01-25

---

## MOD-01: Stammdaten

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| Q1.1 | Stripe Customer Portal Integration: Phase 1 oder Phase 2? | Phase 2 | PENDING |
| Q1.2 | 2FA Implementation: Native (Supabase) oder Third-Party? | Native Supabase | PENDING |
| Q1.3 | Team-Invite Flow: Magic Link oder Password-Setup? | Magic Link | PENDING |
| Q1.4 | Profil-Avatar: Supabase Storage Bucket oder External URL? | Supabase Storage | PENDING |
| Q1.5 | Multi-Tenant Switcher: In Header oder in Profil-Screen? | Header (global) | PENDING |

---

## MOD-02: KI Office

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| Q2.1 | Email scope: Phase 1 = READ + SEND? | Ja | PENDING |
| Q2.2 | Calendar: Phase 1 = internal only? | Ja | PENDING |
| Q2.3 | Fax/Briefdienst in Phase 1 oder Phase 2? | Phase 2 (abhängig von registrierten Integrations) | PENDING |
| Q2.4 | Contacts Ownership: Core Object statt MOD-spezifisch? | Ja, in Backbone verschieben | PENDING |
| Q2.5 | `communication_events` Owner? | Backbone oder MOD-02 | PENDING |
| Q2.6 | Mail-Sync: Full-Sync vs On-Demand? | On-Demand + Metadata-Cache | PENDING |
| Q2.7 | Whisperflow: OpenAI Whisper direkt oder via Armstrong? | Via Armstrong (centralized) | PENDING |
| Q2.8 | Briefgenerator PDF: Server-side (Edge Function) oder Client-side? | Server-side (Edge Function) | PENDING |

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

## MOD-04: Immobilien (Vorbereitung)

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| Q4.1 | Sub-Route Naming: `/immobilien/objekte` vs `/immobilien/portfolio`? | `/immobilien/objekte` (konsistent mit Tile-Name) | PENDING |
| Q4.2 | Investment-Engine Edge Function: Scope Phase 1? | Kaufpreis-Kalkulation, Rendite, Steuer-Schätzung | PENDING |
| Q4.3 | MOD-04 vs MOD-06 Abgrenzung: Verkaufsaktivierung wo? | MOD-04 = Aktivierung Toggle, MOD-06 = Sales-Prozess | PENDING |
| Q4.4 | Property-Features: Separate Tabelle oder JSONB in `properties`? | Separate Tabelle (existiert bereits: `property_features`) | PENDING |
| Q4.5 | Sanierung Sub-Tile: Scope Phase 1? | Basic Tracking (Status, Budget, Timeline) | PENDING |

---

## Cross-Module Questions

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| QX.1 | `contacts` Ownership: Core/Backbone vs MOD-02? | Core/Backbone (Cross-Module-Nutzung) | PENDING |
| QX.2 | `communication_events` Ownership: Backbone vs MOD-02? | Backbone | PENDING |
| QX.3 | Zentrale `connectors` Tabelle oder pro Modul? | Zentral in Zone 1, Tenant-Instanzen in `connectors` | PENDING |
| QX.4 | Armstrong Edge Function: Single vs Multi-Function? | Single mit Action-Dispatcher | PENDING |
| QX.5 | Audit-Events: Einheitliches Schema für alle Module? | Ja, `audit_events` mit `entity_type` Feld | PENDING |

---

## Resolution Log

_Questions will be moved here once resolved with final decisions._

| ID | Resolution | Date | ADR |
|----|------------|------|-----|
| - | - | - | - |
