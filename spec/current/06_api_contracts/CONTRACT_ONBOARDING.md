# Contract: Onboarding

| Feld | Wert |
|------|------|
| **Name** | Onboarding |
| **Direction** | Auth → Z2 |
| **Trigger** | User-Signup (INSERT on `auth.users`) |
| **Payload-Schema** | `{ user_id: UUID, email: string, raw_user_meta_data: { first_name?, last_name?, company_name? } }` |
| **IDs/Correlation** | `user_id` (auth.users.id), `profile_id` (profiles.id), `org_id` (organizations.id), `membership_id` |
| **SoT nach Übergabe** | Z2 (`profiles` + `organizations` + `memberships`) |
| **Code-Fundstelle** | SQL Trigger `on_auth_user_created` → `handle_new_user()` |
| **Fehlerfälle/Retry** | Bei Trigger-Fehler: User kann sich einloggen, aber hat kein Profil/Org. Manueller Fix via Z1 Admin. |

## Ablauf

1. User registriert sich via `/auth` (E-Mail + Passwort)
2. `auth.users` INSERT löst Trigger `on_auth_user_created` aus
3. `handle_new_user()` erstellt:
   - `profiles` Eintrag (id = user_id)
   - `organizations` Eintrag (Tenant)
   - `memberships` Eintrag (user ↔ org, role = `org_admin`)
4. User wird zu `/portal` redirected
5. Tile-Catalog bestimmt sichtbare Module basierend auf Rolle
