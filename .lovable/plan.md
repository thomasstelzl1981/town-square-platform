

# ProviderSearchPanel: Suchfeld vorausfuellen und automatisch suchen

## Befund

- Der **Standort** wird korrekt aus dem Objekt uebernommen (Datenbank: `Leipzig` fuer das aktuelle Objekt). Nicht hart gecodet.
- Die **Kategorie** wird korrekt uebergeben (`sanitaer`), und es gibt bereits ein Mapping zu `Sanitaer Installateur`.
- **Problem:** Das Suchfeld startet leer. Der Nutzer muss selbst wissen, was er eintippen soll, obwohl das System die Kategorie bereits kennt.

## Loesung

### Datei: `ProviderSearchPanel.tsx`

1. **Suchfeld vorausfuellen:** `searchQuery` wird mit `getCategorySearchTerm(category)` initialisiert statt mit leerem String. Bei Kategorie `sanitaer` steht dann sofort `Sanitaer Installateur` im Feld.

2. **Automatische Suche beim Laden:** Ein `useEffect` loest `handleSearch()` beim ersten Rendern aus, sobald `location` vorhanden ist. Der Nutzer sieht sofort Ergebnisse, ohne manuell klicken zu muessen.

3. **Standort prominenter anzeigen:** Die Standort-Anzeige erhaelt den Zusatz mit Adresse und Stadt, damit klar ist, wo gesucht wird (z.B. `Standort: Leipzig`).

## Technische Details

| Aenderung | Detail |
|---|---|
| `useState('')` bei `searchQuery` | Wird zu `useState(getCategorySearchTerm(category))` |
| Neuer `useEffect` | Triggert `handleSearch()` einmalig beim Mount wenn `location` existiert |
| Keine neuen Dependencies | `useEffect` nutzt vorhandene `handleSearch`-Funktion |

Eine Datei, keine DB-Aenderungen, keine neuen Dependencies.
