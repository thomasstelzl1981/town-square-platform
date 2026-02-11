# Golden Path MOD-04: Immobilie — Von Anlage bis Vertrieb

> **SSOT-Status:** Code-Referenz in `src/manifests/goldenPaths/MOD_04.ts`  
> **Version:** 2.0.0  
> **Letzte Aktualisierung:** 2026-02-11

## Übersicht

Dieser Golden Path beschreibt den vollständigen Lebenszyklus einer Immobilie im System:
von der Anlage über die Vermarktung bis zur Deaktivierung.

## Phasen

| Phase | Step-ID | Typ | Beschreibung |
|-------|---------|-----|-------------|
| 1 | `create_property` | action | Immobilie anlegen (CreatePropertyDialog) |
| 2 | `edit_dossier` | route | Immobilienakte bearbeiten |
| 3 | `mod05_visibility` | system | Automatische Sichtbarkeit in MOD-05 |
| 4 | `activate_sales_mandate` | action | Verkaufsauftrag aktivieren |
| 5 | `stammdaten_contract` | system | Vertrag in Stammdaten sichtbar |
| 6 | `sales_desk_visibility` | system | Vertriebsauftrag im Sales Desk |
| 7 | `mod09_katalog` | system | Sichtbarkeit im Partner-Katalog |
| 8 | `mod08_suche` | system | Sichtbarkeit in Investment-Suche |
| 9 | `activate_kaufy` | action | Kaufy-Marktplatz aktivieren (optional) |
| 10 | `kaufy_website` | system | Sichtbarkeit auf Kaufy-Website |
| 11 | `deactivate_mandate` | action | Verkaufsauftrag deaktivieren (Widerruf) |

## Code-Referenzen

- **Definition:** `src/manifests/goldenPaths/MOD_04.ts`
- **Typen:** `src/manifests/goldenPaths/types.ts`
- **Engine:** `src/goldenpath/engine.ts`
- **React Hook:** `src/goldenpath/useGoldenPath.ts`
- **Route Guard:** `src/goldenpath/GoldenPathGuard.tsx`
- **DEV Validator:** `src/goldenpath/devValidator.ts`

## Beteiligte Dateien (Implementierung)

| Phase | Datei | Rolle |
|-------|-------|-------|
| 1 | `CreatePropertyDialog.tsx` | Objekt anlegen |
| 2 | `PropertyDetailPage.tsx` | Dossier + Tabs |
| 3 | `ObjekteTab.tsx` (MOD-05) | Unit-Anzeige |
| 4 | `VerkaufsauftragTab.tsx` | Aktivierung |
| 5 | `VertraegeTab.tsx` | Stammdaten |
| 6 | `SalesDesk.tsx` | Admin-Ansicht |
| 7 | `KatalogTab.tsx` (MOD-09) | Partner-Katalog |
| 8 | `SucheTab.tsx` (MOD-08) | Investment-Suche |
| 9-10 | `VerkaufsauftragTab.tsx` + `Kaufy2026Home` | Kaufy-Toggle |
| 11 | `VerkaufsauftragTab.tsx` | Widerruf/Cleanup |

## Keine neuen DB-Tabellen

Alle Zustandsdaten existieren bereits:
- `properties`, `units`, `storage_nodes`
- `property_features` (verkaufsauftrag, kaufy_sichtbarkeit)
- `listings` (status, sales_mandate_consent_id)
- `listing_publications` (channel, status)
- `user_consents`
