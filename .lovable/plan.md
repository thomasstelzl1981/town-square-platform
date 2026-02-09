

# Erweiterter Plan: 6 Akten, 6 Vorlagen, ID-System, Storage, Risiko und Zukunftssicherung

---

## 1. Korrektur: 6 Akten = 6 Vorlagen

Im bisherigen Plan wurden 6 Akten-Typen identifiziert, aber nur 5 Vorlagen geplant. Die fehlende 6. Vorlage ist die **Finanzierungsakte** (MOD-11).

| Nr | Akte | Modul | Zone 2 Detail-Seite | Master-Vorlage (Zone 1) | Status |
|----|------|-------|---------------------|-------------------------|--------|
| 1 | Immobilienakte | MOD-04 | PropertyDetailPage | `MasterTemplatesImmobilienakte.tsx` | Vorhanden |
| 2 | Selbstauskunft | MOD-07 | SelbstauskunftFormV2 | `MasterTemplatesSelbstauskunft.tsx` | Vorhanden (Refactoring noetig) |
| 3 | Projektakte | MOD-13 | ProjectDetailPage | `MasterTemplatesProjektakte.tsx` | Vorhanden (Refactoring noetig) |
| 4 | Fahrzeugakte | MOD-17 | VehicleDetailPage | NEU zu erstellen | Fehlt |
| 5 | Photovoltaikakte | MOD-19 | PV-Anlagen-Detail | NEU zu erstellen | Fehlt |
| 6 | **Finanzierungsakte** | **MOD-11** | **CaseDetailTab / SubmitToBankTab** | **NEU zu erstellen** | **Fehlt** |

Die Finanzierungsakte umfasst die Daten aus `finance_requests`, `finance_mandates`, `finance_packages`, `finance_bank_contacts` und `applicant_profiles` -- also alles, was einen Finanzierungsfall beschreibt.

---

## 2. ID-Struktur: Vollstaendiges Prefix-Register

### Bereits vorhanden (mit Trigger)

| Entity | Tabelle | Prefix | Format-Beispiel | Trigger |
|--------|---------|--------|-----------------|---------|
| Tenant/Organisation | `organizations` | `T` | `SOT-T-XXXXXXXX` | Ja |
| Immobilie | `properties` | `I` | `SOT-I-XXXXXXXX` | Ja |
| Einheit | `units` | `E` | `SOT-E-XXXXXXXX` | Ja |
| Kontakt | `contacts` | `K` | `SOT-K-XXXXXXXX` | Ja |
| Dokument | `documents` | `D` | `SOT-D-XXXXXXXX` | Ja |
| Finanzpaket | `finance_packages` | `F` | `SOT-F-XXXXXXXX` | Ja |
| Finanzierungsanfrage | `finance_requests` | `FR` | `SOT-FR-XXXXXXXX` | Ja |
| Finanzierungsmandat | `finance_mandates` | `FM` | `SOT-FM-XXXXXXXX` | Ja |
| Finanzierung Bankk. | `finance_bank_contacts` | `FB` | `SOT-FB-XXXXXXXX` | Ja |
| Fahrzeug | `cars_vehicles` | `V` | `SOT-V-XXXXXXXX` | Ja |
| Fahrzeug-Schaden | `cars_claims` | -- | vorhanden, Prefix unklar | Ja |
| Lead | `leads` | `L` | `SOT-L-XXXXXXXX` | Ja |
| Listing | `listings` | kontextabh. | `SOT-V-XXXXXXXX` (Verkauf) | Ja |
| Miet-Listing | `rental_listings` | -- | vorhanden | Ja |
| Service-Fall | `service_cases` | -- | vorhanden | Ja |
| Integration | `integration_registry` | `INT` | `SOT-INT-XXXXXXXX` | Ja |
| Vermieter-Kontext | `landlord_contexts` | -- | vorhanden | Ja |
| Bewertung | `property_valuations` | -- | vorhanden | Ja |
| Loan | `loans` | -- | vorhanden | Ja |
| Finance Case | `finance_cases` | -- | vorhanden | Ja |
| Cases | `cases` | -- | vorhanden | Ja |

### FEHLT (kein public_id, kein Trigger)

