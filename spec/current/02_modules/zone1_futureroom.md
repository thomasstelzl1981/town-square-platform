# Zone 1: FutureRoom (Finance Governance)

**Version:** 2.0.0  
**Zone:** 1 (Admin)  
**Status:** FROZEN

## Übersicht

FutureRoom ist die zentrale Governance-Stelle für Finanzierungsanfragen in Zone 1.

**SoT-Regel:** FutureRoom ist SoT NACH Einreichung (MOD-07) BIS zur Zuweisung an einen Manager (MOD-11).

## Routes

| Pfad | Component | Beschreibung |
|------|-----------|--------------|
| `/admin/futureroom` | FutureRoom | Dashboard (Redirect zu inbox) |
| `/admin/futureroom/inbox` | FutureRoomInbox | Neue Einreichungen |
| `/admin/futureroom/zuweisung` | FutureRoomZuweisung | Manager-Zuweisung |
| `/admin/futureroom/finanzierungsmanager` | FutureRoomManagers | Manager-Pool |
| `/admin/futureroom/bankkontakte` | FutureRoomBanks | Bank-Directory |
| `/admin/futureroom/monitoring` | FutureRoomMonitoring | KPIs + Aging |

## Workflow

```
MOD-07 Submit → Inbox (submitted_to_zone1) → Zuweisung (assigned) → MOD-11 (acceptance)
```

## Datenmodell

- `finance_mandates` — Mandate aus MOD-07
- `finance_bank_contacts` — Bank-Directory
- `profiles` mit role=finance_manager — Manager-Pool

## Acceptance Criteria

- [ ] Inbox zeigt neue Submissions
- [ ] Zuweisung setzt assigned_manager_id
- [ ] Bank-Directory ist pflegbar
- [ ] Monitoring zeigt Aging-Buckets
