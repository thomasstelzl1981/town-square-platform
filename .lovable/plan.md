

# Einheitliche Kontaktstruktur: Master-Schema durchziehen

## Problem

Drei Tabellen speichern Kontaktdaten, aber mit unterschiedlichen Strukturen:

| Feld | contacts (Master/Kontaktbuch) | soat_search_results (Recherche) | contact_staging (Staging) |
|------|------|------|------|
| salutation (Anrede) | Vorhanden | FEHLT | FEHLT |
| first_name (Vorname) | Vorhanden | FEHLT (nur contact_person_name) | Vorhanden |
| last_name (Nachname) | Vorhanden | FEHLT | Vorhanden |
| category (Kategorie) | Vorhanden | Vorhanden | FEHLT |

Wenn die Recherche nur "Max Mueller" als kombinierten Namen speichert, kann man spaeter keine korrekte Anrede generieren ("Sehr geehrter Herr Mueller").

## Loesung

### 1. DB-Migration: Fehlende Spalten ergaenzen

**soat_search_results** erhaelt:
- `salutation` (text, nullable) -- Herr/Frau/Divers/Firma
- `first_name` (text, nullable)
- `last_name` (text, nullable)

`contact_person_name` bleibt als Fallback bestehen (wird nicht geloescht).

**contact_staging** erhaelt:
- `salutation` (text, nullable)
- `category` (text, nullable)

### 2. Einheitliches Kontakt-Schema (Referenz)

Das Master-Schema aus dem Kontaktbuch (`contacts`-Tabelle) definiert die Pflichtfelder fuer alle kontaktfuehrenden Tabellen:

```text
KONTAKT-KERNFELDER (Master-Schema):
────────────────────────────────────
 Anrede        salutation       Herr / Frau / Divers / Firma
 Vorname       first_name       Pflichtfeld
 Nachname      last_name        Pflichtfeld
 Firma         company_name     Optional
 Kategorie     category         Offen / Makler / Bank / Verwalter / ...
 E-Mail        email            Optional
 Telefon       phone            Optional
 Mobil         phone_mobile     Optional (nur contacts + staging)
 Strasse       street           Optional (nur contacts)
 PLZ           postal_code      Optional
 Stadt/Ort     city             Optional
 Website       website_url      Optional (nur search_results + staging)
 Position      contact_person_role  Optional (nur search_results)
```

### 3. Recherche-Tabelle: Neue Spalten in der UI

Die Ergebnistabelle in der Recherche-Zentrale zeigt dann:

| Nr | Spaltenheader | DB-Feld | Beschreibung |
|----|--------------|---------|-------------|
| 1 | (Checkbox) | -- | Bulk-Auswahl |
| 2 | Anrede | salutation | Herr / Frau |
| 3 | Vorname | first_name | Extrahiert aus Website/Google |
| 4 | Nachname | last_name | Extrahiert aus Website/Google |
| 5 | Firma | company_name | Firmenname |
| 6 | Kategorie | category | Branchenzuordnung |
| 7 | Position | contact_person_role | z.B. Geschaeftsfuehrer |
| 8 | E-Mail | email | Verifizierte Adresse |
| 9 | Telefon | phone | Telefonnummer |
| 10 | PLZ | postal_code | Postleitzahl |
| 11 | Stadt | city | Ort |
| 12 | Website | website_url | Firmen-URL |
| 13 | Vertrauen | confidence_score | KI-Konfidenz in % |
| 14 | Quelle | source_refs_json | Google / Firecrawl / Apify |
| 15 | Status | validation_state | Kandidat / Validiert / Importiert |

### 4. Adopt-Funktion anpassen

Wenn ein Recherche-Ergebnis ins Kontaktbuch uebernommen wird, werden jetzt alle Felder sauber gemappt:

```text
soat_search_results          ->  contacts (Kontaktbuch)
─────────────────────────────────────────────────────
salutation                   ->  salutation
first_name                   ->  first_name
last_name                    ->  last_name
company_name                 ->  company
category                     ->  category
email                        ->  email
phone                        ->  phone
city                         ->  city
postal_code                  ->  postal_code
contact_person_role          ->  notes (als Zusatzinfo)
```

### 5. Edge Function anpassen

Die `sot-research-engine` muss beim Speichern der Ergebnisse `first_name`, `last_name` und `salutation` als separate Felder zurueckgeben, statt nur `contact_person_name`.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| DB-Migration | `soat_search_results`: +salutation, +first_name, +last_name; `contact_staging`: +salutation, +category |
| `src/pages/admin/ki-office/AdminRecherche.tsx` | Ergebnistabelle mit neuen Spalten (Anrede, Vorname, Nachname, Kategorie); "Neue Recherche" entfernen; konsolidierte Desk-Ansicht |
| `src/hooks/useDeskContacts.ts` | Adopt-Funktion: salutation + category mit uebergeben |
| `src/hooks/useSoatSearchEngine.ts` | Result-Interface aktualisieren (salutation, first_name, last_name) |
| `supabase/functions/sot-research-engine/index.ts` | Ergebnisse mit getrennten Namensfeldern speichern |

Keine Modul-Freeze-Verletzung (alle Dateien liegen ausserhalb der Modul-Pfade).

