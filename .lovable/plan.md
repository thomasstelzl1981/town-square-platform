

# E-Mail-Adressen aus Handwerker-Websites extrahieren

## Ausgangslage

Google Places API liefert **keine E-Mail-Adressen**. Das ist eine bekannte Einschraenkung. Google Places liefert aber die **Website-URL** — und auf den Websites der Handwerker steht fast immer eine E-Mail-Adresse im Impressum oder Kontaktbereich.

## Loesung: Automatisches Website-Scraping per Edge Function

Wir erstellen eine schlanke Edge Function, die:
1. Die Website-URL entgegennimmt
2. Das HTML abruft (einfacher `fetch`, kein Firecrawl noetig)
3. E-Mail-Adressen per Regex extrahiert
4. Die beste E-Mail zurueckgibt

**Keine zusaetzlichen API-Keys noetig** — nur ein normaler HTTP-Request.

## Technische Umsetzung

### Neue Datei: `supabase/functions/sot-extract-email/index.ts`

Edge Function die:
- URL empfaengt
- HTML der Seite abruft (mit Timeout, User-Agent)
- Regex-Pattern fuer E-Mail-Adressen anwendet (`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`)
- Gaengige False-Positives filtert (z.B. `wix.com`, `example.com`, `sentry.io`)
- Priorisierung: `info@`, `kontakt@`, `office@` bevorzugt
- Array aller gefundenen E-Mails + beste E-Mail zurueckgibt

### Aenderung: `ProviderSearchPanel.tsx`

**Nach der Google-Places-Suche automatisch E-Mails anreichern:**

1. Fuer jeden Treffer mit `website`-URL: Edge Function `sot-extract-email` aufrufen
2. Ergebnisse asynchron in die Suchergebnisse einpflegen (E-Mail-Feld befuellen)
3. Visuell: E-Mail-Adresse unter der Telefonnummer anzeigen (Mail-Icon)
4. Falls keine E-Mail gefunden: Hinweis "Keine E-Mail gefunden — manuell eingeben" mit kleinem Eingabefeld
5. Beim Auswaehlen eines Providers wird die E-Mail in `SelectedProvider.email` uebernommen

**UI-Erweiterung der Suchergebnis-Karten:**
- E-Mail-Adresse anzeigen (oder "wird gesucht..." waehrend des Scrapings)
- Manuelles E-Mail-Eingabefeld als Fallback
- Provider ohne E-Mail koennen trotzdem ausgewaehlt werden, aber mit Warnung

### Aenderung: `PlaceResult`-Interface erweitern

```text
PlaceResult {
  ...bestehende Felder...
  email?: string;          // NEU: extrahierte E-Mail
  emailLoading?: boolean;  // NEU: Scraping laeuft noch
}
```

## Ablauf fuer den Nutzer

```text
1. Panel oeffnet sich → Suche laeuft automatisch (bereits implementiert)
2. Google Places liefert Ergebnisse mit Website-URLs
3. Im Hintergrund: fuer jedes Ergebnis mit Website wird die E-Mail extrahiert
4. Ergebnisse erscheinen mit E-Mail (oder "wird gesucht...")
5. Nutzer waehlt Dienstleister aus → E-Mail wird uebernommen
6. Falls keine E-Mail gefunden: manuelles Eingabefeld pro Ergebnis
```

## Zusammenfassung

| Datei | Aenderung |
|---|---|
| `supabase/functions/sot-extract-email/index.ts` | NEU: Website-Scraping fuer E-Mail-Extraktion |
| `ProviderSearchPanel.tsx` | E-Mail-Anreicherung nach Suche, UI-Erweiterung |

Keine neuen Dependencies, keine DB-Aenderungen, kein Firecrawl noetig.

