
# Korrektur der Adress-Struktur für Demo-Daten

## Problemanalyse

Die Hausnummer ist im falschen Feld gespeichert:

| Feld | Aktueller Wert | Erwarteter Wert |
|------|----------------|-----------------|
| `address` | "Leipziger Straße 42" | "Leipziger Straße" |
| `address_house_no` | NULL | "42" |

---

## Datenbankstruktur (korrekt vorhanden)

Die Tabelle `properties` hat bereits beide Felder:
- `address` (TEXT, NOT NULL) — für die Straße
- `address_house_no` (TEXT, nullable) — für die Hausnummer

---

## Ursache

Die Seed-Migration hat die Daten in einem kombinierten Format eingefügt:

```sql
-- Aus Migration 20260203004029
INSERT INTO properties (..., address, ...)
VALUES (..., 'Leipziger Straße 42', ...);
```

---

## Lösung

### Option 1: Datenbank-Migration zur Bereinigung (empfohlen)

Eine Migration, die:
1. Die Hausnummer aus dem `address`-Feld extrahiert
2. In `address_house_no` schreibt
3. Das `address`-Feld bereinigt

```sql
UPDATE properties
SET 
  address_house_no = CASE 
    WHEN address ~ ' [0-9]+[a-zA-Z]?$' 
    THEN regexp_replace(address, '.* ([0-9]+[a-zA-Z]?)$', '\1')
    ELSE NULL
  END,
  address = CASE 
    WHEN address ~ ' [0-9]+[a-zA-Z]?$' 
    THEN regexp_replace(address, ' [0-9]+[a-zA-Z]?$', '')
    ELSE address
  END
WHERE address_house_no IS NULL
  AND address ~ ' [0-9]+[a-zA-Z]?$';
```

### Option 2: Nur Demo-Daten manuell korrigieren

```sql
UPDATE properties
SET 
  address = 'Leipziger Straße',
  address_house_no = '42'
WHERE id = '00000000-0000-4000-a000-000000000001';
```

---

## Nach der Korrektur

Sie können dann in der Immobilienakte die Adresse frei bearbeiten:

- **Straße**: "Musterstraße" → wird in `address` gespeichert
- **Hausnr.**: "123a" → wird in `address_house_no` gespeichert
- **PLZ/Ort**: Funktioniert bereits korrekt

---

## Code-Flow (bereits korrekt implementiert)

```text
┌─────────────────────────────────────────────────────────────────┐
│ EditableAddressBlock                                            │
│   onFieldChange('street', 'Musterstraße')                       │
│   onFieldChange('houseNumber', '123a')                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ useDossierForm.updateField('street', 'Musterstraße')            │
│ useDossierForm.updateField('houseNumber', '123a')               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ getPropertyChanges() → mapped.address = 'Musterstraße'          │
│                     → mapped.addressHouseNo = '123a'            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ useDossierMutations.useUpdateProperty()                         │
│   → UPDATE properties SET address='...', address_house_no='...' │
└─────────────────────────────────────────────────────────────────┘
```

---

## Zu ändernde Komponente: DossierHeader

Die angezeigte Adresse im Header muss ebenfalls die Trennung berücksichtigen.

**Aktuell in `useUnitDossier.ts` (Zeile 236):**
```typescript
address: `${property.address} • ${property.property_type} ${property.postal_code} ${property.city}`,
```

**Sollte werden:**
```typescript
address: `${property.address}${(property as any).address_house_no ? ' ' + (property as any).address_house_no : ''} • ${property.property_type} ${property.postal_code} ${property.city}`,
```

---

## Implementierungsschritte

1. **Datenbank-Migration**: Demo-Daten korrigieren (address + address_house_no trennen)
2. **useUnitDossier.ts**: Die zusammengesetzte Adress-Anzeige anpassen
3. **Test**: Adresse in der UI ändern und prüfen ob Speichern funktioniert

---

## Dateien

| Datei | Änderung |
|-------|----------|
| Migration | address/address_house_no für Demo-Daten trennen |
| `src/hooks/useUnitDossier.ts` | Zeile 236 - Address-Zusammensetzung anpassen |

---

## Hinweis zur echten Adresse

Nach dieser Korrektur können Sie:
1. Die Immobilienakte öffnen
2. Im Block "Lage & Beschreibung" die Felder bearbeiten:
   - Straße: z.B. "Prager Straße"
   - Hausnr.: z.B. "10"
   - PLZ: z.B. "01069"
   - Ort: z.B. "Dresden"
3. Speichern klicken

Die Änderungen werden persistent in der Datenbank gespeichert und bei jedem Laden der Akte korrekt angezeigt.
