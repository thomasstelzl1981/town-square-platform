# MOD-11: Finanzierungsmanager (Finance Manager Workbench)

**Version:** 2.0.0  
**Zone:** 2 (Portal)  
**Status:** FROZEN  
**Role-Gated:** `finance_manager`

## Übersicht

MOD-11 ist die Workbench für verifizierte Finanzierungsmanager. Manager bearbeiten hier zugewiesene Fälle und kommunizieren mit Kunden.

**WICHTIG:** MOD-11 wird operatives SoT NACH Zuweisung/Annahme durch Zone 1 FutureRoom.

## Routes

| Pfad | Component | Beschreibung |
|------|-----------|--------------|
| `/portal/finanzierungsmanager` | Index | Redirect zu dashboard |
| `/portal/finanzierungsmanager/dashboard` | FMDashboard | Übersicht der Fälle |
| `/portal/finanzierungsmanager/faelle` | FMFaelle | Fall-Liste |
| `/portal/finanzierungsmanager/faelle/:requestId` | FMFallDetail | Fall-Details + Aktionen |
| `/portal/finanzierungsmanager/kommunikation` | FMKommunikation | Nachrichtenverlauf |
| `/portal/finanzierungsmanager/status` | FMStatus | Status-Definitionen + Audit |

## Status-Aktionen (Manager)

- `in_processing` — Fall wird bearbeitet
- `needs_customer_action` — Rückfrage an Kunden
- `completed` — Erfolgreich abgeschlossen
- `rejected` — Abgelehnt

## Datenmodell

- `future_room_cases` — Case-Container für Manager
- `finance_mandates` — Zuweisung von Zone 1
- `case_events` — Audit-Trail

## Integration

- **Zone 1 (FutureRoom):** Erhält zugewiesene Mandate
- **MOD-07:** Status-Änderungen werden gespiegelt
- **Notifications:** Kunde erhält E-Mail bei Rückfragen

## Acceptance Criteria

- [ ] Nur finance_manager sehen das Modul
- [ ] Dashboard zeigt aktive/wartende Fälle
- [ ] Status-Änderungen werden protokolliert
- [ ] Rückfragen setzen needs_customer_action
