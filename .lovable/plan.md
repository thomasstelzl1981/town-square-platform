
# RecordCard Closed-State: Neues Layout ohne Anrede + Foto-Platzhalter mit Drag-and-Drop

## Aenderungen

### 1. Anrede entfernen

Aus `UebersichtTab.tsx` (Zeile 170) und `ProfilTab.tsx` die Anrede-Zeile aus dem `summary`-Array streichen. Sie gehoert nicht unter den Namen.

### 2. RecordCard.tsx — Closed-State komplett umbauen (Zeilen 115-141)

Das `hasDetailedSummary`-Layout wird ersetzt durch:

```text
+--------------------------------------------------+
|  [Badge: Hauptperson]                             |
|                                                   |
|  +--------+   Thomas Stelzl                       |
|  |  FOTO  |   Geb.: 15.03.1985                    |
|  |  80x80 |                                       |
|  | Drop   |   Sauerlacher Strasse 30              |
|  | hier   |   82041 Oberhaching                   |
|  +--------+                                       |
|               Tel:  +49 89 123456                  |
|               Mob:  +49 170 123456                 |
|               thomas.stelzl@example.de             |
|                                              [>]  |
+--------------------------------------------------+
```

Kernpunkte:
- **Foto-Kachel 80x80px** als `rounded-xl` Platzhalter mit Kamera-Icon und Text "Foto" wenn kein Bild vorhanden
- Platzhalter reagiert auf **Drag-and-Drop** (Bild-Datei) via `onPhotoDrop` Callback — neues optionales Prop
- Wenn Bild vorhanden: Bild anzeigen statt Platzhalter
- **Kein Anrede-Feld** im geschlossenen Zustand
- **Name in `text-lg font-semibold`**, Datenzeilen in `text-sm`
- **Linksbuendig**, Labels mit fester Breite `w-16`
- Kein `aspect-square` bei detailliertem Layout

### 3. Neues Prop: `onPhotoDrop`

```typescript
interface RecordCardProps {
  // ... bestehende Props
  onPhotoDrop?: (file: File) => void;  // NEU
}
```

Im geschlossenen Zustand wird die Foto-Kachel als Drop-Zone gerendert:
- `onDragOver` / `onDrop` Events auf dem 80x80 Container
- Akzeptiert nur Bild-Dateien (`image/*`)
- Ruft `onPhotoDrop(file)` auf — der Parent (UebersichtTab/ProfilTab) kuemmert sich um Upload + URL-Update

### 4. Summary-Reihenfolge in UebersichtTab.tsx und ProfilTab.tsx

Ohne Anrede, Geburtsdatum als erstes Item (steht neben dem Foto):

```typescript
summary={[
  // Neben dem Foto (erstes Item)
  ...(person.birth_date ? [{ label: 'Geb.', value: new Date(person.birth_date).toLocaleDateString('de-DE') }] : []),
  // Darunter
  ...(person.street ? [{ label: 'Straße', value: `${person.street} ${person.house_number || ''}`.trim() }] : []),
  ...(person.zip ? [{ label: 'PLZ/Ort', value: `${person.zip} ${person.city || ''}`.trim() }] : []),
  ...((person as any).phone_landline ? [{ label: 'Tel.', value: (person as any).phone_landline }] : []),
  ...(person.phone ? [{ label: 'Mobil', value: person.phone }] : []),
  ...(person.email ? [{ label: 'E-Mail', value: person.email }] : []),
]}
```

ProfilTab analog mit `formData`-Feldern + Geburtsdatum (falls im Profil vorhanden).

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/shared/RecordCard.tsx` | Closed-State neu: 80px Foto-Platzhalter mit Drop, text-lg/text-sm, linksbuendig, neues `onPhotoDrop` Prop |
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | Anrede raus, Geb. als erstes Summary-Item |
| `src/pages/portal/stammdaten/ProfilTab.tsx` | Anrede raus, Geb. ergaenzen, gleiche Reihenfolge |
