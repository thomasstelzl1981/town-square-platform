
# Fix: Pet-Akte — Impfungen, Krankengeschichte und Datenraum

## Drei identifizierte Probleme

### Problem 1: Impfungen nicht erfassbar
Die Tabelle `pet_vaccinations` existiert bereits mit allen noetigen Spalten, aber es gibt weder einen Hook zum Erstellen/Loeschen noch einen Dialog in der UI.

### Problem 2: Krankengeschichte fehlt komplett
Es gibt keine Tabelle `pet_medical_records` und keine UI-Komponente. Krankengeschichte (Tierarztbesuche, Diagnosen, Behandlungen) kann nicht erfasst werden.

### Problem 3: Datenraum wird nicht angezeigt
`EntityStorageTree` sucht Pet-Ordner mit `parent_id IS NULL`, aber `createPetDMSFolders` erstellt sie mit `parent_id: rootId` (dem Modul-Root). Dadurch findet die Abfrage nichts und der Datenraum bleibt leer.

---

## Technische Aenderungen

### Schritt 1: Datenbank — `pet_medical_records` Tabelle erstellen

Neue Tabelle mit RLS:

```sql
CREATE TABLE public.pet_medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  record_type TEXT NOT NULL DEFAULT 'vet_visit',
  title TEXT NOT NULL,
  description TEXT,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vet_name TEXT,
  diagnosis TEXT,
  treatment TEXT,
  medication TEXT,
  cost_amount NUMERIC(10,2),
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.pet_medical_records
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid())
  );
```

Typen fuer `record_type`: `vet_visit`, `diagnosis`, `treatment`, `surgery`, `medication`, `other`.

### Schritt 2: Hooks — `usePets.ts` erweitern

Neue Hooks in `src/hooks/usePets.ts`:

- `usePetMedicalRecords(petId)` — Liest alle Eintraege
- `useCreateVaccination()` — Erstellt Impfung in `pet_vaccinations`
- `useDeleteVaccination()` — Loescht Impfung
- `useCreateMedicalRecord()` — Erstellt Krankengeschichte-Eintrag
- `useDeleteMedicalRecord()` — Loescht Eintrag

### Schritt 3: Dialoge — Zwei neue Dialoge

**a) `AddVaccinationDialog`** (in `PetsMeineTiere.tsx` oder separate Datei)

Felder:
- Impftyp (Text, Pflicht)
- Impfstoff-Name (Text)
- Verabreicht am (Datum, Pflicht)
- Naechste Faelligkeit (Datum)
- Tierarzt (Text)
- Chargen-Nr. (Text)
- Notizen (Textarea)

Button "Impfung hinzufuegen" neben der Sektion "Impfhistorie".

**b) `AddMedicalRecordDialog`** (gleiche Struktur)

Felder:
- Art (Select: Tierarztbesuch, Diagnose, Behandlung, OP, Medikation, Sonstiges)
- Titel (Text, Pflicht)
- Datum (Datum, Pflicht)
- Tierarzt (Text)
- Diagnose (Text)
- Behandlung (Text)
- Medikation (Text)
- Kosten (Zahl)
- Nachkontrolle am (Datum)
- Notizen (Textarea)

Neue Sektion "Krankengeschichte" in der Akte, mit Button "Eintrag hinzufuegen".

### Schritt 4: Datenraum-Query fixen

**Datei:** `src/components/shared/EntityStorageTree.tsx`

Die Root-Folder-Query (Zeile 47-48) entfernt die Bedingung `.is('parent_id', null)`, da Pet-Ordner einen Parent haben:

```
// Vorher
.is('parent_id', null)

// Nachher — entfernt, da Entity-Ordner einen Parent haben koennen
```

Stattdessen wird nur nach `entity_type + entity_id + node_type = 'folder'` gefiltert und der erste Treffer als Root genommen. Die Unterordner werden dann relativ dazu geladen.

### Schritt 5: UI-Integration in `PetInlineDossier`

Die bestehende `PetInlineDossier`-Komponente bekommt:

1. **Impfhistorie-Sektion**: "+" Button oeffnet `AddVaccinationDialog`, Loeschen-Button pro Eintrag
2. **Neue Sektion "Krankengeschichte"**: zwischen Gesundheit und Versicherung, mit Timeline-Darstellung und "+" Button
3. **Datenraum**: bleibt unten, funktioniert nach dem Query-Fix

### Betroffene Dateien

- Datenbank-Migration (neue Tabelle `pet_medical_records`)
- `src/hooks/usePets.ts` (5 neue Hooks)
- `src/pages/portal/pets/PetsMeineTiere.tsx` (Dialoge + neue Sektion)
- `src/components/shared/EntityStorageTree.tsx` (Query-Fix Zeile 47-48)
