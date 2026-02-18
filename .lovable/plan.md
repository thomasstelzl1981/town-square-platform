
# Armstrong Magic Intake Engine -- Dokument-zu-Datensatz-Pipeline

## Ausgangslage

Heute existieren **drei isolierte Intake-Muster** im System:

1. **MOD-13 (Projekte)**: Voll funktionaler KI-Intake via `sot-project-intake` -- Expose/Preisliste hochladen, Gemini extrahiert, User reviewed, Datensatz + Storage-Tree wird erstellt. **Funktioniert bereits ueber Armstrong** (`ARM.MOD13.CREATE_DEV_PROJECT`).
2. **MOD-11 (Finanzmanager)**: Simpler Magic Intake -- Name + E-Mail eingeben, `finance_request` + `applicant_profile` + Storage-Ordner wird angelegt. **Keine Dokumenten-KI**.
3. **MOD-04 (Immobilien)**: Manuelles Formular (`CreatePropertyDialog`) -- Ort, Adresse, Objektart. **Keine Dokumenten-KI**.
4. **MOD-18 (Finanzanalyse)**: Kein Magic Intake vorhanden.

Der `sot-document-parser` existiert bereits und kann Dokumente (PDF, Bilder, Excel) in strukturierte JSON-Daten parsen -- mit spezialisierten Modi (`properties`, `contacts`, `financing`, `general`).

## Architektur-Entscheidung: Engine vs. Dispatcher

**Empfehlung: Zentraler Dispatcher im Armstrong Advisor (kein separater Engine)**

Begruendung:
- Der `sot-document-parser` existiert bereits als Extraktions-Engine
- Was fehlt, ist nur die **Bruecke**: Parser-Output → Ziel-Tabelle
- Ein separater Engine waere Over-Engineering -- Armstrong hat bereits Confirm-Gate, Credit-Preflight und Action-Execution
- Stattdessen: **4 neue Armstrong-Actions** mit klarem Datenmapping

## Was gebaut wird

### 1. Vier neue Armstrong Magic-Intake-Actions

```text
Action                          | Modul  | Input-Dokument           | Ziel-Tabellen                    | Credits
ARM.MOD04.MAGIC_INTAKE_PROPERTY | MOD-04 | Kaufvertrag, Expose, PDF | properties, units, storage_nodes | 3
ARM.MOD11.MAGIC_INTAKE_CASE     | MOD-11 | Selbstauskunft, Gehalt   | finance_requests, applicant_profiles, storage_nodes | 3
ARM.MOD18.MAGIC_INTAKE_FINANCE  | MOD-18 | Kontoauszug, Versicherung| insurance_contracts, user_subscriptions, bank_account_meta | 2
ARM.MOD13.MAGIC_INTAKE_PROJECT  | MOD-13 | (existiert bereits)      | dev_projects, dev_project_units  | 10
```

### 2. Ablauf (identisch fuer alle 4 Module)

```text
User im Armstrong-Chat:
  "Hier ist mein Kaufvertrag, leg die Immobilie an"
  + Datei-Upload (via bestehender Bueroklammer-Funktion)
         |
         v
[1] ARMSTRONG erkennt Intent: ACTION + document_context vorhanden
         |
         v
[2] ARMSTRONG waehlt Action: ARM.MOD04.MAGIC_INTAKE_PROPERTY
    → Zeigt Confirm-Widget: "Ich moechte eine Immobilie aus dem Dokument anlegen (3 Credits)"
         |
    User bestaetigt
         |
         v
[3] ARMSTRONG ruft sot-document-parser auf (parseMode: "properties")
    → Ergebnis: { properties: [{ address: "...", city: "...", purchase_price: 350000, units: [...] }] }
         |
         v
[4] ARMSTRONG zeigt extrahierte Daten als Review-Widget:
    "Ich habe folgende Daten erkannt:
     - Adresse: Musterstr. 42, Berlin
     - Kaufpreis: 350.000 EUR
     - Objektart: ETW
     Soll ich die Immobilie so anlegen?"
         |
    User bestaetigt (oder korrigiert)
         |
         v
[5] ARMSTRONG fuehrt INSERT aus:
    → properties INSERT (+ Trigger erstellt Unit + Storage)
    → inbox_sort_container mit Adress-Keywords
    → Antwort: "Immobilie angelegt! Hier ist der Link zur Akte: /portal/immobilien/{id}"
```

### 3. Datenmapping-Definitionen (das Herzstuck)

Fuer jedes Modul wird ein klares Schema definiert, das den Parser-Output auf DB-Spalten mapped:

**MOD-04 (Immobilien):**

| Parser-Feld       | DB-Tabelle  | DB-Spalte          |
|-------------------|-------------|---------------------|
| address           | properties  | address             |
| city              | properties  | city                |
| postal_code       | properties  | postal_code         |
| property_type     | properties  | property_type       |
| purchase_price    | properties  | purchase_price      |
| market_value      | properties  | market_value        |
| construction_year | properties  | year_built          |
| living_area_sqm   | properties  | total_area_sqm      |
| units[]           | units       | (Bulk-Insert)       |

