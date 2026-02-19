

# Company Profile Seed-Daten + Zone-2 SOT-Filter

## Ueberblick

Zwei Aktionen:
1. Seed-Daten fuer beide Firmen in `compliance_company_profile` einfuegen
2. Zone-2 Rechtliches (`RechtlichesTab.tsx`) so anpassen, dass explizit das **SOT-Profil** (slug='sot') fuer Placeholder-Rendering geladen wird

## 1. Daten einfuegen (DB Insert)

### Firma 1: System of a Town (slug: `sot`)

| Feld | Wert |
|------|------|
| slug | sot |
| company_name | System of a Town |
| legal_form | GmbH |
| address_line1 | Barbara Straße 2D |
| postal_code | (ohne, da nicht angegeben) |
| city | München |
| country | DE |
| email | info@systemofatown.com |
| managing_directors | ["Sebastian Maximilian Bergler"] |
| commercial_register | {"court": "Amtsgericht München", "number": ""} |
| website_url | https://systemofatown.com |
| legal_notes | Keine gewerberechtlichen Erlaubnisse nach §34d/§34i/§34f/§34h GewO erforderlich, da ausschließlich Software-/Plattformbetrieb. Vermittlungstaetigkeiten erfolgen ueber Future Room GmbH. HRB noch nicht vorhanden. |

### Firma 2: Future Room (slug: `futureroom`)

| Feld | Wert |
|------|------|
| slug | futureroom |
| company_name | Future Room |
| legal_form | GmbH |
| address_line1 | Burghauser Str. 73 a |
| postal_code | 84503 |
| city | Altötting |
| country | DE |
| email | info@futureroom.finance |
| managing_directors | ["Tobias Riener"] |
| commercial_register | {"court": "Amtsgericht Traunstein", "number": "HRB 26581"} |
| vat_id | (leer, nicht angegeben) |
| website_url | https://futureroom.finance |
| legal_notes | Betreibt die Marken FUTURE ROOM, KAUFY (kaufy.com) und ACQUIARY (acquiary.com). Gewerberechtliche Erlaubnisse: §34d Abs.1 GewO (Versicherungsmakler, D-K7I4-Y5R8P-34), §34i Abs.1 GewO (Immobiliardarlehensvermittler, D-W-155-VCH8-31), §34f Abs.1 GewO (Finanzanlagenvermittler, D-F-155-K8X5-48). §34h GewO: nicht registriert. |

## 2. RechtlichesTab.tsx: SOT-Profil explizit laden

**Problem:** Zeile 91-98 laedt das Company Profile mit `.limit(1).maybeSingle()` ohne Slug-Filter. Das koennte zufaellig das Future-Room-Profil zurueckgeben.

**Fix:** Filter auf `slug = 'sot'` setzen, da Zone 2 Portal von System of a Town betrieben wird:

```text
// Vorher:
.select('*').limit(1).maybeSingle()

// Nachher:
.select('*').eq('slug', 'sot').maybeSingle()
```

So erscheinen in den AGB und der Datenschutzerklaerung immer die SOT-Firmendaten.

## Dateien

| Datei | Aenderung |
|-------|-----------|
| DB: compliance_company_profile | 2x INSERT (sot + futureroom) |
| src/pages/portal/stammdaten/RechtlichesTab.tsx | Zeile 94: `.eq('slug', 'sot')` hinzufuegen |

## Kein weiterer Code-Aenderungsbedarf

- complianceHelpers.ts: Mappings wurden bereits im letzten Schritt erweitert
- useComplianceCompany.ts: Multi-Row-Query bereits implementiert
- ComplianceCompanyProfile.tsx: Zwei-Slot-UI bereits vorhanden

