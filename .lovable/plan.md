

# Recherche-Zentrale: Marktpotenzial-Kacheln + Banken + Neuer Auftrag

## Problem

1. **"Neuer Auftrag"-Button** im Desk-Orders-Bereich ist falsch platziert — die 4 Kacheln SIND die Auftraege/Kategorien, kein Einstieg fuer neue Auftraege
2. **Kategorie "Banken"** (FutureRoom) fehlt als 5. Kachel
3. **Marktpotenzial-Darstellung** fehlt komplett in den Kacheln (keine Fortschrittsbalken, keine Zielgroessen)
4. Es fehlt ein separater **Plus-Button** zum Anlegen neuer Suchauftraege

## Loesung

### Neues Layout der Recherche-Zentrale

```text
+----------------------------------------------------------+
| RECHERCHE-ZENTRALE                          [+ Auftrag]  |
+----------------------------------------------------------+
| [Acquiary]        [Sales]          [Finance]             |
|  35.000 Markt      75.000 Markt     55.000 Markt        |
|  ████░░░ 142       █░░░░░ 38        ░░░░░░ 0            |
|  0.4% erfasst      0.1% erfasst     0% erfasst          |
|  3 Auftraege        1 Auftrag        0 Auftraege         |
|                                                          |
| [Pet]             [Banken]                               |
|  10.000 Markt      1.350 Markt                           |
|  ░░░░░░ 0          ░░░░░░ 0                              |
|  0% erfasst        0% erfasst                            |
|  0 Auftraege        0 Auftraege                          |
+----------------------------------------------------------+
| (Klick auf Kachel oeffnet Auftrags-Liste darunter)       |
| AUFTRAEGE: Acquiary (3)                                  |
| | Family Office Hamburg   | done   | 25 Kont. | [trash] ||
| | Projektentwickler NRW   | running| 12 Kont. |         ||
+----------------------------------------------------------+
```

### Aenderungen im Detail

#### 1. DESK_CATEGORIES um Marktdaten + Banken erweitern

```text
DESK_CATEGORIES = [
  { code: 'acquiary', label: 'Acquiary',
    subtitle: 'Family Offices & Immobilienunternehmen',
    icon: Building2, marketSize: 35000,
    source: 'BaFin / Destatis 2024' },
  { code: 'sales', label: 'Sales',
    subtitle: 'Immobilienmakler & Hausverwaltungen',
    icon: Briefcase, marketSize: 75000,
    source: 'DIHK 34c + Destatis' },
  { code: 'finance', label: 'Finance',
    subtitle: 'Finanzvertriebe & Finanzdienstleister',
    icon: TrendingUp, marketSize: 55000,
    source: 'DIHK 34f / BaFin' },
  { code: 'pet', label: 'Pet',
    subtitle: 'Hundepensionen, -hotels & -friseure',
    icon: PawPrint, marketSize: 10000,
    source: 'Branchenschaetzung' },
  { code: 'banks', label: 'Banken',
    subtitle: 'Kreditinstitute & Bankfilialen',
    icon: Landmark, marketSize: 1350,
    source: 'Bundesbank 2024' },
]
```

#### 2. "Neuer Auftrag"-Button verschieben

- **Entfernen** aus dem Desk-Orders-Header (Zeile 339-342)
- **Hinzufuegen** als Plus-Button in der Seitenkopfzeile neben dem Titel "Recherche-Zentrale"
- Beim Klick oeffnet sich ein kleiner Dialog/Dropdown: Desk auswaehlen, dann wird der Auftrag erstellt
- Wenn bereits ein Desk ausgewaehlt ist, wird der Auftrag direkt fuer diesen Desk erstellt

#### 3. Marktpotenzial in jeder Kachel

Jede Desk-Karte erhaelt:
- **Progress-Balken** (contacts_extracted / marketSize)
- **Zahlen**: "142 / 35.000" (erfasst / Markt)
- **Prozent** mit Farbkodierung
- **Quellenangabe** als kleiner Text

#### 4. Grid auf 5 Kacheln (3+2 oder 5er-Grid)

`lg:grid-cols-5` fuer Desktop, `sm:grid-cols-2` bleibt.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/admin/ki-office/AdminRecherche.tsx` | DESK_CATEGORIES um marketSize/source/banks erweitern; Kachel-UI um Progress-Balken + Marktdaten; "Neuer Auftrag" aus Orders-Header entfernen und als Plus-Button in Kopfzeile; Landmark-Icon importieren |

Keine weiteren Dateien betroffen. Keine DB-Migration noetig (desk-Spalte akzeptiert beliebige Strings).

