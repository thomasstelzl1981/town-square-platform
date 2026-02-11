
# Finanzierungsobjekt-Sektion ergaenzen (MOD-11 + MOD-07)

## Ueberblick

Zwei zusammenhaengende Probleme werden behoben:

1. **MOD-11 FMFinanzierungsakte**: Unterhalb der Selbstauskunft fehlt die Sektion "Finanzierungsobjekt erfassen" — die Objektdaten (Adresse, Typ, Flaechen, Kosten, Finanzierungsplan) muessen im gleichen tabellarischen Stil wie die Selbstauskunft direkt auf der Seite stehen.

2. **MOD-07 AnfrageTab**: Der Einstieg in eine neue Anfrage laeuft ueber ein Popup-Fenster (Dialog), das unuebersichtlich ist. Stattdessen soll die Seite direkt das Formular zeigen — alle Objektdaten inline sichtbar, keine versteckten Flows.

---

## Aenderung 1: MOD-11 FMFinanzierungsakte — Objektsektion ergaenzen

**Datei:** `src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx`

Unterhalb des bestehenden Blocks "Selbstauskunft" (Zeile 272) wird ein neuer Block **"Finanzierungsobjekt"** eingefuegt. Die Felder orientieren sich an der AnfrageFormV2-Struktur und am PDF-Bankformular:

**Sektion: Objektdaten**
- Objektadresse (Strasse, Hausnummer, PLZ, Ort — getrennte Felder)
- Objektart (Eigentumswohnung, EFH, ZFH, MFH, Grundstueck, Gewerbe)
- Baujahr
- Wohnflaeche (m2)
- Grundstuecksflaeche (m2)
- Ausstattungsniveau (Einfach/Mittel/Gehoben/Luxus)
- Wohnlage (Einfach/Mittel/Gut/Sehr gut)
- Anzahl Zimmer
- Anzahl Stellplaetze/Garagen

**Sektion: Kostenzusammenstellung**
- Kaufpreis / Baukosten
- Modernisierungskosten
- Notar und Grundbuch
- Grunderwerbsteuer
- Maklerprovision
- **Gesamtkosten** (automatisch berechnet)

**Sektion: Finanzierungsplan**
- Eigenkapital
- Darlehenswunsch
- Zinsbindung (5/10/15/20/25/30 Jahre)
- Anfaengliche Tilgung (%)
- Max. Monatsrate
- **Finanzierungsbedarf** (Gesamtkosten minus Eigenkapital, automatisch berechnet)

Alle Felder werden im gleichen tabellarischen Stil (TR-Komponente mit Label|Wert) dargestellt wie die Eckdaten oben. Die Daten werden beim "Finanzierungsakte erstellen"-Click in den `finance_request` und ggf. `custom_object_data` gespeichert.

---

## Aenderung 2: MOD-07 AnfrageTab — Dialog entfernen, Inline-Formular

**Datei:** `src/pages/portal/finanzierung/AnfrageTab.tsx`

Der aktuelle Flow:
1. Nutzer sieht leere Seite mit "Anfrage starten"-Button
2. Dialog oeffnet sich mit Objektquellen-Auswahl
3. Nach Auswahl wird `finance_request` erstellt
4. Dann wird `AnfrageFormV2` gezeigt

**Neuer Flow:**
1. Nutzer sieht direkt das Formular (AnfrageFormV2) — wenn kein Draft existiert, wird automatisch ein leerer Draft erstellt
2. Kein Dialog mehr
3. Oberhalb des Formulars: optionale Prefill-Leiste "Objekt aus Portfolio uebernehmen?" (wie bereits in AnfrageFormV2 vorhanden)

Konkret: Der gesamte Dialog-Block (Zeilen 184-265) wird entfernt. Stattdessen wird bei "kein Draft vorhanden" automatisch ein neuer Draft erstellt und sofort das Formular gezeigt. Der "Anfrage starten"-Button wird zu einem einfachen "Neue Anfrage erstellen"-Button, der direkt den Draft anlegt (ohne Zwischendialog).

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `FMFinanzierungsakte.tsx` | Neuer Block "Finanzierungsobjekt" mit 3 Sektionen (Objekt, Kosten, Finanzierung) im tabellarischen Stil |
| `AnfrageTab.tsx` | Dialog entfernen, direktes Inline-Formular ohne Popup |

## Keine DB-Migration

Alle benoetigten Felder existieren bereits in `finance_requests` (object_address, object_type, purchase_price, etc.) und `custom_object_data` (JSONB fuer zusaetzliche Felder wie Zimmeranzahl, Stellplaetze).
