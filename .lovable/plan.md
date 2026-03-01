

# Umfassender E-Mail-Client Audit — Zustandsbericht + Verbesserungsvorschlaege

---

## Gesamtbewertung: STABIL, FUNKTIONAL, einige Luecken

Der E-Mail-Client ist ein professionelles System mit Multi-Account-Support, Threading, Suche, KI-Assist, serverseitiger Body-Assembly und Pagination. Die Architektur ist schluessig und die Komponenten greifen korrekt ineinander. Nachfolgend der Detail-Audit.

---

## 1. Architektur-Uebersicht — Was greift wie ineinander

```text
┌────────────────────────────────────────────────────────────────┐
│                        EmailTab.tsx                            │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Folders   │  │ Thread-Liste │  │ ThreadDetailPanel /       │ │
│  │ + Account │  │ + Search     │  │ SingleEmailDetail         │ │
│  │ Switcher  │  │ + Pagination │  │ + Reply/Fwd/Archive       │ │
│  └──────────┘  └──────────────┘  └──────────────────────────┘ │
│                                                                │
│  ComposeEmailDialog ──────────────────────────────────────────│
│  │ Template Picker │ KI-Dropdown │ Sig/Footer │ Quality Check │ │
└────────────────────────────────────────────────────────────────┘
         │                │                │
         ▼                ▼                ▼
  sot-mail-send    sot-mail-ai-assist   sot-mail-sync
  (Body Assembly)  (5 Actions)          (IMAP/Gmail/MS)
         │                                 │
         ▼                                 ▼
  mail_messages (DB)              sot-mail-fetch-body
                                  (On-Demand Body)
```

**Bewertung**: Die Architektur ist sauber getrennt. Jede Edge Function hat eine klare Verantwortung. Keine zirkulaeren Abhaengigkeiten.

---

## 2. Komponentenweise Analyse

### 2.1 Multi-Account + Unified Inbox — OK

| Aspekt | Status | Detail |
|--------|--------|--------|
| Account-Auswahl | ✅ | Dropdown mit "Alle Konten" + Provider-Icons |
| Init-Guard | ✅ | `'__init__'` → wird auf ersten Account gesetzt |
| Query-Isolation | ✅ | `queryAccountIds` korrekt per `.in()` |
| Account-Badge in Liste | ✅ | Zeile 1534-1541: Badge im "Alle Konten"-Modus |
| Compose From-Selection | ✅ | Bei >1 Account: Dropdown, sonst read-only |

### 2.2 Threading — OK

| Aspekt | Status | Detail |
|--------|--------|--------|
| IMAP thread_id | ✅ | SHA-256 aus `accountId + normalizedSubject` |
| Gmail threadId | ✅ | Native `threadId` aus API |
| Microsoft threadId | ✅ | Native `conversationId` |
| Thread-Gruppierung | ✅ | `useMemo` mit Map-basierter Gruppierung |
| Multi-Message-Ansicht | ✅ | `ThreadDetailPanel` mit Collapsible pro Nachricht |
| Body Lazy-Load | ✅ | `ThreadMessage` laedt Body bei Expand |

### 2.3 Suche + Filter — OK

| Aspekt | Status | Detail |
|--------|--------|--------|
| Debounce | ✅ | 300ms |
| Filter-Chips | ✅ | Ungelesen, Markiert, Anhaenge |
| Server-Side Search | ✅ | `sot-mail-search` mit ILIKE + Account-Validation |
| Flat-Liste im Suchmodus | ✅ | Kein Threading bei Suche |
| "Thread anzeigen" Button | ✅ | Vorhanden, inklusive Nachladen aelterer Threads |

### 2.4 Pagination — OK mit Anmerkung

| Aspekt | Status | Detail |
|--------|--------|--------|
| Normal-Mode | ✅ | Cursor-basiert mit `lt('received_at')` |
| Search-Mode | ✅ | Nutzt `nextCursor` von `sot-mail-search` |
| "Weitere laden" Button | ✅ | Am Ende der Liste |
| hasMoreMessages Logik | ⚠️ | Normal-Mode nutzt `% 50 === 0` als Heuristik — kann False Positive liefern wenn exakt 50 Messages existieren |

### 2.5 Compose + Send — OK

