
# Finaler SSOT-Plan: Einheitliche Gates + Vertraege + Golden Paths + Lead-Erweiterung

## Risikobewertung

### Gesamtrisiko: NIEDRIG

| Bereich | Risiko | Begruendung |
|---------|--------|-------------|
| DB-Migration (commissions erweitern) | Niedrig | Nur neue nullable Spalten, keine bestehenden Spalten aendern. pipeline_id wird nullable — keine Daten betroffen (Tabelle vermutlich leer oder minimal). |
| TermsGatePanel (neue Komponente) | Sehr niedrig | Rein additiv, greift in keine bestehende Logik ein. |
| AcceptMandateDialog umbauen | Niedrig | Isolierter Dialog mit klarer Schnittstelle (Props rein, onAccept raus). Innerer Inhalt aendert sich, Aussenschnittstelle bleibt. |
| AkquiseManagerPage Gate | Niedrig | Ersetzt inline-Card durch TermsGatePanel. useAcceptAcqMandate bleibt, wird nur erweitert. |
| PartnerReleaseDialog umbauen | Niedrig | Slider bleibt (Eigentuemer muss Provisionshoehe festlegen), nur Gebuehrenstruktur aendert sich (2.000 EUR fix → 30%-Regel). |
| NetworkTab anpassen | Niedrig | Additive Aenderung: 30%-Spalte ergaenzen, "Offen/Bezahlt" bleibt. Keine Datenquelle aendert sich. |
| Lead Pool erweitern | Niedrig | Additive Aenderung: Button + Dialog fuer manuelle Lead-Erstellung in bestehendem LeadPool.tsx. |
| sot-lead-inbox erweitern | Niedrig | Neuer action-Branch "accept_with_terms" neben bestehendem "accept". Alte Actions bleiben. |
| outboundBrands.ts Domains | Niedrig | Nur String-Werte aendern sich. Bestehende Outbound-Identities in DB bleiben (koennen manuell migriert werden). |
| agreement_templates Seed | Sehr niedrig | Rein additiv, INSERT von 5 neuen Templates. |
| contractGenerator.ts | Sehr niedrig | Neue Datei, keine Abhaengigkeiten zu bestehenden. |
| E-Mail-Trigger | Niedrig | sot-finance-manager-notify wird erweitert (console.log → Resend-Call), Edge Function Schnittstelle bleibt. |

**Warum das Risiko gering ist:**
1. Keine Tabellen werden geloescht oder umbenannt
2. Keine bestehenden Spalten werden geaendert (nur neue nullable Spalten)
3. Alle Gate-Dialoge haben saubere Props-Interfaces — der innere Inhalt aendert sich, die Aussenschnittstelle bleibt
4. Die Edge Functions bekommen neue Actions neben den bestehenden
5. Kein Routing aendert sich
6. Kein Auth-Flow wird beruehrt

---

## Korrigierte Geschaeftsregel: Zahlungspflichtiger

```text
Plattformgebuehr = 30% der Brutto-Provision
Zahlungspflichtiger variiert je Pfad:

PFAD 1 Finanzierung:  Finance Manager zahlt (verdient Provision)
PFAD 2 Akquise:       Akquise-Manager zahlt (verdient Provision)
PFAD 3 Verkauf:       Eigentuemer zahlt (beauftragt Verkauf)
PFAD 4 Lead:          Partner zahlt (uebernimmt Lead)
```

---

## Lead-Erweiterung: Manuelle Erfassung aus Zone 1

### IST-Zustand
- LeadPool.tsx (Zone 1): Zeigt Leads mit `zone1_pool = true`, hat Zuweisungs-Button (UserPlus Icon) aber keinen Create-Dialog
- leads Tabelle: Hat `source` enum mit `manual` als Wert — manuell ist also vorgesehen
- sot-lead-inbox Edge Function: Hat Actions list/accept/reject/create_deal — kein "create"
- Kein Dialog zum manuellen Anlegen eines Leads existiert

### SOLL
- LeadPool.tsx bekommt einen "Lead anlegen"-Button + Dialog
- Dialog-Felder: Name, E-Mail, Telefon, Interesse-Typ, Notizen, optional Ziel-Partner
- Bei Anlage: leads INSERT mit source: 'manual', zone1_pool: true
- Optional direkte Zuweisung: lead_assignments INSERT
- Der gesamte TermsGate-Flow greift dann wie bei Zone-3-Leads

---

## Phasen-Implementierungsplan

### Phase 1: Fundament

**1.1 outboundBrands.ts — Domains aktualisieren**
- KAUFY: kaufi.de → adkaufy.app
- ACQUIARY: acquiary.com → adacquiary.com
- FUTUREROOM: futureroom.de → futureroom.com
- Umlaut-Normalisierung in generateFromEmail() ergaenzen (ae, oe, ue, ss)
- Eindeutigkeitspruefung: Wird im Provisioning-Schritt behandelt (OutboundIdentityWidget)

