

# IMAP-Parser Fix: RFC-2047-Decoder + Body-Fetch-Fallback

## Problem-Zusammenfassung

Datenbankanalyse zeigt: 11 von 14 E-Mails haben keinen Body-Content. Alle Facebook- und IONOS-Mails sind betroffen. Subject-Zeilen sind teilweise roh encoded (`=?UTF-8?B?...?=`).

**Ursache 1**: `full: true` im IMAP-Fetch liefert `msg.raw` leer zurueck bei vielen Servern.
**Ursache 2**: Kein RFC-2047-Decoder fuer Subject/From-Name Felder.

## Aenderungen in einer Datei

Alle Fixes betreffen `supabase/functions/sot-mail-sync/index.ts`.

### Fix 1: RFC-2047-Decoder (Zeile ~141, neue Funktion)

Neue Funktion `decodeRfc2047(input: string): string`:
- Erkennt `=?charset?B?base64text?=` (Base64-Encoding)
- Erkennt `=?charset?Q?quotedprintable?=` (Quoted-Printable)
- Behandelt mehrteilige Chunks (mehrere `=?...?=` hintereinander)
- Wird angewendet auf:
  - `envelope.subject` (Zeile 460)
  - `fromName` (Zeile 392)

### Fix 2: Body-Fetch-Fallback (Zeile ~366-443)

Wenn `msg.raw` leer ist, zweiter Fetch-Versuch mit `bodyParts`:
1. Erst normaler Fetch mit `full: true` (wie bisher)
2. Wenn `msg.raw` leer: Zweiter Fetch desselben UIDs mit `bodyParts: ['TEXT']`
3. Das holt `BODY[TEXT]` — den reinen Nachrichteninhalt ohne Header
4. Fallback-Parsing mit dem gleichen `parseMimeMessage()` angewendet
5. Logging: Genau protokollieren welcher Pfad genommen wurde

```text
Fetch-Ablauf:
  1. client.fetch(range, { envelope, flags, uid, full: true })
  2. Fuer jede msg wo msg.raw leer ist:
     → client.fetch(uid, { bodyParts: ['TEXT'] }, true)  // true = UID-basiert
     → msg.bodyParts['TEXT'] → parseMimeMessage()
  3. Falls auch bodyParts leer:
     → client.fetch(uid, { bodyParts: ['1'] }, true)
     → Direkt als text/plain behandeln
```

### Fix 3: Verbessertes Logging (durchgaengig)

- Log welcher Fetch-Pfad (raw vs bodyParts TEXT vs bodyParts 1) erfolgreich war
- Log die Groesse der geholten Daten
- Log wenn ALLE Pfade fehlschlagen (mit UID und Subject fuer Debugging)

### Fix 4: Re-Sync-Kompatibilitaet

Bestehende Mails werden beim naechsten Sync automatisch aktualisiert, da `onConflict: 'account_id,message_id'` ein UPSERT macht. Subject und Body werden dabei mit den korrigierten Werten ueberschrieben.

## Technische Details

### RFC-2047-Decoder Implementierung

```text
Input:  "=?UTF-8?B?SGFzdCBkdSBkaWNo?= =?UTF-8?B?IGdlcmFkZQ==?="
Output: "Hast du dich gerade"

Regex: /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g
  - Group 1: charset (UTF-8)
  - Group 2: encoding (B = Base64, Q = Quoted-Printable)
  - Group 3: encoded text
```

### Body-Fetch Strategie

Die `@workingdevshero/deno-imap` Bibliothek unterstuetzt:
- `full: true` → RFC822 vollstaendig (funktioniert nicht bei allen Servern)
- `bodyParts: ['TEXT']` → BODY[TEXT] (nur Body ohne Header)
- `bodyParts: ['1']` → BODY[1] (erster MIME-Part, meist text/plain)

Der Fallback nutzt diese drei Stufen sequentiell.

## Erwartetes Ergebnis nach Deploy + Re-Sync

| Vorher | Nachher |
|--------|---------|
| 11 Mails ohne Body | Body sollte bei allen vorhanden sein |
| Encoded Subjects (`=?UTF-8?B?...?=`) | Lesbare deutsche Umlaute |
| Encoded From-Names | Korrekt dekodierte Absendernamen |

