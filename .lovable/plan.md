

# E-Mail-Client: Stabilisierung und UI-Verbesserung

## Problem-Analyse

### 1. E-Mail-Body wird nicht geladen (Hauptproblem)
**Ursache:** Die `deno-imap` Bibliothek (`jsr:@workingdevshero/deno-imap`) ist unzuverlaessig. Die 3-Tier-Fetch-Strategie fuer den Body scheitert bei 9 von 10 E-Mails. Die Datenbank bestaetigt: `body_text = NULL`, `body_html = NULL` fuer fast alle Nachrichten.

**Warum es mal geht und mal nicht:** Die Bibliothek ist experimentell. Ob `full: true` (RFC822) funktioniert, haengt vom IMAP-Server, der Nachrichtengroesse und dem Encoding ab. Es ist nicht deterministisch.

### 2. Antwort-/Weiterleitungs-/Loeschen-Buttons
Die Buttons existieren bereits im Code (Zeilen 868-880), sind aber nur sichtbar wenn:
- Ein E-Mail-Konto verbunden ist
- Eine E-Mail in der Liste ausgewaehlt wurde
- Die Buttons befinden sich am unteren Rand des Detail-Panels

Da der Body oft nicht geladen wird, sieht man zwar die Buttons, aber Antworten/Weiterleiten funktionieren schlecht (kein Zitat-Text).

## Loesung

### Teil 1: Stabiler IMAP-Body-Fetch (Edge Function)

**Datei:** `supabase/functions/sot-mail-sync/index.ts`

Die aktuelle 3-Tier-Strategie wird durch eine robustere Methode ersetzt:

1. **Primaer: `bodyParts: ['1']`** -- Holt den ersten MIME-Part direkt (funktioniert bei den meisten Servern zuverlaessiger als `full: true`)
2. **Fallback: `bodyParts: ['1.1', '1.2']`** -- Fuer verschachtelte Multipart-Nachrichten
3. **Letzter Fallback: `full: true`** -- RFC822 als letzte Option
4. **Neuer Safety-Fallback: Re-Fetch nach Upsert** -- Wenn nach dem Sync immer noch kein Body da ist, wird ein einzelner On-Demand-Fetch getriggert

Zusaetzlich:
- Besseres Error-Logging pro Nachricht (UID-basiert)
- Timeout-Handling pro Fetch (10 Sekunden max)
- Body wird bei leerem Ergebnis mit dem Envelope-Subject als Mindest-Snippet gefuellt

### Teil 2: On-Demand Body-Fetch (Neue Edge Function)

**Neue Datei:** `supabase/functions/sot-mail-fetch-body/index.ts`

Wenn der Benutzer eine E-Mail oeffnet und kein Body vorhanden ist, wird automatisch ein einzelner Body-Fetch ausgeloest:
- Frontend erkennt `body_text === null && body_html === null`
- Ruft `sot-mail-fetch-body` auf mit `messageId` und `uid`
- Die Edge Function verbindet sich zum IMAP-Server und holt NUR diese eine Nachricht
- Ergebnis wird in `mail_messages` aktualisiert und im UI angezeigt

Das ist der entscheidende Unterschied: **Statt sich auf den Batch-Sync zu verlassen, wird der Body bei Bedarf einzeln geholt.** Das ist zuverlaessiger, weil:
- Nur eine Verbindung fuer eine Nachricht
- Kein Timeout-Druck durch Batch-Verarbeitung
- Mehrere Fetch-Strategien koennen nacheinander probiert werden

### Teil 3: UI-Verbesserungen (EmailTab.tsx)

**Datei:** `src/pages/portal/office/EmailTab.tsx`

1. **Action-Buttons prominenter machen:**
   - Antworten, Allen antworten, Weiterleiten, Loeschen werden in die **Header-Zeile** des Detail-Panels verschoben (nicht mehr am unteren Rand)
   - Ikonleiste direkt neben Betreff sichtbar, ohne scrollen zu muessen

2. **Body-Loading-Indikator:**
   - Wenn Body leer ist, wird automatisch `sot-mail-fetch-body` aufgerufen
   - Ein Lade-Spinner zeigt an: "E-Mail-Inhalt wird geladen..."
   - Bei Fehler: "Inhalt konnte nicht geladen werden. Erneut versuchen?"

3. **Loeschen-Button in Header-Aktionen:**
   - Trash-Icon neben Star und Archive (bereits vorhanden, bleibt)

## Betroffene Dateien

| # | Datei | Aenderung |
|---|---|---|
| 1 | `supabase/functions/sot-mail-sync/index.ts` | Robustere Body-Fetch-Strategie, besseres Error-Handling |
| 2 | `supabase/functions/sot-mail-fetch-body/index.ts` | **NEU** -- On-Demand Body-Fetch fuer einzelne E-Mails |
| 3 | `src/pages/portal/office/EmailTab.tsx` | Action-Buttons in Header verschoben, Auto-Fetch fuer fehlenden Body |

## Technische Details

### On-Demand Body-Fetch Ablauf:

```text
Benutzer klickt E-Mail
       |
       v
body_text == null?  --NEIN--> Body anzeigen
       |
      JA
       |
       v
sot-mail-fetch-body aufrufen
       |
       v
Edge Function: IMAP connect --> SELECT mailbox --> FETCH UID
       |
       v
Versuch 1: bodyParts ['1']
Versuch 2: bodyParts ['TEXT']
Versuch 3: full: true (RFC822)
       |
       v
Body in mail_messages updaten
       |
       v
Frontend: refetch + anzeigen
```

### Braucht man eine zusaetzliche API/Software?

**Nein.** Das Problem ist nicht der IMAP-Standard, sondern die Deno-IMAP-Bibliothek. Die Loesung:
- On-Demand-Fetch (einzeln statt Batch) umgeht die meisten Bibliotheks-Bugs
- Mehrere Fetch-Strategien fangen Provider-Unterschiede ab
- Kein zusaetzlicher Provider oder externe API noetig

### Keine DB-Aenderungen

Die `mail_messages`-Tabelle hat bereits `body_text`, `body_html` und `snippet` Felder.

