

# Rechtstexte seeden + Placeholder-Kompatibilitaet

## Ausgangslage

- Zwei `compliance_documents` existieren bereits (portal_agb + portal_privacy), aber mit `status=draft`, `current_version=0` und **ohne Versionen**.
- Die Placeholder-Syntax im Code ist `{...}` (einfache Klammern), die Texte verwenden `{{...}}` (doppelte). Die Texte werden auf einfache Klammern angepasst.
- Im Code fehlen 3 Placeholder-Mappings: `{address_line2}`, `{country}`, `{commercial_register}` (als zusammengefasster String).

## Schritt 1: Placeholder-Mappings erweitern

**Datei:** `src/lib/complianceHelpers.ts`

Neue Eintraege im `replacements`-Objekt:
```text
'{address_line2}': profile.address_line2 || '',
'{country}': profile.country || 'DE',
'{commercial_register}': [cr.court, cr.number].filter(Boolean).join(', ') || '—',
```

So werden alle im Text vorkommenden Platzhalter abgedeckt.

## Schritt 2: Daten einfuegen (3 DB-Operationen)

### 2a: compliance_documents updaten

Beide Dokumente auf `status=active`, `current_version=1` setzen + Titel anpassen:
- portal_agb: title = "Nutzungsbedingungen (Portal)"
- portal_privacy: title = "Datenschutzerklaerung (Portal)"

### 2b: compliance_document_versions anlegen

Zwei neue Versionen (je version=1, status=active) mit dem vollstaendigen Markdown-Text aus dem Prompt. Dabei werden alle `{{...}}` durch `{...}` ersetzt (Kompatibilitaet mit bestehendem Rendering).

## Dateien-Uebersicht

| Datei | Aenderung |
|-------|-----------|
| src/lib/complianceHelpers.ts | 3 neue Placeholder-Mappings |
| DB: compliance_documents | UPDATE status + title + current_version |
| DB: compliance_document_versions | 2x INSERT (Version 1, active, mit content_md) |

## Kein Code-Aenderung noetig an

- RechtlichesTab.tsx (liest bereits active Versionen + rendert Markdown)
- useLegalConsent.ts (prueft bereits gegen active Versionen)
- useComplianceDocuments.ts (unveraendert)