| Entity | Tabelle | Vorgeschlagener Prefix | Begruendung |
|--------|---------|----------------------|-------------|
| Bautraeger-Projekt | `dev_projects` | `BT` | "BauTraeger" -- eindeutig, kein Konflikt |
| Bautraeger-Einheit | `dev_project_units` | `BE` | "BautraegerEinheit" -- analog zu `E` fuer Units |
| Antragsteller-Profil | `applicant_profiles` | `AP` | "AntragstellerProfil" -- zentral fuer MOD-07/11 |
| PV-Anlage | `pv_plants` | `PV` | Offensichtlich |
| Mietvertrag | `leases` | `MV` | "MietVertrag" |
| Selbstauskunft | `self_disclosures` | `SD` | "SelbstDisklosure" |

### Wie die ID-Vergabe funktioniert

Die bestehende Funktion `generate_public_id(prefix)` erzeugt IDs im Format:

```
SOT-{PREFIX}-{BASE32_8_ZEICHEN}
```

Fuer jede neue Entitaet wird ein INSERT-Trigger erstellt:

```
CREATE TRIGGER trg_{tabelle}_public_id
  BEFORE INSERT ON {tabelle}
  FOR EACH ROW EXECUTE FUNCTION set_{tabelle}_public_id();
```

Die Trigger-Funktion prueft `IF NEW.public_id IS NULL` und setzt dann automatisch. Bestehende Zeilen werden per einmaligem UPDATE-Backfill nachgefuellt.

---

## 3. Storage/DMS-Verwebung: Wie Akten und Dateien zusammenhaengen

### Aktueller DMS-Aufbau

Jeder Tenant hat automatisch 20 Modul-Root-Ordner (MOD_01 bis MOD_20) plus System-Ordner im `storage_nodes`-Baum.

### Verknuepfung: Akte zu DMS

```text
Tenant (organizations)
  └── storage_nodes (DMS-Baum)
       ├── MOD_04 (Immobilien)
       │    └── {property_id}/        <-- Entity-Unterordner
       │         ├── 01_Stammdaten/
       │         ├── 02_Mietvertraege/
       │         └── ...
       ├── MOD_13 (Projekte)
       │    └── {dev_project_id}/
       ├── MOD_17 (Fahrzeuge)
       │    └── {vehicle_id}/
       │         ├── 01_Stammdaten/
       │         ├── 02_Versicherung/
       │         └── ...
       ├── MOD_19 (Photovoltaik)
       │    └── {pv_plant_id}/
       │         ├── 01_Stammdaten/
       │         ├── 02_MaStR_BNetzA/
       │         └── ...
       └── MOD_11 (Finanzierung)
            └── {finance_request_id}/
```

### Blob-Storage-Pfad-Konvention

```
{tenant_id}/{module_code}/{entity_id}/{filename}
```

Beispiel: `SOT-T-ABC12345/MOD_04/SOT-I-XYZ99999/grundriss.pdf`

### Was sicherstellt, dass alles verbunden bleibt

1. **tenant_id**: Jede Akte und jeder DMS-Ordner gehoert zum selben Tenant
2. **module_code**: Ordnet die Dateien dem richtigen Modul zu
3. **entity_id (UUID)**: Der DMS-Ordner referenziert die Akte ueber die `template_id` in `storage_nodes`
4. **public_id**: Fuer externe Referenzen (Briefe, Exporte, Kundenansicht)
5. **RLS**: Stellt sicher, dass nur der eigene Tenant Zugriff hat

### Was bei neuen Akten passiert

Wenn eine neue Akte (z.B. PV-Anlage) erstellt wird:
1. Datensatz in `pv_plants` mit automatischer `public_id = SOT-PV-XXXXXXXX`
2. DMS-Ordner unter `MOD_19/{pv_plant_id}/` wird automatisch angelegt (Subtree-Template)
3. Dateien werden im Blob unter `{tenant_id}/MOD_19/{pv_plant_id}/` gespeichert

---

## 4. Die 6. Vorlage: Finanzierungsakte (MOD-11)

### Bloecke

