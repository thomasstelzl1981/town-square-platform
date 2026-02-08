
## Erweiterung der Kontaktverwaltung

### Zusammenfassung

Die `contacts`-Tabelle wird um zusaetzliche Spalten erweitert, um eine vollstaendige Kontaktverwaltung zu ermoeglichen. Die bestehenden Daten (Mieter, Verwalter etc.) bleiben vollstaendig erhalten.

---

### 1. Neue Datenbank-Spalten

Die folgenden Spalten werden zur `contacts`-Tabelle hinzugefuegt:

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `salutation` | TEXT | Anrede (Herr, Frau, Divers, Firma) |
| `phone_mobile` | TEXT | Mobiltelefon (separat von Festnetz) |
| `street` | TEXT | Strasse inkl. Hausnummer |
| `postal_code` | TEXT | Postleitzahl |
| `city` | TEXT | Ort |
| `category` | TEXT | Kategorie (Mieter, Eigentuemer, Verwalter, Makler, Bank, Handwerker, Sonstige) |

**Wichtig:** Die bestehende `phone`-Spalte bleibt als Festnetz-Telefon erhalten. `phone_mobile` ist das neue Mobil-Feld.

---

### 2. Datenmigration

- Alle bestehenden Kontakte behalten ihre aktuellen Werte
- `first_name` und `last_name` sind bereits getrennt vorhanden - keine Aenderung noetig
- Neue Spalten werden als `NULL` initialisiert (keine Pflichtfelder)
- Bestehende Kategorien aus `notes` werden NICHT automatisch migriert (manuelles Nachpflegen moeglich)

**SQL-Migration:**
```text
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS salutation TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone_mobile TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS category TEXT;
```

---

### 3. UI-Anpassungen in KontakteTab.tsx

**Neue Tabellen-Spalten:**

| Spalte | Anzeige |
|--------|---------|
| Vorname | `first_name` |
| Name | `last_name` |
| E-Mail | `email` |
| Mobil | `phone_mobile` |
| Telefon | `phone` (Festnetz) |
| Firma | `company` |
| Kategorie | Badge mit Farbe |

**Kategorie-Optionen:**
- Mieter (blau)
- Eigentuemer (gruen)
- Verwalter (lila)
- Makler (orange)
- Bank (grau)
- Handwerker (gelb)
- Sonstige (default)

---

### 4. Formulare anpassen

**Neuer Kontakt Dialog und Detail-Drawer:**

```text
+------------------------------------------+
| Anrede:      [Dropdown: Herr/Frau/...]   |
| Vorname:     [_______________]           |
| Nachname:    [_______________]           |
| Firma:       [_______________]           |
| Kategorie:   [Dropdown]                  |
+------------------------------------------+
| E-Mail:      [_______________]           |
| Mobil:       [_______________]           |
| Telefon:     [_______________]           |
+------------------------------------------+
| Strasse:     [_______________]           |
| PLZ:         [_____]                     |
| Ort:         [_______________]           |
+------------------------------------------+
| Notizen:     [_______________]           |
+------------------------------------------+
```

---

### 5. Betroffene Dateien

1. **Datenbank-Migration**: Neue Spalten hinzufuegen
2. **KontakteTab.tsx**: Erweiterte Tabelle, Formulare, Detail-Ansicht
3. **Interface Contact**: Neue Felder hinzufuegen

---

### 6. Keine Breaking Changes

- Bestehende Referenzen in `leases.tenant_contact_id` bleiben unveraendert
- Die Immobilienakte liest weiterhin `first_name`, `last_name`, `email`, `phone`
- Die neuen Felder sind optional - bestehende Kontakte funktionieren weiter

---

### Technische Details

**TypeScript Interface (nach Migration automatisch aktualisiert):**
```text
interface Contact {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  salutation: string | null;      // NEU
  email: string | null;
  phone: string | null;           // Festnetz
  phone_mobile: string | null;    // NEU - Mobil
  street: string | null;          // NEU
  postal_code: string | null;     // NEU
  city: string | null;            // NEU
  company: string | null;
  category: string | null;        // NEU
  notes: string | null;
  public_id: string;
  // ... sync fields
}
```

**Kategorie-Badge Farben:**
```text
Mieter       -> bg-blue-100 text-blue-800
Eigentuemer  -> bg-green-100 text-green-800
Verwalter    -> bg-purple-100 text-purple-800
Makler       -> bg-orange-100 text-orange-800
Bank         -> bg-gray-100 text-gray-800
Handwerker   -> bg-yellow-100 text-yellow-800
Sonstige     -> bg-muted text-muted-foreground
```
