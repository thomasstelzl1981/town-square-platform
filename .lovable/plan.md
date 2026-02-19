
# Loeschantraege (Art. 17 DSGVO) — Pragmatischer Ausbau

## Bewertung des ChatGPT-Prompts

Gleiche Situation wie beim DSAR-Prompt: Der Vorschlag beschreibt ein Enterprise-System mit Execution Engine, Dry-Run-Mode, Tombstone-Strategien und automatisierten Deletion Runnern. Das ist fuer ein System mit 0 aktiven Loeschantraegen massives Over-Engineering.

| Bereich | Prompt-Umfang | Jetzt noetig? | Begruendung |
|---------|--------------|---------------|-------------|
| Status-Workflow (9 Stufen) | Ja | **Teilweise** | 6 Status reichen (ohne DELETING/PARTIALLY_COMPLETED) |
| Identitaetspruefung | Ja | **Ja** | Pflicht — identisch zum DSAR-Pattern |
| Anspruchspruefung (Legal Hold) | Ja | **Ja** | Kernthema Art. 17 — welche Daten duerfen/muessen bleiben |
| Deletion Runner / Execution Engine | Ja | **Nein** | Bei 0-5 Anfragen/Jahr: manuell loeschen reicht |
| Dry-Run Mode | Ja | **Nein** | Ohne automatische Loesch-Engine kein Dry-Run noetig |
| Tombstone/Anonymize Strategy per Table | Ja | **Nein** | Dokumentation reicht, keine automatische Ausfuehrung |
| deletion_plan_tasks Tabelle | Ja | **Nein** | Freitext-Notizen reichen fuer manuellen Prozess |
| Backup Scrub Jobs | Ja | **Nein** | Standard-Praxis, nur im Antworttext erwaehnen |
| 3 Antwortvorlagen | Ja | **Ja** | Spart Zeit, rechtlich sauber |
| Camunda Keys | Ja | **Nein** | Kein Camunda im Einsatz |

## Was Phase 1 liefert

Exakt das DSAR-Pattern gespiegelt: Manuelles Case-Management mit Identitaetspruefung, Legal-Hold-Bewertung, 3 Antwortvorlagen und Ledger-Audit. Keine automatische Loesch-Engine.

### 1. DB-Migration: Tabelle erweitern

Aktuelle `deletion_requests` hat nur 10 Felder. Neue Felder:

```text
+ request_channel          (text, default 'EMAIL')
+ request_received_at      (timestamptz)
+ requester_name           (text, nullable)
+ due_date                 (date)
+ identity_status          (text, default 'UNVERIFIED')
+ identity_method          (text, nullable)
+ identity_notes           (text, nullable)
+ scope_mode               (text, default 'FULL_ERASURE')
+ scope_notes              (text, nullable)
+ retention_notes          (text, nullable)        -- Freitext: welche Daten behalten + Grund
+ erasure_summary          (text, nullable)         -- Freitext: was geloescht wurde
+ response_status          (text, default 'NONE')
+ response_sent_at         (timestamptz, nullable)
+ response_channel         (text, nullable)
+ response_type            (text, nullable)         -- COMPLETED | PARTIAL | REJECTED
+ assigned_to              (uuid, nullable)
+ internal_notes           (text, nullable)
```

Status-Werte anpassen: `NEW`, `IDENTITY_REQUIRED`, `IN_REVIEW`, `HOLD_LEGAL`, `RESPONDED`, `CLOSED`, `REJECTED`

### 2. UI: Deletion Tab komplett neu aufbauen

Gleiche Architektur wie DSAR — Inbox + Detail + Intake + Response Generator:

**a) Inbox-Liste** (`DeletionCaseList.tsx`)
- Tabelle: Requester, Kanal, Status-Badge, Fristdatum, Legal Hold Indikator
- Filter nach Status
- Button "Neuen Loeschantrag erfassen"

**b) Case Detail** (`DeletionCaseDetail.tsx`) — 5 Bloecke:

1. **Anfragedaten** — Requester, Kanal, Eingang, Frist (30 Tage), Scope (Voll/Eingeschraenkt)
2. **Identitaetspruefung** — Identisch zum DSAR-Pattern (Methode + Buttons + Notizen)
3. **Anspruchspruefung / Legal Hold** — Hier das Kernthema Art. 17:
   - Legal Hold Grund (Freitext: z.B. "Steuerrechtliche Aufbewahrung bis 2033")
   - Retention-Notizen: Welche Datenkategorien behalten werden + warum
   - Erasure Summary: Was geloescht/anonymisiert wurde
   - Toggle: "Vollstaendig geloescht" vs. "Teilweise geloescht (Legal Hold)"
