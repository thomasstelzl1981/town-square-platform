

# KI-Bankensuche: Google Places Integration in Kachel 2

## Ausgangslage

Die Edge Function `sot-places-search` existiert bereits und nutzt die **Google Places API (New)** mit Header-basierter Authentifizierung. Sie wird aktuell im Sanierungsmodul (Handwerkersuche) erfolgreich eingesetzt. Die "Coming soon"-Platzhalter in der KI-Vorschlaege-Spalte koennen durch eine echte Suche ersetzt werden.

## Aenderungen

### Datei: `FMEinreichung.tsx`

**1. Statische Platzhalter entfernen**

Das hartcodierte `AI_SUGGESTIONS`-Array und das "Coming soon"-Badge werden entfernt.

**2. Google Places Suche einbauen**

- Beim Laden eines Falls wird automatisch eine Suche nach "Bank" + PLZ/Ort des Objekts ausgeloest (Radius: 50 km / 50000 m)
- Die Suche ruft `supabase.functions.invoke('sot-places-search', { body: { query: 'Bank [PLZ Ort]', radius: 50000 } })` auf
- Ergebnisse werden als klickbare Liste in der mittleren Spalte "KI-Vorschlaege" angezeigt
- Jeder Eintrag zeigt: Name, Adresse, Telefon (falls vorhanden)
- Beim Klick wird die Bank in die Auswahl uebernommen (Name + ggf. E-Mail manuell nachtragen)

**3. UI der mittleren Spalte**

```text
+----------------------------------+
| KI-Vorschlaege (50 km Umkreis)  |
| [Lade Banken im Umkreis...]     |
|                                  |
| Sparkasse Musterstadt    [+]    |
|   Hauptstr. 1, 12345 Musterst. |
|                                  |
| Volksbank Region XY      [+]    |
|   Bahnhofstr. 5, 12346 Ort     |
|                                  |
| Deutsche Bank Filiale    [+]    |
|   Marktplatz 2, 12345 Musterst.|
|                                  |
| [Erneut suchen]                  |
+----------------------------------+
```

- Loading-State mit Spinner waehrend der Suche
- Fehler-Handling mit Toast-Nachricht
- "Erneut suchen"-Button fuer manuelle Aktualisierung
- Da Google Places keine E-Mail liefert: Bei Uebernahme wird die Bank ohne E-Mail hinzugefuegt, der Nutzer kann die E-Mail dann manuell im Chip oder im E-Mail-Entwurf ergaenzen

**4. Technische Details**

- Neuer State: `aiResults` (Array), `aiLoading` (boolean)
- Suchparameter werden aus dem aktiven Fall extrahiert: `property?.postal_code`, `property?.city` oder Fallback auf `applicant?.object_address`
- Die Suche wird via `useEffect` ausgeloest, wenn sich der aktive Fall aendert
- Bank-Objekt aus Places-Ergebnis: `{ id: place_id, name, email: '', source: 'ki' }`

### Keine weiteren Dateien betroffen

Die Edge Function `sot-places-search` bleibt unveraendert — sie unterstuetzt bereits Freitext-Suche mit optionalem Radius.

### Keine Datenbank-Aenderungen

Reine Frontend-Aenderung in einer Datei.

