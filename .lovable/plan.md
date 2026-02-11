
# Selbstauskunft: 3-Spalten Side-by-Side Layout (MOD-07 + MOD-11)

## Konzept

Beide Antragsteller werden in einer einzigen Tabelle nebeneinander dargestellt:

```text
+---------------------+------------------+------------------+
| Feld                | 1. Antragsteller | 2. Antragsteller |
+---------------------+------------------+------------------+
| Anrede              | [Herr ▼]         | [     ▼]         |
| Vorname             | [Max           ] | [              ] |
| Nachname            | [Mustermann    ] | [              ] |
| ...                 | ...              | ...              |
+---------------------+------------------+------------------+
```

- Kein Toggle/Switch mehr -- die 2. Spalte ist immer sichtbar
- Co-Applicant-Profil wird automatisch in der DB erstellt beim ersten Eintrag in Spalte 2
- Tabelle ist halb so lang und direkt vergleichbar
- Geteilte Sektionen (Haushalt, Erklaerungen) bleiben einspalttig

## Wichtig: MOD-11 ist EDITIERBAR

Der Finanzierungsmanager in MOD-11 muss die Selbstauskunft bearbeiten und speichern koennen. Das ist seine Kernaufgabe: Unterlagen aufbereiten vor der Einreichung an die Bank. Die Selbstauskunft-Anzeige im FMFallDetail wird daher von Read-Only auf editierbar umgestellt, inklusive Speicher-Button.

## Betroffene Dateien (3 Dateien)

### 1. `src/components/finanzierung/ApplicantPersonFields.tsx`
- `TR`-Komponente erhaelt dritte Spalte (`children2` fuer AS2)
- `DualHeader`-Komponente fuer konsistente Spaltenkoepfe
- Alle Sections (Person, Employment, Bank, Income, Expenses, Assets) erhalten `DualApplicantSectionProps`: zwei formData-Saetze, zwei onChange-Handler
- `onCoFirstInput`-Callback fuer Auto-Create des Co-Applicant-Profils

### 2. `src/components/finanzierung/SelbstauskunftFormV2.tsx`
- Switch "2. Antragsteller hinzufuegen" wird entfernt
- Alle Sektions-Aufrufe bekommen `formData` + `coFormData` + `onChange` + `onCoChange`
- Co-Applicant wird automatisch erstellt beim ersten Input in die rechte Spalte
- Separatoren und dashed-border Wrapper fuer den 2. AS fallen weg

### 3. `src/pages/portal/finanzierungsmanager/FMFallDetail.tsx`
- Selbstauskunft-Tab: Umstellung von Read-Only auf editierbar
- Nutzt die gleichen Section-Komponenten aus `ApplicantPersonFields.tsx`
- Laedt `applicant_profiles[0]` (AS1) und `applicant_profiles[1]` (AS2) aus dem Request
- Konvertiert zu `ApplicantFormData` via `profileToFormData`
- Save-Button speichert Aenderungen zurueck in die DB via `useUpdateApplicantProfile`
- 3-Spalten-Layout identisch zu MOD-07
- Geteilte Felder (Haushalt, Erklaerungen) ebenfalls editierbar

## Technische Details

### Neues Interface fuer alle Sections:
```typescript
interface DualApplicantSectionProps {
  formData: ApplicantFormData;       // AS1
  coFormData: ApplicantFormData;     // AS2
  onChange: (field, value) => void;  // AS1
  onCoChange: (field, value) => void; // AS2
  readOnly: boolean;
  coReadOnly?: boolean;
  onCoFirstInput?: () => void;      // Auto-Create trigger
}
```

### MOD-11 Speicher-Logik:
- State: `formData`, `coFormData`, `sharedData` (wie in SelbstauskunftFormV2)
- Save: `supabase.from('applicant_profiles').update(...)` fuer beide Profile
- Der `useUpdateApplicantProfile` Hook existiert bereits und wird genutzt
- Save-Button im Tab-Header der Selbstauskunft

### Auto-Create Co-Applicant:
- `useCoFirstInput` Hook trackt ob bereits getriggert
- Beim ersten Tastendruck in AS2-Spalte wird `onCoFirstInput()` aufgerufen
- MOD-07: Erstellt neues `applicant_profiles`-Record mit `party_role: 'co_applicant'`
- MOD-11: Erstellt neues `applicant_profiles`-Record mit `linked_primary_profile_id` und `finance_request_id`

## Keine DB-Aenderungen

Die `applicant_profiles`-Tabelle unterstuetzt bereits Co-Applicants ueber `linked_primary_profile_id` und `party_role`.
