# Conflict Resolution Log

> **Version**: 1.0  
> **Status**: Living Document  
> **Erstellt**: 2026-01-25

Dieses Dokument trackt alle identifizierten Konflikte zwischen Spezifikationen, Code und Architektur.

---

## Legende

| Status | Bedeutung |
|--------|-----------|
| 🔴 OPEN | Konflikt identifiziert, nicht gelöst |
| 🟡 IN_PROGRESS | Lösung definiert, noch nicht implementiert |
| 🟢 RESOLVED | Implementiert und verifiziert |

---

## K: Konflikte (Kritisch)

### K1: Route-Prefix MOD-02

| Aspekt | Wert |
|--------|------|
| **ID** | K1 |
| **Bereich** | MOD-02 KI Office |
| **IST (Spec)** | `/portal/office` |
| **IST (Code)** | `/portal/ki-office` (App.tsx) |
| **SOLL** | `/portal/ki-office` |
| **Resolution** | Code hat Vorrang (semantisch klarer). Spec anpassen. |
| **Status** | 🟢 RESOLVED |
| **Datum** | 2026-01-25 |
| **Betroffene Dateien** | `docs/modules/MOD-02_KI_OFFICE.md` |

### K2: Route-Prefix MOD-03

| Aspekt | Wert |
|--------|------|
| **ID** | K2 |
| **Bereich** | MOD-03 DMS |
| **IST (Spec)** | `/portal/dms` |
| **IST (Code)** | `/portal/dms` ✅ |
| **SOLL** | `/portal/dms` |
| **Resolution** | Code angepasst: `App.tsx` und `PortalNav.tsx` aktualisiert |
| **Status** | 🟢 RESOLVED |
| **Datum** | 2026-01-25 |
| **Betroffene Dateien** | `src/App.tsx`, `src/components/portal/PortalNav.tsx` |
| **Datum** | 2026-01-25 |
| **Betroffene Dateien** | `src/App.tsx`, `src/components/portal/PortalNav.tsx` |

### K3: Contacts Ownership

| Aspekt | Wert |
|--------|------|
| **ID** | K3 |
| **Bereich** | Core/Backbone vs MOD-02 |
| **IST** | `contacts` in MODULE_OWNERSHIP_MAP unter "Vermietung/Miety" (2.8) |
| **SOLL** | `contacts` als Core/Backbone Object (Cross-Module) |
| **Resolution** | `contacts` nach Section 2.1 (Core/Foundation) verschieben |
| **Status** | 🟢 RESOLVED |
| **Datum** | 2026-01-25 |
| **Betroffene Dateien** | `MODULE_OWNERSHIP_MAP.md` |

### K4: Communication Events Ownership

| Aspekt | Wert |
|--------|------|
| **ID** | K4 |
| **Bereich** | Core/Backbone vs MOD-02 |
| **IST** | `communication_events` nicht im Ownership Map |
| **SOLL** | `communication_events` als Core/Backbone Object |
| **Resolution** | Neue Tabelle in Section 2.1 hinzufügen |
| **Status** | 🟢 RESOLVED |
| **Datum** | 2026-01-25 |
| **Betroffene Dateien** | `MODULE_OWNERSHIP_MAP.md` |

---

## M: Missing (Fehlende Elemente)

### M1: MOD-02 Tabellen nicht in DB

| Aspekt | Wert |
|--------|------|
| **ID** | M1 |
| **Bereich** | MOD-02 KI Office |
| **Fehlend** | `mail_accounts`, `mail_sync_status`, `letter_drafts`, `letter_sent`, `calendar_events`, `calendar_reminders` |
| **Resolution** | Migration bei Implementation erstellen |
| **Status** | 🟡 IN_PROGRESS |
| **Priorität** | Phase 1 MVP |

### M2: MOD-03 Tabellen nicht in DB

| Aspekt | Wert |
|--------|------|
| **ID** | M2 |
| **Bereich** | MOD-03 DMS |
| **Fehlend** | `storage_nodes`, `document_links`, `extractions`, `document_chunks`, `jobs`, `connectors` |
| **Resolution** | Migration bei Implementation erstellen |
| **Status** | 🟡 IN_PROGRESS |
| **Priorität** | Phase 1 MVP |

### M3: Integration Registry Lücken

| Aspekt | Wert |
|--------|------|
| **ID** | M3 |
| **Bereich** | Zone 1 |
| **Fehlend** | Einträge für RESEND, GMAIL_OAUTH, OUTLOOK_OAUTH, IMAP_GENERIC, CAYA |
| **Resolution** | Seed-Data bei Implementation erstellen |
| **Status** | 🟡 IN_PROGRESS |
| **Priorität** | Phase 1 MVP |

### M4: INTERFACES.md Erweiterungen

