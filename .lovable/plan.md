

# Personenakte erweitern: Beamte, Einkommensdaten und Pensionsberechnung

## Ist-Zustand

### Bereits vorhanden
| Feld | Angestellte | Selbststaendige | Beamte |
|---|---|---|---|
| Bruttoeinkommen | Ja | - | Fehlt |
| Nettoeinkommen | Ja | - | Fehlt |
| Steuerklasse | Ja | - | Fehlt |
| Kinderfreibetraege | Ja | - | Fehlt |
| Arbeitgeber/Firma | Ja | Ja | Fehlt |
| Besoldungsgruppe | - | - | Fehlt |
| Erfahrungsstufe | - | - | Fehlt |
| Dienstherr | - | - | Fehlt |
| Verbeamtungsdatum | - | - | Fehlt |

### Renteninformation (pension_records)
Aktuell nur DRV-Felder (current_pension, projected_pension, disability_pension). Keine Unterscheidung zwischen gesetzlicher Rente und Beamtenpension. Beamte sind NICHT in der gesetzlichen Rentenversicherung -- die aktuelle Sektion "DRV Renteninformation" ist fuer Beamte falsch.

---

## Umsetzungsplan

### 1. Datenbank erweitern (SQL Migration)

**Tabelle `household_persons` -- neue Spalten fuer Beamte:**

| Spalte | Typ | Beschreibung |
|---|---|---|
| `besoldungsgruppe` | text | z.B. "A13", "A14", "B3" |
| `erfahrungsstufe` | integer | 1-8 (je nach Besoldungsordnung) |
| `dienstherr` | text | "bund" oder Bundesland-Kuerzel |
| `verbeamtung_date` | date | Datum der Verbeamtung |
| `ruhegehaltfaehiges_grundgehalt` | numeric | Monatliches ruhegehaltfaehiges Grundgehalt |
| `ruhegehaltfaehige_dienstjahre` | numeric | Anrechenbare Dienstjahre (inkl. Vordienstzeiten) |
| `planned_retirement_date` | date | Geplantes Ruhestandsdatum |

**Tabelle `pension_records` -- neue Spalte:**

| Spalte | Typ | Beschreibung |
|---|---|---|
| `pension_type` | text | "drv" (Standard) oder "beamtenpension" |

### 2. UI-Erweiterung (UebersichtTab.tsx)

**Beamten-Sektion (employment_status === 'beamter'):**
Zeigt dieselben allgemeinen Felder wie Angestellte (Brutto, Netto, Steuerklasse, Kinderfreibetraege) PLUS beamtenspezifische Felder:
- Dienstherr (Select: Bund, Bayern, Baden-Wuerttemberg, ... alle 16 Laender)
- Besoldungsgruppe (Select: A2-A16, B1-B11, W1-W3, R1-R10)
- Erfahrungsstufe (Select: 1-8)
- Ruhegehaltfaehiges Grundgehalt (numerisch)
- Datum der Verbeamtung (Datum)
- Ruhegehaltfaehige Dienstjahre (numerisch)
- Geplantes Ruhestandsdatum (Datum)

**Renten-/Pensionssektion -- bedingte Anzeige:**
- Bei `employment_status !== 'beamter'`: Sektion "DRV Renteninformation" (wie bisher)
- Bei `employment_status === 'beamter'`: Sektion "Pensionsanspruch" mit berechneten Werten:
  - Versorgungssatz = Dienstjahre x 1,79375% (max. 71,75%)
  - Brutto-Pension = Ruhegehaltfaehiges Grundgehalt x Versorgungssatz
  - Anzeige als read-only KPI-Felder

### 3. Pensionsberechnungslogik

Gesetzliche Grundlage (BeamtVG):

```text
Versorgungssatz = min(Dienstjahre x 1,79375%, 71,75%)
Brutto-Pension  = Ruhegehaltfaehiges Grundgehalt x Versorgungssatz
Mindestversorgung = 35% des Grundgehalts (amtsabhaengig)

Bei vorzeitigem Ruhestand:
  Abschlag = Monate vor Regelaltersgrenze x 0,3% (max. 10,8%)
  Gekuerzte Pension = Brutto-Pension x (1 - Abschlag)
```

Diese Logik wird direkt inline in der UI berechnet (kein separater Engine-File noetig, da es eine einfache Formel ist). Spaeter kann sie in eine Engine ausgelagert werden, wenn das Renten-Tool gebaut wird.

### 4. Dateien betroffen

| Datei | Aenderung |
|---|---|
| SQL Migration | Neue Spalten in `household_persons` und `pension_records` |
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | Beamten-Formularfelder, bedingte Renten-/Pensions-Sektion, Inline-Berechnung |

### 5. Fehlende Felder bei Angestellten -- Pruefung

Die Angestellten-Sektion ist bereits vollstaendig:
- Arbeitgeber, Brutto, Netto, Steuerklasse, Kinderfreibetraege -- alles vorhanden.
- Zusaetzlich sinnvoll waere "Beschaeftigt seit" (Datum), aber das ist optional und nicht zwingend fuer die Rentenberechnung, da die DRV-Daten direkt vom Rentenbescheid kommen.

