

# Zustandsanalyse E-Mail-Client + PR 3 Risikoanalyse & Umsetzungsplan

---

## Teil 1: PR 1 Audit — Multi-Account + Unified Inbox

### Umsetzungsstatus: SAUBER UMGESETZT

| Feature | Status | Details |
|---------|--------|---------|
| `selectedAccountId` State | OK | Zeile 775: `useState<string \| 'all'>('__init__')` mit Init-Guard (Z. 839-843) |
| AccountSwitcher Dropdown | OK | Zeilen 1226-1253: Select mit "Alle Konten" + Provider-Icons |
| Query-Logik unified | OK | Zeilen 854-856: `queryAccountIds` nutzt `.in()` bei "all" |
| selectedEmail Reset | OK | Zeile 848: `setSelectedThreadId(null)` bei Account-Wechsel |
| Sync bei "Alle Konten" | OK | Zeilen 1021-1031: Sequentiell alle Accounts syncen |
| ComposeEmailDialog accounts | OK | Zeilen 1206-1218: `accounts` Array + `defaultAccountId` |
| From-Dropdown im Compose | OK | Zeilen 346-373: Select bei >1 Account, read-only bei 1 |
| Account-Badge in Liste | TEILWEISE | Badges in ThreadDetailPanel vorhanden, aber in der Thread-Liste fehlen sie im "Alle Konten"-Modus |
| Polling unified | OK | Zeilen 941-963: `.in('account_id', queryAccountIds)` |

### Offene Punkte PR 1
1. **Account-Badge in Message-Liste fehlt**: Im "Alle Konten"-Modus wird in der Thread-Liste (mittlere Spalte) nicht angezeigt, von welchem Konto die Nachricht stammt. Nur im Detail-Panel gibt es Account-Info.
2. **Kein Fehlerfall-UI bei Account-Wechsel**: Wenn ein Account `sync_status: 'error'` hat, wird das im Dropdown nicht visuell markiert.

**Bewertung**: Kernfunktionalitaet ist stabil. Keine Regression.

---

## Teil 2: PR 2 Audit — Threading + Suche

### Umsetzungsstatus: SAUBER UMGESETZT

| Feature | Status | Details |
|---------|--------|---------|
| IMAP thread_id Fix | OK | `sot-mail-sync` Z. 390-413: `normalizeSubject()` + SHA-256 Hash → `imap_thread_<hash>` |
| Gmail/Microsoft threadId | OK | Unveraendert (native IDs) |
| Thread-Gruppierung | OK | Z. 902-937: `useMemo` gruppiert nach `thread_id`, sortiert nach `latestMessage.received_at` |
| ThreadDetailPanel | OK | Z. 340-458: Multi-Message-View mit Collapsible, Lazy-Load Body |
| SingleEmailDetail | OK | Z. 589-757: Fallback fuer Einzel-Nachrichten-Threads |
| sot-mail-search | OK | Neue Edge Function mit RLS-Guard, ILIKE, Cursor-Pagination |
| Search-Input debounced | OK | Z. 784-787: 300ms Debounce |
| Filter-Chips | OK | Z. 777-781: `filterUnread`, `filterStarred`, `filterAttachments` |
| Search-Mode Flat-Liste | OK | Z. 903-911: Bei Suche kein Threading, jede Nachricht einzeln |
| Body-Fetch Lazy-Load | OK | Z. 491-496: `useEffect` in `ThreadMessage` laedt Body bei Expand |

### Offene Punkte PR 2
1. **Pagination "Weitere laden" fehlt**: Die Planung sah einen "Weitere laden"-Button mit Cursor vor. Aktuell wird nur `limit(50)` verwendet, ohne Moeglichkeit, aeltere Nachrichten nachzuladen.
2. **Suche zeigt keinen "Thread anzeigen"-Button**: Search-Results sind flat, aber es gibt keinen Link zurueck zur Thread-Ansicht eines Treffers.

**Bewertung**: Kernfunktionalitaet stabil. Threading und Suche funktionieren. Pagination ist ein bekannter Scope-Rueckstand.

---

## Teil 3: PR 3 — Signature/Impressum-Engine + Templates + Armstrong Assist

### Ist-Zustand der relevanten Datenquellen

**Profil-Felder (profiles Tabelle)**:

| Feld | Typ | Aktueller Wert (Thomas Stelzl) |
|------|-----|-------------------------------|
| `email_signature` | text | "Mit freundlichen Gruessen\n\nThomas Stelzl\nMobil: +49 16090117358..." |
| `letterhead_company_line` | text | (leer) |
| `letterhead_extra_line` | text | (leer) |
| `letterhead_website` | text | (leer) |
| `letterhead_bank_name` | text | (leer) |
| `letterhead_iban` | text | (leer) |
| `letterhead_bic` | text | (leer) |

