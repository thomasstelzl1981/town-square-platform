

# Armstrong Edge Function Optimierung

## Zusammenfassung
5 gezielte Prompt- und Performance-Verbesserungen in `supabase/functions/sot-armstrong-advisor/index.ts`. Keine Logik-, Routing- oder Action-Aenderungen.

## Aenderungen

### 1. ARMSTRONG_CORE_IDENTITY Block (neu, nach Zeile 132)
Neuer Konstanten-Block mit einheitlicher Identitaet und `buildContextBlock()`-Hilfsfunktion. Wird nach dem MVP MODULE ALLOWLIST Abschnitt eingefuegt.

### 2. generateExplainResponse komplett ersetzen (Zeilen 2529-2611)
- KB-Query nur bei Nachrichten > 20 Zeichen (Performance)
- `content`-Feld aus KB-Query entfernt (nur `title_de`, `summary_de`)
- Limit von 5 auf 4 reduziert
- Einheitlicher `ARMSTRONG_CORE_IDENTITY`-Prompt statt zwei separate Prompt-Varianten
- Neuer `contextBlock`-Parameter fuer Zone/Modul/Entity-Awareness
- `moduleLabel`-Mapping fuer lesbare Modul-Namen

### 3. generateDraftResponse System-Prompt (Zeilen 2629-2644)
Nur der `systemPrompt`-String wird ersetzt: nutzt `ARMSTRONG_CORE_IDENTITY` statt eigene Intro-Zeile. Regeln bleiben inhaltlich gleich, plus Disclaimer-Hinweis am Ende.

### 4. Legacy-Prompt Zone 2 (Zeile 2938)
Einzeiler-Prompt ersetzt durch `ARMSTRONG_CORE_IDENTITY` mit Zone-2-Portal-Kontext (handlungsorientierte Antworten, Zugang zu Daten).

### 5. EXPLAIN-Branch Aufruf (Zeile 3417)
`buildContextBlock(body, userContext)` als 5. Parameter an `generateExplainResponse` uebergeben.

## Technische Details
- Dateien: 1 (`supabase/functions/sot-armstrong-advisor/index.ts`)
- Keine neuen Dependencies
- Keine Typ-Aenderungen
- Edge Function wird nach Aenderung automatisch deployed
- KAUFY-Prompts (Zone 3) bleiben unberuehrt

