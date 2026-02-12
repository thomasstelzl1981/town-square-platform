# Golden Path: Finanzierung (MOD-07 + MOD-11)

**Version:** 1.3  
**Status:** ACTIVE  
**Date:** 2026-02-12  
**Konsolidiert aus:** `docs/workflows/GOLDEN_PATH_FINANZIERUNG.md` (ZBC Schritt 7)

---

## Übersicht

Der Finanzierungs-Golden-Path beschreibt den vollständigen Workflow von der Selbstauskunft des Kunden bis zur Bank-Einreichung durch den Finanzierungsmanager.

**Kritische Trennung:**
- **MOD-07 (Kunde):** Datenerfassung + Snapshot-Erstellung — KEINE Bank-API, KEINE Akte!
- **Zone 1 (FutureRoom):** Triage + Zuweisung + Template-Governance
- **MOD-11 (Manager):** Akte aufbauen + Bank-Übergabe via E-Mail oder Europace API

---

## Modul-Verantwortlichkeiten

| Modul | Zone | Funktion | Bank-Übergabe |
|-------|------|----------|---------------|
| **MOD-07** | Zone 2 | Datenerfassung + Snapshot | ❌ NEIN |
| **FutureRoom** | Zone 1 | Triage + Delegation + Template-Mgmt | ❌ NEIN |
| **MOD-11** | Zone 2 | Akte aufbauen + operatives Processing | ✅ JA |

## MOD-07 Anfrage-Tab Kacheln

Der Anfrage-Tab in MOD-07 spiegelt die MOD-11 Kacheln in einer Kunden-Variante:

| Kachel | Beschreibung |
|--------|-------------|
| MagicIntake | Schnellerfassung per Freitext/Upload |
| Objekte aus Kaufy | Marktplatz-Suche, automatische Übernahme |
| Eckdaten | Kaufpreis, Eigenkapital, Wunschrate |
| Finanzierungskalkulator | Zinsen, Tilgung, Gesamtbedarf |
| Überschlägiges Angebot | FinanceOfferCard (Anzeige) |
| Finanzierungsobjekt | FinanceObjectCard (Stammdaten) |
| Kapitaldienstfähigkeit | HouseholdCalculationCard (liest Selbstauskunft) |

**Wichtig:** Die Selbstauskunft bleibt in ihrem eigenen Tab (permanent, objektunabhängig).

## Snapshot-Contract (MOD-07 → Zone 1)

Beim Einreichen wird ein **Snapshot** der Antragsteller-Daten erstellt:

```json
{
  "finance_request_id": "UUID",
  "tenant_id": "UUID",
  "applicant_snapshot": {
    "...alle applicant_profiles Felder...",
    "snapshot_at": "2026-02-12T..."
  }
}
```

- Gespeichert in `finance_requests.applicant_snapshot` (JSONB)
- Der FM erhält eine stabile Kopie — Originaldaten bleiben unberührt
- Der FM baut aus dem Snapshot seine eigene Finanzierungsakte

## Status-Flow

```
draft → complete → submitted_to_zone1 (Z2→Z1) → delegated (Z1→Z2) → accepted → in_review → bank_submitted → approved/rejected
```

## Detaillierter Ablauf

### Phase 1: Datenerfassung (MOD-07, Zone 2)

1. Kunde füllt Selbstauskunft aus (`applicant_profiles`) — permanent, objektunabhängig
2. Kunde erstellt Anfrage im Anfrage-Tab (Objekt + Eckdaten + Kalkulation)
3. Dokumente werden hochgeladen (DMS-Integration)
4. Completion-Score wird berechnet (min. 80%)
5. Kunde reicht Antrag ein → **Snapshot wird erstellt** → Status: `submitted_to_zone1`
6. `finance_mandate` mit Status `new` wird erstellt
7. Audit-Event `FIN_SUBMIT` wird geloggt

### Phase 2: Triage & Zuweisung (Zone 1 FutureRoom)

8. Antrag erscheint in FutureRoom Inbox (Status: `new`)
9. Zone 1 Admin prüft Vollständigkeit
10. Admin weist Finanzierungsmanager zu → Status: `delegated`
11. `assigned_manager_id` und `delegated_at` werden gesetzt

