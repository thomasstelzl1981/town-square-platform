

# Consents-Tab aus Compliance Desk entfernen

## Begruendung

Die `consent_templates`-Tabelle ist leer und wird nirgends produktiv genutzt. Alle operativen Consents (SALES_MANDATE_V2, DATA_ACCURACY_CONSENT, SYSTEM_SUCCESS_FEE) laufen ueber die `agreement_templates`-Tabelle. Das Tab ist toter Code.

## Aenderungen

### 1. Tab-Eintrag + Import entfernen
**Datei:** `src/pages/admin/compliance/ComplianceDeskRouter.tsx`
- Import von `ComplianceConsents` entfernen
- Eintrag `{ value: 'consents', ... }` aus TABS-Array entfernen
- `<TabsContent value="consents">` entfernen

### 2. Komponenten-Datei loeschen
**Datei:** `src/pages/admin/compliance/ComplianceConsents.tsx` — komplett loeschen

### 3. DB-Tabelle vorerst behalten
Die `consent_templates`-Tabelle bleibt in der DB bestehen (leer, kein Schaden). Falls gewuenscht, kann sie spaeter per Migration gedroppt werden.

## Ergebnis
Der Compliance Desk hat dann 8 statt 9 Tabs. Keine funktionalen Auswirkungen, da das Tab nie genutzt wurde.
