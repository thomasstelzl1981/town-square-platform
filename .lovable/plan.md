

# Plan: Armstrong-Begruessung + Pet-Kachel Bilderrahmen

## Befund 1: Armstrong sagt "Mister Gebhard"

**Ursache:** In `src/pages/portal/PortalDashboard.tsx` Zeile 138 wird `profile?.last_name` als `displayName` an die ArmstrongGreetingCard uebergeben. Fuer Robyn Gebhard ergibt das "Gebhard" als Name. Die Begruessungen lauten dann "Guten Tag, Gebhard!" — und wenn der Armstrong-Advisor-Chat aktiv wird, interpretiert das KI-Modell den Nachnamen als formelle Anrede und generiert "Mr. Gebhard".

**Loesung:** Die Priorisierung in Zeile 138 aendern — `first_name` zuerst, dann `display_name`, dann Fallback "Freund":

```typescript
// Vorher:
displayName={profile?.last_name || profile?.display_name || ''}

// Nachher:
displayName={profile?.first_name || profile?.display_name?.split(' ')[0] || ''}
```

Das entspricht der bestehenden Governance-Regel: "Begruessung nur mit Vorname, Fallback: Freund".

| Datei | Aenderung |
|---|---|
| `src/pages/portal/PortalDashboard.tsx` Zeile 138 | `last_name` → `first_name` |

---

## Befund 2: Pet-Kachel zeigt Foto nur als Mini-Kreis

**Ursache:** In `RecordCard.tsx` entscheidet Zeile 95 `const hasDetailedSummary = summary.length > 2` ob die grosse Foto-Ansicht (portrait mit Bilderrahmen) oder die klassische Avatar-Kreis-Ansicht genutzt wird. Der Hund "Lennox" hat nur 2 Summary-Items (Tierart + Rasse), daher faellt er in den klassischen Modus mit winzigem Avatar-Kreis.

**Loesung:** In `PetsMeineTiere.tsx` sicherstellen, dass Pet-Karten immer mindestens 3 Summary-Items haben, damit der Bilderrahmen-Modus greift. Dazu das Alter oder einen Platzhalter-Eintrag ergaenzen:

```typescript
// In PetsMeineTiere.tsx, summaryItems-Aufbau ergaenzen:
const summaryItems = [
  { label: '', value: SPECIES_LABELS[pet.species] || pet.species },
  ...(pet.breed ? [{ label: '', value: pet.breed }] : []),
  { label: '', value: age || 'Alter unbekannt' },
  ...(pet.weight_kg ? [{ label: '', value: `${pet.weight_kg} kg` }] : []),
  ...(pet.chip_number ? [{ label: '', value: `Chip: ${pet.chip_number}` }] : []),
];
```

Damit hat jede Pet-Karte mindestens 3 Items (Tierart, Rasse/leer, Alter) und der grosse Bilderrahmen-Modus mit `aspect-[4/5]` wird aktiv. Das Foto fuellt die Kachel als Bilderrahmen.

| Datei | Aenderung |
|---|---|
| `src/pages/portal/pets/PetsMeineTiere.tsx` Zeile 134-138 | Summary-Items so aufbauen, dass immer >= 3 vorhanden sind |
| `src/pages/portal/PortalDashboard.tsx` Zeile 138 | `last_name` → `first_name` |

