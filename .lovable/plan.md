
# Akten-Entwicklung -- Strukturierter 3-Phasen-Plan

## Analyse: "Grundstuecksakte"

Die Immobilienakte (AKTE-01) enthaelt bereits alle Grundstuecksdaten:
- Fluerstuecksnummer (`parcelNumber`)
- Grundbuch: Amtsgericht, Blatt, Band (`landRegisterCourt`, `landRegisterSheet`, `landRegisterVolume`)
- Teilungserklaerung (`teNumber`)
- Kaufpreis, Kaufdatum, Erwerbsnebenkosten

Eine separate Grundstuecksakte ist daher **nicht erforderlich**. Der Eintrag wird aus dem Backlog entfernt.

---

## Bestandsaufnahme: 9 Akten-Typen

| Nr | Akte | Modul | DB-Tabelle | Dossier-View | DMS | Parser | Status |
|----|------|-------|------------|-------------|-----|--------|--------|
| 01 | Immobilienakte | MOD_04 | units/properties | Ja (10 Bloecke) | Vollstaendig | Live | Fertig |
| 02 | PV-Akte | MOD_19 | pv_plants | Ja (7 Bloecke) | DMS ja, Sortierung fehlt | Fehlt | Phase 1 |
| 03 | Personenakte | MOD_01 | household_persons | Nein (RecordCard) | DMS ja, Sortierung fehlt | Fehlt | Phase 1 |
| 04 | Versicherungsakte | MOD_11 | insurance_contracts | Nein | Fehlt komplett | Fehlt | Phase 1 |
| 05 | Fahrzeugakte | MOD_17 | cars_vehicles | Inline (9 Bloecke) | DMS ja, Sortierung fehlt | Fehlt | Phase 1 |
| 06 | Vorsorgeakte | MOD_11 | vorsorge_contracts | Nein | Fehlt komplett | Fehlt | Phase 1 |
| 07 | Abonnement-Akte | MOD_11 | user_subscriptions | Nein | N/A (Bankdaten) | N/A | Fertig |
| 08 | Bankkonto-Akte | MOD_11 | bank_account_meta | Nein | N/A (FinAPI) | N/A | Fertig |
| 09 | Haustierakte | MOD_05 | pets | Inline | DMS ja, Sortierung fehlt | Fehlt | Phase 1 |

---

## Phase 1: Akten definieren und Datenpunkte festlegen

Fuer jede Akte wird eine vollstaendige **Mastervorlage** erstellt (analog zu den bereits existierenden `MasterTemplatesFahrzeugakte.tsx` und `MasterTemplatesPhotovoltaikakte.tsx`).

### 1.1 Versicherungsakte (AKTE-04) -- Neue Mastervorlage

Datenpunkte (aus `insurance_contracts`):

| Block | Titel | Felder |
|-------|-------|--------|
| A | Identitaet | ID, Kategorie (Hausrat/Haftpflicht/KFZ/Wohngebaeude/Rechtsschutz/Unfall/...), Status |
| B | Vertragsdaten | Versicherer, Policen-Nr., Versicherungsnehmer, Vertragsbeginn, Vertragsende, Kuendigungsfrist |
| C | Praemie/Kosten | Praemie, Zahlungsintervall (monatlich/vierteljaehrlich/jaehrlich), Selbstbeteiligung |
| D | Deckung | Versicherungssumme, Deckungsumfang (JSONB-Details je Kategorie) |
| E | Schaden/Claims | Schadensmeldungen, Schadensnummer, Status, Regulierungsbetrag |
| F | Zuordnung | Verknuepfte Immobilie, Verknuepftes Fahrzeug, Verknuepfte Person |
| G | Dokumente | DMS-Ordner: 01_Police, 02_Nachtraege, 03_Schaeden, 04_Korrespondenz, 05_Sonstiges |

### 1.2 Vorsorgeakte (AKTE-06) -- Neue Mastervorlage

| Block | Titel | Felder |
|-------|-------|--------|
| A | Identitaet | ID, Vertragstyp (Riester/Ruerup/bAV/Privat/Kapital-LV), Status |
| B | Vertragsdaten | Anbieter, Vertragsnummer, Vertragsbeginn, Vertragsende |
| C | Beitraege | Beitrag, Zahlungsintervall, Dynamik (%), BU-Zusatzbeitrag |
| D | Leistungen | Aktueller Vertragswert, Stichtag, Prognostizierter Endwert, Monatliche Rente, Versicherte Summe |
| E | Zuordnung | Person (FK household_persons), Bezugsberechtigter |
| F | Dokumente | DMS-Ordner: 01_Vertrag, 02_Standmitteilungen, 03_Renteninformation, 04_Korrespondenz |

### 1.3 Personenakte (AKTE-03) -- Bestehende Daten dokumentieren

