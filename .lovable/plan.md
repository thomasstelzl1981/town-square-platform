

# Systemweite Reparatur-Analyse — 4 Funde

## Fund 1: Armstrong Greeting sagt immer "Mr."

**Ursache gefunden**: `src/components/dashboard/ArmstrongGreetingCard.tsx`, Zeile 42:
```typescript
const formattedName = name ? `Mr. ${name}` : 'Freund';
```
Hardcoded "Mr." vor dem Namen, unabhaengig vom Geschlecht.

**Reparatur**: `Mr. ${name}` ersetzen durch einfach `${name}` (Vorname). Geschlechtsneutral, kein Anrede-Feld noetig, rechtlich sauber.

| Datei | Aenderung |
|---|---|
| `src/components/dashboard/ArmstrongGreetingCard.tsx` | Zeile 42: `Mr. ${name}` → `${name}` |

---

## Fund 2: Logo in Stammdaten wird aus Golden Tenant uebernommen

**Analyse**: Die `letterhead_logo_url` im Profil von Robyn zeigt auf einen Storage-Pfad unter ihrem eigenen Tenant (`eac1778a-...`). Das Problem ist vermutlich, dass beim Onboarding oder bei der Demo-Seed ein Logo in diesen Slot geschrieben wird, das eigentlich das Golden Tenant Logo ist. Oder die Anzeige-Logik faellt auf ein falsches Fallback zurueck.

**Reparatur**: Zwei Stellen pruefen:
1. `src/pages/portal/stammdaten/ProfilTab.tsx` Zeile 386: Der Fallback-Mechanismus laedt `letterhead_logo_url` aus dem Profil. Wenn dort beim Seeding ein Golden-Tenant-Logo hinterlegt wurde, erscheint es als "eigenes" Logo.
2. Seed-Engine / `handle_new_user` Trigger: Pruefen, ob dort ein Default-Logo gesetzt wird.

**Empfehlung**: Die `letterhead_logo_url` soll beim Onboarding `null` bleiben. Wenn dort bereits ein Wert steht, zeigt ProfilTab das Logo an — korrekt. Das eigentliche Problem ist, dass ein Logo dort hineinkam, das nicht dem User gehoert. Loesung: Im ProfilTab einen klaren "Kein Logo hinterlegt"-State zeigen und sicherstellen, dass kein Seed-Prozess ein Default-Logo setzt.

| Datei | Aenderung |
|---|---|
| `src/pages/portal/stammdaten/ProfilTab.tsx` | Fallback-Logik fuer Logo-Slot reviewen; kein automatisches Erben |

---

## Fund 3: Briefgenerator Logo-Uebernahme aus Stammdaten

**Analyse**: `src/pages/portal/office/BriefTab.tsx` Zeile 838 nutzt `profile?.letterhead_logo_url` direkt. Wenn Fund 2 gefixt ist (kein falsches Logo im Profil), ist der Briefgenerator automatisch auch gefixt — er liest nur das, was in Stammdaten steht.

**Reparatur**: Kein separater Fix noetig. Haengt direkt an Fund 2.

---

## Fund 4: Tierakte — Bild-Inkonsistenz (geschlossen vs. offen)

**Ursache gefunden**: In `PetsMeineTiere.tsx` werden alle RecordCards mit `isOpen={false}` gerendert. Klickt man, oeffnet sich die PetDossier darunter (Inline-Detail). Aber:

1. **Geschlossene Karte zeigt kein Bild**: `thumbnailUrl={pet.photo_url || undefined}` — aber `photo_url` ist `null` bis man in der geoeffneten Akte ein Foto hochlaedt. Erst dann wird `photo_url` gesetzt. Aber: Das Upload passiert in `PetProfileSection` (innerhalb PetDossier), das ein Public-URL in die DB schreibt. Die geschlossene RecordCard liest `pet.photo_url` aus dem Query-Cache — nach Upload muesste sie also das Bild zeigen, WENN der Cache invalidiert wird.

2. **Kein Drag-and-Drop auf geschlossene Karte**: Anders als bei Fahrzeugen fehlt `onPhotoDrop` auf der RecordCard fuer Pets. Bei Fahrzeugen kann man ein Foto direkt auf die geschlossene Karte ziehen.

3. **Redundanz Steckbrief-Foto + Galerie**: Im PetDossier gibt es erst ein 160x160px Profilfoto im Steckbrief, direkt darunter eine separate Fotogalerie-Section. Das ist redundant und verwirrend.

**Reparatur**:

| Schritt | Datei | Aenderung |
|---|---|---|
| A | `src/pages/portal/pets/PetsMeineTiere.tsx` | `onPhotoDrop` auf RecordCard hinzufuegen (wie Fahrzeuge), damit Drag-and-Drop auf geschlossene Karte funktioniert |
| B | `src/pages/portal/pets/PetsMeineTiere.tsx` | Cache-Invalidierung nach PetDossier-Upload sicherstellen (react-query invalidate `pets`) |
| C | `src/components/shared/pet-dossier/PetDossier.tsx` | Galerie-Section entfernen oder in Steckbrief integrieren (1 Foto-Bereich statt 2) — analog Fahrzeuge |

---

## Zusammenfassung der Aenderungen

| # | Datei | Was |
|---|---|---|
| 1 | `ArmstrongGreetingCard.tsx` | `Mr. ${name}` → `${name}` |
| 2 | `ProfilTab.tsx` | Logo-Fallback pruefen, kein Golden-Tenant-Erbe |
| 3 | Kein separater Fix | Briefgenerator erbt aus Stammdaten (gefixt durch #2) |
| 4a | `PetsMeineTiere.tsx` | `onPhotoDrop` hinzufuegen + Cache-Invalidierung |
| 4b | `PetDossier.tsx` / `PetGallerySection` | Galerie in Steckbrief konsolidieren |

Keine DB-Migration noetig. Keine Freeze-Konflikte (MOD-05 und MOD-22 sind unfrozen, Dashboard-Komponenten sind nicht frozen).

