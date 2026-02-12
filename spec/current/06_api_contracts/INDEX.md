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
| [Acq Mandate Submit](CONTRACT_ACQ_MANDATE_SUBMIT.md) | Z2 → Z1 | Mandat einreichen MOD-12 | `acq_mandates` Status-Enum | Dokumentiert |
| [Listing Publish](CONTRACT_LISTING_PUBLISH.md) | Z2 → Z1 | Inserat-Request an Zone 1 Governance | `supabase/functions/sot-listing-publish/` | Dokumentiert |
| [Listing Distribute](CONTRACT_LISTING_DISTRIBUTE.md) | Z1 → Z2/Z3 | Zone 1 verteilt Listing an Consumer | `listings`, `listing_publications` | Dokumentiert |
| [Social Mandate Submit](CONTRACT_SOCIAL_MANDATE_SUBMIT.md) | Z2 → Z1 | Social-Mandat MOD-14 | `supabase/functions/sot-social-mandate-submit/` | Dokumentiert |
| [Social Payment](CONTRACT_SOCIAL_PAYMENT.md) | Z2 → Extern → Z1 | Stripe Checkout | `supabase/functions/sot-social-payment-*` | Dokumentiert |
| [Acq Inbound Email](CONTRACT_ACQ_INBOUND_EMAIL.md) | Extern → Z1 | Resend Webhook (Akquise) | `supabase/functions/sot-acq-inbound-webhook/` | Dokumentiert |
| [Renovation Outbound](CONTRACT_RENOVATION_OUTBOUND.md) | Z2 → Extern | Tender-Anfrage MOD-04 | `supabase/functions/sot-renovation-outbound/` | Dokumentiert |
| [Renovation Inbound](CONTRACT_RENOVATION_INBOUND.md) | Extern → Z1 | Resend Webhook (Sanierung) | `supabase/functions/sot-renovation-inbound-webhook/` | Dokumentiert |
| [WhatsApp Inbound](CONTRACT_WHATSAPP_INBOUND.md) | Extern → Z1 | Meta WABA Webhook | `supabase/functions/sot-whatsapp-webhook/` | Dokumentiert |
| [Project Intake](CONTRACT_PROJECT_INTAKE.md) | Z1 → Z2 | Armstrong/Direktaufruf | `supabase/functions/sot-project-intake/` | Dokumentiert |
| [WhatsApp Media](CONTRACT_WHATSAPP_MEDIA.md) | Intern (Z1 → Z2 DMS) | Media-Empfang via WhatsApp | `supabase/functions/sot-whatsapp-media/` | Dokumentiert |
| [Acq Outbound Email](CONTRACT_ACQ_OUTBOUND_EMAIL.md) | Z2 → Extern | Akquise-Anschreiben MOD-12 | `supabase/functions/sot-acq-outbound/` | Dokumentiert |
| [Finance Doc Reminder](CONTRACT_FINANCE_DOC_REMINDER.md) | System → Z2 | Cron (woechentlich) | `supabase/functions/finance-document-reminder/` | Dokumentiert |
| [Landing Page Generate](CONTRACT_LANDING_PAGE_GENERATE.md) | Z2 → Z3 | Landing Page erstellen MOD-13 | `supabase/functions/sot-generate-landing-page/` | Dokumentiert |
| [Renter Invite](CONTRACT_RENTER_INVITE.md) | Z2 → Z1 → Z3 | Mietereinladung MOD-05 | `supabase/functions/sot-renter-invite/` | Implementiert |

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
