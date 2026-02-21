

# Magic Intake Center — Bugfixes und Haertung

## Problem

Die Tiefenanalyse hat 3 kritische Probleme aufgedeckt, die das Intake Center daran hindern, ein geschlossenes System zu sein.

## Befund 1: Entity Loader — 5 von 8 Kategorien kaputt

`useIntakeEntityLoader.ts` verwendet Spaltennamen, die in der Datenbank nicht existieren. Ergebnis: 400-Fehler, leeres Dropdown, Nutzer kann kein Objekt zuordnen.

| Kategorie | Falscher Spaltenname | Korrekter Spaltenname |
|---|---|---|
| Fahrzeug | `brand` | `make` |
| PV-Anlage | `capacity_kwp` | `kwp` |
| Versicherung | `provider_name` | `insurer` |
| Vorsorge | `provider_name` | `provider` |
| Finanzierung | `bank_name, loan_amount` | `purchase_price, loan_amount_requested` (oder `status, purpose`) |

**Fix**: Alle `selectFields` und `buildLabel`-Funktionen korrigieren.

## Befund 2: Checklist-Matching auf Namen statt doc_type

`useIntakeChecklistProgress.ts` prueft `documents.name` per Freitext-includes(). Das fuehrt zu unzuverlaessigen Ergebnissen. Die `documents`-Tabelle hat ein `doc_type`-Feld, das praeziser waere.

**Fix**: Matching-Logik auf `doc_type` umstellen. In `storageManifest.ts` ein optionales `doc_type`-Feld zu jedem `required_docs`-Eintrag hinzufuegen und im Hook darauf pruefen.

## Befund 3: Upload landet im Modul-Root statt im Entity-Ordner

Wenn der Nutzer ein bestehendes Objekt waehlt (z.B. Immobilie "WE-01"), wird die `entityId` zwar an `useDocumentIntake.intake()` uebergeben, aber in `useUniversalUpload` wird der `parentNodeId` nicht aufgeloest. Die Datei landet im generischen `{moduleCode}_ROOT` statt im Entity-spezifischen Unterordner.

**Fix**: In `useDocumentIntake` vor dem Upload-Aufruf den korrekten `storage_nodes`-Ordner fuer die Entity aufloesen (Query: `storage_nodes` WHERE `property_id = X` oder `entity_id = X` etc.) und als `parentNodeId` uebergeben.

---

## Technische Aenderungen

### Datei 1: `src/hooks/useIntakeEntityLoader.ts`

Alle 5 fehlerhaften Konfigurationen korrigieren:

```text
fahrzeugschein:
  selectFields: 'id, make, model, license_plate'
  buildLabel: r.make statt r.brand

pv_anlage:
  selectFields: 'id, name, kwp'
  buildLabel: r.kwp statt r.capacity_kwp

versicherung:
  selectFields: 'id, insurer, category'
  buildLabel: r.insurer statt r.provider_name

vorsorge:
  selectFields: 'id, provider, contract_type'
  buildLabel: r.provider statt r.provider_name

finanzierung:
  selectFields: 'id, purpose, status, purchase_price'
  buildLabel: r.purpose + r.purchase_price statt r.bank_name + r.loan_amount
```

### Datei 2: `src/hooks/useIntakeChecklistProgress.ts`

- Query aendern: `documents.doc_type` statt `documents.name` laden
- Matching: `doc_type` gegen neue `doc_type_hint`-Felder in `storageManifest.required_docs` pruefen
- Fallback: Name-Matching bleibt als Sekundaer-Check

### Datei 3: `src/config/storageManifest.ts`

- `required_docs`-Eintraege um optionales `doc_type?: string` erweitern
- Mapping z.B.: `{ name: 'Grundbuchauszug', folder: '02_Grundbuch', doc_type: 'GRUNDBUCHAUSZUG' }`

### Datei 4: `src/hooks/useDocumentIntake.ts`

- Vor dem `universalUpload.upload()`-Aufruf: Entity-spezifischen `parentNodeId` aus `storage_nodes` aufloesen
- Query: `storage_nodes WHERE tenant_id AND {entity_fk_column} = entityId AND node_type = 'folder'`
- Den aufgeloesten `parentNodeId` an `universalUpload.upload()` uebergeben

### Keine Aenderungen an

- `useUniversalUpload.ts` (Logik ist korrekt, nur die Aufrufer muessen richtige Parameter liefern)
- `StorageExtractionCard.tsx` (funktioniert korrekt)
- Datenbank-Schema (keine Migrationen noetig)
- Routing/Manifests