**MOD-11 (Finanzmanager):**

| Parser-Feld       | DB-Tabelle          | DB-Spalte          |
|-------------------|---------------------|---------------------|
| first_name        | applicant_profiles  | first_name          |
| last_name         | applicant_profiles  | last_name           |
| email             | applicant_profiles  | email               |
| employer          | applicant_profiles  | employer_name       |
| net_income        | applicant_profiles  | net_income          |
| bank              | finance_requests    | (via JSONB)         |
| loan_amount       | finance_requests    | (via JSONB)         |

**MOD-18 (Finanzanalyse):**

| Parser-Feld       | DB-Tabelle             | DB-Spalte          |
|-------------------|------------------------|---------------------|
| insurance_type    | insurance_contracts    | category            |
| provider          | insurance_contracts    | provider            |
| premium           | insurance_contracts    | annual_premium      |
| contract_number   | insurance_contracts    | contract_number     |
| subscription_name | user_subscriptions     | name                |
| monthly_cost      | user_subscriptions     | monthly_amount      |
| bank_name         | bank_account_meta      | display_name        |
| iban              | bank_account_meta      | iban                |

### 4. Backend-Erweiterung: sot-armstrong-advisor

Im `executeAction`-Block werden 3 neue Cases hinzugefuegt (MOD-13 existiert bereits):

- `ARM.MOD04.MAGIC_INTAKE_PROPERTY`: Parser → properties INSERT → Return Link
- `ARM.MOD11.MAGIC_INTAKE_CASE`: Parser → finance_request + applicant_profile INSERT → Return Link
- `ARM.MOD18.MAGIC_INTAKE_FINANCE`: Parser → insurance/subscription INSERT → Return Zusammenfassung

Jede Action folgt dem gleichen 3-Schritt-Muster:
1. `sot-document-parser` aufrufen (mit parseMode)
2. Daten validieren + Default-Werte setzen
3. INSERT in Zieltabellen + Storage-Ordner erstellen

### 5. Frontend: Keine neuen UI-Komponenten noetig

Der Armstrong-Chat hat bereits:
- Datei-Upload (Bueroklammer, gerade implementiert)
- Confirm-Gate (Action-Bestaetigungen)
- Markdown-Rendering (fuer Ergebnis-Darstellung)

Die einzige Ergaenzung: Die **Intent-Keywords** im Advisor muessen erweitert werden, damit Armstrong bei Dokument-Upload + modulspezifischen Keywords die richtige Action vorschlaegt.

## Kosten-Kalkulation

**Pro Magic Intake:**
- 1 Credit: sot-document-parser (Gemini Flash)
- 1-2 Credits: Armstrong Advisor (Antwort-Generierung)
- **Gesamt: 2-3 Credits = 0,50 - 0,75 EUR pro Intake**

**Vergleich manueller Aufwand:**
- Immobilie manuell anlegen: 5-15 Min Dateneingabe
- Finanzierungsfall mit Selbstauskunft: 20-30 Min
- Versicherungen erfassen: 10 Min pro Vertrag

Bei 0,50 EUR pro automatisiertem Intake ist das Kosten-Nutzen-Verhaeltnis exzellent.

**Folgefragen zum gleichen Dokument bleiben kostenlos** (Context ist gecacht).

## Realismus-Bewertung

| Aspekt | Bewertung |
|--------|-----------|
| Technisch machbar? | Ja -- alle Bausteine existieren |
| Parser-Qualitaet? | Gut fuer standardisierte Dokumente (Kaufvertraege, Gehaltsabrechnungen), schwaecher bei handschriftlichen/unstrukturierten PDFs |
| Kosten tragbar? | Ja -- 0,50 EUR/Intake bei hohem Automatisierungsgrad |
| Skalierbar? | Ja -- neue Module brauchen nur ein neues Mapping |
| Risiken? | Parser-Fehler → deshalb immer Review-Schritt vor INSERT |

## Technische Umsetzung

### Neue/geaenderte Dateien

**Manifest (1 Datei):**
- `src/manifests/armstrongManifest.ts` -- 3 neue Actions registrieren (MOD-04, MOD-11, MOD-18)

**Backend (1 Datei):**
- `supabase/functions/sot-armstrong-advisor/index.ts`:
  - 3 neue Cases im `executeAction`-Switch
  - Erweiterte Intent-Keywords fuer Dokument-Intakes
  - Mapping-Logik: Parser-Output → DB-INSERT
  - 3 neue Action-Definitionen im MVP_ACTIONS Array

**Keine neuen Dateien** -- alles wird in bestehende Strukturen integriert.

### Umfang
- ~50 Zeilen Manifest (3 Action-Registrierungen)
- ~300 Zeilen Backend (3 Execute-Cases mit Mapping + Validation)
- ~20 Zeilen Intent-Keywords
- Geschaetzte Umsetzung: 1 Session
