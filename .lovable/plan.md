

# DSAR-Workflow: Pragmatischer Ausbau (Phase 1)

## Bewertung des Prompts

Der Prompt beschreibt ein vollstaendiges Enterprise-DSAR-System. Die Analyse zeigt:

| Bereich | Prompt-Umfang | Jetzt noetig? | Begruendung |
|---------|--------------|---------------|-------------|
| Status-Workflow (8 Stufen) | Ja | **Teilweise** | 6 Status reichen fuer MVP (ohne COLLECTING/EXPORT_READY) |
| Identitaetspruefung | Ja | **Ja** | Pflicht — keine Daten ohne Verifizierung |
| Datensammlung (Subject Map) | Ja | **Nein** | Manueller Prozess reicht bei 0-5 Anfragen/Jahr |
| ZIP-Export mit Checksums | Ja | **Nein** | Manuell zusammenstellen, PDF-Vorlage reicht |
| Antwortvorlage | Ja | **Ja** | Spart Zeit und ist rechtlich sauber |
| Camunda-ready Keys | Ja | **Nein** | Kein Camunda im Einsatz |
| Auto-Deletion Job | Ja | **Nein** | Manuell loeschbar bei geringem Volumen |
| dsar_artifacts Tabelle | Ja | **Nein** | Ein Export pro Case reicht |

## Was Phase 1 liefert

Ein funktionsfaehiger DSAR-Workflow, der **rechtlich sauber** ist, aber ohne Over-Engineering:

### 1. DB-Migration: Tabelle erweitern (12 → ~22 Felder)

Neue Felder auf `dsar_requests`:

```text
+ request_channel          (text, default 'EMAIL')
+ request_received_at      (timestamptz)
+ identity_status          (text, default 'UNVERIFIED')  -- UNVERIFIED | VERIFIED | FAILED
+ identity_method          (text, nullable)               -- LOGIN | EMAIL | ID_DOC | OTHER
+ identity_notes           (text, nullable)
+ scope_mode               (text, default 'FULL')         -- FULL | LIMITED
+ scope_notes              (text, nullable)
+ response_status          (text, default 'NONE')         -- NONE | DRAFT | SENT
+ response_sent_at         (timestamptz, nullable)
+ response_channel         (text, nullable)               -- EMAIL | PORTAL | POSTAL
+ assigned_to              (uuid, nullable)
+ internal_notes           (text, nullable)
```

Status-Werte anpassen auf: `NEW`, `IDENTITY_REQUIRED`, `IN_REVIEW`, `RESPONDED`, `CLOSED`, `REJECTED`

(Kein COLLECTING/EXPORT_READY — das ist Phase 2 wenn automatischer Export kommt)

### 2. UI: DSAR Tab komplett neu aufbauen

Statt der simplen Collapsible-Liste ein richtiges Case-Management:

**a) Inbox-Liste (oben)**
- Tabelle mit: Requester, Kanal, Status-Badge, Fristdatum, Zugewiesen-an
- Filter nach Status
- Button "Neue Anfrage erfassen" (manueller Intake)

**b) Case Detail (Inline-Expansion oder Subpage)**

Vier Bloecke:

1. **Anfragedaten** — Requester-Info, Kanal, Eingangsdatum, Frist (auto-berechnet: +30 Tage)
2. **Identitaetspruefung** — Status-Anzeige + Buttons (Verifiziert / Fehlgeschlagen) + Methode + Notizen
3. **Antwort** — Status + Antwortvorlage-Generator (Button generiert Text aus Case-Daten + Company Profile)
4. **Intern** — Notizen, Zuweisung, Timeline (Ledger Events)

**c) Schutzregel**: Antwort-Generierung und Status "RESPONDED" nur moeglich wenn `identity_status = 'VERIFIED'`

### 3. Antwortvorlage-Generator

Eine reine Frontend-Funktion die aus den Case-Daten + Company Profile (`sot`) den Art. 15 Antworttext generiert:

- Platzhalter werden ersetzt: `[NAME]`, `[REQUEST_DATE]`, `[COMPANY_LEGAL_NAME]`, etc.
- Text wird in einem grossen Textarea angezeigt (Copy-to-Clipboard)
- Der vollstaendige Text aus dem Prompt (Abschnitt G) wird als Template hardcoded
- Company-Daten kommen aus `compliance_company_profile` (gleicher Mechanismus wie Impressum)

### 4. Ledger-Events (Whitelist erweitern)

Neue Events im bestehenden Ledger-System:

- `dsar.created`
- `dsar.identity_verified`
- `dsar.identity_failed`
- `dsar.response_generated`
- `dsar.response_sent`
- `dsar.closed`
- `dsar.rejected`

### 5. Intake-Formular

Ein einfaches Formular zum manuellen Erfassen einer DSAR-Anfrage:
- Pflicht: requester_email, request_channel, request_received_at
- Optional: requester_name, requester_phone, user_id (falls bekannt)
- Auto: due_date = received_at + 30 Tage, status = NEW

## Was bewusst NICHT in Phase 1 kommt

| Feature | Grund |
|---------|-------|
| Automatischer Daten-Export (ZIP) | Erfordert Subject-Map ueber alle Tabellen — bei 0 Anfragen nicht lohnend |
| dsar_artifacts Tabelle | Ein Case = eine Antwort reicht |
| Signed URL Downloads | Keine automatischen Exports = kein Download noetig |
| Auto-Deletion Cron Job | Manuell loeschbar |
| Camunda Keys | Kein Camunda im Einsatz |
| Scope JSON (Module/Brands) | Scope-Notizen als Freitext reichen |
| Extension-Management | Seltenfall, Freitext-Notiz reicht |

## Datei-Zusammenfassung

| Aktion | Datei | Beschreibung |
|--------|-------|-------------|
| MIGRATION | `dsar_requests` | ~10 neue Spalten, Status-Werte anpassen |
| NEU | `src/pages/admin/compliance/dsar/DSARCaseList.tsx` | Inbox-Tabelle mit Filtern |
| NEU | `src/pages/admin/compliance/dsar/DSARCaseDetail.tsx` | Case-Detailansicht (4 Bloecke) |
| NEU | `src/pages/admin/compliance/dsar/DSARIntakeForm.tsx` | Manuelles Erfassungsformular |
| NEU | `src/pages/admin/compliance/dsar/DSARResponseGenerator.tsx` | Antwortvorlage-Generator |
| NEU | `src/pages/admin/compliance/dsar/dsarResponseTemplate.ts` | Art. 15 Textvorlage als Konstante |
| EDIT | `src/pages/admin/compliance/ComplianceDSAR.tsx` | Komplett ersetzen durch neue Subkomponenten |
| EDIT | `src/pages/admin/compliance/useComplianceCases.ts` | Hook erweitern fuer neue Felder + Intake-Mutation |
| EDIT | Ledger Event Whitelist | 7 neue `dsar.*` Events registrieren |

## Ergebnis

Ein rechtlich sauberer DSAR-Workflow der sofort nutzbar ist: Anfrage erfassen, Identitaet pruefen, Antwort generieren, Case schliessen. Alles auditiert im Ledger. Automatischer Export kann als Phase 2 nachgeruestet werden wenn das Volumen steigt.
