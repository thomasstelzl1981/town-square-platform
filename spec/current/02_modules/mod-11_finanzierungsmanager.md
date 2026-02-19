# MOD-11: Finanzierungsmanager (Finance Manager Workbench)

**Version:** 2.2.0  
**Zone:** 2 (Portal)  
**Status:** FROZEN  
**Role-Gated:** `finance_manager`  
**Last Updated:** 2026-02-18

---

## Übersicht

MOD-11 ist die Workbench für verifizierte Finanzierungsmanager. Manager bearbeiten hier zugewiesene Fälle und kommunizieren mit Kunden.

**SoT-Regel:** MOD-11 wird operatives SoT **NACH Zuweisung/Annahme** durch Zone 1 FutureRoom.

---

## Routes (FROZEN — aligned with routesManifest.ts)

| Pfad | Component | Beschreibung |
|------|-----------|--------------|
| `/portal/finanzierungsmanager` | Index | Redirect zu dashboard |
| `/portal/finanzierungsmanager/dashboard` | FMDashboard | Übersicht der Fälle |
| `/portal/finanzierungsmanager/finanzierungsakte` | FMFinanzierungsakte | Finanzierungsakte |
| `/portal/finanzierungsmanager/einreichung` | FMEinreichung | Bank-Einreichung |
| `/portal/finanzierungsmanager/provisionen` | FMProvisionen | Provisionen (Systemgebühr) |
| `/portal/finanzierungsmanager/archiv` | FMArchiv | Archiv |

### Dynamic Routes

| Pfad | Component | Beschreibung |
|------|-----------|--------------|
| `/portal/finanzierungsmanager/einreichung/:requestId` | FMEinreichungDetail | Einreichung Detail |
| `/portal/finanzierungsmanager/faelle/:requestId` | FMFallDetail | Finanzierungsakte Detail |

---

## Tile-Catalog Eintrag

```yaml
MOD-11:
  code: "MOD-11"
  title: "Finanzierungsmanager"
  icon: "Landmark"
  main_route: "/portal/finanzierungsmanager"
  display_order: 11
  sub_tiles: [dashboard, finanzierungsakte, einreichung, provisionen, archiv]
```

---

## Rollenprüfung

```typescript
// Zugriffskontrolle
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

const isFinanceManager = profile?.role === 'finance_manager';
```

Wenn kein `finance_manager`: Zeige "Kein Zugriff" mit Link zu Informationsseite.

---

## Status-Aktionen (Manager)

| Status | Beschreibung | Nächste mögliche |
|--------|--------------|------------------|
| `assigned` | Zuweisung erhalten | `in_processing` |
| `in_processing` | Wird bearbeitet | `needs_customer_action`, `completed`, `rejected` |
| `needs_customer_action` | Rückfrage an Kunden | `in_processing` (nach Kundenreaktion) |
| `completed` | Erfolgreich abgeschlossen | - |
| `rejected` | Abgelehnt | - |

---

## Datenmodell

### future_room_cases

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primary Key |
| `manager_tenant_id` | UUID | Tenant des Managers |
| `finance_mandate_id` | UUID | Referenz zu finance_mandates |
| `status` | enum | Case-Status |
| `target_bank_id` | UUID? | Zielbank für Einreichung |
| `submitted_to_bank_at` | timestamp? | Zeitpunkt der Bankeinreichung |
| `bank_response` | string? | Antwort der Bank |
| `first_action_at` | timestamp? | Erste Aktion des Managers |

### case_events (Audit-Trail)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primary Key |
| `tenant_id` | UUID | Mandant |
| `case_id` | UUID | Referenz zu cases |
| `event_type` | string | z.B. `status_change`, `message_sent` |
| `event_source` | string | `manager`, `system`, `customer` |
| `previous_status` | string? | Status vorher |
| `new_status` | string? | Status nachher |
| `actor_user_id` | UUID? | Ausführender User |
| `payload` | JSON? | Zusätzliche Daten |

---

## UI-Struktur

### Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard                                                    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│ │ Neu (3)     │ │ In Bearb.(5)│ │ Warte (2)   │             │
│ │ zugewiesen  │ │             │ │ auf Kunde   │             │
│ └─────────────┘ └─────────────┘ └─────────────┘             │
│                                                              │
│ Überfällige Fälle (>7 Tage ohne Aktivität)                  │
│ ┌──────────────────────────────────────────┐                │
│ │ FIN-ABC123 | Müller | 12 Tage            │                │
│ │ FIN-DEF456 | Schmidt | 8 Tage            │                │
│ └──────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Fall-Detail