**1.2 DB-Migration: commissions erweitern**

Neue nullable Spalten (kein Breaking Change):
- `commission_type` text (finance / acquisition / sales / lead)
- `liable_user_id` uuid (Zahlungspflichtiger)
- `liable_role` text (owner / finance_manager / akquise_manager / vertriebspartner)
- `gross_commission` numeric
- `platform_share_pct` numeric DEFAULT 30
- `platform_fee` numeric
- `reference_id` uuid
- `reference_type` text
- `contract_document_id` uuid

`pipeline_id` wird nullable gemacht (ALTER COLUMN ... DROP NOT NULL).

**1.3 DB-Seed: 5 agreement_templates einfuegen**

| Code | Titel |
|------|-------|
| FIN_MANDATE_ACCEPTANCE_V1 | Finanzierungsmandat-Uebernahme |
| ACQ_MANDATE_ACCEPTANCE_V1 | Akquise-Mandat-Uebernahme |
| PARTNER_RELEASE_V1 | Partner-Netzwerk-Freigabe |
| LEAD_ASSIGNMENT_V1 | Lead-Zuweisungsvertrag |
| REFERRAL_AGREEMENT_V1 | Tippgeber-Vereinbarung |

Jeder Template-Text enthaelt Platzhalter ({{partner_name}}, {{gross_commission}}, {{platform_fee}}, etc.) und Abschnitt 3 benennt den korrekten Zahlungspflichtigen je Pfad.

**1.4 contractGenerator.ts (neue Datei)**
- `generateContract(templateCode, variables)`: Laedt Template, ersetzt Platzhalter
- `storeContract(tenantId, content, metadata)`: Speichert als DMS-Dokument
- Reine Utility-Funktionen, keine Seiteneffekte

**1.5 TermsGatePanel.tsx (neue Shared Component)**

```text
Props:
  templateCode, templateVariables, onAccept, referenceId,
  referenceType, liableUserId, liableRole, grossCommission,
  grossCommissionPct

Verhalten:
  1. Laedt Template aus agreement_templates
  2. Zeigt Vertragsvorschau (Platzhalter ersetzt)
  3. Zeigt Zusammenfassung:
     - Brutto-Provision
     - Plattformgebuehr (30%)
     - Netto (bei Partner-Pfaden)
     - Zahlungspflichtiger (kontextabhaengiger Text)
  4. Checkbox + Button
  5. Bei Confirm:
     a) user_consents INSERT
     b) Vertrag generieren + DMS ablegen
     c) commissions INSERT (mit allen neuen Feldern)
     d) onAccept Callback
```

### Phase 2: Gate-Migration

**2.1 PFAD 1 — Finanzierung: AcceptMandateDialog**
- Datei: `src/components/finanzierung/AcceptMandateDialog.tsx`
- Aenderung: Inneren Inhalt durch TermsGatePanel ersetzen
- Props-Interface bleibt (open, onOpenChange, loanAmount, applicantName, onAccept, isPending)
- Provision: 0,5% vom Darlehensbetrag (bleibt)
- Plattformgebuehr: 30% davon
- liable_user_id = Finance Manager (der die onAccept-Aktion ausfuehrt)

**2.2 PFAD 2 — Akquise: AkquiseManagerPage Gate**
- Datei: `src/pages/portal/AkquiseManagerPage.tsx` (Zeilen 329-347)
- Aenderung: Orange Card durch TermsGatePanel ersetzen
- Hook useAcceptAcqMandate erweitern: Neben split_terms auch user_consents + commissions INSERT
- liable_user_id = Akquise-Manager

**2.3 PFAD 3 — Verkauf: PartnerReleaseDialog**
- Datei: `src/components/verkauf/PartnerReleaseDialog.tsx`
- Aenderung: Slider bleibt (3-15%), aber 2.000 EUR fixe Gebuehr wird durch 30%-Regel ersetzt
- Neue Berechnung: askingPrice x commissionRate = grossCommission, davon 30% = platformFee
- 2 Checkboxen werden zu 1 TermsGatePanel Checkbox
- liable_user_id = Eigentuemer (aus Listing/Tenant-Kontext)

**2.4 PFAD 4 — Lead Pool: Accept-Gate hinzufuegen**
- Datei: `src/pages/admin/LeadPool.tsx` — Zuweisungs-Dialog erweitern
- Edge Function `sot-lead-inbox`: Neuer action-Branch oder Erweiterung von "accept"
- Bei Accept: TermsGatePanel(LEAD_ASSIGNMENT_V1) einblenden
- liable_user_id = Partner

**2.5 Lead Pool: Manuelle Lead-Erstellung (Zone 1)**
- Datei: `src/pages/admin/LeadPool.tsx` — "Lead anlegen" Button + Dialog
- Dialog: Name, E-Mail, Telefon, Interesse-Typ, Notizen, Ziel-Rolle/Partner (optional)
- INSERT in leads mit source: 'manual', zone1_pool: true
- Bei direkter Zuweisung: lead_assignments INSERT, gleicher TermsGate-Flow

