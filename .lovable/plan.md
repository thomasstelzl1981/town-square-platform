

# Erweiterte Firmendaten für gewerbliche Vermietereinheiten

## Zusammenfassung

Bei gewerblichen Vermietereinheiten sollen strukturierte Felder für den Geschäftsführer/Inhaber sowie zusätzliche Registerdaten erfasst werden.

---

## Aktuelle Felder (IST)

| Feld | Datenbank-Spalte | Status |
|------|------------------|--------|
| Geschäftsführer | `managing_director` (Freitext) | Vorhanden |
| Rechtsform | `legal_form` | Vorhanden |
| HRB-Nummer | `hrb_number` | Vorhanden |
| USt-ID | `ust_id` | Vorhanden |

---

## Neue Felder (SOLL)

| Feld | Neue Spalte | Typ |
|------|-------------|-----|
| Anrede (GF/Inhaber) | `md_salutation` | TEXT |
| Vorname (GF/Inhaber) | `md_first_name` | TEXT |
| Nachname (GF/Inhaber) | `md_last_name` | TEXT |
| Steuernummer | `tax_number` | TEXT |
| Amtsgericht | `registry_court` | TEXT |

---

## Datenbankänderung

Neue Spalten für `landlord_contexts`:

```sql
ALTER TABLE landlord_contexts
  ADD COLUMN md_salutation TEXT,
  ADD COLUMN md_first_name TEXT,
  ADD COLUMN md_last_name TEXT,
  ADD COLUMN tax_number TEXT,
  ADD COLUMN registry_court TEXT;
```

---

## UI-Änderungen

### 1. KontexteTab.tsx — Inline-Edit (Business-Bereich)

Aktuell (Zeilen 616-670):
```text
┌─────────────────────────────────────────┐
│ FIRMENDATEN                             │
│ ┌───────────────┐ ┌───────────────────┐ │
│ │ Geschäftsführer│ │ Rechtsform       │ │
│ └───────────────┘ └───────────────────┘ │
│ ┌───────────────┐ ┌───────────────────┐ │
│ │ HRB-Nummer    │ │ USt-ID           │ │
│ └───────────────┘ └───────────────────┘ │
│ ┌───────────────────────────────────────│
│ │ Steuersatz (%)                       │ │
│ └──────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

Neu:
```text
┌─────────────────────────────────────────┐
│ GESCHÄFTSFÜHRER / INHABER               │
│ ┌────────┐ ┌───────────┐ ┌────────────┐ │
│ │ Anrede │ │ Vorname   │ │ Nachname   │ │
│ └────────┘ └───────────┘ └────────────┘ │
├─────────────────────────────────────────┤
│ REGISTERDATEN                           │
│ ┌───────────────┐ ┌───────────────────┐ │
│ │ Rechtsform    │ │ Steuernummer     │ │
│ └───────────────┘ └───────────────────┘ │
│ ┌───────────────┐ ┌───────────────────┐ │
│ │ Amtsgericht   │ │ HRB-Nummer       │ │
│ └───────────────┘ └───────────────────┘ │
│ ┌───────────────────────────────────────│
│ │ USt-ID                               │ │
│ └──────────────────────────────────────┘│
├─────────────────────────────────────────┤
│ STEUERSATZ                              │
│ ┌───────────────────────────────────────│
│ │ Steuersatz (%)                       │ │
│ └──────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### 2. CreateContextDialog.tsx — Step 2 (Business)

Gleiche Erweiterungen im Anlage-Dialog (Zeilen 870-936).

### 3. Anzeige-Karte (ContextCardView)

Aktuell wird `managing_director` als `GF: Max Mustermann` angezeigt (Zeilen 390-405).

Neu: Kombination aus `md_salutation`, `md_first_name`, `md_last_name` mit Fallback auf `managing_director`.

---

## Interface-Erweiterungen

### ContextFormData erweitern

```typescript
interface ContextFormData {
  // ... bestehende Felder
  // NEU: Strukturierte GF-Daten
  md_salutation: string;
  md_first_name: string;
  md_last_name: string;
  tax_number: string;
  registry_court: string;
}
```

### LandlordContext erweitern

```typescript
interface LandlordContext {
  // ... bestehende Felder
  md_salutation?: string | null;
  md_first_name?: string | null;
  md_last_name?: string | null;
  tax_number?: string | null;
  registry_court?: string | null;
}
```

---

## Anrede-Optionen

```typescript
const salutationOptions = [
  { value: 'Herr', label: 'Herr' },
  { value: 'Frau', label: 'Frau' },
  { value: 'Divers', label: 'Divers' },
];
```

---

## Zu ändernde Dateien

| Datei | Änderung |
|-------|----------|
| **Migration** | 5 neue Spalten in `landlord_contexts` |
| `KontexteTab.tsx` | Interface + Inline-Edit-Formular + View-Anzeige |
| `CreateContextDialog.tsx` | Interface + Step-2-Formular |

---

## Implementierungsschritte

1. **Datenbank-Migration**: 5 neue Spalten hinzufügen
2. **KontexteTab.tsx**:
   - Interface `LandlordContext` erweitern
   - Interface `ContextFormData` erweitern
   - `handleStartEdit` mit neuen Feldern befüllen
   - `updateContextMutation` mit neuen Feldern erweitern
   - Inline-Edit-Formular (Business-Bereich) umbauen
   - Anzeige-Karte anpassen
3. **CreateContextDialog.tsx**:
   - Interface `ContextFormData` erweitern
   - `defaultFormData` erweitern
   - Step-2-Formular (Business) umbauen
   - `saveContext` Mutation erweitern

---

## Architektur-Sicherheit

| Prüfpunkt | Status |
|-----------|--------|
| Routen | Unverändert |
| Bestehende Daten | Kompatibel (alle neuen Felder nullable) |
| `managing_director` | Bleibt als Fallback bestehen |
| RLS Policies | Unverändert |