| Aspekt | Status | Detail |
|--------|--------|--------|
| Signatur-Toggle | ✅ | Client-Flag, Server baut zusammen |
| Footer-Toggle | ✅ | Letterhead-Daten aus Profil |
| Server-Assembly | ✅ | `assembleBody()` in `sot-mail-send` |
| Reply-Quote-Handling | ✅ | Signatur wird vor Quote eingefuegt |
| Template-Picker | ✅ | Dropdown nach Kategorien |
| Platzhalter-Warnung | ✅ | Unaufgeloeste Platzhalter werden angezeigt |
| Contact-Typeahead | ✅ | 250ms Debounce, max 8 Vorschlaege |
| Voice-Dictation | ✅ | Subject + Body per Mikrofon |

### 2.6 KI-Assist — OK

| Aspekt | Status | Detail |
|--------|--------|--------|
| text_improve | ✅ | Funktional |
| text_shorten | ✅ | Funktional |
| suggest_subject | ✅ | Funktional |
| quality_check | ✅ | Checkliste mit Emojis |
| text_expand | ✅ | Stichworte → fertige E-Mail |
| Fehlerbehandlung | ✅ | Rate-Limit (429) + Credits (402) behandelt |

### 2.7 Sync — OK

| Aspekt | Status | Detail |
|--------|--------|--------|
| IMAP 4-Tier Body-Fetch | ✅ | BODY[1] → BODY[TEXT] → Nested Parts → RFC822 |
| Gmail API Sync | ✅ | Mit Auto-Refresh bei 401 |
| Microsoft Graph Sync | ✅ | Implementiert (ohne Token-Refresh) |
| Timeout-Schutz | ✅ | 25s AbortController fuer IMAP |
| MIME-Parsing | ✅ | Charset-aware (QP, Base64, RFC 2047) |
| Background-Polling | ✅ | 60s Intervall, Lightweight ID-Check |

### 2.8 Sicherheit — OK mit Anmerkungen

| Aspekt | Status | Detail |
|--------|--------|--------|
| mail_accounts RLS | ✅ | `user_id = auth.uid()` + Tenant-Isolation |
| mail_messages RLS | ✅ | Via `account_id IN (SELECT... user_id = auth.uid())` |
| mail_compose_templates RLS | ✅ | Tenant-Isolation via `memberships` |
| Edge Functions Auth | ✅ | Alle pruefen `Authorization` Header |
| Token-Exposure | ⚠️ | `mail_accounts` Query in EmailTab Z. 836-838 nutzt `.select('*')` — Token-Felder (`access_token`, `refresh_token`, `credentials_vault_key`) werden zum Client gesendet |
| sot-mail-send Auth | ✅ | `getUser()` + Account-Owner-Check |
| sot-mail-search Auth | ✅ | Account-Owner-Validation vor Query |

---

## 3. Gefundene Probleme

### 3.1 HOCH: Token-Exposure im Client

**Problem**: `EmailTab.tsx` Zeile 837 macht `select('*')` auf `mail_accounts`. Das schickt `access_token`, `refresh_token` und `credentials_vault_key` (base64-encoded Passwort!) zum Browser.

**RLS schuetzt nicht davor** — der User hat SELECT-Recht auf seine eigenen Accounts, und die Tokens sind Teil der Zeile.

**Fix**: `.select('*')` aendern zu expliziter Feldliste: `id, provider, email_address, display_name, sync_status, last_sync_at, sync_error, sync_mail, sync_calendar, sync_contacts`.

### 3.2 MITTEL: hasMoreMessages False-Positive

**Problem**: Zeile 992: `messages.length === 50` wird true, auch wenn es exakt 50 Messages gibt und keine weiteren existieren. Der "Weitere laden"-Button erscheint, und ein Klick liefert 0 Ergebnisse.

**Fix**: Nach dem Load-More: wenn `data.length === 0`, `hasMoreMessages` auf false setzen (wird bereits indirekt behandelt: `data.length < 50` → `setMessageCursor(null)`). Problem ist, dass `hasMoreMessages` nicht `messageCursor` nutzt, sondern die Modulo-Heuristik. Die Logik sollte auf `messageCursor !== null` umgestellt werden, analog zum Search-Mode.

### 3.3 MITTEL: handleShowThread Race Condition

**Problem**: `handleShowThread` (Z. 1291) nutzt `setTimeout(500ms)` und liest dann `queryClient.getQueryData()`. Die 500ms sind eine Heuristik — wenn die React-Query-Refetch laenger dauert, wird der Thread nicht gefunden und unnoetig nachgeladen. Wenn sie kuerzer ist, laeuft alles doppelt.

**Fix**: Statt `setTimeout` sollte auf das `refetch()` Promise gewartet werden, oder ein `onSuccess`-Callback der Query genutzt werden.

