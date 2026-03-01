

## Analyse — 3 Probleme im E-Mail-Composer

### 1. Fehlende E-Mail-Signatur (Impressum aus Stammdaten)

**Ist-Zustand:** `ComposeEmailDialog.tsx` fuegt keinen Signatur-Footer an. Die `profiles`-Tabelle hat ein `email_signature`-Feld, das in Stammdaten → Profil gepflegt wird — aber der Compose-Dialog liest es nie aus.

**Fix:** Beim Oeffnen des Compose-Dialogs die Signatur aus `profiles.email_signature` laden und als initialen Body-Footer einfuegen:
```
[Nachricht]

--
Max Mustermann
Tel: +49 170 1234567
...
```

**Dateien:**
- `src/components/portal/office/ComposeEmailDialog.tsx` — Signatur aus DB laden (`profiles.email_signature`), als `\n\n--\n${signature}` ans Body-Ende anhaengen (nur bei neuer E-Mail, nicht bei Reply wo der Body schon befuellt ist)

### 2. Betreffzeile zeigt Empfaenger-E-Mail

**Ist-Zustand:** Das `<Input id="email-subject">` hat kein `autoComplete="off"`. Der Browser erkennt das Wort "subject" und fuellt per Autofill die gespeicherte E-Mail-Adresse ein.

**Fix:** `autoComplete="off"` auf das Subject-Input setzen. Keine Backend-Aenderung noetig.

**Datei:**
- `src/components/portal/office/ComposeEmailDialog.tsx` — `autoComplete="off"` auf Subject-Input (Zeile 251)

### 3. KI-Funktionen im E-Mail-Composer (ohne eigene Kachel)

**Konzept:** Einen kleinen "KI-Assistent"-Button in die Toolbar des Compose-Dialogs einbauen. Funktionen:
- **Text verbessern**: Markierten/gesamten Text stilistisch ueberarbeiten (Tonfall: professionell/freundlich)
- **Text kuerzen**: Auf das Wesentliche reduzieren
- **Betreff vorschlagen**: Aus dem Body-Text einen passenden Betreff generieren

Technisch: Ein Dropdown-Button (z.B. `Sparkles`-Icon) oberhalb der Textarea mit 3 Optionen. Ruft eine Edge Function `sot-mail-ai-assist` auf, die den Text per Lovable AI (gemini-2.5-flash) verarbeitet.

**Dateien:**
- `supabase/functions/sot-mail-ai-assist/index.ts` — Neue Edge Function (text_improve, text_shorten, suggest_subject)
- `src/components/portal/office/ComposeEmailDialog.tsx` — KI-Dropdown-Button ueber der Textarea

### 4. Autofill fuer Kontaktfelder

**Ist-Zustand:** Das "An"-Feld ist ein einfaches `<Input>` ohne Kontakt-Vorschlaege. Es gibt eine `ContactBookDialog` in MOD-12, aber keine Autofill-Suche im Compose-Dialog.

**Fix:** Das "An"-Feld mit einer Typeahead-Suche erweitern, die beim Tippen aus der `contacts`-Tabelle passende Kontakte vorschlaegt (Name + E-Mail). Kein neues UI-Widget — eine simple Dropdown-Liste unter dem Input.

**Datei:**
- `src/components/portal/office/ComposeEmailDialog.tsx` — Typeahead auf dem "An"-Feld mit DB-Suche gegen `contacts` (email, first_name, last_name)

### Freeze-Check
- MOD-02: **unfrozen** — OK
- Edge Functions: nicht eingefroren — OK

