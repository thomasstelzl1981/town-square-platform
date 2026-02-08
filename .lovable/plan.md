

## Automatische Kontaktanreicherung aus E-Mail und Post

### Zusammenfassung

Eine KI-gestuetzte Funktion extrahiert Kontaktdaten aus E-Mail-Signaturen und Post-Absenderinformationen. Bestehende Kontakte werden angereichert, neue mit Kategorie "Offen" angelegt. Die Funktion ist separat fuer E-Mail und Post aktivierbar.

---

### 1. UI-Anpassungen in KontakteTab.tsx

**Neues Layout der Header-Zeile:**

```text
+-----------------------------------------------------------+
|                                                           |
| [Suche...]           [Auto-Anreicherung Schalter] [+ Neu] |
|                                                           |
+-----------------------------------------------------------+
```

**Schalter-Details:**
- Zwei Toggle-Switches nebeneinander: "E-Mail" und "Post"
- Jeder Switch zeigt: Label + Mail/FileText Icon + Switch-Komponente
- Status wird im LocalStorage UND Datenbank (tenant_extraction_settings) gespeichert
- Abstand nach oben zur Headline mit `pt-2` oder `mt-2`

---

### 2. Datenbank-Erweiterung

**Neue Spalten in `tenant_extraction_settings`:**

| Spalte | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `auto_enrich_contacts_email` | BOOLEAN | false | E-Mail-Signatur-Parsing aktiv |
| `auto_enrich_contacts_post` | BOOLEAN | false | Post-Absender-Parsing aktiv |

**Neue Kategorie fuer `contacts.category`:**
- Wert: `Offen`
- Farbe: `bg-amber-100 text-amber-800`

---

### 3. Edge Function: `sot-contact-enrichment`

**Trigger:** Wird aufgerufen nach E-Mail-Sync oder Post-Verarbeitung

**Logik:**
1. Pruefe ob Auto-Enrich fuer den Kanal aktiv ist
2. Extrahiere Kontaktdaten aus Quelle:
   - **E-Mail:** `from_address`, `from_name`, `body_text` (Signatur-Parsing via KI)
   - **Post:** `sender_info` JSON aus `inbound_items`
3. Suche existierenden Kontakt per E-Mail-Adresse
4. **Falls gefunden:** Update nur NULL-Felder (keine Ueberschreibung)
5. **Falls nicht gefunden:** Neuen Kontakt mit `category = 'Offen'` anlegen

**Signatur-Parsing Strategie:**
```text
E-Mail-Signatur Beispiel:
"Mit freundlichen Gruessen
Thomas Stelzl
Mobil: +49 160 90117358
Email: thomas.stelzl@example.com"

Extrahierte Felder:
- first_name: "Thomas"
- last_name: "Stelzl"  
- phone_mobile: "+49 160 90117358"
- email: "thomas.stelzl@example.com"
```

---

### 4. Ablauf-Schema

```text
E-Mail/Post eingehend
        |
        v
+------------------+
| Kanal aktiv?     |---> Nein ---> Ende
+------------------+
        |
        Ja
        v
+------------------+
| Daten extrahieren|
| (KI fuer E-Mail) |
+------------------+
        |
        v
+------------------+
| Kontakt suchen   |
| (per E-Mail)     |
+------------------+
        |
   +----+----+
   |         |
Gefunden   Nicht gefunden
   |         |
   v         v
Update    Neu anlegen
NULL-     (category:
Felder    "Offen")
```

---

### 5. Betroffene Dateien

1. **Migration:** Neue Spalten in `tenant_extraction_settings`
2. **KontakteTab.tsx:** Header-Bereich mit Schaltern und Abstand
3. **CATEGORIES-Array:** Neue Kategorie "Offen" hinzufuegen
4. **Edge Function:** `supabase/functions/sot-contact-enrichment/index.ts`
5. **E-Mail-Sync:** Trigger nach neuer E-Mail (in `sot-mail-sync`)

---

### 6. Technische Details

**TypeScript: Schalter-State**
```text
const [emailEnrichEnabled, setEmailEnrichEnabled] = useState(false);
const [postEnrichEnabled, setPostEnrichEnabled] = useState(false);

// Query zum Laden der Settings
useQuery(['tenant-enrich-settings'], async () => {
  const { data } = await supabase
    .from('tenant_extraction_settings')
    .select('auto_enrich_contacts_email, auto_enrich_contacts_post')
    .single();
  return data;
});
```

**Neue Kategorie:**
```text
{ 
  value: 'Offen', 
  label: 'Offen', 
  className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' 
}
```

**Edge Function Payload:**
```text
{
  source: 'email' | 'post',
  tenant_id: string,
  data: {
    email?: string,
    from_name?: string,
    body_text?: string,      // nur bei E-Mail
    sender_info?: object     // nur bei Post
  }
}
```

---

### 7. KI-Modell fuer Signatur-Parsing

Verwendung von Lovable AI (google/gemini-3-flash-preview):

**Prompt-Beispiel:**
```text
Extrahiere Kontaktdaten aus dieser E-Mail-Signatur.
Antworte als JSON mit: first_name, last_name, company, 
phone_mobile, phone, street, postal_code, city.
Felder ohne Wert als null.

Signatur:
{body_text}
```

---

### 8. Sicherheit

- RLS-Policies pruefen tenant_id Zugehoerigkeit
- Nur eigene Kontakte werden angereichert/erstellt
- Kein Ueberschreiben bestehender Daten (nur NULL-Felder werden gefuellt)

