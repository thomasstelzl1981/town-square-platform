# Golden Path: Finanzierung (MOD-07 + MOD-11)

**Version:** 1.2  
**Status:** ACTIVE  
**Date:** 2026-02-12  
**Konsolidiert aus:** `docs/workflows/GOLDEN_PATH_FINANZIERUNG.md` (ZBC Schritt 7)

---

## Übersicht

Der Finanzierungs-Golden-Path beschreibt den vollständigen Workflow von der Selbstauskunft des Kunden bis zur Bank-Einreichung durch den Finanzierungsmanager.

**Kritische Trennung:**
- **MOD-07 (Kunde):** Nur Datenerfassung — KEINE Bank-API!
- **Zone 1 (FutureRoom):** Triage + Zuweisung + Template-Governance
- **MOD-11 (Manager):** Bank-Übergabe via E-Mail oder Europace API

---

## Modul-Verantwortlichkeiten

| Modul | Zone | Funktion | Bank-Übergabe |
|-------|------|----------|---------------|
| **MOD-07** | Zone 2 | Datenerfassung durch Kunden | ❌ NEIN |
| **FutureRoom** | Zone 1 | Triage + Delegation + Template-Mgmt | ❌ NEIN |
| **MOD-11** | Zone 2 | Operatives Processing | ✅ JA |

## Status-Flow

```
draft → complete → submitted (Z2→Z1) → assigned (Z1→Z2) → accepted → in_review → bank_submitted → approved/rejected
```

## Detaillierter Ablauf

### Phase 1: Datenerfassung (MOD-07, Zone 2)

1. Kunde füllt Selbstauskunft aus (`applicant_profiles`)
2. Dokumente werden hochgeladen (DMS-Integration)
3. Completion-Score wird berechnet (min. 80%)
4. Kunde reicht Antrag ein → Status: `submitted_to_zone1`
5. `finance_mandate` mit Status `new` wird erstellt
6. Audit-Event `FIN_SUBMIT` wird geloggt

### Phase 2: Triage & Zuweisung (Zone 1 FutureRoom)

7. Antrag erscheint in FutureRoom Inbox (Status: `new`)
8. Zone 1 Admin prüft Vollständigkeit
9. Admin weist Finanzierungsmanager zu → Status: `delegated`
10. `assigned_manager_id` und `delegated_at` werden gesetzt

### Phase 3: Mandatsannahme & Benachrichtigung (MOD-11, Zone 2)

11. Manager sieht Mandat im Dashboard
12. Manager akzeptiert Mandat → Status: `accepted`
13. **Automatische Kunden-Benachrichtigung:**
    - Edge Function `sot-finance-manager-notify` wird ausgelöst
    - Vorlage wird aus `admin_email_templates` geladen (category=`finance`, name=`FM Vorstellung`)
    - Manager-Profil wird vollständig geladen (Name, Telefon, E-Mail, Firma)
    - **Absender:** Outbound-Identity des Managers (z.B. `anna.schmidt@futureroom.com`)
    - **Versand:** via `sot-system-mail-send` → Resend API
    - E-Mail enthält persönliche Vorstellung und Kontaktdaten des Managers

### Phase 4: Provisionsvereinbarung (MOD-11)

14. Manager bestätigt Provisionsvereinbarung (TermsGate, 30% Plattformgebühr)
15. `split_terms_confirmed_at` wird gesetzt → Mandat ist aktiv

### Phase 5: Bearbeitung & Einreichung (MOD-11)

16. Manager bearbeitet Finanzierungsakte
17. Manager wählt bis zu 4 Banken (KI-Suche, Kontaktbuch, manuell)
18. Manager sendet Antrag an Banken → Status: `bank_submitted`
19. Banken-Antworten werden nachverfolgt → `approved` / `rejected`

---

## E-Mail-Vorlagen (Zone 1 Governance)

Die Vorlagen für automatische Benachrichtigungen werden in Zone 1 unter **FutureRoom > Vorlagen** verwaltet.

### FM Vorstellung (mandate_accepted)

| Platzhalter | Beschreibung |
|---|---|
| `{{customer_name}}` | Vorname des Antragstellers |
| `{{manager_name}}` | Vor- und Nachname des Managers |
| `{{manager_phone}}` | Mobilnummer des Managers |
| `{{manager_email}}` | Outbound-E-Mail des Managers |
| `{{manager_company}}` | Firma/Company-Line des Managers |
| `{{public_id}}` | Public-ID des Finanzierungsantrags |

**Standard-Vorlage:**
```
Guten Tag {{customer_name}},

mein Name ist {{manager_name}}, ich bin Ihr zugewiesener
Finanzierungsmanager für Ihren Antrag {{public_id}}.

Meine Kontaktdaten:
- Telefon: {{manager_phone}}
- E-Mail: {{manager_email}}
- {{manager_company}}

Ich melde mich umgehend bei Ihnen, sobald ich Ihre Anfrage
prüfen konnte. Melden Sie sich gerne jederzeit bei mir!

Mit freundlichen Grüßen,
{{manager_name}}
```

---

## Technische Referenzen

| Komponente | Pfad |
|---|---|
| Submission Hook | `src/hooks/useSubmitFinanceRequest.ts` |
| Zone 1 Zuweisung | `src/pages/admin/futureroom/FutureRoomZuweisung.tsx` |
| Zone 1 Vorlagen | `src/pages/admin/futureroom/FutureRoomTemplates.tsx` |
| Mandatsannahme | `src/hooks/useFinanceMandate.ts` → `useAcceptMandate()` |
| Notify Edge Fn | `supabase/functions/sot-finance-manager-notify/index.ts` |
| Mail Edge Fn | `supabase/functions/sot-system-mail-send/index.ts` |
| Einreichung UI | `src/pages/portal/finanzierungsmanager/FMEinreichung.tsx` |

Siehe auch: [CONTRACT_FINANCE_SUBMIT.md](../../spec/current/06_api_contracts/CONTRACT_FINANCE_SUBMIT.md)

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-02-06 | Initial version |
| 1.1 | 2026-02-11 | Konsolidiert nach docs/golden-paths/ (ZBC Schritt 7) |
| 1.2 | 2026-02-12 | Persönliche FM-Vorstellungs-E-Mail, Template-System in Zone 1, detaillierter Ablauf dokumentiert |