```
┌─────────────────────────────────────────────────────────────┐
│ FIN-ABC123 - Max Mustermann                     [In Bearb.] │
├─────────────────────────────────────────────────────────────┤
│ Tabs: Übersicht | Selbstauskunft | Dokumente | Kommunikation│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Übersicht:                                                   │
│ ├── Objekt: Musterstraße 1, 12345 Berlin (ETW)              │
│ ├── Kaufpreis: 250.000 €                                     │
│ ├── Darlehenswunsch: 200.000 €                              │
│ ├── Eigenkapital: 50.000 €                                   │
│ └── Einreichung: 01.02.2026                                  │
│                                                              │
│ Selbstauskunft (read-only):                                  │
│ ├── Identität: ✓ Vollständig                                 │
│ ├── Einkommen: ✓ 4.500 € netto                              │
│ ├── Ausgaben: ✓ 1.200 € mtl.                                │
│ └── Vermögen: ✓ 60.000 € (Bank + Depot)                     │
│                                                              │
│ Dokumente:                                                   │
│ ├── ✓ Personalausweis                                        │
│ ├── ✓ Gehaltsabrechnungen (3)                               │
│ ├── ✓ Arbeitsvertrag                                         │
│ ├── ✓ Exposé                                                 │
│ ├── ⚠ Grundbuchauszug (fehlt)                               │
│ └── ✓ Energieausweis                                         │
│                                                              │
│ [Rückfrage stellen] [Status ändern] [An Bank einreichen]    │
└─────────────────────────────────────────────────────────────┘
```

---

## Kommissionierung (FROZEN)

Vor Annahme eines Mandats muss der Manager bestätigen:

```
┌─────────────────────────────────────────────────────────────┐
│ Provision bestätigen                                         │
│                                                              │
│ Für die Bearbeitung dieses Falls wird eine Provision von    │
│ 0,5% der Darlehenssumme (200.000 €) = 1.000 € fällig.       │
│                                                              │
│ [x] Ich bestätige die Provisionsvereinbarung                │
│                                                              │
│ [Mandat annehmen]                                           │
└─────────────────────────────────────────────────────────────┘
```

Bei Annahme:
- `finance_mandates.accepted_at` = now()
- Audit-Event `mandate.accepted`
- E-Mail an Kunden mit Manager-Kontaktdaten

---

## Integration

### Zone 1 (FutureRoom)
- Erhält zugewiesene Mandate via `finance_mandates`
- Status-Änderungen werden via `case_events` protokolliert
- Zone 1 kann Monitoring-Dashboard einsehen

### MOD-07 (Kundenportal)
- Status-Änderungen werden in `finance_requests.status` gespiegelt
- Bei `needs_customer_action`: Kunde sieht Aufforderung im Portal

### Notifications
- E-Mail bei Zuweisung (an Manager)
- E-Mail bei Annahme (an Kunde)
- E-Mail bei Rückfrage (an Kunde)
- E-Mail bei Abschluss (an Kunde + Manager)

---

## Bank-Einreichung (Phase 2)

*Nicht in erstem MVP, aber Struktur vorbereitet:*

1. Manager wählt Zielbank aus `finance_bank_contacts`
2. System generiert Einreichungspaket
3. Manager lädt PDF herunter oder übermittelt via Bank-Portal
4. Status `submitted_to_bank_at` gesetzt
5. Antwort manuell erfasst in `bank_response`

---

## Events & Audit

| Event | Trigger | Payload |
|-------|---------|---------|
| `mandate.assigned` | Zone 1 Zuweisung | `{mandate_id, manager_id}` |
| `mandate.accepted` | Manager nimmt an | `{mandate_id, commission_confirmed}` |
| `case.status_changed` | Status-Wechsel | `{case_id, from, to}` |
| `case.message_sent` | Rückfrage | `{case_id, message_preview}` |
| `case.completed` | Abschluss | `{case_id, outcome}` |

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 2.2.0 | 2026-02-18 | Routes-Tabelle an Manifest angeglichen: Dashboard, Finanzierungsakte, Einreichung, Provisionen, Archiv. Tile-Catalog YAML aktualisiert. |
| 2.1.0 | 2026-02-03 | Status-Machine und Kommissionierung dokumentiert |
| 2.0.0 | 2026-02-01 | Komplett-Umbau zur Manager-Workbench |
