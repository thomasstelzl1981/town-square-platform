

# Company Profile: Zwei Firmenslots + Notizfeld

## Ueberblick

Die Seite zeigt kuenftig zwei separate Firmen-Cards mit jeweils eigener Impressum-Vorschau:
1. **System of a Town** (slug: `sot`)
2. **Future Room** (slug: `futureroom`) — betreibt auch Kaufy + Acquiary

Jede Card hat ein zusaetzliches freies Textarea-Feld "Sonstige rechtliche Anmerkungen".

## Datenbank-Aenderung

### Migration: `compliance_company_profile` erweitern

```text
ALTER TABLE compliance_company_profile
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS legal_notes TEXT;
```

- `slug`: Eindeutiger Identifier pro Firma ('sot', 'futureroom')
- `legal_notes`: Freies Textfeld fuer sonstige rechtliche Anmerkungen
- Bestehender Datensatz (falls vorhanden) bekommt slug='sot' als Default

## Hook: useComplianceCompany.ts

- Interface `CompanyProfile` erweitern um `slug: string | null` und `legal_notes: string | null`
- Query aendern: statt `limit(1).maybeSingle()` nun **alle** Zeilen laden (`.select('*')`)
- Return aendern: `profiles: CompanyProfile[]` (Array statt Einzelobjekt)
- Upsert-Mutation bekommt den `slug` als Parameter zum Identifizieren
- Neue Helper-Funktion: `getProfileBySlug(slug: string)` fuer einfachen Zugriff

## UI: ComplianceCompanyProfile.tsx

Kompletter Umbau auf Multi-Firmen-Darstellung:

- Fuer jeden Slug ('sot', 'futureroom') eine eigene **CompanyCard**-Sektion rendern
- Jede Card enthaelt:
  - Titel mit Firmenname (z.B. "Firma 1: System of a Town", "Firma 2: Future Room")
  - Alle bestehenden Felder (Name, Rechtsform, Adresse, etc.)
  - **NEU**: Textarea "Sonstige rechtliche Anmerkungen" (mehrzeilig, frei)
  - Eigener Speichern-Button
  - Eigene Impressum-Vorschau (Collapsible)
- Die `legal_notes` werden in der Impressum-Vorschau am Ende mit angezeigt (falls befuellt)

## Auswirkung auf Platzhalter-System

- `renderComplianceMarkdown` in `complianceHelpers.ts` muss wissen, WELCHE Firma gemeint ist
- Fuer Portal-AGB/Privacy: Primaer-Firma (slug='sot') verwenden (oder spaeter konfigurierbar)
- Keine Aenderung am Consent-System noetig — das bleibt wie es ist

## Dateien

| Datei | Aenderung |
|-------|-----------|
| DB-Migration | slug + legal_notes Spalten |
| useComplianceCompany.ts | Multi-Row Query, slug-basierter Upsert |
| ComplianceCompanyProfile.tsx | Zwei Cards mit Textarea + je Impressum-Vorschau |

## Reihenfolge

1. DB-Migration (slug + legal_notes)
2. Hook auf Multi-Row umbauen
3. UI mit zwei Cards + Textarea rendern

