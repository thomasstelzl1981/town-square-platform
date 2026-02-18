
# Datenraum-Extraktion und Dokumenten-Auslesung — Neustrukturierung der Einstellungen

## Problem

Die Einstellungen-Seite zeigt aktuell eine einzelne "Dokumenten-Auslesung"-Kachel (Kachel C), die Posteingang und Storage-Extraktion vermischt. Die bereits gebaute Storage Extraction Engine (ENG-STOREX mit scan/start/process-batch) hat kein Frontend. Ausserdem fehlen klare Erklaerungen, was Armstrong mit den extrahierten Daten machen kann.

---

## Loesung

Kachel C wird in **zwei separate Kacheln** aufgeteilt und die ENG-STOREX wird mit einer interaktiven Scan-/Freigabe-UI eingebunden:

### Neue Kachelstruktur (4 Kacheln + Engine-Card)

| Kachel | Titel | Inhalt |
|--------|-------|--------|
| A | Speicherplatz | Unveraendert |
| B | Digitaler Postservice | Unveraendert |
| C | Posteingangs-Auslesung | Automatische Pipeline fuer eingehende PDFs |
| D | Datenraum-Extraktion | **NEU** — Scan/Angebot/Freigabe fuer eigene Dateien |
| E | Document Intelligence Engine | Unveraendert (DataEngineInfoCard) |

---

## Kachel C: Posteingangs-Auslesung (refactored)

Fokus: **Automatische End-to-End-Verarbeitung** eingehender Dokumente.

**Inhalt:**
- Toggle: "Automatische Auslesung aktivieren" (bestehend)
- Erklaerung: "Neue Dokumente im Posteingang werden automatisch analysiert"
- Pipeline-Schritte:
  1. PDF empfangen
  2. Texterkennung (OCR/Gemini Vision)
  3. Dokumententyp erkennen
  4. In passende Akte sortieren
  5. Fuer Armstrong durchsuchbar machen
- Kosten: 1 Credit pro Dokument
- Armstrong-Beispiele:
  - "Zeige mir alle Rechnungen vom letzten Monat"
  - "Fasse den Mietvertrag Musterstr. 5 zusammen"
  - "Welche offenen Fristen habe ich?"

---

## Kachel D: Datenraum-Extraktion (NEU)

Fokus: **Bulk-Analyse bestehender Dateien** — der Scan/Angebot/Freigabe-Flow.

**Inhalt:**
- Erklaerung: "Machen Sie Ihren gesamten Datenraum fuer Armstrong durchsuchbar"
- Button "Datenraum scannen" → ruft `sot-storage-extractor` mit `action: scan` auf
- Nach Scan: Kostenvoranschlag anzeigen:
  - Dokumente gesamt: X
  - Bereits extrahiert: Y
  - Zu verarbeiten: Z
  - Geschaetzte Kosten: Z Credits (Z × 0,25 EUR)
  - Geschaetzte Dauer: ~N Minuten
- Button "Extraktion starten" → ruft `action: start` auf
- Waehrend Extraktion: Fortschrittsbalken mit polling (`action: status`)
- Button "Abbrechen" waehrend der Verarbeitung
- NK-Beleg-Parsing als Unterpunkt erwaehnt
- Armstrong-Beispiele:
  - "Durchsuche alle meine Dokumente nach Kuendigungsfristen"
  - "Erstelle eine Uebersicht aller Versicherungspolicen"
  - "Finde alle Nebenkostenabrechnungen der letzten 3 Jahre"

---

## Technische Aenderungen

### `src/pages/portal/dms/EinstellungenTab.tsx`

- Kachel C wird auf Posteingangs-Auslesung fokussiert (reduziert, mit Armstrong-Beispielen)
- **Neue Kachel D** eingefuegt zwischen Kachel C und DataEngineInfoCard
- Kachel D enthaelt:
  - States: `scanResult`, `jobStatus`, `isScanning`, `isExtracting`
  - `scanStorageMutation`: ruft `sot-storage-extractor` mit `action: 'scan'`
  - `startExtractionMutation`: ruft mit `action: 'start'`
  - `processBatchMutation`: ruft mit `action: 'process-batch'` (getriggert nach start und nach jedem batch)
  - Polling via `useQuery` mit `refetchInterval` auf `action: 'status'` waehrend `isExtracting`
  - Progress-Anzeige mit `Progress`-Komponente
  - Cancel-Button: ruft `action: 'cancel'`

### `src/components/dms/DataEngineInfoCard.tsx`

- Phase-2-Items "Storage-Extraktion" und "NK-Beleg-Parsing" von `status: 'planned'` auf den korrekten `status: 'live'` umstellen (sie sind bereits als 'live' markiert, also nur noch das Styling angleichen — gruene Badges statt amber)

---

## Umsetzungsreihenfolge

1. Kachel C refactoren (Posteingangs-Fokus + Armstrong-Beispiele)
2. Kachel D erstellen (Scan/Angebot/Freigabe-UI mit sot-storage-extractor Calls)
3. DataEngineInfoCard: Live-Items in Phase 1 verschieben
4. Testen: Scan-Flow, Fortschrittsanzeige, Cancel
