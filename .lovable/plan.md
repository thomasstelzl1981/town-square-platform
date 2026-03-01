

# PR 2 — Threading + Professionelle Suche: Detailplan & Risikoanalyse

---

## 1. Ist-Zustand (Analyse-Ergebnis)

### Datenbank — thread_id

| Provider | thread_id Quelle | Format | Beispiel |
|----------|-----------------|--------|----------|
| IMAP | `envelope.messageId` (RFC Message-ID Header) | `<uuid@domain>` | `<AM0PR07MB6305BC27...@eurprd07.prod.outlook.com>` |
| Google | `detail.threadId` (Gmail-interner Thread-Identifier) | Alphanumerischer String | `19abc3f4e5d6` |
| Microsoft | `msg.conversationId` (Graph API) | GUID-artiger String | `AAQkAGI2...` |

**Datenlage (Produktion):**
- 25 Nachrichten gesamt, 22 mit thread_id, 3 ohne
- **0 Threads mit >1 Nachricht** — alle 22 thread_ids sind einzigartig
- Bestehender Index: `idx_mail_messages_thread` (btree auf thread_id)

### Kritisches Problem: IMAP thread_id = Message-ID, NICHT Thread-ID

Zeile 676 in `sot-mail-sync`:
```
thread_id: envelope.messageId || null
```

`envelope.messageId` ist die **einzigartige Message-ID** jeder einzelnen E-Mail (RFC 5322 `Message-ID`), **nicht** eine Thread-Gruppierung. Jede Nachricht bekommt dadurch eine eigene "thread_id". Das ist der Grund, warum alle 22 thread_ids einzigartig sind.

**Gmail** nutzt korrekt `detail.threadId` (native Thread-Gruppierung).
**Microsoft** nutzt korrekt `msg.conversationId` (native Thread-Gruppierung).
**IMAP** hat **keine native Thread-ID** — muss per Heuristik gebaut werden.

### Suche — Aktueller Zustand

- `searchQuery` State existiert (Zeile 512), Input-Feld vorhanden (Zeile 1005-1011)
- **searchQuery wird nirgends zum Filtern verwendet** — das Eingabefeld ist funktionslos
- Alle Nachrichten werden mit `limit(50)` geladen, keine Pagination
- Kein serverseitiger Suchendpoint vorhanden

---

## 2. Geplante Aenderungen

### 2.1 IMAP Threading-Fix (Backend — sot-mail-sync)

**Problem**: `envelope.messageId` ist keine Thread-ID.

**Loesung — Subject-Normalisierung + In-Reply-To Heuristik**:

IMAP liefert per Envelope:
- `messageId` — einzigartige ID dieser Nachricht
- `inReplyTo` — Message-ID der Nachricht, auf die geantwortet wird (sofern vorhanden)
- `subject` — Betreff

**Algorithmus**:
1. Normalisiere Subject: entferne `Re:`, `Fwd:`, `AW:`, `WG:` Prefixe, trimme
2. Generiere `thread_id` als deterministischen Hash aus `account_id + normalized_subject`
3. Nachrichten mit gleichem normalisierten Betreff im selben Account → gleiche thread_id

**Warum nicht In-Reply-To allein?** Weil In-Reply-To nur bei Antworten gesetzt wird, nicht bei der Ursprungsmail. Subject-Heuristik deckt alle Faelle ab (Gmail und Outlook nutzen intern dasselbe Prinzip).

**Format**: `imap_thread_<sha256(account_id + normalized_subject)>` — deterministisch, idempotent bei Re-Sync

### 2.2 Frontend — Konversationsansicht

**Aenderung in EmailTab.tsx:**

1. Nachrichten nach `thread_id` gruppieren (Fallback: eigene Nachricht = eigener Thread)
2. Message-Liste zeigt **Thread-Header** statt Einzelnachrichten:
   - Absender der letzten Nachricht
   - Thread-Subject
   - Badge: Anzahl Nachrichten im Thread (wenn >1)
   - Unread-Status: Fett wenn mindestens eine Nachricht ungelesen
3. Detail-Panel: Bei Thread-Klick → alle Nachrichten chronologisch, mit Collapse/Expand

**Gruppierungslogik** (client-seitig, da max 50 Nachrichten geladen):
```typescript
const threads = useMemo(() => {
  const grouped = new Map<string, typeof messages>();
  for (const msg of messages) {
    const key = msg.thread_id || msg.id; // Fallback: eigene ID
    const existing = grouped.get(key) || [];
    existing.push(msg);
    grouped.set(key, existing);
  }
  return Array.from(grouped.values())
    .map(msgs => ({
      threadId: msgs[0].thread_id || msgs[0].id,
      messages: msgs.sort((a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime()),
      latestMessage: msgs[msgs.length - 1],
      unreadCount: msgs.filter(m => !m.is_read).length,
    }))
    .sort((a, b) => new Date(b.latestMessage.received_at).getTime() - new Date(a.latestMessage.received_at).getTime());
}, [messages]);
```

### 2.3 Serverseitige Suche — Neue Edge Function

**Neue Edge Function: `sot-mail-search`**

