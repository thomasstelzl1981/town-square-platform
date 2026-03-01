

## Nummerntyp-Filter im Auswahl-Dialog + Bug-Fix

### Aktueller Stand
Die Edge Function sucht bereits nach Local, Mobile und TollFree getrennt und liefert den Typ pro Nummer zurueck. Die UI zeigt den Typ als Badge an, aber es gibt keinen Filter — alle Typen werden gemischt angezeigt.

### Aenderungen

**1. UI: `StatusForwardingCard.tsx`** — Typ-Filter im Dialog
- Neuer State `filterType` mit Werten `'all' | 'Local' | 'Mobile' | 'TollFree'`
- Toggle-Buttons oberhalb der Nummernliste: "Alle", "Festnetz", "Mobil", "Gebührenfrei"
- Gefilterte Liste basierend auf Auswahl
- Default-Filter auf "Festnetz" (`Local`), da der User sich schoene Festnetznummern aussuchen moechte

**2. Edge Function: Bug-Fix Zeile 235**
- `number.phone_number` ist undefiniert (Variable heisst `numberToBuy`) — aendere zu `numberToBuy`

### Technische Details

Keine neuen Dateien, kein neuer API-Call. Der Filter arbeitet rein client-seitig auf den bereits geladenen Nummern. Die Edge Function liefert schon alle 3 Typen.

