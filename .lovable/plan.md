

# Compliance-Bereich: Grosse, sichtbare Textfelder ueberall

## Problem

Mehrere Tabs im Compliance Desk verstecken Inhalte hinter Dialogen oder Collapsibles. Der User muss klicken, um Texte zu sehen. Es gibt genug Platz — alles soll sofort sichtbar und editierbar sein.

## Betroffene Tabs und Aenderungen

### 1. Portal Terms (CompliancePortalTerms.tsx)

**Aktuell:** Aktive Version ist hinter einem Collapsible versteckt, Textarea hat `min-h-[250px]`.

**Neu:**
- Collapsible komplett entfernen — aktive Version wird immer als Markdown-Block angezeigt
- Textarea auf `min-h-[400px]` vergroessern
- Imports fuer Collapsible, CollapsibleContent, CollapsibleTrigger, Eye, ChevronDown entfernen

### 2. Public Pages (CompliancePublicPages.tsx)

**Aktuell:** Kompakte Tabelle mit Status-Badges. Bearbeitung nur ueber Dialog mit Plus-Button.

**Neu:**
- Tabelle und Dialog komplett entfernen
- Pro Dokument eine eigene grosse Card (wie bei Portal Terms):
  - Header mit Titel, Brand, Status-Badge, Version
  - Aktive Version als gerenderter Markdown-Block (immer sichtbar)
  - Grosse Textarea (`min-h-[400px]`) zum Bearbeiten, prefilled mit aktivem Text
  - Aenderungsnotiz-Feld + Draft-speichern-Button
  - Draft-Aktivierung inline
- Dokumente gruppiert nach Brand anzeigen

### 3. Agreements (ComplianceAgreements.tsx)

**Aktuell:** Collapsible pro Template — Inhalt versteckt hinter Aufklapp-Trigger.

**Neu:**
- Collapsible entfernen — jedes Template wird als eigene Card mit sofort sichtbarem Inhalt dargestellt
- Titel-Input und Textarea (`min-h-[400px]`) sind direkt sichtbar
- Speichern-Button pro Card
- Kein Aufklappen mehr noetig

### 4. Consents (ComplianceConsents.tsx)

**Aktuell:** Kompakte Liste mit Bearbeitung ueber Dialog.

**Neu:**
- Dialog entfernen
- Jedes Template als eigene Card mit allen Feldern inline:
  - Code, Titel, Zustimmungstext als grosse Textarea (`min-h-[300px]`)
  - Speichern-Button direkt in der Card
- "Neues Template"-Formular ebenfalls als eigene Card am Ende (statt Dialog)

## Technische Details

| Datei | Aenderung |
|-------|-----------|
| CompliancePortalTerms.tsx | Collapsible entfernen, Markdown-Vorschau immer sichtbar, groessere Textarea |
| CompliancePublicPages.tsx | Komplett umbauen: Tabelle + Dialog → eine Card pro Dokument mit Inline-Editor |
| ComplianceAgreements.tsx | Collapsible entfernen → jedes Template als eigene Card mit sichtbaren Feldern |
| ComplianceConsents.tsx | Dialog entfernen → Inline-Cards fuer alle Templates + Neuanlage-Card |

## Designprinzip

- `min-h-[400px]` fuer Rechtstext-Textareas (AGB, Datenschutz, Impressum, Agreements)
- `min-h-[300px]` fuer kuerzere Texte (Consent-Texte)
- Keine Collapsibles, keine Dialoge fuer Textinhalte
- Alles sofort lesbar und editierbar

