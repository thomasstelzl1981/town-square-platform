# Contract: Renter Invite

**Version:** 1.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10  
**Golden Path:** GP-10 Vermietung

---

## Direction

Z2 → Z1

## Trigger

Vermieter laedt Mieter ein (MOD-05, Insert in `renter_invites`).

## Payload-Schema

```json
{
  "lease_id": "UUID",
  "tenant_id": "UUID",
  "contact_id": "UUID",
  "email": "string",
  "invite_code": "string"
}
```

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `lease_id` | Mietvertrag |
| `tenant_id` | Vermieter-Organisation |
| `contact_id` | Kontakt des Mieters |
| `invite_code` | Einladungscode fuer Registrierung |

## SoT nach Uebergabe

Z1 Governance (Logging, Email-Dispatch via Edge Function, Renter-Org Provisioning).

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| Email-Versand fehlgeschlagen | Log, Admin kann erneut einladen |
| Renter-Org Erstellung fehlgeschlagen | Log, manueller Retry durch Admin |
| Doppelte Einladung | Deduplizierung via lease_id + email |

## Code-Fundstelle

- `renter_invites` Tabelle (DB Insert durch MOD-05)
- Edge Function fuer Email-Dispatch: **NOCH NICHT IMPLEMENTIERT**
- Renter-Org Provisioning: **NOCH NICHT IMPLEMENTIERT**

## Offene Implementierungen

1. Edge Function `sot-renter-invite/index.ts` — Email-Versand via Resend
2. Renter-Org Erstellung bei Invite-Akzeptanz
3. Cross-Tenant Datenraum (access_grants fuer Vermieter -> Mieter)
4. Verbindung in MOD-20 Kommunikation (statt Hardcoded-Daten)
