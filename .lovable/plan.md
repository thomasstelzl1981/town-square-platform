

# Fix: Tierarzt-Suche auf der Doc-Seite

## Problem

Die Suchmaschine funktioniert grundsaetzlich — der direkte Test zeigt **4 Ergebnisse von Google Places** fuer "Tierarzt Notdienst Muenchen". Das Problem liegt in der **falschen Parameteruebergabe** im LennoxDoc.tsx:

| Parameter | Aktuell (falsch) | Edge Function erwartet |
|---|---|---|
| Standort | In `query` eingebettet: `"Tierarzt Notdienst 85521"` | Separates Feld `location: "85521"` |
| Max Ergebnisse | `limit: 8` | `max_results: 4` |
| Filter | `filters: { category: 'veterinary' }` | Nicht unterstuetzt (ignoriert) |

Dadurch bekommt Google Places keine saubere Location-Trennung und die Ergebnisse werden nicht korrekt zurueckgegeben.

## Loesung

**Datei**: `src/pages/zone3/lennox/LennoxDoc.tsx` — `handleVetSearch` Funktion (Zeilen 69-104)

Aenderungen:
1. `query` auf reinen Suchbegriff reduzieren: `"Tierarzt Notdienst"`
2. `location` als separates Feld senden: `location: vetSearch.trim()`
3. `limit` ersetzen durch `max_results: 4` (Kosten + Geschwindigkeit)
4. `filters.category` entfernen (nicht unterstuetzt)
5. Fallback-Daten ebenfalls auf max 4 reduzieren

```typescript
const { data, error } = await supabase.functions.invoke('sot-research-engine', {
  body: {
    intent: 'find_contacts',
    query: 'Tierarzt Notdienst',
    location: vetSearch.trim(),
    max_results: 4,
  },
});
```

Keine weiteren Dateien betroffen. Reine Bugfix-Aenderung in einer Datei.

