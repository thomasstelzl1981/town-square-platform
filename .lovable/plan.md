

# Pruefergebnis: NK/BWA Engine und Konteneröffnungsvorlage

## NK/BWA Engine: KORREKT

Beide Engines sind sauber implementiert:

- **NK-Abrechnung Engine** (`src/engines/nkAbrechnung/`):
  - `spec.ts`: Vollstaendige Typdefinitionen mit allen 18 BetrKV-Kategorien, Verteilerschluessel (Flaeche, MEA, Personen, Verbrauch, Einheiten), Readiness-Status
  - `allocationLogic.ts`: Korrekte Verteilungsberechnung inkl. unterjaehriger Anteilsberechnung (Tage-Ratio)
  - `engine.ts`: Orchestrierung laedt Lease, Unit, Property, Kontaktname, NK-Periode und berechnet die Abrechnungsmatrix inkl. Vorauszahlungen
  - Bewohneranzahl wird korrekt aus `lease.number_of_occupants` (Default: 2) und `property.total_occupants` gelesen

- **BWA Engine** (`src/engines/bewirtschaftung/`):
  - `spec.ts`: Saubere Interfaces fuer BWA, Instandhaltung (Peters'sche Formel), Leerstand, Mietpotenzial
  - `engine.ts`: Reine Funktionen ohne Seiteneffekte, getestet (`engine.test.ts` vorhanden)

Keine Aenderungen noetig.

---

## Konteneröffnungsvorlage: 2 BUGS

### Bug 1: `AddBankAccountDialog` fragt `properties.name` ab — Spalte existiert nicht

In `src/components/shared/AddBankAccountDialog.tsx` Zeile 73:
```
supabase.from('properties').select('id, name').eq('tenant_id', activeTenantId)
```

Die Tabelle `properties` hat KEINE Spalte `name`. Es gibt nur `address` und `city`. Daher erscheinen Immobilien zwar im Dropdown, aber mit dem Fallback-Label "Immobilie" statt des echten Namens.

**Fix**: Query aendern zu `select('id, address, city')` und Label bauen als `"Leopoldstr., Muenchen"` etc.

### Bug 2: Inkonsistentes Zuordnungsmodell zwischen den Komponenten

| Komponente | Fragt ab | owner_type |
|------------|----------|------------|
| `KontoAkteInline` | `landlord_contexts` | `'property'` |
| `AddBankAccountDialog` | `properties` | `'property'` |

Beide verwenden `owner_type = 'property'`, aber **verschiedene Tabellen** und **verschiedene IDs**. Das Demo-Konto hat `owner_id = d0...0010` (eine `landlord_contexts`-ID), nicht eine `properties`-ID.

**Loesung**: `AddBankAccountDialog` muss dieselbe Logik verwenden wie `KontoAkteInline` — also `landlord_contexts` statt `properties` fuer den Typ "Vermietereinheit" abfragen. Oder alternativ einen neuen `owner_type = 'landlord_context'` einfuehren (waere aber ein groesserer Umbau).

Empfehlung: In `AddBankAccountDialog` die Query von `properties` auf `landlord_contexts` umstellen, Label auf `c.name` setzen, und Select-Group-Label von "Vermietereinheiten" beibehalten.

---

## Aenderungen

### Datei 1: `src/components/shared/AddBankAccountDialog.tsx`

- Zeile 73: `properties`-Query ersetzen durch `landlord_contexts`-Query
- Zeile 79-81: Label-Generierung anpassen auf `c.name || 'Vermietereinheit'`
- Typ bleibt `'property'` fuer Abwaertskompatibilitaet mit bestehendem `owner_type`-Feld

### Keine weiteren Dateien betroffen

Die NK/BWA Engines bleiben unveraendert. Nach diesem Fix funktioniert "Konto manuell anlegen" korrekt mit den richtigen Vermietereinheiten im Dropdown, und neue Konten erhalten die korrekte `owner_id` (die `landlord_contexts.id`).

