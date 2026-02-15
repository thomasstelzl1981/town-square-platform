

# RecordCard Akte: Ueberarbeitung Open-State + Person-DMS-Tree

## Zusammenfassung

Drei Aenderungen:
1. **"Person hinzufuegen" und "Neue Person"-Formular entfernen** aus der Akte (Open-State) — Personen werden nur noch am Dashboard (Grid) hinzugefuegt
2. **Familienstand/Gueterstand** als neues Feld in der geoeffneten Akte abfragen (`marital_status` existiert bereits in `household_persons`)
3. **Personen-DMS-Tree automatisch erstellen** mit vordefinierten Unterordnern fuer persoenliche Dokumente

---

## Aenderung 1: CTA-Widget und Formular bleiben am Dashboard

Das "Person hinzufuegen"-Widget (Zeilen 258-273) und das "Neue Person"-Formular (Zeilen 275-323) in `UebersichtTab.tsx` bleiben **unveraendert am Dashboard-Grid** — dort gehoeren sie hin. Es gibt aktuell keinen separaten "Person hinzufuegen"-Button innerhalb der geoeffneten Akte, also ist hier nichts zu entfernen.

**Keine Code-Aenderung noetig.**

---

## Aenderung 2: Familienstand in der geoeffneten Akte

Das Feld `marital_status` existiert bereits in der Tabelle `household_persons`. Es wird lediglich in der UI der geoeffneten Akte als Select-Feld ergaenzt.

### `UebersichtTab.tsx` — Im Open-State "Persoenliche Daten"-Sektion

Neues Select-Feld nach "Geburtsdatum" einfuegen:

```typescript
// Optionen
const MARITAL_OPTIONS = [
  { value: 'ledig', label: 'Ledig' },
  { value: 'verheiratet', label: 'Verheiratet' },
  { value: 'geschieden', label: 'Geschieden' },
  { value: 'verwitwet', label: 'Verwitwet' },
  { value: 'eingetragene_lebenspartnerschaft', label: 'Eingetr. Lebenspartnerschaft' },
];

// Im FIELD_GRID nach Geburtsdatum:
<div>
  <Label className="text-xs">Familienstand</Label>
  <Select
    value={form.marital_status || ''}
    onValueChange={v => updateField(person.id, 'marital_status', v)}
  >
    <SelectTrigger><SelectValue placeholder="Bitte waehlen" /></SelectTrigger>
    <SelectContent>
      {MARITAL_OPTIONS.map(o => (
        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

---

## Aenderung 3: Automatischer Personen-DMS-Tree

### 3a. Neuer Hook: `usePersonDMS.ts`

Analog zu `usePvDMS.ts` — erstellt bei Personenanlage automatisch eine Ordnerstruktur:

```typescript
const PERSON_DMS_FOLDERS = [
  '01_Personalausweis',
  '02_Reisepass',
  '03_Geburtsurkunde',
  '04_Ehevertrag',
  '05_Testament',
  '06_Patientenverfuegung',
  '07_Vorsorgevollmacht',
  '08_Sonstiges',
];
```

Der Hook erstellt:
1. Einen Root-Ordner (`entity_type: 'person'`, `entity_id: person.id`, `module_code: 'MOD_18'`)
2. Alle 8 Unterordner als Kinder des Root-Ordners

### 3b. Aufruf bei Personenanlage

In `UebersichtTab.tsx` wird nach erfolgreichem `createPerson.mutate()` automatisch `createPersonDMSTree` aufgerufen:

```typescript
const { createPersonDMSTree } = usePersonDMS();

// In handleAddPerson:
createPerson.mutate(newForm, {
  onSuccess: (newPerson) => {
    createPersonDMSTree.mutateAsync({
      personId: newPerson.id,
      personName: `${newForm.first_name} ${newForm.last_name}`.trim(),
    });
    // ...
  },
});
```

### 3c. Auch fuer bestehende Personen nachholen

Wenn eine bestehende Person geoeffnet wird und noch keinen DMS-Ordner hat, wird der Tree automatisch erstellt (Lazy Creation in `EntityStorageTree` — dieses Verhalten existiert bereits fuer den Upload-Fall, muss aber auch fuer die initiale Anzeige greifen).

### 3d. Anzeige im Datenraum-Bereich der geoeffneten Akte

Die bestehende `EntityStorageTree`-Komponente wird bereits im Open-State gerendert (Zeilen 240-249 in `RecordCard.tsx`). Sie nutzt `entity_type='person'` und `entity_id=person.id` — **das funktioniert bereits**. Sobald die Ordner existieren, werden sie in der Spaltenansicht (ColumnView) angezeigt, gemaess dem `DESIGN.STORAGE`-Standard.

### 3e. recordCardManifest aktualisieren

`person`-Entity nutzt aktuell `moduleCode: 'MOD_01'`. Fuer den Finanzanalyse-Kontext (MOD-18) muss geprueft werden, ob der moduleCode korrekt ist. Da Personen moduluebergreifend genutzt werden, bleibt `MOD_01` als Standard. Die `EntityStorageTree`-Komponente filtert nach `entity_type + entity_id`, nicht nach moduleCode, also funktioniert es unabhaengig.

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/usePersonDMS.ts` | **Neu** — Hook mit `PERSON_DMS_FOLDERS` und `createPersonDMSTree` |
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | Familienstand-Select hinzufuegen, DMS-Tree-Erstellung bei Personenanlage |
| `src/hooks/useFinanzanalyseData.ts` | Evtl. `createPerson` Rueckgabewert anpassen (Person-ID zurueckgeben) |

**Keine DB-Migration noetig** — `marital_status` existiert bereits in `household_persons`.

