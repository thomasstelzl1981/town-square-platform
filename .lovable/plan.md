

# Impressum-Vorschau aus Company Profile entfernen

## Problem

Im Tab "Company Profile" gibt es unter jeder Firmen-Card eine aufklappbare "Impressum-Vorschau", die einen Markdown-Text aus den Formulardaten generiert. Das ist verwirrend und redundant, weil:
- Tab "Public Pages" ist der eigentliche Ort fuer Impressums-Texte
- Die Vorschau suggeriert, dass dort das Impressum gepflegt wird
- Company Profile soll reine **Stammdaten-Eingabe** sein (SSOT fuer Firmendaten)

## Aenderung

**Datei:** `src/pages/admin/compliance/ComplianceCompanyProfile.tsx`

Entfernt werden:
1. Die Funktion `buildImprintMd()` (Zeilen 20-30)
2. Der gesamte Collapsible-Block "Impressum-Vorschau" (Zeilen 96-112)
3. Die Imports fuer `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`, `Eye`, `ChevronDown`
4. Der State `previewOpen` in der CompanyCard

Was bleibt: Nur das Stammdaten-Formular mit Speichern-Button pro Firma.

## Keine weiteren Aenderungen

- Public Pages (Tab 3): bleibt unveraendert — dort gehoert das Impressum hin
- Portal Terms (Tab 4): gerade erst umgebaut, bleibt so
- Bundles (Tab 5): eigenstaendige Gruppierungslogik, bleibt so
