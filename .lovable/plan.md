
# Fix: "Objekte aus Kaufy" — 3-Zeilen Multi-Asset-Design

## Ist-Zustand (Screenshot)
Die Kaufy-Karte zeigt:
- 1x Suchfeld ("Objekt suchen...")
- 1x Button ("Objekt uebernehmen")
- Dropdown-Ergebnisse: nur 2 Zeilen pro Treffer

## Soll-Zustand (3-Zeilen-Design)
Jeder Suchtreffer im Dropdown zeigt 3 klar getrennte Zeilen:
- **Zeile 1**: Public-ID + Titel (fett)
- **Zeile 2**: PLZ, Ort, Strasse
- **Zeile 3**: Kaufpreis, Objekttyp, Wohnflaeche

Die Multi-Select-Chips unterhalb der Suche zeigen ebenfalls mehr Kontext.

## Aenderungen

### Datei: `src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx`

**Dropdown-Ergebnisse (2x vorhanden: Standard + Split-View)**

Aktuell (2 Zeilen):
```
Ohne Titel
Berlin (10115) — 250.000 EUR
```

Neu (3 Zeilen):
```
SOT-I-00042 — Eigentumswohnung
10115 Berlin, Musterstr. 5
250.000 EUR | ETW | 75 qm
```

Konkret werden die `button`-Elemente in den Dropdown-Listen (Zeilen 279-284 und 422-425) um eine dritte Zeile erweitert:
- Zeile 1: `public_id` + `title` (oder Objekttyp als Fallback)
- Zeile 2: `postal_code` + `city` + Adresse (falls vorhanden)
- Zeile 3: `asking_price` + `property_type` + `living_area`

**Multi-Select-Chips** (Zeilen 289-294 und 432-437):
Erweitert um Objekttyp und Flaeche, z.B.:
```
SOT-I-00042 | 10115 Berlin | 250.000 EUR | ETW 75qm  [x]
```

### Umfang
- Nur 1 Datei betroffen: `FMFinanzierungsakte.tsx`
- Aenderungen an 4 Stellen (je 2x Standard-Layout, 2x Split-View-Layout, da der Code dupliziert ist)
- Keine Datenbank-Aenderungen
- Keine neuen Abhaengigkeiten

### Hinweis zum Split-View
Der Split-View-Toggle funktioniert korrekt im Code. Er ist im Screenshot sichtbar. Falls er nicht reagiert, pruefe ich nach der Implementierung nochmals die Klick-Logik.
