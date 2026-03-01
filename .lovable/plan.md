

# KI-Textgenerator im E-Mail-Client — Konzept

## Das Problem

Vorgefertigte Templates sind starr und werden selten genutzt. Ein separates Eingabefeld (wie beim Briefgenerator) wuerde die UI ueberladen. Die Frage ist: Wie kann KI-Texterstellung direkt in den bestehenden Compose-Flow integriert werden, ohne zusaetzliche UI-Elemente?

## Die Loesung: "Stichworte → fertige E-Mail" im bestehenden Body-Feld

Der User tippt Stichworte oder einen kurzen Satz direkt ins Body-Feld — zum Beispiel:

```
Besichtigung Musterstr 5, Samstag 14 Uhr, Herr Mueller
```

Dann klickt er im bestehenden KI-Dropdown (das bereits "Verbessern" und "Kuerzen" hat) auf eine neue Option: **"Ausformulieren"**.

Die KI macht daraus eine komplette, professionelle E-Mail:

```
Sehr geehrter Herr Mueller,

gerne moechte ich Ihnen eine Besichtigung der Immobilie
in der Musterstrasse 5 anbieten. Wuerde Ihnen Samstag
um 14:00 Uhr passen?

Ich freue mich auf Ihre Rueckmeldung.
```

**Kein neues Eingabefeld. Kein Modal. Kein Wizard.** Das Body-Feld IST das Eingabefeld — es wird nur transformiert.

## Was sich aendert

### 1. `sot-mail-ai-assist` — Neue Action `text_expand`

Neue Action neben den bestehenden (`text_improve`, `text_shorten`, `suggest_subject`, `quality_check`):

- **`text_expand`**: Nimmt Stichworte/kurzen Text, generiert daraus eine vollstaendige professionelle E-Mail
- System-Prompt erkennt Kontext (Betreff-Feld wird mitgesendet, falls gefuellt)
- Optional: Empfaenger-Name wird mitgesendet fuer korrekte Anrede

### 2. `ComposeEmailDialog.tsx` — Neuer Eintrag im KI-Dropdown

Das bestehende KI-Dropdown bekommt einen neuen Eintrag:

```
[Sparkles] KI-Assistent
  ├── Ausformulieren     ← NEU (aus Stichpunkten eine E-Mail machen)
  ├── Verbessern         (bestehend)
  ├── Kuerzen            (bestehend)
  ├── Betreff vorschlagen (bestehend)
  └── Qualitaetscheck    (bestehend)
```

Wenn der Body <30 Zeichen hat und der User "Ausformulieren" klickt, wird der Text als Stichworte interpretiert. Bei laengerem Text wird er als Entwurf behandelt und professionell ausformuliert.

### Kein weiterer UI-Aufwand

- Kein neues Eingabefeld
- Kein Modal oder Sidebar
- Nutzt den bestehenden AI-Loading-State (Spinner im Button)
- Ergebnis ersetzt den Body-Inhalt (mit Undo-Moeglichkeit ueber Ctrl+Z im Textarea)

## Dateien & Umfang

| Datei | Aenderung | Umfang |
|-------|-----------|--------|
| `supabase/functions/sot-mail-ai-assist/index.ts` | Neuer `text_expand` Case mit Prompt | ~15 Zeilen |
| `src/components/portal/office/ComposeEmailDialog.tsx` | Neuer Dropdown-Eintrag, Subject+Recipient als Kontext mitsenden | ~20 Zeilen |

**Geschaetzter Umfang**: ~35 Zeilen in 2 Dateien. Minimaler Eingriff.

## Risiko: NIEDRIG

- Bestehende AI-Actions bleiben unveraendert
- Kein neuer Endpoint, nur neuer Case in bestehender Edge Function
- Kein DB-Schema-Change
- Backwards-kompatibel (neue Action ist optional)

