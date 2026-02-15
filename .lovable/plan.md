
# Fix: RecordCard zeigt altes Layout wegen zu hoher Schwelle

## Ursache

In `RecordCard.tsx` Zeile 93 steht:
```typescript
const hasDetailedSummary = summary.length > 4;
```

Das erfordert **5+ Eintraege**. Thomas Stelzl hat aber nur 4 befuellte Felder (Strasse, PLZ/Ort, Mobil, E-Mail). Geburtsdatum und Festnetz sind leer. Deshalb greift das alte zentrierte Layout.

## Loesung

Die Schwelle von `> 4` auf `> 2` senken. Sobald mehr als 2 Summary-Felder vorhanden sind, wird das neue linksbuendige Layout mit Foto-Kachel angezeigt. Bei Personen-Karten sind praktisch immer mindestens 3-4 Felder befuellt, sodass das neue Layout zuverlaessig greift.

## Aenderung

### `src/components/shared/RecordCard.tsx` — Zeile 93

```typescript
// ALT:
const hasDetailedSummary = summary.length > 4;

// NEU:
const hasDetailedSummary = summary.length > 2;
```

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/shared/RecordCard.tsx` | Schwelle von `> 4` auf `> 2` aendern (Zeile 93) |

Eine einzige Zeile. Keine weiteren Dateien betroffen.
