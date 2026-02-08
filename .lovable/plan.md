
## Erweiterung: E-Mail-Signatur, Briefkopf-Daten und Spracherkennung

### Zusammenfassung

Ich werde drei Erweiterungen implementieren:
1. **Mouse-Over-Verhalten im Posteingang** beheben
2. **Spracherkennung im E-Mail-Composer** hinzufuegen (nutzt bereits vorhandenen Armstrong Voice Hook)
3. **Zwei neue Kacheln in Stammdaten/Profil** fuer Signatur und Briefkopf-Daten

---

### 1. Mouse-Over-Verhalten im Posteingang (EmailTab)

**Problem:** Die E-Mail-Listen-Buttons haben `hover:bg-muted/50`, was moeglicherweise inkonsistent wirkt.

**Loesung:**
- Hover-Stil anpassen fuer konsistentere UX
- Uebergang glaetten mit `transition-colors duration-150`
- Zeile 567-592 in `EmailTab.tsx` anpassen

---

### 2. Spracherkennung im E-Mail-Composer

**Vorhandene Infrastruktur:**
- `VoiceButton` Komponente existiert bereits (`src/components/armstrong/VoiceButton.tsx`)
- `useArmstrongVoice` Hook verfuegbar (`src/hooks/useArmstrongVoice.ts`)
- WebSocket-Verbindung zu `sot-armstrong-voice` Edge Function

**Aenderungen:**

**Datei: `src/components/portal/office/ComposeEmailDialog.tsx`**
- Import `VoiceButton` und `useArmstrongVoice`
- Mikrofon-Button neben Betreff und Nachricht-Feld hinzufuegen
- Transkript automatisch in aktives Feld einfuegen
- States verwalten fuer welches Feld gerade diktiert wird

**Konzept:**
```text
Betreff-Feld          [Mic-Button]
Nachricht-Feld        [Mic-Button]
```

Beim Klick auf Mikrofon:
1. Spracheingabe starten
2. Transkript in entsprechendes Feld einfuegen
3. Button zeigt Listening-Status

---

### 3. Neue Kacheln in Stammdaten/Profil

**Datei: `src/pages/portal/stammdaten/ProfilTab.tsx`**

**Kachel 5: E-Mail-Signatur**
- Textarea fuer eigene Signatur
- Button "Vorschlag generieren" basierend auf Profildaten
- Vorschlag beinhaltet: Name, Telefonnummern, E-Mail
- Signatur wird in `profiles.email_signature` gespeichert (neues Feld)

**Kachel 6: Briefkopf-Daten**
- Felder fuer Briefgenerator-spezifische Daten:
  - Firmenname (optional, falls gewerblich)
  - Logo-Upload (Bild-URL)
  - Zusaetzliche Zeile (z.B. Rechtsform, Registernummer)
  - Bankverbindung (IBAN, BIC, Bankname)
  - Webseite
- Daten werden in `profiles.letterhead_*` Feldern gespeichert

**Neue Datenbankfelder in `profiles`:**
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_signature TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS letterhead_logo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS letterhead_company_line TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS letterhead_extra_line TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS letterhead_bank_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS letterhead_iban TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS letterhead_bic TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS letterhead_website TEXT;
```

---

### 4. Signatur-Vorschlag generieren

**Logik im Frontend:**
- Basierend auf vorhandenen Profildaten automatisch eine Signatur erstellen:
```
Mit freundlichen Gruessen

{Vorname} {Nachname}
Tel: {phone_mobile} | {phone_landline}
E-Mail: {email}
```

**Oder mit AI (optional Lovable AI):**
- Edge Function aufrufen, die eine professionelle Signatur generiert

---

### 5. Integration in bestehende Features

**E-Mail-Versand (`sot-mail-send`):**
- Beim Senden pruefen, ob Signatur in Profil vorhanden
- Signatur automatisch an `bodyText` und `bodyHtml` anhaengen

**Briefgenerator (`BriefTab`):**
- Briefkopf-Daten aus Profil laden
- Bei Post-Versand/PDF-Generierung Logo und Bankdaten einfuegen

---

### Technische Umsetzungsschritte

1. **Datenbank-Migration:**
   - Neue Spalten zu `profiles` hinzufuegen

2. **ProfilTab.tsx erweitern:**
   - State um neue Felder ergaenzen
   - Zwei neue Card-Komponenten hinzufuegen
   - Update-Mutation erweitern
   - Signatur-Vorschlag-Button implementieren

3. **ComposeEmailDialog.tsx erweitern:**
   - VoiceButton integrieren
   - Transkript-Handling implementieren
   - Signatur automatisch anhaengen (optional mit Checkbox)

4. **EmailTab.tsx anpassen:**
   - Hover-Styling optimieren

5. **sot-mail-send Edge Function erweitern:**
   - Signatur aus Profil laden und anhaengen

---

### UI-Vorschau der neuen Kacheln

```text
+------------------------------------------+
|  [Pen-Icon] E-Mail-Signatur              |
|  Ihre persoenliche E-Mail-Signatur       |
+------------------------------------------+
|  +------------------------------------+  |
|  | Mit freundlichen Gruessen          |  |
|  |                                    |  |
|  | Max Mustermann                     |  |
|  | Tel: +49 170 1234567               |  |
|  | E-Mail: max@example.de             |  |
|  +------------------------------------+  |
|                                          |
|  [Sparkles] Vorschlag generieren         |
+------------------------------------------+

+------------------------------------------+
|  [FileText-Icon] Briefkopf-Daten         |
|  Daten fuer den KI-Briefgenerator        |
+------------------------------------------+
|  Logo:           [Upload-Bereich]        |
|  Firmenzusatz:   [_______________]       |
|  Webseite:       [_______________]       |
|  Separator ---------------------------------
|  Bankname:       [_______________]       |
|  IBAN:           [_______________]       |
|  BIC:            [_______________]       |
+------------------------------------------+
```

---

### Risiken und Abhaengigkeiten

- **Armstrong Voice WebSocket:** Muss verfuegbar sein fuer Spracherkennung
- **Signatur-Anhaengung:** Kann optional sein (User muss aktivieren koennen)
- **Logo-Upload:** Nutzt bestehenden Storage-Bucket `tenant-documents`
