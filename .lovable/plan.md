

# PR 2 Nacharbeiten — Pagination + Thread-Link in Suche

## 1. Pagination "Weitere laden"

### Aenderungen in EmailTab.tsx:

**State**: Neuer `cursor` State (ISO-Timestamp der aeltesten geladenen Nachricht).

**Query-Logik**: Bestehende Supabase-Query erhaelt optionalen `.lt('received_at', cursor)` Filter. Neue Nachrichten werden an bestehende Liste angehaengt (nicht ersetzt).

**UI**: Am Ende der Thread-Liste ein Button "Weitere laden", sichtbar wenn `messages.length` ein Vielfaches von 50 ist (= es gibt vermutlich mehr). Bei Klick: gleiche Query mit Cursor = `received_at` der letzten Nachricht.

**Suchresultate**: `sot-mail-search` unterstuetzt bereits `cursor`-Parameter. Frontend muss diesen bei "Weitere laden" mitsenden.

**Aufwand**: ~30 Zeilen in EmailTab.tsx.

## 2. "Thread anzeigen" bei Suchresultaten

### Aenderungen in EmailTab.tsx:

Im Search-Mode (flat list) bekommt jeder Treffer einen kleinen Button/Link: "Thread anzeigen".

**Logik bei Klick**:
1. Suche beenden (`setSearchQuery('')`, `setDebouncedSearch('')`)
2. `setSelectedThreadId(message.thread_id || message.id)`
3. Sicherstellen, dass der Thread in der normalen (nicht-Suche) Liste enthalten ist — falls nicht (weil aeltere Nachricht), wird er per Einzel-Query nachgeladen

**Aufwand**: ~15 Zeilen in EmailTab.tsx.

## Dateien

| Datei | Aenderung | Risiko |
|-------|-----------|--------|
| `src/pages/portal/office/EmailTab.tsx` | Pagination-State + Button + Cursor-Logik + Thread-Link in Suche | NIEDRIG |

Keine Backend-Aenderungen noetig. `sot-mail-search` hat Cursor-Support bereits eingebaut.

## Risiken

- **NIEDRIG**: Pagination ist additiv (bestehende Query wird nur erweitert)
- **NIEDRIG**: Thread-Link setzt nur bestehende States zurueck
- **MITTEL**: Edge-Case — wenn "Thread anzeigen" geklickt wird und der Thread nicht in den aktuell geladenen 50 Messages ist, muss eine Einzel-Nachlade-Query erfolgen. Fallback: Thread-Detail wird direkt per `thread_id`-Query geladen, unabhaengig von der Hauptliste.

