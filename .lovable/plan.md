

# PR 1 — Multi-Account + Unified Inbox: Detailplan & Risikoanalyse

---

## 1. Ist-Zustand (Analyse-Ergebnis)

### Datenbank
| Tabelle | Relevante Spalten | Indizes |
|---------|-------------------|---------|
| `mail_accounts` | id, tenant_id, user_id, provider, email_address, sync_status, ... | PK, user_id via RLS |
| `mail_messages` | id, account_id, message_id, thread_id, folder, subject, from_address, is_read, received_at | `idx_mail_messages_account_folder`, `idx_mail_messages_thread`, `idx_mail_messages_received` |

### Aktuelle Konten in Produktion
| E-Mail | Provider | User | Messages |
|--------|----------|------|----------|
| thomas.stelzl@systemofatown.com | IMAP | Thomas Stelzl | 23 (22 mit thread_id) |
| otto.stelzl@zl-wohnbau.de | Google | Otto Stelzl (anderer Tenant) | 2 |

### Code-Zustand
- **EmailTab.tsx** (1123 Zeilen): `accounts[0]` hardcoded als `activeAccount` (Zeile 568)
- **ComposeEmailDialog.tsx** (527 Zeilen): Empfaengt `accountId` + `accountEmail` als Props — kein Account-Switcher
- **AccountIntegrationDialog.tsx** (696 Zeilen): Kann bereits mehrere Konten verwalten (Add/Delete/Sync-Toggles)
- **sot-mail-sync**: Akzeptiert `accountId` — bereits Multi-Account-faehig
- **sot-mail-send**: Akzeptiert `accountId` — bereits Multi-Account-faehig
- **RLS**: `mail_messages` gefiltert ueber `account_id IN (SELECT id FROM mail_accounts WHERE user_id = auth.uid())` — korrekt fuer Multi-Account

### Fazit: Backend ist bereits Multi-Account-faehig. Nur das Frontend muss angepasst werden.

---

## 2. Geplante Aenderungen

### 2.1 EmailTab.tsx — Account-Switcher + Unified Inbox

**Problem**: Zeile 568 `const activeAccount = accounts[0]` ignoriert alle weiteren Konten.

**Loesung**:
- Neuer State: `selectedAccountId: string | 'all'` (Default: erstes Konto)
- Account-Dropdown im Sidebar-Header (oberhalb des "Neue E-Mail"-Buttons)
- Option "Alle Konten" als erster Eintrag im Dropdown
- Provider-Badge (Google/IMAP-Icon) neben jedem Konto-Eintrag

**Query-Logik bei "Alle Konten"**:
```
// Statt .eq('account_id', activeAccount.id):
selectedAccountId === 'all'
  ? .in('account_id', accounts.map(a => a.id))
  : .eq('account_id', selectedAccountId)
```

**Auswirkungen auf bestehende Features**:
- `syncMutation`: Bei "all" → sync alle Konten sequentiell oder nur aktives
- `selectedEmail` Reset bei Account-Wechsel
- Polling-Interval: Bei "all" → Query ueber alle account_ids
- Delete/Archive/Star-Mutations: Bleiben unveraendert (arbeiten auf message.id)

### 2.2 Message-Liste — Account-Badge bei Unified Inbox

- Wenn `selectedAccountId === 'all'`: Zeige kleine Badge mit Account-Email oder Provider-Icon neben jeder Nachricht
- Nur sichtbar im "Alle Konten"-Modus, nicht bei einzelnem Account

### 2.3 ComposeEmailDialog — From-Account waehlbar

**Problem**: `accountId` und `accountEmail` sind feste Props.

**Loesung**:
- Neue Prop: `accounts: EmailAccount[]` (statt einzelner accountId/accountEmail)
- Neue Prop: `defaultAccountId: string`
- Im Dialog: "Von"-Feld wird zu einem Select-Dropdown statt read-only Text
- Sende-Request nutzt den ausgewaehlten Account

### 2.4 EmailDetailPanel — Account-Info