**Parameter**:
```typescript
interface SearchRequest {
  accountIds: string[];       // Filter auf Konten (RLS-geprüft)
  q?: string;                 // Freitext: subject, from_address, from_name, snippet
  folder?: string;            // INBOX, SENT, etc.
  unreadOnly?: boolean;
  starredOnly?: boolean;
  hasAttachments?: boolean;
  fromDate?: string;          // ISO date
  toDate?: string;            // ISO date
  limit?: number;             // Default 50, max 100
  cursor?: string;            // received_at ISO timestamp für Pagination
}
```

**Implementierung**: SQL-Query mit dynamischen WHERE-Bedingungen.
Freitext-Suche ueber `subject ILIKE '%q%' OR from_address ILIKE '%q%' OR from_name ILIKE '%q%' OR snippet ILIKE '%q%'`.

**Kein Volltextindex noetig** bei <10.000 Nachrichten pro User. ILIKE genuegt.

### 2.4 Frontend — Suchleiste + Filterbar

**EmailTab.tsx:**

1. Such-Input aktivieren (aktuell funktionslos) — Debounce 300ms
2. Bei Eingabe: Edge-Function `sot-mail-search` aufrufen statt lokale Query
3. Filter-Chips unterhalb der Suchleiste:
   - Ungelesen | Mit Anhang | Markiert | Zeitraum
4. Pagination: "Weitere laden" Button am Ende der Liste (Cursor-basiert)

### 2.5 Neuer DB-Index fuer Suche

```sql
CREATE INDEX idx_mail_messages_search 
  ON mail_messages (account_id, folder, received_at DESC)
  WHERE folder IS NOT NULL;
```

Bestehender `idx_mail_messages_account_folder` deckt bereits `(account_id, folder)` ab — genuegt fuer ILIKE-Queries mit Folder-Filter. Kein zusaetzlicher Index zwingend noetig.

---

## 3. Risikoanalyse

### HOCH — Thread-ID Migration (IMAP)

| Risiko | Beschreibung | Mitigation |
|--------|-------------|------------|
| Bestehende thread_ids werden ueberschrieben | 22 IMAP-Nachrichten haben `envelope.messageId` als thread_id. Beim naechsten Sync wuerden sie neue Hash-basierte thread_ids bekommen | **Migration-Strategie**: Beim naechsten Sync werden alle IMAP-Nachrichten mit neuer thread_id geupdated. Da Upsert auf `(account_id, message_id)`, kein Datenverlust. Alter thread_id-Wert war ohnehin falsch/nutzlos |
| Subject-Heuristik fehlerhaft | "Rechnung" und "Re: Rechnung" werden korrekt gruppiert, aber zwei verschiedene Rechnungs-Mails vom selben Absender ebenfalls | **Akzeptierbar**: Gmail hat dasselbe "Problem" by design. Thread-Splitting ist kein Feature fuer PR 2 |
| Cross-Account Thread-Merging | Wenn User IMAP + Gmail hat: Dieselbe Konversation hat in IMAP eine Hash-ID und in Gmail eine native threadId. Diese werden NICHT gemergt | **Bewusste Entscheidung**: Cross-Account Thread-Merging ist Scope PR 4+. Threads sind account-scoped |

### HOCH — Regression bei bestehendem E-Mail-Fluss

| Risiko | Beschreibung | Mitigation |
|--------|-------------|------------|
| selectedEmail Mapping bricht | Aktuell: `selectedEmail = message.id`. Bei Thread-View: selectedThread? | **Loesung**: Zwei States: `selectedThreadId` + `selectedMessageId`. Thread-Klick setzt Thread, Detail zeigt alle Messages. Single-Message-Klick innerhalb Thread setzt scrollTarget |
| Delete/Archive/Star auf Thread vs. Message | Aktuell: Operationen auf Einzel-Message-ID | **Loesung**: Thread-Level-Actions (Delete Thread = alle Messages loeschen) + Message-Level-Actions im expandierten Thread |
| Body-Fetch bei Thread-Expand | Wenn Thread 5 Nachrichten hat, muessen ggf. 5 Bodies geladen werden | **Loesung**: Lazy-Load — nur die sichtbar expandierte Nachricht fetched Body on-demand. Collapsed Messages zeigen nur Snippet |

### MITTEL — Serverseitige Suche

| Risiko | Beschreibung | Mitigation |
|--------|-------------|------------|
| ILIKE Performance bei vielen Mails | `ILIKE '%text%'` kann nicht Index-gestuetzt laufen | Bei <10.000 Mails pro User: <50ms. Bei >100k: pg_trgm Index noetig → Scope PR 4+ |
| RLS-Bypass in Edge Function | `sot-mail-search` nutzt Service-Role-Key | **Muss**: Explizite WHERE `account_id IN (SELECT id FROM mail_accounts WHERE user_id = $auth_user_id)` als Guard |
| Suchresultate vs. Thread-Gruppierung | Suche findet 3 von 5 Thread-Messages — Thread-Ansicht verwirrend | **Loesung**: Suchresultate als flache Liste anzeigen (kein Threading), mit "Thread anzeigen" Button pro Treffer |

### MITTEL — UX-Konsistenz