| Aspekt | Wert |
|--------|------|
| **ID** | M4 |
| **Bereich** | Cross-Module Dokumentation |
| **Fehlend** | MOD-01, MOD-02, MOD-03 Interfaces |
| **Resolution** | Sections 10-14 hinzufügen |
| **Status** | 🟢 RESOLVED |
| **Datum** | 2026-01-25 |
| **Betroffene Dateien** | `INTERFACES.md` |

---

## N: Naming Inkonsistenzen

### N1: Audit-Tabelle Naming

| Aspekt | Wert |
|--------|------|
| **ID** | N1 |
| **IST (Spec MOD-03)** | `audit_log` |
| **IST (DB)** | `audit_events` |
| **SOLL** | `audit_events` |
| **Resolution** | Existierende Tabelle beibehalten. Spec aktualisieren. |
| **Status** | 🟢 RESOLVED |
| **Datum** | 2026-01-25 |

### N2: Inbound Routing

| Aspekt | Wert |
|--------|------|
| **ID** | N2 |
| **IST (Spec MOD-03)** | `routing_rules` |
| **IST (DB)** | `inbound_routing_rules` |
| **SOLL** | `inbound_routing_rules` |
| **Resolution** | DB-Name beibehalten (klarer Kontext). Spec aktualisieren. |
| **Status** | 🟢 RESOLVED |
| **Datum** | 2026-01-25 |

### N3: Connectors vs Integration Registry

| Aspekt | Wert |
|--------|------|
| **ID** | N3 |
| **Bereich** | Zone 1 vs MOD-03 |
| **Konflikt** | Beide Specs erwähnen "Connectors" |
| **Resolution** | `integration_registry` (Zone 1) = Definitionen, `connectors` (MOD-03) = Tenant-Instanzen |
| **Status** | 🟢 RESOLVED |
| **Datum** | 2026-01-25 |

---

## A: Architektur-Klärungen

### A1: Core Objects Liste

| Aspekt | Wert |
|--------|------|
| **ID** | A1 |
| **IST (A1 Overview)** | 5 Core Objects: Org, User, Property, Lead, Document |
| **SOLL** | 6 Core Objects: + Contact |
| **Resolution** | `Contact` als 6. Core Object in A1 dokumentieren |
| **Status** | 🟢 RESOLVED |
| **Datum** | 2026-01-25 |

### A2: Communication Events Scope

| Aspekt | Wert |
|--------|------|
| **ID** | A2 |
| **Frage** | Gehört `communication_events` zu MOD-02 oder Backbone? |
| **Resolution** | Backbone (Cross-Module: MOD-02, MOD-03, MOD-04+ nutzen es) |
| **Status** | 🟢 RESOLVED |
| **Datum** | 2026-01-25 |

### A3: Storage Strategy DMS

| Aspekt | Wert |
|--------|------|
| **ID** | A3 |
| **Frage** | Multi-Bucket vs Single-Vault pro Tenant? |
| **Resolution** | Single Vault pro Tenant + `storage_nodes` für virtuelle Struktur |
| **Status** | 🟢 RESOLVED |
| **Datum** | 2026-01-25 |

---

### K6: User-Data-Spaces falsch kategorisiert

| Aspekt | Wert |
|--------|------|
| **ID** | K6 |
| **Bereich** | Storage Architecture / Integration Registry |
| **IST (Plan)** | Dropbox/OneDrive/GDrive in Zone 1 `integration_registry` |
| **SOLL** | User-scoped Connectors in Zone 2 MOD-03 `connectors` Tabelle |
| **Resolution** | ADR-037 + ADR-038 erstellt. User-Data-Connectors sind KEINE Platform-APIs. |
| **Status** | 🟢 RESOLVED |
| **Datum** | 2026-01-25 |
| **Grund** | GDPR-Compliance, User-Ownership, keine Platform-APIs |
| **Betroffene Dateien** | `ADR-037_Integration_Registry.md`, `ADR-038_Storage_Architecture.md`, `MOD-03_DMS.md` |

---

## Validation Checklist (vor Implementation)

Vor Start der Implementation müssen alle K-Konflikte RESOLVED sein:

- [x] K1: Route MOD-02 → RESOLVED (Spec angepasst)
- [x] K2: Route MOD-03 → RESOLVED (Code angepasst)
- [x] K3: Contacts Ownership → RESOLVED (Ownership Map aktualisiert)
- [x] K4: Communication Events → RESOLVED (Ownership Map aktualisiert)
- [x] K6: User-Data-Spaces → RESOLVED (ADR-037, ADR-038 erstellt)

✅ **Alle kritischen Konflikte gelöst — Ready for Implementation**

---

## Changelog

| Datum | Änderung | Autor |
|-------|----------|-------|
| 2026-01-25 | Initial erstellt mit K1-K4, M1-M4, N1-N3, A1-A3 | System |
| 2026-01-25 | K1, K3, K4, N1, N2, N3, A1, A2, A3, M4 → RESOLVED | System |
| 2026-01-25 | K6 hinzugefügt + RESOLVED (User-Data-Spaces) | System |