### 3.4 NIEDRIG: Google Sent-Email ohne thread_id

**Problem**: `sot-mail-send` Zeile 131 speichert gesendete E-Mails mit `thread_id: undefined` (kein Feld gesetzt). Die gesendete Nachricht wird nicht dem Thread zugeordnet, sodass im "Gesendet"-Ordner kein Threading stattfindet.

**Fix**: Bei Google-Antworten: `thread_id` aus der Gmail-API-Response (`data.threadId`) extrahieren und in die DB schreiben. Bei IMAP: `generateImapThreadId()` analog zur Sync-Logik nutzen.

### 3.5 NIEDRIG: mail_compose_templates INSERT-Policy zu offen

**Problem**: Die INSERT-Policy hat kein `qual` — jeder authentifizierte User kann Templates mit beliebiger `tenant_id` erstellen.

**Fix**: WITH CHECK hinzufuegen: `tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid())`.

### 3.6 NIEDRIG: Microsoft Token-Refresh fehlt

**Problem**: `sendMicrosoftMail` (Z. 426-468) prueft `account.access_token`, hat aber keinen Refresh-Mechanismus bei 401. `syncMicrosoftMail` (Z. 893-960) wirft einfach einen Fehler bei 401. Im Gegensatz dazu hat Gmail einen vollstaendigen Refresh-Flow.

### 3.7 KOSMETISCH: Doppelter ConnectionDialog

**Problem**: EmailTab rendert sowohl `AccountIntegrationDialog` (Z. 1332) als auch den inline `ConnectionDialog` (definiert ab Z. 196). Der inline `ConnectionDialog` wird an keiner Stelle mehr geoeffnet — `showConnectionDialog` oeffnet `AccountIntegrationDialog`. Der gesamte `ConnectionDialog`-Code (Z. 196-337) ist Dead Code.

---

## 4. Empfohlene Verbesserungen (nach Prioritaet)

### Prioritaet 1 — Sicherheit

1. **Token-Exposure fixen**: `select('*')` auf `mail_accounts` durch explizite Feldliste ersetzen. ~1 Zeile.

2. **INSERT-Policy fixen**: `mail_compose_templates` INSERT WITH CHECK um tenant_id-Pruefung ergaenzen. ~1 SQL-Statement.

### Prioritaet 2 — Stabilitaet

3. **Pagination-Logik bereinigen**: Normal-Mode `hasMoreMessages` auf cursor-basiert umstellen (wie Search-Mode). ~5 Zeilen.

4. **handleShowThread robuster machen**: `setTimeout` durch Query-Observer oder `refetch().then()` ersetzen. ~10 Zeilen.

5. **Sent-Thread-Zuordnung**: Gesendete Nachrichten mit korrektem `thread_id` speichern. ~15 Zeilen in `sot-mail-send`.

### Prioritaet 3 — Aufraumen

6. **Dead Code entfernen**: Inline `ConnectionDialog` + `ImapConnectionForm` aus EmailTab entfernen (~200 Zeilen). Die Funktionalitaet lebt bereits in `AccountIntegrationDialog`.

### Prioritaet 4 — Nice-to-Have

7. **Unread-Count in Sidebar**: Folder-Badges (Z. 1410-1412) zeigen keinen Live-Count — `folders` ist eine statische Liste ohne dynamische Zaehler.

8. **Mark-as-Read bei Anzeige**: Wenn ein ungelesener Thread angeklickt wird, sollte `is_read` automatisch auf `true` gesetzt werden.

9. **Attachment-Download/-Anzeige**: `has_attachments` wird gespeichert, aber es gibt keine UI zum Anzeigen oder Herunterladen von Anhaengen.

---

## Zusammenfassung

| Bereich | Note | Kommentar |
|---------|------|-----------|
| Architektur | A | Saubere Trennung, klare Verantwortlichkeiten |
| Multi-Account | A | Vollstaendig, inkl. Unified Inbox |
| Threading | A- | Funktional; Sent-Zuordnung fehlt |
| Suche + Pagination | B+ | Funktional; Pagination-Heuristik suboptimal |
| Compose + KI | A | 5 KI-Actions, Voice, Templates, Signature |
| Sicherheit | B | Token-Exposure ist das dringendste Problem |
| Code-Hygiene | B- | ~200 Zeilen Dead Code, einige Race Conditions |

**Gesamtnote: B+ / Gut** — Funktional vollstaendig, alle Kernfeatures greifen ineinander. Die Token-Exposure sollte als erstes gefixt werden.

