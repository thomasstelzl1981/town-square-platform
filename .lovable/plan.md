

# Bugfix: Konsistentes Klick-Verhalten der Tierakten

## Problem-Analyse

Das aktuelle Layout nutzt ein einziges CSS-Grid (`grid-cols-2`) fuer ALLE Karten — geschlossen UND offen. Wenn eine Karte geoeffnet wird, nimmt sie `col-span-2` ein und verschiebt die anderen Karten im Grid-Flow. Das fuehrt zu:

- Geschlossene Karten "springen" je nach Position im Grid
- Die offene Akte erscheint mal unter, mal neben der geschlossenen
- Inkonsistentes visuelles Verhalten

## Soll-Bild (2 Tiere: Bello und Luna)

### Szenario 1: Beide geschlossen (Anfangszustand)

```text
+-------------------+  +-------------------+
|     [Foto]        |  |     [Foto]        |
|     Bello         |  |     Luna          |
|     Hund · Dackel |  |     Hund · Golden |
|     4 Jahre       |  |     2 Jahre       |
+-------------------+  +-------------------+
```

### Szenario 2: Klick auf Bello → Bello oeffnet sich

```text
+-------------------+  +-------------------+
|     [Foto]        |  |     [Foto]        |
|     Bello (aktiv) |  |     Luna          |
|     Hund · Dackel |  |     Hund · Golden |
+-------------------+  +-------------------+

+-----------------------------------------------+
|  Bello — Hund                            [X]  |
|  ──────────────────────────────────────────── |
|  STAMMDATEN                                    |
|  Name: Bello    Tierart: Hund    Rasse: Dackel |
|  ...                                           |
|  DATENRAUM                                     |
|  [EntityStorageTree]                           |
+-----------------------------------------------+
```

### Szenario 3: Klick auf Bello nochmal → Bello schliesst

```text
+-------------------+  +-------------------+
|     [Foto]        |  |     [Foto]        |
|     Bello         |  |     Luna          |
|     Hund · Dackel |  |     Hund · Golden |
+-------------------+  +-------------------+
```

### Szenario 4: Klick auf Luna → Luna oeffnet sich

```text
+-------------------+  +-------------------+
|     [Foto]        |  |     [Foto]        |
|     Bello         |  |     Luna (aktiv)  |
|     Hund · Dackel |  |     Hund · Golden |
+-------------------+  +-------------------+

+-----------------------------------------------+
|  Luna — Hund                             [X]  |
|  ──────────────────────────────────────────── |
|  STAMMDATEN                                    |
|  Name: Luna    Tierart: Hund    Rasse: Golden  |
|  ...                                           |
|  DATENRAUM                                     |
|  [EntityStorageTree]                           |
+-----------------------------------------------+
```

## Technische Loesung

**Datei:** `src/pages/portal/pets/PetsMeineTiere.tsx`

### Strukturaenderung: Zwei separate Bereiche statt einem Grid

Das Layout wird in zwei Bloecke aufgeteilt:

1. **Oben: Geschlossene Karten-Leiste** (immer sichtbar, alle Karten immer geschlossen dargestellt)
2. **Unten: Offene Akte** (nur sichtbar wenn `openPetId` gesetzt)

```text
{/* Block 1: Alle Karten — IMMER geschlossen */}
<div className={RECORD_CARD.GRID}>
  {pets.map(pet => (
    <RecordCard
      key={pet.id}
      isOpen={false}              // <-- IMMER false
      onToggle={() => toggle}     // Toggle-Logik
      glowVariant={openPetId === pet.id ? 'teal' : undefined}
      // ... summary props
    >
      {null}
    </RecordCard>
  ))}
</div>

{/* Block 2: Inline-Dossier — NUR wenn ein Tier ausgewaehlt */}
{openPetId && (
  <PetInlineDossier
    key={openPetId}
    petId={openPetId}
    tenantId={activeTenantId}
  />
)}
```

### Warum diese Loesung?

- Geschlossene Karten bleiben **immer oben fixiert** im Grid
- Kein Layout-Sprung, weil keine Karte `col-span-2` einnimmt
- Die offene Akte erscheint immer **unterhalb des Grids**
- Toggle funktioniert zuverlaessig: Klick auf aktive Karte schliesst, Klick auf andere wechselt
- Die aktive Karte erhaelt einen `teal` Glow zur visuellen Markierung

### Detaillierte Aenderungen

1. **RecordCard-Aufruf**: `isOpen` wird auf `false` gesetzt (Karten werden nie im "open"-Modus der RecordCard gerendert), `children` wird `null`
2. **Aktive Karte markieren**: `glowVariant="teal"` nur fuer `openPetId === pet.id`, sonst `undefined`
3. **PetInlineDossier**: Wird als eigenstaendiger Block **unterhalb** des Grids gerendert, mit `key={openPetId}` fuer sauberes Remounting
4. **PetInlineDossier-Komponente**: Behaelt Header mit Titel, X-Button zum Schliessen, und alle Sektionen inkl. Datenraum ganz unten
5. **onToggle Prop wird weitergereicht**: Der X-Button in PetInlineDossier braucht Zugriff auf `setOpenPetId(null)` — daher wird ein `onClose` Prop ergaenzt

### Keine weiteren Dateien betroffen

Nur `PetsMeineTiere.tsx` wird geaendert. Keine DB-Migration, keine Manifest-Aenderungen.

