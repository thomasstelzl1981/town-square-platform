

# Compliance Desk — Editor-Felder nachrüsten (MVP)

## Status Quo

Die Tabs 3 und 4 haben bereits einen Markdown-Editor (Textarea im Dialog) fuer `content_md` und `change_note`. Die uebrigen Tabs (6, 7, 8, 9) haben **keine** Editor-/Textfelder — sie zeigen nur Listen und Status-Buttons.

## Aenderungen je Tab

### Tab 3 (Public Pages) + Tab 4 (Portal Terms) — bereits vorhanden
Beide haben Dialog mit `Textarea` fuer `content_md` + Version-Liste. Kleine Verbesserung:
- **`change_note`-Feld** hinzufuegen: Ein `Input`-Feld "Aenderungsnotiz" oberhalb des Save-Buttons im Dialog, wird an `createVersion.mutate({ ..., changeNote })` uebergeben.
- Versionen: `change_note` in der Versionsliste anzeigen (bereits vorbereitet via `v.change_note`).

### Tab 6 (Agreements) — Editor hinzufuegen
Aktuell reine Read-only-Liste. `agreement_templates` hat ein `content`-Feld (TEXT), das nirgends editiert wird.

Aenderungen an `ComplianceAgreements.tsx`:
- Pro Template: Klappbarer Bereich (Collapsible oder Dialog) mit:
  - `Textarea` fuer `content` (Markdown, `min-h-[300px] font-mono`)
  - `Input` fuer `title` (editierbar)
  - Save-Button (UPDATE auf `agreement_templates`)
- Mutation: `supabase.from('agreement_templates').update({ content, title, updated_at }).eq('id', id)`
- Ledger-Event: `legal.document.version_created` (optional)

### Tab 7 (Consents) — Editor + Create hinzufuegen
Aktuell leere Liste. `consent_templates` hat `body_de` (TEXT) + `title_de` + `code` + `version`.

Aenderungen an `ComplianceConsents.tsx`:
- "Neues Template"-Button oben rechts oeffnet Dialog mit:
  - `Input` fuer `code` (z.B. `MARKETING_CONSENT_V1`)
  - `Input` fuer `title_de`
  - `Textarea` fuer `body_de` (Markdown, `min-h-[200px] font-mono`)
  - `Input` fuer `required_for_module` (optional)
  - Save-Button (INSERT)
- Pro bestehendes Template: Klick oeffnet Edit-Dialog mit gleichen Feldern
- `is_active` Toggle-Button in der Liste

### Tab 8 (DSAR) — Notes-Textarea hinzufuegen
Aktuell nur Status-Buttons, kein Textfeld.

Aenderungen an `ComplianceDSAR.tsx`:
- Pro Case: Klappbarer Detail-Bereich (oder Dialog bei Klick) mit:
  - `Textarea` fuer `notes` (interne Notizen, `min-h-[120px]`)
  - Save-Button fuer Notes-Update
- `updateStatus` Mutation akzeptiert bereits `notes` — muss nur im UI exponiert werden.
- Beim Erstellen neuer Cases (Create-Dialog): `notes`-Feld von Anfang an verfuegbar.

### Tab 9 (Deletion) — Notes + Legal-Hold-Textarea hinzufuegen
Aktuell nur Status-Buttons, `legal_hold_reason` wird angezeigt aber nicht editierbar.

Aenderungen an `ComplianceDeletion.tsx`:
- Pro Case: Klappbarer Detail-Bereich mit:
  - `Textarea` fuer `notes` (interne Notizen)
  - `Input` oder `Textarea` fuer `legal_hold_reason` (editierbar, mit Warnung-Icon)
  - Save-Button
- `useDeletionRequests` Hook erweitern: `updateNotes` Mutation (oder `updateStatus` erweitern um `legal_hold_reason`).

## Keine Aenderung noetig

| Tab | Grund |
|-----|-------|
| Tab 1 (Overview) | Nur Read-only Dashboard |
| Tab 2 (Company Profile) | Hat bereits Input-Felder |
| Tab 5 (Bundles) | Nur Zuordnungs-UI |
| Tab 10 (Audit) | Nur Read-only Viewer |

## Dateien

| Datei | Aenderung |
|-------|-----------|
| `CompliancePublicPages.tsx` | `change_note` Input-Feld im Dialog hinzufuegen |
| `CompliancePortalTerms.tsx` | `change_note` Input-Feld im Dialog hinzufuegen |
| `ComplianceAgreements.tsx` | Dialog/Collapsible mit `content` Textarea + `title` Input + Save |
| `ComplianceConsents.tsx` | Create-Dialog + Edit-Dialog mit `body_de` Textarea + `title_de`/`code` Inputs |
| `ComplianceDSAR.tsx` | `notes` Textarea pro Case + Create-Dialog mit Notes |
| `ComplianceDeletion.tsx` | `notes` Textarea + `legal_hold_reason` Input pro Case |
| `useComplianceCases.ts` | `updateNotes` Mutation hinzufuegen (oder bestehende erweitern um `legal_hold_reason`) |

## Umsetzungsreihenfolge

1. Tabs 3+4: `change_note` Feld (kleinste Aenderung, schnell)
2. Tab 6: Agreement-Editor
3. Tab 7: Consent-Template CRUD
4. Tabs 8+9: Notes/Legal-Hold Textfelder
5. Hook-Erweiterung fuer Tab 9

