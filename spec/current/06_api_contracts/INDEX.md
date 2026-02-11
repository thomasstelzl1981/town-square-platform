# Cross-Zone Handoff Contract Index

**Version:** 1.0  
**Status:** ACTIVE  
**ZBC-Regel:** ZBC-R10  
**Date:** 2026-02-11

---

## Übersicht

Jeder Cross-Zone-Übergang im System MUSS einen formalen Contract haben (ZBC-R10). Dieses Dokument ist der zentrale Index aller Contracts.

---

## Contract-Register

| Contract | Richtung | Trigger | Code-Fundstelle | Status |
|----------|----------|---------|-----------------|--------|
| [Lead Capture](CONTRACT_LEAD_CAPTURE.md) | Z3 → Z1 | Form-Submit auf Website | `supabase/functions/sot-lead-inbox/` | Implementiert |
| [Finance Submit](CONTRACT_FINANCE_SUBMIT.md) | Z2 → Z1 | "Anfrage absenden" in MOD-07 | `finance_requests` Status-Enum | Implementiert |
| [Mandate Assignment](CONTRACT_MANDATE_ASSIGNMENT.md) | Z1 → Z2 | Admin-Zuweisung | `supabase/functions/sot-finance-manager-notify/` | Implementiert |
| [Onboarding](CONTRACT_ONBOARDING.md) | Auth → Z2 | User-Signup | SQL Trigger `on_auth_user_created` | Implementiert |
| [Data Room Access](CONTRACT_DATA_ROOM_ACCESS.md) | Z2 → Z3 | Freigabe-Aktion in MOD-06 | `access_grants` Tabelle | Implementiert |
| [Email Inbound](CONTRACT_EMAIL_INBOUND.md) | Extern → Z1 | Resend Webhook | `supabase/functions/sot-inbound-receive/` | Implementiert |

---

## Contract-Template (Pflichtfelder)

Jeder Contract MUSS folgende Felder enthalten:

| Feld | Beschreibung |
|------|-------------|
| Name | Eindeutiger Contract-Name |
| Direction | Z3→Z1, Z2→Z1, Z1→Z2, Auth→Z2, Extern→Z1 |
| Trigger | Was löst den Handoff aus |
| Payload-Schema | Felder mit Typen |
| IDs/Correlation | Welche IDs werden übergeben |
| SoT nach Übergabe | Wer ist Owner nach dem Handoff |
| Code-Fundstelle | Dateipfad der Implementierung |
| Fehlerfälle/Retry | Fehlerbehandlung |
