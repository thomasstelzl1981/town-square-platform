
# Briefgenerator: Daten korrekt aus Stammdaten/Kontakten durchreichen

## Problem

Drei Datenleitungen sind aktuell unterbrochen:
1. **Empfaenger-Adresse** wird nicht aus der `contacts`-Tabelle geladen (Felder `street`, `postal_code`, `city` existieren, werden aber nicht abgefragt)
2. **Absender-Logo + Briefkopf** wird nicht aus dem Profil geladen (`letterhead_logo_url`, `letterhead_company_line` etc. werden ignoriert)
3. **Privater Absender** hat keine Adresse (Profil-Adressfelder werden nicht in die Sender-Option uebernommen)

## Aenderungen

### 1. `BriefTab.tsx` — Kontakt-Query erweitern

Die Kontakt-Query (aktuell Zeile 162) wird um Adressfelder erweitert:

```
contacts: id, first_name, last_name, email, company, salutation, street, postal_code, city
```

Das `Contact`-Interface bekommt die neuen Felder. Die Empfaenger-Adresse wird dann als mehrzeiliger String an `LetterPreview.recipientAddress` uebergeben:

```
Musterstrasse 5
80000 Muenchen
```

### 2. `BriefTab.tsx` — Profil-Query erweitern

Die Profil-Query (aktuell Zeile 98) wird um Briefkopf- und Adressfelder erweitert:

```
profiles: id, display_name, first_name, last_name, active_tenant_id,
          street, house_number, postal_code, city,
          letterhead_logo_url, letterhead_company_line
```

### 3. `BriefTab.tsx` — Privater Absender mit Adresse

Die "Privatperson"-SenderOption (Zeile 126) bekommt die Profil-Adresse:

```text
address: "Musterstr. 1, 12345 Hamburg"  (statt leer)
```

### 4. `BriefTab.tsx` — Logo-Prop an LetterPreview durchreichen

Die `LetterPreview`-Komponente (Zeile 493) bekommt ein neues Prop:

```
logoUrl={profile?.letterhead_logo_url || undefined}
```

### 5. `BriefTab.tsx` — Empfaenger-Adresse an LetterPreview durchreichen

```
recipientAddress={selectedContact ? [
  selectedContact.street,
  [selectedContact.postal_code, selectedContact.city].filter(Boolean).join(' ')
].filter(Boolean).join('\n') : undefined}
```

### 6. Edge Function — Anrede-Logik verbessern

Der Prompt in `sot-letter-generate` bekommt die `salutation` des Kontakts (Herr/Frau), damit die Anrede korrekt generiert wird ("Sehr geehrter Herr Mueller" vs. "Sehr geehrte Frau Mueller").

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/office/BriefTab.tsx` | Query-Erweiterungen, Props-Durchreichung, Interface-Update |
| `supabase/functions/sot-letter-generate/index.ts` | Salutation-Feld im Prompt |

## Kein DB-/Schema-Aenderung noetig

Alle Felder (`street`, `postal_code`, `city`, `salutation` auf `contacts`; `letterhead_logo_url` etc. auf `profiles`) existieren bereits in der Datenbank.