- Bei Unified Inbox: Zeige welches Konto die Mail empfangen hat (kleines Badge im Header)

---

## 3. Risikoanalyse

### HOCH — Regression bei bestehendem Konto
| Risiko | Beschreibung | Mitigation |
|--------|-------------|------------|
| selectedEmail Stale-Ref | Bei Account-Wechsel zeigt Detail-Panel eine Mail vom alten Account | Reset `selectedEmail = null` bei Account-Wechsel |
| Body-Fetch mit falschem Account | `sot-mail-fetch-body` braucht Account-Kontext fuer IMAP-Credentials | Pruefe: Fetch-Body nutzt `email.id` + `email.message_id` → account kommt aus DB-Join, kein Client-seitiger Account noetig |
| Sync-Button bei "Alle Konten" | Was passiert bei Klick? Alle synchen = mehrere Edge-Function-Calls parallel | Loesung: Bei "all" → sync alle Konten nacheinander mit Toast-Fortschritt |

### MITTEL — Query-Performance
| Risiko | Beschreibung | Mitigation |
|--------|-------------|------------|
| `.in('account_id', [...])` Performance | Bei vielen Konten + vielen Mails | Bestehender Index `idx_mail_messages_account_folder` genuegt. Limit 50 bleibt. |
| Polling bei "Alle Konten" | Aktuelle Polling-Query checkt nur einen Account | Polling-Query anpassen auf `.in(...)` analog zur Haupt-Query |

### NIEDRIG — UI-Konsistenz
| Risiko | Beschreibung | Mitigation |
|--------|-------------|------------|
| Folder-Counts pro Account | "Eingang (5)" bezieht sich auf welches Konto? | Vorerst keine Counts bei "Alle Konten", nur bei Einzel-Account |
| ComposeEmailDialog State | Account-Wechsel waehrend Compose offen | Default-Account beim Oeffnen setzen, danach frei waehlbar |

### KEIN RISIKO
- **OAuth-Flows**: Werden nicht angefasst (nur Frontend-Wiring)
- **sot-mail-send / sot-mail-sync**: Keine Aenderungen noetig (akzeptieren bereits accountId)
- **RLS-Policies**: Bereits Multi-Account-sicher (user_id-basiert)
- **Login/Routing**: Kein Kontakt mit Auth-System
- **Zone 1 / Admin-Email**: Komplett separater Code-Pfad

---

## 4. Dateien & Umfang

| Datei | Aenderung | Risiko |
|-------|-----------|--------|
| `src/pages/portal/office/EmailTab.tsx` | Account-State, Dropdown, Query-Logik, Polling, Sync-Button | MITTEL |
| `src/components/portal/office/ComposeEmailDialog.tsx` | accounts-Prop, From-Dropdown | NIEDRIG |
| Keine neuen Dateien | — | — |
| Keine DB-Migration | — | — |
| Keine Edge-Function-Aenderung | — | — |

**Geschaetzter Umfang**: ~150 Zeilen geaendert/hinzugefuegt in 2 Dateien.

---

## 5. Was wir NICHT anfassen (Scope-Grenzen PR 1)

- Kein Threading (PR 2)
- Keine serverseitige Suche (PR 2)
- Keine Signature/Impressum-Engine (PR 3)
- Keine neuen Edge Functions
- Keine DB-Schema-Aenderungen
- Kein neuer Index noetig (bestehende Indizes reichen)

---

## 6. Testplan

1. Einzelnes Konto: Alles funktioniert wie bisher (Regression-Check)
2. Account-Wechsel: Mails wechseln, selectedEmail wird zurueckgesetzt
3. "Alle Konten": Mails beider Konten gemischt, Account-Badge sichtbar
4. Compose im "Alle Konten"-Modus: From-Account waehlbar, korrekte accountId beim Senden
5. Reply/Forward: Verwendet das Konto der Original-Mail
6. Sync bei "Alle Konten": Alle verbundenen Konten werden synchronisiert
7. Body-Fetch: Funktioniert bei beiden Providern (IMAP + Google)

