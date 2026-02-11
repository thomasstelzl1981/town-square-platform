# Contract: Mandate Assignment

| Feld | Wert |
|------|------|
| **Name** | Mandate Assignment |
| **Direction** | Z1 → Z2 |
| **Trigger** | Admin weist Manager in FutureRoom/Acquiary zu |
| **Payload-Schema** | `{ mandate_id: UUID, assigned_manager_user_id: UUID, mandate_type: 'finance' \| 'acquisition' }` |
| **IDs/Correlation** | `mandate_id`, `assigned_manager_user_id`, `finance_request_id` (bei Finanzierung), `acq_mandate_id` (bei Akquise) |
| **SoT nach Übergabe** | Z2 (MOD-11 Finanzierungsmanager oder MOD-12 Akquise-Manager) |
| **Code-Fundstelle** | `supabase/functions/sot-finance-manager-notify/`, `src/components/admin/acquiary/` |
| **Fehlerfälle/Retry** | Bei Notification-Fehler: Zuweisung bleibt bestehen, Benachrichtigung wird geloggt. Admin kann erneut benachrichtigen. |

## Ablauf

1. Anfrage/Mandat erscheint in Z1 Inbox (FutureRoom oder Acquiary)
2. Admin wählt Manager aus verfügbarem Pool
3. Status-Update: `assigned`, `assigned_manager_user_id` gesetzt
4. Edge Function sendet Benachrichtigung an Manager
5. Fall erscheint im Z2 Manager-Dashboard (MOD-11 oder MOD-12)