| Risiko | Beschreibung | Mitigation |
|--------|-------------|------------|
| Thread-Ansicht vs. Flat-Ansicht Toggle | User erwartet ggf. beide Modi | **PR 2 Scope**: Nur Thread-Ansicht (Default). Flat-Mode bleibt als Fallback bei Suche |
| Pagination-UX | "Mehr laden" vs. Infinite Scroll | **Loesung**: Expliziter "Weitere laden" Button — einfacher, kein Scroll-Listener noetig |
| Leere Threads bei Folder-Wechsel | Thread hat Messages in INBOX + SENT. Im Folder-View erscheint nur die INBOX-Haelfte | **Bewusste Entscheidung**: Threads werden per Folder gefiltert angezeigt. Cross-Folder-Thread-View = Scope PR 4+ |

### NIEDRIG

| Risiko | Beschreibung | Mitigation |
|--------|-------------|------------|
| Google threadId Format-Stabilitaet | Gmail threadId ist stabil und aendert sich nicht | Kein Risiko — native API-Garantie |
| Microsoft conversationId Stabilitaet | Graph API conversationId ist stabil | Kein Risiko — native API-Garantie |
| Filter-State Persistenz | Filter-Auswahl geht bei Tab-Wechsel verloren | URL-Params oder lokaler State — akzeptabel fuer PR 2 |

### KEIN RISIKO

- **OAuth-Flows**: Nicht angefasst
- **sot-mail-send**: Keine Aenderung (sendet Einzel-Messages, kein Thread-Kontext noetig)
- **RLS-Policies**: Bestehende Policies bleiben korrekt
- **sot-mail-fetch-body**: Keine Aenderung (arbeitet auf message.id, account-agnostisch via DB-Join)
- **ComposeEmailDialog**: Keine Aenderung in PR 2
- **Login/Routing**: Kein Kontakt

---

## 4. Dateien & Umfang

| Datei | Aenderung | Risiko |
|-------|-----------|--------|
| `supabase/functions/sot-mail-sync/index.ts` | IMAP: thread_id Heuristik (Subject-Hash statt messageId) | HOCH |
| `supabase/functions/sot-mail-search/index.ts` | **NEU** — Serverseitige Suche mit Filtern + Pagination | MITTEL |
| `src/pages/portal/office/EmailTab.tsx` | Thread-Gruppierung, Thread-Detail-View, Such-Integration, Filter-Chips, Pagination | HOCH |
| DB-Migration | Optional: Trigram-Index fuer Volltextsuche (nur bei >10k Messages noetig) | NIEDRIG |

**Geschaetzter Umfang**: ~300 Zeilen geaendert/hinzugefuegt in 2-3 Dateien + 1 neue Edge Function (~150 Zeilen).

---

## 5. Scope-Grenzen PR 2

| In Scope | Nicht in Scope |
|----------|----------------|
| IMAP thread_id Fix (Subject-Hash) | Cross-Account Thread-Merging |
| Client-seitige Thread-Gruppierung | Volltextindex (pg_trgm) |
| Serverseitige Suche (ILIKE) | Thread-Splitting bei gleichem Subject |
| Filter: unread, starred, attachments, date | Saved Searches / Search History |
| Cursor-basierte Pagination | Infinite Scroll |
| Thread-Detail mit Collapse/Expand | Cross-Folder Thread-View |
| Flat-List bei Suchresultaten | Signatur/Impressum (PR 3) |

---

## 6. Empfohlene Reihenfolge

1. **Schritt 1**: `sot-mail-sync` IMAP thread_id Fix (Backend, isoliert testbar)
2. **Schritt 2**: `sot-mail-search` Edge Function (Backend, isoliert testbar)
3. **Schritt 3**: EmailTab Thread-Gruppierung + Thread-Detail (Frontend)
4. **Schritt 4**: Such-Integration + Filter-Chips (Frontend)
5. **Schritt 5**: Pagination "Weitere laden" (Frontend)

Schritte 1+2 koennen parallel implementiert werden. Schritte 3-5 bauen aufeinander auf.

---

## 7. Testplan

1. **IMAP Sync nach Fix**: Bestehende 22 Nachrichten bekommen neue thread_ids. Nachrichten mit gleichem normalisierten Subject gruppieren sich
2. **Gmail Sync**: Thread-IDs bleiben unveraendert (native threadId)
3. **Thread-Ansicht**: Threads mit >1 Nachricht zeigen Badge, expandieren korrekt
4. **Single-Message Thread**: Verhaelt sich wie bisher (kein visueller Unterschied)
5. **Suche**: Freitext findet Nachrichten ueber Subject, Absender, Snippet
6. **Filter**: Ungelesen-Filter zeigt nur ungelesene Nachrichten/Threads
7. **Pagination**: "Weitere laden" laedt naechste 50 Nachrichten korrekt
8. **Regression**: Reply/Forward/Delete/Archive/Star funktionieren wie bisher
9. **Body-Fetch**: On-demand Fetch im Thread-Detail funktioniert pro Nachricht
10. **Unified Inbox + Threading**: Threads werden per Account gruppiert (kein Cross-Account-Merge)

