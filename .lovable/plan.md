
# E-Mail-Client Stabilitaets-Optimierung

## Problem-Zusammenfassung

Der E-Mail-Client hat 3 strukturelle Schwaechen:

1. **IMAP Body-Fetch Unreliabilitaet**: 4-Tier-Strategie schlaegt bei vielen Mails fehl, weil die `deno-imap` Library nicht alle MIME-Strukturen korrekt parst
2. **Keine automatische Wiederholung**: Kein Retry-Mechanismus bei fehlgeschlagenem Body-Fetch
3. **Unnoetige Full-Refetches**: Nach Body-Laden wird die gesamte Liste neu geladen statt nur die einzelne Nachricht

## Loesungsansatz: 3-Schichten-Strategie (kostenlos)

Keine externen Vertraege noetig. Alle Verbesserungen nutzen bestehende Infrastruktur.

---

### Schicht 1: Robusterer IMAP-Sync (Edge Function)

**Datei: `supabase/functions/sot-mail-sync/index.ts`**

- **Charset-Awareness**: Die `parseMimeMessage`-Funktion ignoriert aktuell den `charset`-Parameter im Content-Type. Emails mit `charset=iso-8859-1` oder `windows-1252` werden falsch dekodiert. Fix: Charset aus Content-Type extrahieren und an `TextDecoder` weitergeben.
- **Content-Transfer-Encoding im Batch-Fetch**: Der Tier-0-Check (`BODY[1]`) prueft nicht auf Transfer-Encoding. Wenn der Body base64- oder QP-kodiert ist, wird er roh gespeichert. Fix: Transfer-Encoding aus `bodyStructure` lesen und anwenden.
- **Timeout-Protection**: IMAP-Verbindungen haben kein Timeout. Wenn der Server haengt, blockiert die Edge Function bis zum 60s-Limit. Fix: `AbortController` mit 25s-Timeout.

**Datei: `supabase/functions/sot-mail-fetch-body/index.ts`**

- Gleiche Charset- und Encoding-Fixes wie oben
- **Retry mit Backoff**: Bei Fehlschlag automatisch 1x mit 2s Pause wiederholen, bevor `success: false` zurueckgegeben wird

---

### Schicht 2: Intelligenteres Frontend-Caching (React Query)

**Datei: `src/pages/portal/office/EmailTab.tsx`**

Aktuelles Problem: Nach dem Body-Fetch wird `refetchMessages()` aufgerufen, was die gesamte Liste neu laedt und die UI flackern laesst.

**Loesung: Optimistic Cache Update**

Statt `refetchMessages()` nach Body-Fetch: Den Body direkt in den React Query Cache der Nachrichtenliste schreiben mit `queryClient.setQueryData`. Das aktualisiert nur die eine Nachricht ohne Netzwerk-Request.

```text
VORHER:
  Body fetched -> refetchMessages() -> gesamte Liste neu laden -> UI flackert

NACHHER:
  Body fetched -> queryClient.setQueryData(['email-messages', ...], updater) -> nur 1 Nachricht aktualisiert -> kein Flackern
```

Zusaetzlich: **Auto-Retry mit Exponential Backoff**
- Wenn der Body-Fetch fehlschlaegt: nach 2s automatisch nochmal versuchen
- Maximal 2 Retries, dann "Erneut versuchen"-Button zeigen
- Verhindert, dass der Nutzer manuell klicken muss

---

### Schicht 3: Hintergrund-Sync mit Polling-Fallback

**Datei: `src/pages/portal/office/EmailTab.tsx`**

Ein `useEffect`-Hook der im Hintergrund alle 60 Sekunden prueft, ob neue Nachrichten vorhanden sind (Smart Polling). Das stellt sicher, dass auch ohne manuelles "Synchronisieren" neue Mails angezeigt werden.

```text
useEffect:
  - Alle 60s: supabase.from('mail_messages').select('id').eq('account_id', ...).order('received_at', desc).limit(1)
  - Wenn neueste Message-ID != letzte bekannte ID: queryClient.invalidateQueries(['email-messages', ...])
  - Kein voller Sync, nur ein leichtgewichtiger Check
```

---

## Technische Umsetzung — Dateien

### 1. `supabase/functions/sot-mail-sync/index.ts`
- Charset-Erkennung in `parseMimeMessage()` hinzufuegen
- Transfer-Encoding aus `bodyStructure` im Tier-0-Check auslesen
- 25s Timeout per `AbortController` fuer IMAP-Verbindung
- Connection-Cleanup im `finally`-Block absichern

### 2. `supabase/functions/sot-mail-fetch-body/index.ts`
- Gleiche Charset-Fixes
- 1x automatischer Retry bei Fehlschlag (2s Pause)
- Timeout-Protection (20s)

### 3. `src/pages/portal/office/EmailTab.tsx`
- `refetchMessages()` nach Body-Fetch ersetzen durch `queryClient.setQueryData()` Optimistic Update
- Auto-Retry-Logik im `EmailDetailPanel` (max 2 Retries mit 2s/4s Backoff)
- Hintergrund-Polling alle 60s fuer neue Nachrichten (leichtgewichtiger DB-Check)
- `fetchTriggered`-State verbessern: Reset bei Email-Wechsel UND bei Retry

### 4. `supabase/functions/sot-mail-send/index.ts`
- Keine strukturellen Aenderungen noetig — SMTP-Versand via Nodemailer funktioniert
- Kleine Verbesserung: Nach erfolgreichem Senden den React Query Cache direkt aktualisieren statt `refetchMessages()`

---

## Kosten

- **0 EUR** — Alle Aenderungen nutzen bestehende Infrastruktur
- IMAP/SMTP laeuft ueber die Mail-Server des Nutzers (keine Drittanbieter-Kosten)
- Edge Functions sind im Lovable Cloud Kontingent enthalten
- Kein externer E-Mail-API-Vertrag noetig

## Erwartetes Ergebnis

- **Body-Anzeige**: ~90% der Mails sollten direkt beim Sync den Body haben (vs. aktuell ~60-70%)
- **Fallback**: Die restlichen ~10% werden zuverlaessig per On-Demand-Fetch mit Auto-Retry geladen
- **Kein Flackern**: Optimistic Cache Updates statt Full-Refetch
- **Automatische Updates**: Neue Mails erscheinen innerhalb von 60s ohne manuelles Sync