### Phase 3: E-Mail-Trigger

**3.1 sot-finance-manager-notify aufwerten**
- IST: Nur console.log
- SOLL: Aufruf von sot-system-mail-send fuer TRG-01 (TYPE A + TYPE B)

**3.2 Trigger in TermsGatePanel integrieren**
- Nach Consent + Vertrag: sot-system-mail-send aufrufen
- TRG-01: "Mandat angenommen" (System-Mail)
- TRG-03: "Vertrag verfuegbar" (System-Mail)

**3.3 Desk-Absender konfigurieren**
- futureroom@systemofatown.com
- acquiary@systemofatown.com
- leads@systemofatown.com
- sales@systemofatown.com

### Phase 4: Monitoring + Sichtbarkeit

**4.1 VertraegeTab (MOD-01 Stammdaten)**
- DMS-Dokument-Link aus commissions.contract_document_id ergaenzen

**4.2 CommissionApproval (Zone 1)**
- Neue Spalten: commission_type, liable_user_id (aufgeloest zu Name), gross_commission, platform_fee, reference_type

**4.3 NetworkTab (MOD-09)**
- Zusaetzliche Spalte: "Plattformanteil (30%)" und "Netto"
- Vertrags-Referenz-Link ergaenzen
- Bestehende Logik (deal_value x commission_rate) bleibt als Basis

---

## Datenfluss pro Gate: Zahlungspflichtiger

| Pfad | liable_user_id Quelle | liable_role | Zahlungstext im Vertrag |
|------|----------------------|-------------|------------------------|
| Finanzierung | auth.uid() (Finance Manager) | finance_manager | "Der Finance Manager entrichtet 30% seiner Bearbeitungsprovision" |
| Akquise | auth.uid() (Akquise-Manager) | akquise_manager | "Der Akquise-Manager entrichtet 30% seiner Akquise-Provision" |
| Verkauf | Eigentuemer (listings.tenant_id → org owner) | owner | "Der Eigentuemer entrichtet 30% der Kaeufer-Provision" |
| Lead | auth.uid() (Partner bei Accept) | vertriebspartner | "Der Partner entrichtet 30% bei erfolgreicher Konversion" |

---

## Dateien-Uebersicht

| Datei | Aenderungstyp | Phase |
|-------|--------------|-------|
| `src/config/outboundBrands.ts` | Modify (Domains) | 1 |
| DB: commissions Tabelle | Migration (neue Spalten) | 1 |
| DB: agreement_templates | Seed (5 INSERT) | 1 |
| `src/lib/contractGenerator.ts` | Neu | 1 |
| `src/components/shared/TermsGatePanel.tsx` | Neu | 1 |
| `src/components/finanzierung/AcceptMandateDialog.tsx` | Modify | 2 |
| `src/pages/portal/AkquiseManagerPage.tsx` | Modify (Gate-Card) | 2 |
| `src/hooks/useAcqMandate.ts` | Modify (useAcceptAcqMandate erweitern) | 2 |
| `src/components/verkauf/PartnerReleaseDialog.tsx` | Modify | 2 |
| `src/pages/portal/verkauf/ExposeDetail.tsx` | Modify (Props-Anpassung) | 2 |
| `src/pages/admin/LeadPool.tsx` | Modify (Create-Dialog + Terms-Gate) | 2 |
| `supabase/functions/sot-lead-inbox/index.ts` | Modify (accept erweitern) | 2 |
| `supabase/functions/sot-finance-manager-notify/index.ts` | Modify | 3 |
| `src/pages/portal/stammdaten/VertraegeTab.tsx` | Modify | 4 |
| `src/pages/admin/CommissionApproval.tsx` | Modify | 4 |
| `src/pages/portal/vertriebspartner/NetworkTab.tsx` | Modify | 4 |

**Keine Dateien werden geloescht. Kein Routing aendert sich. Keine Auth-Flows werden beruehrt.**

---

## Zusammenfassung

- 2 neue Dateien (contractGenerator.ts, TermsGatePanel.tsx)
- 1 DB-Migration (commissions erweitern, pipeline_id nullable)
- 5 agreement_templates (Seed)
- 1 Config-Update (outboundBrands.ts)
- 4 Gate-Dialoge umstellen (Finance, Akquise, Verkauf, Lead)
- 1 Lead Pool erweitern (manuelles Anlegen)
- 1 Edge Function erweitern (sot-lead-inbox)
- 1 Edge Function aufwerten (sot-finance-manager-notify)
- 3 Monitoring-Seiten anpassen (VertraegeTab, CommissionApproval, NetworkTab)
- Risiko: NIEDRIG — alle Aenderungen sind additiv oder ersetzen isolierte Dialog-Inhalte
