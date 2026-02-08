
## Kurzdiagnose (warum DNS/Resend nicht schuld ist)

Deine DNS-Änderungen (für re:send/Domain-Verification) haben keinen Einfluss darauf, ob IMAP beim Abrufen den E-Mail-Body liefert. Dass neue Testmails ankommen, bestätigt außerdem, dass IMAP grundsätzlich funktioniert.

Der Grund, warum du überall „Kein Inhalt“ siehst, ist ein Bug in unserer IMAP-Sync-Implementierung:

- Wir rufen `client.fetch(...)` mit Optionen auf, die diese IMAP-Library gar nicht kennt (`body: true`)  
- und wir lesen anschließend Felder aus, die es im Rückgabe-Objekt nicht gibt (`msg.body`, `msg.bodyParts`)

Die Library liefert Inhalte nur über:
- `full: true` (dann kommt `msg.raw` + `msg.parts.TEXT`)
- oder `bodyParts: [...]` (dann kommt `msg.parts[...]`)

Dadurch werden aktuell nie `body_text`, `body_html`, `snippet` befüllt → UI zeigt immer „Kein Inhalt“.

Zusatz-Bug (nicht dein Hauptproblem, aber sichtbar):  
Die Library entfernt Backslashes aus Flags (`Seen` statt `\\Seen`). Unser Code prüft aktuell `\\Seen`, daher bleiben Mails praktisch immer „ungelesen“.

---

## Ziel

1) Beim Sync werden Inhalte zuverlässig geholt und in `mail_messages.body_text/body_html/snippet` gespeichert.  
2) Beim Klick auf eine Mail ist der Inhalt lesbar.  
3) Flags (gelesen/markiert) werden korrekt gemappt.

---

## Umsetzungsschritte (konkret)

### 1) IMAP Fetch korrekt machen (Edge Function `sot-mail-sync`)
**Datei:** `supabase/functions/sot-mail-sync/index.ts`

**Änderungen:**
- Ersetze den aktuellen Fetch-Block:

  - Entferne: `body: true` (existiert nicht)
  - Nutze stattdessen: `full: true` (und optional `internalDate: true`, `size: true`)

**Beispiel-Strategie:**
- `client.fetch(range, { envelope:true, flags:true, uid:true, internalDate:true, bodyStructure:true, full:true })`
- Danach für jeden `msg`:
  - Raw-Message aus `msg.raw` (Uint8Array) auslesen
  - MIME sauber parsen (siehe Schritt 2)
  - `body_text`, `body_html`, `snippet` upserten

**Warum das sicher wirkt:**  
Die Library baut dann `BODY.PEEK[]` in den IMAP-FETCH ein. Ohne das kommt schlicht kein Inhalt zurück.

---

### 2) MIME/Multipart zuverlässig parsen (statt „string splits“)
Nur `raw` in Text zu verwandeln reicht bei Multipart/Quoted-Printable/Base64 nicht.

**Vorschlag:**
- In der Edge Function `npm:mailparser` verwenden (`simpleParser`), um aus `raw` sauber `text` und `html` zu extrahieren.
- Danach:
  - `body_text = parsed.text ?? null`
  - `body_html = parsed.html ?? null` (falls string)
  - `snippet` aus `body_text` oder aus HTML (Tags strippen)

**Schutz gegen übergroße Inhalte (empfohlen):**
- Body vor dem Speichern begrenzen (z.B. 200–500 KB pro Feld), um DB nicht aufzublähen.
- Wenn zu groß: `snippet` speichern + `body_*` leer lassen und später „on demand“ nachladen (optional, siehe Schritt 4 optional).

---

### 3) Flags korrekt mappen (Seen/Flagged)
**Datei:** `supabase/functions/sot-mail-sync/index.ts`

Aktuell:
- `flags.includes('\\Seen')` funktioniert nicht, weil die Library `Seen` liefert.

**Fix:**
- Prüfe auf beide Varianten oder normalisiere:
  - `const normFlags = (msg.flags ?? []).map(f => f.replace(/^\\/, ''))`
  - `isRead = normFlags.includes('Seen')`
  - `isStarred = normFlags.includes('Flagged')`

---

### 4) (Optional, falls Performance/Timeouts später auffallen) Lazy-Load pro Mail
Wenn sich herausstellt, dass `full:true` bei vielen Mails/Attachments zu langsam wird, implementieren wir zusätzlich eine zweite Backend-Funktion:

- `sot-mail-fetch-body`:
  - Input: `accountId`, `uid`
  - macht `fetch('UID', { byUid:true, bodyParts:['TEXT'] oder full:true })`
  - parsed und updatet nur diese eine Mail in `mail_messages`

Frontend:
- Wenn der User eine Mail anklickt und `body_*` leer ist → „Inhalt laden…“ und Trigger dieser Funktion.

Für deinen aktuellen Zustand (wenige Mails) ist Schritt 1–3 aber der schnellste und sauberste Fix.

---

## Verifikation (wie wir prüfen, dass es wirklich geht)

1) Sync im UI auslösen (oder automatisch beim Laden).
2) Datenbankcheck (intern): `body_text_len/body_html_len` muss > 0 sein für mindestens die Testmails.
3) UI: Mail anklicken → Inhalt sichtbar (Text oder HTML).
4) UI: Read/Unread-State plausibel (nach Mark-Read später; falls wir das UI-Flagging schon drin haben).

---

## Risiken / Edge Cases

- Multipart + Attachments: `mailparser` löst das zuverlässig.
- HTML-only Mails: `body_html` wird gesetzt; UI rendert HTML.
- Sehr große Mails: können Timeouts verursachen → dann Schritt 4 (Lazy Load) aktivieren.

---

## Optional nächste Verbesserungen (nach dem Fix)
- Button „Inhalt nachladen“ direkt in der Detailansicht, wenn Body fehlt
- Attachments anzeigen & downloaden (aus BodyStructure/Parts)
- „Als gelesen markieren“ beim Öffnen (IMAP STORE + DB Update)
