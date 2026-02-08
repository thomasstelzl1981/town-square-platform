

## Spaltenreihenfolge und Internal ID anpassen

### Zusammenfassung

Die bestehende `public_id` Spalte wird als "Interne ID" in der Tabelle angezeigt. Die Spaltenreihenfolge wird wie gewuenscht angepasst.

---

### Neue Spaltenreihenfolge

| # | Spalte | Datenfeld | Beispiel |
|---|--------|-----------|----------|
| 1 | **Interne ID** | `public_id` | SOT-K-MAXMUSTER |
| 2 | **Firma** | `company` | Immo-HV GmbH |
| 3 | **Anrede** | `salutation` | Herr |
| 4 | **Vorname** | `first_name` | Max |
| 5 | **Name** | `last_name` | Mustermann |
| 6 | **E-Mail** | `email` | max@example.de |
| 7 | **Mobil** | `phone_mobile` | +49 170 1234567 |
| 8 | **Telefon** | `phone` | +49 341 12345 |
| 9 | **Strasse** | `street` | Musterstr. 1 |
| 10 | **PLZ** | `postal_code` | 04109 |
| 11 | **Ort** | `city` | Leipzig |
| 12 | **Kategorie** | `category` | Badge mit Farbe |

---

### Umsetzung

**Datei:** `src/pages/portal/office/KontakteTab.tsx`

Die `columns`-Definition wird in der neuen Reihenfolge sortiert:

```text
const columns: Column<Contact>[] = [
  { key: 'public_id', header: 'Interne ID', ... },    // NEU an Position 1
  { key: 'company', header: 'Firma', ... },           // Verschoben nach vorn
  { key: 'salutation', header: 'Anrede', ... },
  { key: 'first_name', header: 'Vorname', ... },
  { key: 'last_name', header: 'Name', ... },
  { key: 'email', header: 'E-Mail', ... },
  { key: 'phone_mobile', header: 'Mobil', ... },
  { key: 'phone', header: 'Telefon', ... },
  { key: 'street', header: 'Strasse', ... },
  { key: 'postal_code', header: 'PLZ', ... },
  { key: 'city', header: 'Ort', ... },
  { key: 'category', header: 'Kategorie', ... },
];
```

---

### Vorhandene IDs

Die `public_id` wird automatisch generiert und hat das Format:
- `SOT-K-MAXMUSTER` (Max Mustermann)
- `SOT-K-HOFFMANN` (Sandra Hoffmann)
- `SOT-K-WEBER` (Michael Weber)

Diese ID ist bereits eindeutig und kann fuer Verlinkungen genutzt werden.

---

### Keine Datenbank-Aenderungen noetig

Die `public_id` Spalte existiert bereits - es wird nur die UI-Darstellung angepasst.