| Block | Titel | Felder |
|-------|-------|--------|
| A | Stammdaten | Anrede, Vorname, Nachname, Geburtsdatum, Avatar |
| B | Kontakt | E-Mail, Telefon mobil, Telefon Festnetz |
| C | Adresse | Strasse, Hausnummer, PLZ, Ort |
| D | Beschaeftigung | Status, Arbeitgeber, Brutto-/Nettoeinkommen, Steuerklasse |
| E | Beamten-Felder | Besoldungsgruppe, Erfahrungsstufe, Dienstherr, Verbeamtungsdatum, Dienstjahre |
| F | Vorsorge-Referenz | Geplantes Renteneintrittsdatum, Kindergeld-Freibetrag |
| G | Familienstand | Familienstand, Rolle im Haushalt |
| H | Dokumente | DMS-Ordner (bereits implementiert): 01_Personalausweis bis 08_Sonstiges |

### 1.4 Haustierakte (AKTE-09) -- Bestehende Daten dokumentieren

| Block | Titel | Felder |
|-------|-------|--------|
| A | Stammdaten | Name, Tierart, Rasse, Geschlecht, Geburtsdatum, Gewicht |
| B | Identifikation | Chipnummer, Foto |
| C | Gesundheit | Allergien, Kastriert, Tierarzt-Name |
| D | Versicherung | Versicherungsanbieter, Policennummer |
| E | Dokumente | DMS-Ordner: 01_Impfpass, 02_Tierarzt, 03_Versicherung, 04_Sonstiges |

---

## Phase 2: RecordCard-Manifest und DMS-Integration

### 2.1 DMS-Auto-Ordner nachrüsten

Fuer **Versicherung** und **Vorsorge** fehlt die DMS-Integration komplett. Es werden dedizierte `useInsuranceDMS` und `useVorsorgeDMS` Hooks erstellt (analog zu `usePersonDMS` und `usePvDMS`):

- `useInsuranceDMS`: Erstellt Root-Ordner + 5 Unterordner bei Neuanlage
- `useVorsorgeDMS`: Erstellt Root-Ordner + 4 Unterordner bei Neuanlage

### 2.2 RecordCard-Manifest aktualisieren

Das `recordCardManifest.ts` wird um DMS-Ordner-Definitionen erweitert, sodass jeder Akten-Typ seine eigene Ordnerstruktur kennt.

### 2.3 Inbox-Sortierregeln

Bei Anlage einer neuen Akte werden automatisch `inbox_sort_containers` + keyword-basierte `inbox_sort_rules` erstellt (Versicherer-Name, Policennr, Kennzeichen, etc.).

---

## Phase 3: Parser-Modi (nachgelagerter Schritt)

Erst wenn die Akten-Struktur steht, werden die Parser-Modi im `sot-document-parser` erweitert:

1. **versicherung** -- Erkennung von Policen-PDFs
2. **fahrzeugschein** -- Zulassungsbescheinigung Teil I/II
3. **pv_anlage** -- MaStR-Auszuege und Anlagen-Datenblaetter
4. **vorsorge** -- Standmitteilungen und Renteninformationen
5. **tierarzt** -- Tierarzt-Rechnungen und Impfpaesse

---

## Technische Umsetzung (Phase 1)

### Neue Dateien
- `src/pages/admin/MasterTemplatesVersicherungsakte.tsx` -- Versicherungsakte Mastervorlage (analog Fahrzeugakte-Pattern)
- `src/pages/admin/MasterTemplatesVorsorgeakte.tsx` -- Vorsorgeakte Mastervorlage
- `src/pages/admin/MasterTemplatesPersonenakte.tsx` -- Personenakte Mastervorlage
- `src/pages/admin/MasterTemplatesHaustierakte.tsx` -- Haustierakte Mastervorlage

### Geaenderte Dateien
- `src/pages/admin/MasterTemplates.tsx` -- 4 neue Karten fuer die neuen Mastervorlagen
- `src/router/ManifestRouter.tsx` -- 4 neue Routen registrieren
- `src/manifests/routesManifest.ts` -- 4 neue Route-Eintraege
- `spec/current/07_akten/akten_backlog.json` -- "Grundstuecksakte" entfernen, Status aktualisieren

### Bestehende Dateien (unveraendert in Phase 1)
- `MasterTemplatesFahrzeugakte.tsx` -- bereits vollstaendig (9 Bloecke, 47 Felder)
- `MasterTemplatesPhotovoltaikakte.tsx` -- bereits vollstaendig (7 Bloecke, 44 Felder)

---

## Zusammenfassung der Reihenfolge

1. **Jetzt (Phase 1):** Mastervorlagen fuer alle 4 fehlenden Akten erstellen, Routing einrichten, Backlog bereinigen
2. **Danach (Phase 2):** DMS-Hooks und Auto-Ordner fuer Versicherung + Vorsorge implementieren
3. **Zuletzt (Phase 3):** Parser-Modi im `sot-document-parser` erweitern