| Block | Titel | Entity | Felder (ca.) |
|-------|-------|--------|--------------|
| A | Mandatsinfo | finance_mandates | status, delegated_at, accepted_at, assigned_manager_id, notes |
| B | Finanzierungsanfrage | finance_requests | status, purpose, loan_amount, property_value, ltv |
| C | Antragsteller (Primary) | applicant_profiles | party_role, employment_type, gross_income, net_income |
| D | Antragsteller (Co-Applicant) | applicant_profiles | (gleiche Felder, linked_primary_profile_id) |
| E | Objektdaten (Referenz) | properties / dev_project_units | Verknuepfung zur Immobilien-/Projektakte |
| F | Finanzierungspakete | finance_packages | bank, interest_rate, monthly_rate, term_years |
| G | Bank-Kontakte | finance_bank_contacts | bank_name, contact_person, email, phone |
| H | Dokumente | storage_nodes | DMS-Ordnerstruktur MOD_11 |

ca. 55 Felder ueber 5 Entitaeten.

---

## 5. Risikoanalyse: Kann etwas kaputt gehen?

### Risiko-Matrix

| Massnahme | Risiko | Begruendung |
|-----------|--------|-------------|
| **Vorlagen-Refactoring (Tabs zu Accordion)** | **Null** | Reine UI-Aenderung in Zone 1. Keine Datenbank-Abhaengigkeit. Bestehende Daten und Zone-2-Workflows bleiben unberuehrt. |
| **Neue Vorlagen (3 neue Dateien)** | **Null** | Neue Read-Only-Seiten. Keine bestehende Datei wird veraendert. Neue Routen haben keine Seiteneffekte. |
| **public_id auf 6 Tabellen** | **Sehr niedrig** | Nullable Spalte wird hinzugefuegt. Bestehende Queries nutzen `id` (UUID), nicht `public_id`. Trigger feuert nur bei INSERT. Backfill aktualisiert nur NULL-Werte. |
| **linked_primary_profile_id** | **Sehr niedrig** | Nullable FK-Spalte. Kein bestehender Code referenziert sie. Wird nur aktiv, wenn 2. Antragsteller-UI gebaut wird. |
| **KB.SYSTEM.009 Governance** | **Null** | Reine Markdown-Datei. Keine Laufzeit-Abhaengigkeit. |

### Architektur-Risiken im Detail

**Frage: Kann die public_id-Migration bestehende Queries brechen?**
- Nein. Die Spalte ist nullable und hat einen DEFAULT ueber den Trigger. Bestehende INSERTs ohne `public_id` bekommen automatisch einen Wert. Bestehende SELECTs ignorieren die neue Spalte.

**Frage: Kann das Accordion-Refactoring Zone-2-Workflows beeinflussen?**
- Nein. Die Master-Vorlagen in Zone 1 sind reine Dokumentations-Seiten. Sie lesen keine Daten aus der Datenbank und schreiben nichts. Sie haben null Verbindung zu Zone-2-Formularen.

**Frage: Koennen neue Routen bestehende Routen ueberschreiben?**
- Nein. Die neuen Pfade (`/admin/master-templates/fahrzeugakte`, `/photovoltaikakte`, `/finanzierungsakte`) sind eindeutig und kollidieren nicht mit bestehenden Routen.

**Frage: Kann der DMS-Bezug inkonsistent werden?**
- Nein. Das DMS nutzt `module_code` + `template_id` (Entity-UUID) als Schluessel. Die `public_id` ist ein zusaetzliches Label, kein Ersatz fuer die UUID-basierte Verknuepfung.

### Fazit Risiko
**Gesamtrisiko: Null bis sehr niedrig.** Alle Aenderungen sind additiv. Kein bestehender Code wird veraendert (ausser UI-Layout der 3 bestehenden Vorlagen). Keine Datenbank-Constraints werden geaendert. Keine RLS-Policies werden beruehrt.

---

## 6. Zukunftssicherung: Wie neue Akten im gleichen Stil eingepflegt werden

### Governance-Regel KB.SYSTEM.009

Diese Regel wird als verbindlicher Standard fuer alle zukuenftigen Akten festgeschrieben:

**K13: Accordion-Layout-Pflicht**
Jede Erfassungsakte MUSS dem einheitlichen Accordion-Layout folgen:
- Header mit Icon, Titel, MOD-Code, Read-Only Badge, Zurueck-Button
- Info-Banner mit Datenquelle
- 4 Stats-Karten (Bloecke, Felder, Entitaeten, Pflichtfelder)
- Accordion-Bloecke mit 5-Spalten-Tabelle

