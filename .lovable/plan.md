

# Posteingang -- Soll-Ist-Analyse und Korrekturplan

## Analyse

### IST-Zustand
- **Posteingang-Tab** (`PosteingangTab.tsx`): Zeigt NUR die Inbox (Aktivierungskarte bei fehlendem Vertrag ODER E-Mail-Liste bei aktivem Vertrag)
- **Intelligenz-Tab** (`EinstellungenTab.tsx`): Enthaelt die Steuer-Kacheln mit Switches:
  - Kachel 1: Datenraum-Extraktion (StorageExtractionCard)
  - Kachel 2: Posteingangs-Auslesung (OCR-Toggle/Switch)
  - Kachel 3: Speicherplatz
  - Kachel 4: Digitaler Postservice (Nachsendeauftrag)
- Die Switches fuer Aktivierung sind vom Posteingang **abgetrennt** auf einem anderen Tab

### SOLL-Zustand
- **Posteingang-Tab** zeigt OBEN den Inbox-Bereich (E-Mail-Liste oder Aktivierungskarte) und DARUNTER die relevanten Steuerungs-Switches:
  - Posteingangs-Auslesung (OCR on/off)
  - Datenraum-Extraktion
  - Postservice-Aktivierung
- Alle zusammengehoerenden Funktionen auf EINER Seite, nicht verstreut ueber zwei Tabs

## Korrekturplan

### Schritt 1: Steuerungs-Kacheln als eigenstaendige Komponenten extrahieren
Die drei relevanten Kacheln aus `EinstellungenTab.tsx` werden in eigene Komponenten ausgelagert, damit sie in beiden Kontexten (Intelligenz-Tab UND Posteingang-Tab) wiederverwendbar sind:
- `PosteingangAuslesungCard` -- OCR-Switch + Pipeline-Uebersicht
- `PostserviceCard` -- Nachsendeauftrag-Verwaltung

Die `StorageExtractionCard` existiert bereits als eigene Komponente.

### Schritt 2: PosteingangTab erweitern
Die `PosteingangTab.tsx` wird um die extrahierten Kacheln ergaenzt:
- OBEN: Bestehender Inbox-Bereich (E-Mail-Tabelle oder Aktivierungskarte)
- UNTEN: Steuerungs-Kacheln in einem Grid-Layout:
  - Posteingangs-Auslesung (OCR-Switch)
  - Datenraum-Extraktion
  - Postservice-Karte

### Schritt 3: EinstellungenTab (Intelligenz) bereinigen
Die `EinstellungenTab` verwendet die gleichen extrahierten Komponenten, sodass kein doppelter Code entsteht. Die Intelligenz-Seite bleibt als Konfigurationsuebersicht bestehen, referenziert aber die gleichen Komponenten.

## Technische Umsetzung

### Neue Dateien
- `src/components/dms/PosteingangAuslesungCard.tsx` -- OCR-Toggle-Kachel (extrahiert aus EinstellungenTab Zeilen 234-310)
- `src/components/dms/PostserviceCard.tsx` -- Nachsendeauftrag-Kachel (extrahiert aus EinstellungenTab Zeilen 388-530)

### Geaenderte Dateien
- `src/pages/portal/dms/PosteingangTab.tsx` -- Import und Einbindung der 3 Steuerungskacheln unterhalb des Inbox-Bereichs
- `src/pages/portal/dms/EinstellungenTab.tsx` -- Inline-Code durch die neuen Komponenten ersetzen (Deduplizierung)

### Layout-Struktur PosteingangTab (nach Aenderung)

```text
+--------------------------------------------------+
|  POSTEINGANG                                     |
|  Dein digitaler Postservice fuer eingehende Dok. |
+--------------------------------------------------+
|                                                  |
|  [Inbox-Bereich: E-Mail-Tabelle oder             |
|   Aktivierungskarte wenn kein Vertrag]           |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  [Steuerungs-Grid: 3 Spalten]                    |
|  +----------------+ +----------------+ +--------+|
|  | Posteingangs-  | | Datenraum-     | | Post-  ||
|  | Auslesung      | | Extraktion     | | service||
|  | [OCR Switch]   | | [Scan/Analyze] | | [Auft.]||
|  +----------------+ +----------------+ +--------+|
|                                                  |
+--------------------------------------------------+
```

## Zusammenfassung
- Kein Routing-Problem -- die Seite rendert korrekt
- Problem: Steuerungs-Switches auf falschem Tab (Intelligenz statt Posteingang)
- Loesung: Komponenten extrahieren und in PosteingangTab unterhalb der Inbox einbinden
- Nebeneffekt: EinstellungenTab wird schlanker durch Wiederverwendung der gleichen Komponenten

