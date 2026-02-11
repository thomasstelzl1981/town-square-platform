# Contract: Finance Submit

| Feld | Wert |
|------|------|
| **Name** | Finance Submit |
| **Direction** | Z2 → Z1 |
| **Trigger** | User klickt "Anfrage absenden" in MOD-07 Finanzierung |
| **Payload-Schema** | `{ finance_request_id: UUID, tenant_id: UUID, status: 'submitted', applicant_profile_id: UUID }` |
| **IDs/Correlation** | `finance_request_id`, `tenant_id`, `applicant_profile_id` |
| **SoT nach Übergabe** | Z1 FutureRoom (`finance_requests` + `finance_mandates`) |
| **Code-Fundstelle** | Status-Enum UPDATE auf `finance_requests.status = 'submitted'` |
| **Fehlerfälle/Retry** | Bei DB-Fehler: Toast-Meldung, User kann erneut einreichen. Kein automatischer Retry. |

## Ablauf

1. User vervollständigt Selbstauskunft (MOD-07)
2. User erstellt Finanzierungsanfrage mit Objektdaten
3. User klickt "Einreichen" → Status wird auf `submitted` gesetzt
4. Anfrage erscheint in Z1 FutureRoom Inbox
5. Admin weist Finanzierungsmanager zu → Status `assigned`
6. Manager bearbeitet in MOD-11

## Status-Flow

```
draft → complete → submitted (Z2→Z1) → assigned (Z1→Z2) → in_review → bank_submitted → approved/rejected
```