**K14: public_id-Pflicht**
Jede geschaeftskritische Entitaet MUSS eine `public_id TEXT NOT NULL UNIQUE` mit eindeutigem Prefix besitzen. Neue Prefixe werden im ID-Register (diese Regel) dokumentiert.

**K15: Master-Vorlage-Pflicht**
Jede Akte MUSS als Read-Only-Referenz unter `/admin/master-templates/{name}` dokumentiert sein, BEVOR die Zone-2-Implementierung beginnt.

**K16: DMS-Subtree-Pflicht**
Jede Akte mit Dokumenten-Bezug MUSS eine definierte DMS-Ordnerstruktur unter dem jeweiligen Modul-Root besitzen.

**K17: Prefix-Register**
Alle vergebenen Prefixe werden in KB.SYSTEM.009 gefuehrt. Vor Vergabe eines neuen Prefix muss Eindeutigkeit geprueft werden.

### Checkliste fuer neue Akten (wird Teil von KB.SYSTEM.009)

Wenn in Zukunft eine neue Akte hinzukommt (z.B. MOD-20 Miety, oder ein neues Modul):

1. Prefix waehlen und im Register pruefen (kein Duplikat)
2. DB-Migration: `public_id TEXT` + Trigger + Backfill
3. DMS-Subtree-Template definieren (welche Unterordner)
4. Master-Vorlage in Zone 1 erstellen (Accordion, 5-Spalten)
5. Route in ManifestRouter.tsx hinzufuegen
6. Karte auf MasterTemplates.tsx Hauptseite ergaenzen

---

## 7. Vollstaendige Umsetzungsreihenfolge

### Schritt 1: DB-Migration
- `public_id` + Trigger + Backfill fuer: `dev_projects` (BT), `dev_project_units` (BE), `applicant_profiles` (AP), `pv_plants` (PV), `leases` (MV), `self_disclosures` (SD)
- `linked_primary_profile_id` auf `applicant_profiles`

### Schritt 2: KB.SYSTEM.009 erstellen
- Governance-Regel mit K13-K17
- Prefix-Register als Referenz

### Schritt 3: Vorlagen-Refactoring
- `MasterTemplatesProjektakte.tsx`: Tabs zu Accordion, 5-Spalten, Header/Banner/Stats vereinheitlichen
- `MasterTemplatesSelbstauskunft.tsx`: Tabs zu Accordion, Entity-Spalte ergaenzen, Stats ergaenzen
- `MasterTemplatesImmobilienakte.tsx`: Minimal-Anpassung (Stats-Labels)

### Schritt 4: Neue Vorlagen erstellen
- `MasterTemplatesFahrzeugakte.tsx` (MOD-17, 9 Bloecke)
- `MasterTemplatesPhotovoltaikakte.tsx` (MOD-19, 7 Bloecke)
- `MasterTemplatesFinanzierungsakte.tsx` (MOD-11, 8 Bloecke)

### Schritt 5: Hauptseite + Routing
- `MasterTemplates.tsx`: 6 Karten statt 3
- `ManifestRouter.tsx`: 3 neue Routen

### Schritt 6: 2. Antragsteller (Selbstauskunft)
- `SelbstauskunftFormV2.tsx`: Toggle-Logik mit echtem Formular
- `SelbstauskunftTab.tsx`: Lade/Speicher-Logik fuer Co-Applicant

---

## 8. Zusammenfassung

| Frage | Antwort |
|-------|---------|
| **6 Akten, 6 Vorlagen?** | Ja -- die fehlende 6. ist die Finanzierungsakte (MOD-11) |
| **ID-Struktur lueckenlos?** | Nach Migration: Ja. 6 Tabellen bekommen `public_id` + Trigger |
| **Storage-Verwebung klar?** | Ja: `tenant_id/module_code/entity_id/filename` als fester Pfad |
| **Kann etwas kaputt gehen?** | Nein. Alles additiv, keine bestehenden Abhaengigkeiten betroffen |
| **Zukunftssicherung?** | KB.SYSTEM.009 mit Checkliste und Prefix-Register |
| **Gesamtumfang** | 6 Dateien (3 refactored + 3 neu) + 1 Migration + 1 KB-Regel + 2 Routen-Zeilen |

