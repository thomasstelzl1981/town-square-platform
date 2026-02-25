

## Plan: Manuelles Backfill der Objektuebersicht-Daten fuer Menden Living

### Ausgangslage

Das Expose-PDF (Seite 16) enthaelt eine strukturierte **Objektuebersicht** mit allen gesetzlich vorgeschriebenen Datenfeldern. Diese Daten wurden beim urspruenglichen Import nicht extrahiert, weil das Tool-Schema zu schmal war. Die neuen DB-Spalten existieren bereits (Migration aus der vorherigen Runde), sind aber alle NULL.

### Extrahierte Daten aus dem Expose (Seite 16)

| Feld | Wert aus Expose |
|---|---|
| **Objekt** | Wunne 6-28, 58706 Menden |
| **Baujahr** | 1980 |
| **WEG** | WEG 1 (Wunne 6-18); WEG 2 (Wunne 20-22); WEG 3 (Wunne 24-28) |
| **Wohnbloecke** | 6 |
| **Wohnhaeuser** | 12 |
| **Wohneinheiten** | 72 |
| **Wohnungsgroessen** | zwischen 77 m² und 98 m² (3-5 Zimmer) |
| **Stockwerke** | je 3 |
| **Zustand** | gepflegt / modernisiert |
| **Loggien / Balkone** | vorhanden |
| **Anlagetyp** | Kapitalanlage und Eigennutzung moeglich |
| **Verkaeufer** | Kalo Eisenach GmbH |
| **Managementkosten** | WEG-Verwaltung durch Coeles PM GmbH, mtl. Netto 26 EUR je WE |
| **Erwerbsnebenkosten** | ca. 7% (5% GrESt + ca. 2% Notar/Gericht) |
| **Abschreibung** | lineare AfA gem. §7 Abs. 4 Satz 1 Nr. 2b EStG, 2,0% ueber 50 Jahre |
| **Einkuenfte** | Vermietung und Verpachtung gem. §2 Abs. 1 Nr. 6, §21 Abs. 1 Nr. 1 EStG |
| **Heizung** | Erdgaszentralheizung (neu, Einbau 2023-2024) |
| **Energietraeger** | Erdgas |

### Was wird gemacht

**1. SQL-UPDATE auf `dev_projects` (Projekt-ID: `bbbf6f6f-...`)**

Befuellt die neuen Spalten mit den extrahierten Daten:
- `full_description` — Ausfuehrliche Beschreibung aus Seiten 13-14 (Wohnanlage + Objektuebersicht Text, ca. 300 Woerter)
- `location_description` — Lagebeschreibung aus Seiten 11-12 (Stadtteil Wunne, Mikrolage mit Entfernungen)
- `features` — JSON-Array: Balkone/Loggien, Kellerraum, Kunststofffenster Doppelverglasung, Laminat/PVC, Erdgaszentralheizung 2023-2024, Massivbauweise, Satteldach, Vorhangfassade
- `energy_cert_type` — NULL (im Expose nicht spezifiziert)
- `energy_cert_value` — NULL
- `energy_class` — NULL
- `heating_type` — "Erdgaszentralheizung"
- `energy_source` — "Erdgas"
- `renovation_year` — 2024
- `parking_type` — "Parkflächen" (erwaehnt auf Seite 14)
- `parking_price` — NULL

**2. ProjectOverviewCard erweitern**

Die Kachel zeigt aktuell nur 6 Key Facts. Sie muss erweitert werden um die **vollstaendige Objektuebersicht** — analog zur Expose-Seite 16. Das bedeutet:

Neue Felder in der linken Spalte (zusaetzlich zu den bestehenden 6 Key Facts):
- Wohnbloecke / Wohnhaeuser
- Wohnungsgroessen (Spanne)
- Stockwerke
- Zustand
- Loggien/Balkone
- Anlagetyp
- Verkaeufer
- Managementkosten (WEG-Verwaltung)
- Erwerbsnebenkosten
- AfA-Regelung (Freitext aus Expose)
- Einkunftsart

Diese kommen teils aus `intake_data`, teils aus den neuen Spalten, teils aus bestehenden Feldern.

**3. Beschreibungs-Strategie: KI-generierte Beschreibung**

Statt den Expose-Text 1:1 zu uebernehmen, wird eine **KI-Beschreibung** generiert — analog zur bestehenden Funktion in `EditableAddressBlock.tsx` (MOD-04 Immobilienakte), die bereits einen "KI-Beschreibung generieren"-Button hat.

Strategie:
- In der `ProjectOverviewCard` rechte Spalte: Wenn `full_description` leer ist, zeige einen Button "KI-Beschreibung generieren"
- Der Button ruft eine Edge Function auf, die das Expose-PDF aus dem Storage liest und via Lovable AI Gateway eine professionelle Objektbeschreibung generiert
- Die Beschreibung wird in `dev_projects.full_description` gespeichert
- Format: 2-3 Absaetze, professionell, fuer Kapitalanleger optimiert

**Fuer den manuellen Sofort-Schritt** (damit wir jetzt weiterarbeiten koennen): Die `full_description` und `location_description` werden direkt aus dem Expose-Text per SQL-UPDATE befuellt — ohne KI-Call. Das ist der pragmatische Weg.

### Aenderungen im Detail

| # | Was | Wie |
|---|---|---|
| 1 | Daten-Backfill | SQL-UPDATE auf `dev_projects` SET full_description, location_description, features, heating_type, energy_source, renovation_year, parking_type |
| 2 | ProjectOverviewCard UI | Key Facts erweitern um alle Objektuebersicht-Felder (Wohnbloecke, Stockwerke, Zustand, Anlagetyp, Verkaeufer, Managementkosten, Erwerbsnebenkosten, AfA-Regelung) |
| 3 | Beschreibung rechts | full_description anzeigen (jetzt befuellt), spaeter KI-Button ergaenzen |

### Dateien

| Datei | Aenderung |
|---|---|
| SQL (kein File) | UPDATE dev_projects SET ... WHERE id = 'bbbf6f6f-...' |
| `src/components/projekte/ProjectOverviewCard.tsx` | Key Facts Grid erweitern, neue Felder aus intake_data + DB-Spalten anzeigen |

### Nicht betroffen

- Keine DB-Migration noetig (Spalten existieren bereits)
- Keine Edge-Function-Aenderung (manuelles Backfill)
- KI-Beschreibungs-Button ist ein Folge-Schritt (nicht in diesem Commit)

