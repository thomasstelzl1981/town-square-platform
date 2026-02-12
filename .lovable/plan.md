
# FinanceObjectCard: Zwei neue Zeilen (Nutzungsart + Mieteinnahmen)

## Was wird geaendert

In der gemeinsamen Komponente `FinanceObjectCard.tsx` werden zwei neue Felder am Ende der Tabelle (vor dem Speichern-Button) ergaenzt:

1. **Nutzungsart** (Dropdown): "Eigengenutzt" oder "Vermietet"
2. **Mieteinnahmen monatlich** (Zahleneingabe in EUR): Nur sichtbar/relevant wenn "Vermietet" gewaehlt ist, aber immer angezeigt

Da die Komponente in MOD-07 und MOD-11 identisch genutzt wird, wirkt die Aenderung automatisch in beiden Modulen.

## Technische Details

**Datei:** `src/components/finanzierung/FinanceObjectCard.tsx`

### Interface erweitern

Zwei neue Felder im `ObjectFormData` Interface:
- `usage: string` (Werte: `"eigengenutzt"` oder `"vermietet"`)
- `rentalIncome: string` (monatliche Mieteinnahmen)

### emptyObjectData erweitern

Defaults: `usage: ''`, `rentalIncome: ''`

### Zwei neue Tabellenzeilen

Nach "Stellplaetze / Garagen" (Zeile 175):

1. **Nutzungsart** — Select-Dropdown mit zwei Optionen:
   - "Eigengenutzt"
   - "Vermietet"

2. **Mieteinnahmen mtl. (EUR)** — Number-Input mit Placeholder "0"

Beide Felder nutzen den bestehenden tabellarischen Stil (TR-Komponente, gleiche Input-Klassen).

### Keine weiteren Dateien betroffen

Da `externalData` bereits als `Partial<ObjectFormData>` typisiert ist, koennen Listings kuenftig auch `usage` und `rentalIncome` liefern, ohne dass die Props geaendert werden muessen.
