# Contract: Acquisition Mandate Submit

**Version:** 1.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10

---

## Direction

Z2 → Z1

## Trigger

User reicht Akquise-Mandat ein (Status-Wechsel → `submitted_to_zone1`) in MOD-12.

## Payload-Schema

```json
{
  "mandate_id": "UUID",
  "tenant_id": "UUID",
  "status": "submitted_to_zone1",
  "mandate_code": "string"
}
```

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `mandate_id` | Primaerschluessel in `acq_mandates` |
| `tenant_id` | Mandanten-Zuordnung |
| `mandate_code` | Menschenlesbarer Code (z.B. `ACQ-2026-001`) |

## SoT nach Uebergabe

Z1 Acquiary Inbox — Admin uebernimmt Review und Assignment.

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| DB-Fehler beim Status-Update | Toast-Fehler, User kann erneut einreichen |
| Auth-Fehler (nicht eingeloggt) | Redirect zu /auth |
| Mandate nicht gefunden | 404, sollte nicht auftreten (UI-gesteuert) |

## Code-Fundstelle

- `src/hooks/useAcqMandate.ts` (Status-Mutation)
- `acq_mandates` Tabelle (Status-Enum)
