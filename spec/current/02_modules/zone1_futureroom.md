# Zone 1: FutureRoom (Finance Governance)

**Version:** 2.1.0  
**Zone:** 1 (Admin)  
**Status:** FROZEN  
**Last Updated:** 2026-02-03

---

## Übersicht

FutureRoom ist die zentrale Governance-Stelle für Finanzierungsanfragen in Zone 1.

**SoT-Regel:** FutureRoom ist SoT **NACH Einreichung** (MOD-07) **BIS zur Zuweisung** an einen Manager (MOD-11).

---

## Routes (FROZEN)

| Pfad | Component | Beschreibung |
|------|-----------|--------------|
| `/admin/futureroom` | FutureRoom | Dashboard (Redirect zu inbox) |
| `/admin/futureroom/inbox` | FutureRoomInbox | Neue Einreichungen |
| `/admin/futureroom/zuweisung` | FutureRoomZuweisung | Manager-Zuweisung |
| `/admin/futureroom/finanzierungsmanager` | FutureRoomManagers | Manager-Pool |
| `/admin/futureroom/bankkontakte` | FutureRoomBanks | Bank-Directory |
| `/admin/futureroom/monitoring` | FutureRoomMonitoring | KPIs + Aging |

---

## Workflow (FROZEN)

```
MOD-07 Submit
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ ZONE 1 FUTUREROOM                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Inbox                      Zuweisung                        │
│  ┌─────────┐               ┌─────────┐                      │
│  │ new     │───────────────▶│ assign  │                      │
│  │ cases   │               │ manager │                      │
│  └─────────┘               └────┬────┘                      │
│                                 │                            │
│                                 ▼                            │
│                          ┌───────────┐                       │
│                          │  MOD-11   │                       │
│                          │ Workbench │                       │
│                          └───────────┘                       │
│                                                              │
│  Monitoring ◄────── Status-Spiegelung ──────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Status-Übersicht

| Status | Location | Beschreibung |
|--------|----------|--------------|
| `draft` | MOD-07 | Kunde bereitet vor |
| `collecting` | MOD-07 | Selbstauskunft in Arbeit |
| `ready` | MOD-07 | Bereit zur Einreichung |
| `submitted` | Zone 1 | Im Inbox |
| `assigned` | Zone 1 | Manager zugewiesen |
| `in_processing` | MOD-11 | Manager bearbeitet |
| `needs_customer_action` | MOD-11 | Kunde muss reagieren |
| `completed` | MOD-11 | Erfolgreich |
| `rejected` | MOD-11 | Abgelehnt |

---

## Datenmodell

### finance_mandates

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primary Key |
| `tenant_id` | UUID | Ursprungs-Tenant |
| `finance_request_id` | UUID | Referenz zu MOD-07 |
| `public_id` | string | Human-readable ID |
| `status` | enum | Mandate-Status |
| `priority` | number | 0=normal, 1=hoch |
| `assigned_manager_id` | UUID? | Zugewiesener Manager |
| `delegated_at` | timestamp? | Zeitpunkt der Zuweisung |
| `delegated_by` | UUID? | Admin der zugewiesen hat |
| `accepted_at` | timestamp? | Manager-Annahme |
| `notes` | string? | Admin-Notizen |

### finance_bank_contacts

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primary Key |
| `public_id` | string | Bank-Kürzel |
| `bank_name` | string | Vollständiger Name |
| `contact_name` | string? | Ansprechpartner |
| `contact_email` | string? | E-Mail |
| `contact_phone` | string? | Telefon |
| `portal_url` | string? | Bank-Portal URL |
| `preferred_loan_types` | string[]? | Bevorzugte Darlehensarten |
| `preferred_regions` | string[]? | Regionen |
| `min_loan_amount` | number? | Mindestbetrag |
| `max_loan_amount` | number? | Maximalbetrag |
| `is_active` | boolean | Aktiv? |
| `notes` | string? | Interne Notizen |

---

## UI-Struktur

### Inbox

```
┌─────────────────────────────────────────────────────────────┐
│ Inbox - Neue Einreichungen                            (12)  │
├─────────────────────────────────────────────────────────────┤
│ Filter: [Alle ▼] [Priorität ▼] [Quelle ▼]    [Suche...]    │
├─────────────────────────────────────────────────────────────┤
│ ID        │ Kunde      │ Objekt      │ Betrag  │ Eingeg.   │
│───────────┼────────────┼─────────────┼─────────┼───────────│
│ FIN-ABC12 │ M. Müller  │ Berlin, ETW │ 200.000 │ vor 2h    │
│ FIN-DEF45 │ K. Schmidt │ Hamburg, MFH│ 450.000 │ vor 1 Tag │
│ FIN-GHI78 │ A. Weber   │ (Custom)    │ 180.000 │ vor 3 Tage│
└─────────────────────────────────────────────────────────────┘
```

### Zuweisung

```
┌─────────────────────────────────────────────────────────────┐
│ Zuweisung - Manager zuweisen                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Unzugewiesene Fälle (3)          Verfügbare Manager         │
│ ┌────────────────────┐           ┌────────────────────────┐ │
│ │ FIN-ABC12          │    ──▶    │ Max Muster (2 offen)   │ │
│ │ FIN-DEF45          │           │ Anna Schmidt (5 offen) │ │
│ │ FIN-GHI78          │           │ Tom Weber (1 offen)    │ │
│ └────────────────────┘           └────────────────────────┘ │
│                                                              │
│ Drag & Drop oder Dropdown zur Zuweisung                     │
│                                                              │
│ Bei Zuweisung:                                               │
│ - Manager erhält E-Mail                                      │
│ - Status → assigned                                          │
│ - Audit-Event erstellt                                       │
└─────────────────────────────────────────────────────────────┘
```

### Monitoring

```
┌─────────────────────────────────────────────────────────────┐
│ Monitoring - KPIs & Aging                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Status-Verteilung                  Ø Zeit bis Zuweisung     │
│ ┌────────────────────────┐        ┌───────────────────────┐ │
│ │ ▓▓▓▓░░░░░░ submitted 40% │       │ 1.2 Tage              │ │
│ │ ▓▓▓░░░░░░░ assigned 30% │        └───────────────────────┘ │
│ │ ▓▓░░░░░░░░ processing 20%│                                 │
│ │ ▓░░░░░░░░░ completed 10% │       Aging Buckets            │
│ └────────────────────────┘        ┌───────────────────────┐ │
│                                    │ < 3 Tage: 15          │ │
│                                    │ 3-7 Tage: 8           │ │
│                                    │ > 7 Tage: 3 ⚠️         │ │
│                                    └───────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Events & Audit

| Event | Trigger | Payload |
|-------|---------|---------|
| `mandate.created` | MOD-07 Submit | `{mandate_id, request_id}` |
| `mandate.assigned` | Admin Zuweisung | `{mandate_id, manager_id, assigned_by}` |
| `mandate.priority_changed` | Admin | `{mandate_id, old, new}` |
| `mandate.rejected` | Admin Ablehnung | `{mandate_id, reason}` |

---

## Integration

### MOD-07 (Kundenportal)
- Bei Submit: `finance_mandates` Eintrag erstellt
- Status-Updates werden zurück gespiegelt

### MOD-11 (Manager)
- Erhält zugewiesene Mandate
- Status-Updates an Zone 1

### Notifications
- E-Mail an Manager bei Zuweisung
- E-Mail an Kunde bei Manager-Bestätigung

---

## Acceptance Criteria

- [x] Routes definiert und dokumentiert
- [x] Workflow-Diagramm erstellt
- [x] Datenmodell spezifiziert
- [x] UI-Struktur skizziert
- [ ] Inbox zeigt neue Submissions
- [ ] Zuweisung setzt assigned_manager_id
- [ ] Bank-Directory ist pflegbar
- [ ] Monitoring zeigt Aging-Buckets