**Bestehende Signatur-Nutzung**: `ComposeEmailDialog` laedt `email_signature` bei neuen E-Mails (Z. 102-132) und haengt sie als `\n\n--\n{signature}` an.

**Bestehende Template-Infrastruktur**:
- Tabelle `admin_email_templates` existiert (Zone 1) mit 5 Templates: Onboarding, Follow-Up, Sales, Partner, Finance
- Tabelle `acq_email_templates` existiert (Akquise-Modul)
- Beide sind Zone 1 / Admin-Templates, NICHT fuer den User-Email-Client (Zone 2) gedacht

**Bestehende AI-Assist**:
- `sot-mail-ai-assist` Edge Function mit 3 Actions: `text_improve`, `text_shorten`, `suggest_subject`
- Nutzt Lovable AI Gateway (google/gemini-2.5-flash)

**Impressum-Quellen**:
- Zone 3 Websites haben `Zone3LegalPage` mit DB-gestuetztem Impressum (per Brand)
- Compliance-Docs werden aus DB geladen (`website_imprint_{brand}`)
- Fuer E-Mail-Footer: Es gibt KEINE dedizierte Impressum-Datenquelle fuer den E-Mail-Client

---

### Geplante Aenderungen PR 3

#### 3.1 Signature/Impressum Toggle im Compose Dialog

**ComposeEmailDialog.tsx** — Checkboxen + Live-Preview:

```
[x] Signatur anhaengen (aus Profil)
[x] Rechtlicher Footer anhaengen (Impressum)
```

- Bei "Signatur": bestehende `email_signature` aus Profil (bereits geladen)
- Bei "Impressum": Neuer Block aus `letterhead_*` Feldern + Tenant-Info
- Live-Preview-Bereich zeigt finalen HTML-Body vor dem Senden
- Beides wird beim Senden serverseitig zusammengebaut

#### 3.2 BuildOutboundEmail — Serverseitige Body-Assembly

**Neues Pattern in `sot-mail-send`** (kein neuer Endpoint):

Wenn `includeSignature: true` oder `includeFooter: true` im Request:
1. Laedt `profiles.email_signature` + `letterhead_*` Felder
2. Laedt Tenant-Impressum aus `compliance_documents` (Key: `email_footer_{tenant}`)
3. Baut deterministisch zusammen:
   ```
   [User Body]
   ---
   [Signatur]
   ---
   [Rechtlicher Footer: Firma, Adresse, HRB, USt-IdNr, Website]
   ```
4. HTML-Version mit professionellem Styling

#### 3.3 Templates fuer den User-Email-Client

**Neue DB-Tabelle: `mail_compose_templates`**

| Feld | Typ |
|------|-----|
| id | uuid PK |
| tenant_id | uuid |
| user_id | uuid (nullable — tenant-weite Templates) |
| name | text |
| category | text (vertrieb, follow_up, termin, allgemein) |
| subject_template | text |
| body_template | text |
| placeholders | jsonb |
| is_active | boolean |
| created_at | timestamptz |

Mitgelieferte Default-Templates (via Demo Seed):
- Vertrieb: Erstansprache
- Follow-up: Nachfass
- Terminbestaetigung
- Allgemein: Informationsanfrage

**Platzhalter-System**: `{{first_name}}`, `{{last_name}}`, `{{company}}`, `{{agent_name}}`, `{{agent_phone}}`, `{{agent_email}}`

**UI**: Template-Dropdown im Compose Dialog neben dem "KI"-Button. Auswahl fuellt Subject + Body, Platzhalter werden client-seitig ersetzt (aus Profil + To-Kontakt).

#### 3.4 Armstrong Assist — Qualitaetscheck vor dem Senden

**Neue Action in `sot-mail-ai-assist`**: `quality_check`

Prompt:
```
Pruefe die folgende E-Mail auf:
1. Ton (professionell, hoeflich?)
2. Vollstaendigkeit (Gruss, Betreff-Bezug, Call-to-Action?)
3. Fehlende Felder (Name, Kontaktdaten?)
4. Offensichtliche Fehler (Tippfehler, fehlende Anrede?)
Antworte als kurze Checkliste mit Emojis (✅/⚠️/❌).
```

**UI**: Neuer Button "Qualitaetscheck" im Compose Dialog (neben KI-Dropdown). Zeigt Ergebnis als Inline-Feedback unterhalb des Body-Textfelds.

---

### Risikoanalyse PR 3

#### HOCH

