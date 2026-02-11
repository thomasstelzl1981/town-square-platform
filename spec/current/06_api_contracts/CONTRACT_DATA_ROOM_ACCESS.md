# Contract: Data Room Access

| Feld | Wert |
|------|------|
| **Name** | Data Room Access |
| **Direction** | Z2 → Z3 |
| **Trigger** | Freigabe-Aktion in MOD-06 (Verkauf) — Datenraum für Interessenten freigeben |
| **Payload-Schema** | `{ scope_id: UUID, scope_type: 'property' \| 'listing', subject_id: UUID, subject_type: 'lead' \| 'user', tenant_id: UUID, can_view: boolean, can_download: boolean, expires_at?: timestamp }` |
| **IDs/Correlation** | `access_grant_id`, `scope_id` (Property/Listing), `subject_id` (Lead/User), `tenant_id` |
| **SoT nach Übergabe** | Z3 (read-only Zugriff via `access_grants`) |
| **Code-Fundstelle** | `access_grants` Tabelle, `src/hooks/useAccessGrants.ts` |
| **Fehlerfälle/Retry** | Bei DB-Fehler: Toast-Meldung, User kann erneut freigeben. Revoke jederzeit möglich. |

## Ablauf

1. Eigentümer gibt Datenraum in MOD-06 frei
2. INSERT in `access_grants` mit Scope und Berechtigungen
3. Interessent (Z3) kann Dokumente einsehen/herunterladen
4. Zugriff kann widerrufen werden (`revoked_at` gesetzt)
5. Optionales Ablaufdatum (`expires_at`)
