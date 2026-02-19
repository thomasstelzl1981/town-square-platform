
# Bundles-Tab aus Compliance Desk entfernen

## Problem

Der Tab "Bundles" (Tab 5) zeigt eine leere Verwaltung fuer "TermsGate Bundles". Die Funktionalitaet ist redundant, weil AGB und Datenschutz bereits einzeln im Tab "Portal Terms" mit Versionierung verwaltet werden. Die Bundle-Tabellen in der Datenbank sind leer und werden nirgends in Zone 2 abgefragt.

## Aenderungen

### 1. ComplianceDeskRouter.tsx

- Tab-Eintrag `{ value: 'bundles', label: 'Bundles', icon: Layers }` entfernen
- `TabsContent` fuer `bundles` entfernen
- Import von `ComplianceBundles` entfernen
- Import von `Layers` entfernen (wird nur fuer Bundles verwendet)

### 2. ComplianceOverview.tsx

- Import und Aufruf von `useComplianceBundles` entfernen
- Die Bundles-Statistik-Kachel aus der Overview-Ansicht entfernen (falls vorhanden)

### 3. Dateien die bestehen bleiben (nicht loeschen)

- `ComplianceBundles.tsx` — wird nicht mehr importiert, kann spaeter entfernt werden
- `useComplianceBundles.ts` — wird nicht mehr importiert, kann spaeter entfernt werden
- DB-Tabellen `compliance_bundles` + `compliance_bundle_items` — bleiben bestehen, kein Schema-Aenderung noetig

## Ergebnis

- Compliance Desk hat 9 statt 10 Tabs
- Kein verwirrender leerer Bereich mehr
- Die Infrastruktur in der DB bleibt fuer spaetere Nutzung erhalten