### Phase 3: Mandatsannahme & Benachrichtigung (MOD-11, Zone 2)

12. Manager sieht Mandat im Dashboard (professionelle Visitenkarte mit §34i-Daten)
13. Manager akzeptiert Mandat → Status: `accepted`
14. **Automatische Kunden-Benachrichtigung:**
    - Edge Function `sot-finance-manager-notify` wird ausgelöst
    - Vorlage wird aus `admin_email_templates` geladen (category=`finance`, name=`FM Vorstellung`)
    - Manager-Profil wird vollständig geladen (Name, Telefon, E-Mail, Firma, §34i)
    - **Absender:** Outbound-Identity des Managers
    - **Versand:** via `sot-system-mail-send` → Resend API

### Phase 4: Provisionsvereinbarung (MOD-11)

15. Manager bestätigt Provisionsvereinbarung (TermsGate, 30% Plattformgebühr)
16. `split_terms_confirmed_at` wird gesetzt → Mandat ist aktiv

### Phase 5: Akte aufbauen & Einreichung (MOD-11)

17. Manager lädt Snapshot-Daten aus `finance_requests.applicant_snapshot`
18. Manager baut daraus seine eigene Finanzierungsakte (ergänzt, korrigiert)
19. Manager wählt bis zu 4 Banken (KI-Suche, Kontaktbuch, manuell)
20. Manager sendet Antrag an Banken → Status: `bank_submitted`
21. Banken-Antworten werden nachverfolgt → `approved` / `rejected`

---

## FM-Visitenkarte (§34i Pflichtangaben)

Der Finanzierungsmanager pflegt seine professionelle Visitenkarte im Dashboard:

| Feld | DB-Spalte (profiles) |
|---|---|
| §34i Registrierungsnummer | `reg_34i_number` |
| Zuständige IHK | `reg_34i_ihk` |
| Erlaubnisbehörde | `reg_34i_authority` |
| Vermittlerregister-Nr. | `reg_vermittler_id` |
| Berufshaftpflicht (Versicherer) | `insurance_provider` |
| Berufshaftpflicht (Policen-Nr.) | `insurance_policy_no` |

Die Daten werden aus den Stammdaten vorgeladen und können über den Bearbeitungs-Dialog angepasst werden.

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

---

## Technische Referenzen

| Komponente | Pfad |
|---|---|
| Anfrage-Tab (MOD-07) | `src/pages/portal/finanzierung/AnfrageTab.tsx` |
| Selbstauskunft (MOD-07) | `src/components/finanzierung/SelbstauskunftFormV2.tsx` |
| Submission Hook | `src/hooks/useSubmitFinanceRequest.ts` |
| Zone 1 Zuweisung | `src/pages/admin/futureroom/FutureRoomZuweisung.tsx` |
| Zone 1 Vorlagen | `src/pages/admin/futureroom/FutureRoomTemplates.tsx` |
| Zone 1 Manager-Pool | `src/pages/admin/futureroom/FutureRoomManagers.tsx` |
| FM Dashboard | `src/pages/portal/finanzierungsmanager/FMDashboard.tsx` |
| FM Finanzierungsakte | `src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx` |
| Mandatsannahme | `src/hooks/useFinanceMandate.ts` → `useAcceptMandate()` |
| Notify Edge Fn | `supabase/functions/sot-finance-manager-notify/index.ts` |
| Mail Edge Fn | `supabase/functions/sot-system-mail-send/index.ts` |
| Golden Path Engine | `src/manifests/goldenPaths/MOD_07_11.ts` |

Siehe auch: [CONTRACT_FINANCE_SUBMIT.md](../../spec/current/06_api_contracts/CONTRACT_FINANCE_SUBMIT.md)

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-02-06 | Initial version |
| 1.1 | 2026-02-11 | Konsolidiert nach docs/golden-paths/ (ZBC Schritt 7) |
| 1.2 | 2026-02-12 | Persönliche FM-Vorstellungs-E-Mail, Template-System in Zone 1 |
| 1.3 | 2026-02-12 | Anfrage-Tab mit MOD-11 Kacheln, Snapshot-Contract, §34i-Visitenkarte, Selbstauskunft bereinigt (Sektionen 8+9 entfernt) |