| Risiko | Beschreibung | Mitigation |
|--------|-------------|------------|
| Body-Assembly Duplikation | Signatur wird aktuell client-seitig angehaengt (ComposeEmailDialog Z. 119-121). Wenn serverseitig nochmal angehaengt wird → doppelte Signatur | **Loesung**: Client haengt Signatur NICHT mehr inline an. Stattdessen sendet er Flags `includeSignature` + `includeFooter` an `sot-mail-send`. Server baut Body zusammen. BREAKING CHANGE in ComposeEmailDialog |
| Impressum-Daten fehlen | `letterhead_*` Felder sind bei allen Usern leer. Ohne Daten kein Footer | **Loesung**: UI-Hinweis "Bitte fuellen Sie Ihre Briefkopf-Daten in Stammdaten > Profil aus". Leere Felder = Footer wird weggelassen |
| Reply/Forward Body-Corruption | Bei Reply wird `initialBody` mit quoted Text uebergeben. Wenn Server nochmal Signatur anhaengt, wird die Signatur VOR dem Quote eingefuegt | **Loesung**: Server erkennt `isReply: true` Flag und fuegt Signatur zwischen neuen Text und Quote ein |

#### MITTEL

| Risiko | Beschreibung | Mitigation |
|--------|-------------|------------|
| Template-Tabelle RLS | Neue Tabelle braucht RLS fuer tenant_id-Isolation | Standard-RLS: `tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())` |
| Platzhalter nicht aufgeloest | User sendet Template mit `{{first_name}}` ohne Kontakt-Daten | **Loesung**: Unaufgeloeste Platzhalter werden als Warnung angezeigt, aber nicht blockiert |
| sot-mail-send Aenderung | Bestehender Send-Contract wird erweitert (neue Felder). Alte Clients ohne neue Felder muessen weiter funktionieren | **Loesung**: Neue Felder sind optional mit Default `false`. Bestehende Aufrufe bleiben kompatibel |

#### NIEDRIG

| Risiko | Beschreibung | Mitigation |
|--------|-------------|------------|
| AI Quality-Check Latenz | Gemini-Flash-Call ~1-2s | Akzeptabel, Button zeigt Spinner |
| Template-Kategorien zu wenig | Nur 4 Kategorien initial | Erweiterbar, kein Risiko |
| HTML-Signatur vs. Plain-Text | `email_signature` ist Plain-Text, E-Mail wird als HTML gesendet | **Loesung**: Server wrappet Signatur in `<pre>` mit professionellem Styling |

#### KEIN RISIKO

- **OAuth-Flows**: Nicht angefasst
- **sot-mail-sync**: Nicht angefasst
- **sot-mail-search**: Nicht angefasst
- **Threading**: Nicht angefasst
- **RLS bestehender Tabellen**: Nicht angefasst

---

### Dateien & Umfang

| Datei | Aenderung | Risiko |
|-------|-----------|--------|
| `src/components/portal/office/ComposeEmailDialog.tsx` | Signatur-Toggle, Impressum-Toggle, Template-Dropdown, Quality-Check-Button, Live-Preview | HOCH |
| `supabase/functions/sot-mail-send/index.ts` | Body-Assembly mit Signature + Footer (neue optionale Felder) | HOCH |
| `supabase/functions/sot-mail-ai-assist/index.ts` | Neue Action `quality_check` | NIEDRIG |
| DB-Migration | Neue Tabelle `mail_compose_templates` + RLS + Seed-Daten | MITTEL |
| Keine neuen Edge Functions | — | — |

**Geschaetzter Umfang**: ~250 Zeilen geaendert in 3 Dateien + 1 DB-Migration.

---

### Empfohlene Reihenfolge

1. **Schritt 1**: DB-Migration `mail_compose_templates` mit RLS + Default-Templates
2. **Schritt 2**: `sot-mail-send` um Body-Assembly erweitern (Signature + Footer-Felder laden, HTML zusammenbauen)
3. **Schritt 3**: `sot-mail-ai-assist` um `quality_check` Action erweitern
4. **Schritt 4**: `ComposeEmailDialog` um Toggles, Template-Picker, Quality-Check und Preview erweitern
5. **Schritt 5**: Client-seitige Signatur-Logik entfernen (Server uebernimmt)

Schritte 1-3 sind unabhaengig voneinander. Schritt 4+5 muessen zusammen deployed werden.

---

### Testplan

1. **Neue E-Mail ohne Signatur/Footer**: Body wird wie bisher gesendet (Backwards-Compatibility)
2. **Neue E-Mail mit Signatur**: Signatur aus Profil wird korrekt angehaengt
3. **Neue E-Mail mit Impressum-Footer**: Letterhead-Daten erscheinen im Footer
4. **Reply mit Signatur**: Signatur steht zwischen neuem Text und Quote
5. **Template waehlen**: Subject + Body werden korrekt gefuellt, Platzhalter ersetzt
6. **Template mit fehlendem Platzhalter**: Warnung erscheint, Senden moeglich
7. **Quality-Check**: KI-Feedback erscheint als Checkliste
8. **Leere Letterhead-Felder**: Kein Footer, stattdessen Hinweis auf Profil-Vervollstaendigung
9. **Regression**: Bestehender Reply/Forward/Compose-Flow funktioniert unveraendert

