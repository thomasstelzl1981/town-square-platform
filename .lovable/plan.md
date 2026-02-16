

# Fix: Demo-Daten des Mustermann-Kunden in Stammdaten, Selbstauskunft und Zuhause

## Analyse des Problems

Aktuell zeigen drei Module nicht die erwarteten Mustermann-Demo-Daten:

### 1. Stammdaten (MOD-01 / profiles)
Die `profiles`-Tabelle enthaelt die realen Daten des Entwicklers (Thomas Stelzl, Oberhaching). Da die Stammdaten direkt aus `profiles` lesen (gebunden an `auth.users.id`), sieht der Demo-Mandant "Thomas Stelzl" statt "Max Mustermann".

**Loesung:** Das Profil (`d028bc99-...`) mit den Mustermann-Stammdaten aktualisieren:
- first_name: Max, last_name: Mustermann
- Adresse: Leopoldstrasse 42, 80802 Muenchen
- phone_mobile: +49 170 1234567
- display_name: Max Mustermann
- tax_id: DE123456789

### 2. Selbstauskunft (MOD-07 / applicant_profiles)
Es gibt aktuell 4 Eintraege im Demo-Tenant — fragmentiert und inkonsistent:
- `00000000-...0005` (Max, mit finance_request_id → Snapshot, nicht persistent)
- `a23366ab-...` (Max, persistent, aber KEIN net_income, KEIN Arbeitgeber)
- `c445bafd-...` (Thomas Stelzl — Altlast, leer)
- `703e1648-...` (Lisa, mit Daten)

**Loesung:**
- Den persistenten Max-Datensatz (`a23366ab-...`) vollstaendig befuellen: Einkommen, Beschaeftigung, Adresse, Vermoegen
- Den Thomas-Stelzl-Datensatz (`c445bafd-...`) loeschen (Altlast)
- Den Snapshot-Datensatz (`00000000-...0005`) bleibt unveraendert (gehoert zur Finance Request)

### 3. Zuhause (MOD-20 / miety_homes)
Der einzige Eintrag hat minimale Daten:
- ownership_type: "miete" (Mustermann ist aber Eigentuemer laut Persona)
- market_value: NULL
- Kein construction_year, kein heating_type, kein plot_area

**Loesung:** Den miety_homes-Datensatz (`da78ca31-...`) mit vollstaendigen Mustermann-Daten aktualisieren:
- ownership_type: eigentum
- market_value: 850000
- construction_year: 2005
- heating_type: Waermepumpe
- plot_area_sqm: 620
- rooms_count: 6 (bereits gesetzt)
- area_sqm: 300 (bereits gesetzt)

## Betroffene Dateien und Aenderungen

| Aenderung | Details |
|-----------|---------|
| DB-Update: `profiles` | Mustermann-Stammdaten fuer Entwickler-Profil setzen |
| DB-Update: `applicant_profiles` (Max persistent) | Einkommen, Beschaeftigung, Adresse vervollstaendigen |
| DB-Delete: `applicant_profiles` (Stelzl-Altlast) | Datensatz `c445bafd-...` entfernen |
| DB-Update: `miety_homes` | Eigentum, Marktwert, Baujahr, Heizung etc. |

### Kein Code-Aenderungsbedarf
Alle drei Module lesen bereits korrekt aus der Datenbank. Das Problem sind ausschliesslich fehlende/falsche Demo-Daten in den Tabellen. Die Trigger-Synchronisation (profiles → household_persons) wird automatisch die Personenkarten in der Finanzanalyse aktualisieren.

## Technische Details: Daten-Updates

### profiles (Entwickler-Profil → Mustermann)
```text
UPDATE profiles SET
  first_name = 'Max',
  last_name = 'Mustermann',
  display_name = 'Max Mustermann',
  street = 'Leopoldstraße',
  house_number = '42',
  postal_code = '80802',
  city = 'München',
  country = 'DE',
  phone_mobile = '+49 170 1234567',
  phone_landline = '+49 89 12345678',
  tax_id = 'DE123456789',
  tax_number = '143/123/45678'
WHERE id = 'd028bc99-6e29-4fa4-b038-d03015faf222';
```

### applicant_profiles (Max persistent vervollstaendigen)
```text
UPDATE applicant_profiles SET
  net_income_monthly = 0,
  self_employed_income_monthly = 8500,
  company_name = 'IT-Beratung Mustermann',
  company_legal_form = 'Einzelunternehmen',
  employment_type = 'selbstaendig',
  address_street = 'Leopoldstraße 42',
  address_postal_code = '80802',
  address_city = 'München',
  phone = '+49 170 1234567',
  email = 'max@mustermann-demo.de',
  children_count = 2,
  adults_count = 2,
  child_benefit_monthly = 500,
  bank_savings = 85000,
  securities_value = 120000,
  life_insurance_value = 45000
WHERE id = 'a23366ab-e769-46b0-8d44-f8117f901c15';
```

### applicant_profiles (Stelzl-Altlast loeschen)
```text
DELETE FROM applicant_profiles
WHERE id = 'c445bafd-1813-4b21-8966-709078deea2a';
```

### miety_homes (Eigentum + vollstaendige Daten)
```text
UPDATE miety_homes SET
  name = 'Villa Mustermann',
  ownership_type = 'eigentum',
  market_value = 850000,
  construction_year = 2005,
  heating_type = 'Wärmepumpe',
  plot_area_sqm = 620,
  has_garage = true,
  has_garden = true,
  has_basement = true,
  floor_count = 2,
  bathrooms_count = 3,
  address = 'Leopoldstraße',
  address_house_no = '42',
  city = 'München',
  zip = '80802'
WHERE id = 'da78ca31-7456-44a8-980c-3e374818b49e';
```

## Auswirkungen (automatisch via Trigger)
- Der `profiles → household_persons` Trigger synchronisiert Name, Adresse und Telefon automatisch auf die Hauptperson in der Finanzanalyse
- Die Selbstauskunft zeigt dann korrekte Mustermann-Daten
- Das Zuhause-Modul zeigt ein vollstaendiges Eigenheim-Dossier