4. **Antwort** — 3 Vorlagen (Completed, Partial, Rejected), Copy-to-Clipboard
5. **Intern** — Notizen, Zuweisung

**c) Schutzregel**: Antwort nur moeglich wenn `identity_status = 'VERIFIED'`

### 3. Drei Antwortvorlagen (`deletionResponseTemplates.ts`)

Alle drei Texte aus dem Prompt (Abschnitt I) als Template-Funktionen:

1. **COMPLETED** — Bestaetigung der vollstaendigen Loeschung
2. **PARTIAL** — Teilweise Loeschung mit Legal-Hold-Begruendung
3. **REJECTED** — Ablehnung (z.B. Identitaet nicht nachgewiesen)

Platzhalter werden aus Case-Daten + Company Profile (`sot`) ersetzt.

### 4. Response Generator (`DeletionResponseGenerator.tsx`)

Spiegelt den DSAR-Generator:
- Dropdown: Antworttyp waehlen (Completed / Partial / Rejected)
- Text wird generiert und in grossem Textarea angezeigt
- Copy-to-Clipboard
- Versandkanal (E-Mail/Post) + "Als versendet markieren"

### 5. Ledger-Events (Whitelist erweitern)

Neue Events:

- `legal.deletion.created`
- `legal.deletion.identity_verified`
- `legal.deletion.identity_failed`
- `legal.deletion.legal_hold_applied`
- `legal.deletion.response_sent`
- `legal.deletion.closed`
- `legal.deletion.rejected`

### 6. Hook erweitern (`useComplianceCases.ts`)

- `DeletionRequest` Interface aktualisieren mit allen neuen Feldern
- `createDeletionRequest` Mutation hinzufuegen (analog `createRequest` bei DSAR)
- `updateDeletionStatus` erweitern fuer neue Felder + Ledger-Events

## Was bewusst NICHT kommt

| Feature | Grund |
|---------|-------|
| Deletion Runner / Execution Engine | Manuelle Loesung bei 0-5 Anfragen/Jahr |
| Dry-Run Mode | Ohne Engine kein Dry-Run |
| deletion_plan_tasks Tabelle | Freitext-Notizen reichen |
| Tombstone-Strategie per Table | Dokumentation, keine Automatisierung |
| Backup Scrub Jobs | Standard-Praxis, im Antworttext erwaehnt |
| Auto-Deletion / Retention Cron | Manuell loeschbar |

## Datei-Zusammenfassung

| Aktion | Datei | Beschreibung |
|--------|-------|-------------|
| MIGRATION | `deletion_requests` | ~17 neue Spalten, Status-Werte anpassen |
| NEU | `src/pages/admin/compliance/deletion/DeletionCaseList.tsx` | Inbox-Tabelle |
| NEU | `src/pages/admin/compliance/deletion/DeletionCaseDetail.tsx` | Case-Detailansicht (5 Bloecke) |
| NEU | `src/pages/admin/compliance/deletion/DeletionIntakeForm.tsx` | Erfassungsformular |
| NEU | `src/pages/admin/compliance/deletion/DeletionResponseGenerator.tsx` | Antwortvorlage-Generator (3 Typen) |
| NEU | `src/pages/admin/compliance/deletion/deletionResponseTemplates.ts` | 3 Art. 17 Textvorlagen |
| EDIT | `src/pages/admin/compliance/ComplianceDeletion.tsx` | Komplett ersetzen durch neue Subkomponenten |
| EDIT | `src/pages/admin/compliance/useComplianceCases.ts` | Hook erweitern: neue Felder, Create-Mutation, Ledger |
| EDIT | Ledger Event Whitelist (RPC) | 7 neue `legal.deletion.*` Events |

## Ergebnis

Der Deletion Tab wird zum Spiegel des DSAR-Tabs: Gleiche Qualitaet, gleiche Patterns, gleiche UX. Manuelles Case-Management das rechtlich sauber ist. Automatische Loesch-Engine kann als Phase 2 nachgeruestet werden wenn das Volumen es rechtfertigt.
