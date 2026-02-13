

# Reparatur: Demo-Widget Klickverhalten und Daten-Isolation

## Problem (aus Screenshots)

1. **Klick auf Demo-Widget** oeffnet eine einzelne Immobilienakte (UnitDossierView) inline im Portfolio. Das ist falsch. Das Demo-Widget soll nur ein visueller Indikator sein, dass Demo-Daten aktiv sind — kein Klick-Dossier oeffnen.

2. **Demo deaktiviert** zeigt trotzdem Daten. Der `is_demo`-Filter auf der embedded relation (`properties.is_demo`) funktioniert moeglicherweise nicht korrekt mit Supabase PostgREST embedded filters.

## Loesung

### Aenderung 1: Inline-Dossier komplett entfernen

In `src/pages/portal/immobilien/PortfolioTab.tsx`:

- Die `selectedDemoId` State-Variable entfernen
- Die `DEMO_DOSSIER_DATA` Konstante (ca. 80 Zeilen hartcodierte Dossier-Daten) komplett entfernen
- Den `UnitDossierView`-Import entfernen (falls nur hier verwendet)
- Den Block (Zeilen 935-943) mit dem inline `UnitDossierView` entfernen
- Das Demo-Widget (Zeile 782-823) aendern: Kein onClick-Toggle mehr fuer `selectedDemoId`, sondern nur noch ein statisches Widget ohne Klick-Aktion (oder optional: Klick navigiert zur ersten Demo-Property-Detailseite)

### Aenderung 2: Demo-Filter robust machen

Der aktuelle Filter `.eq('properties.is_demo', false)` funktioniert bei Supabase embedded relations als "Filter auf die eingebettete Relation", nicht als WHERE-Clause auf die Haupttabelle. Das heisst: Units werden trotzdem zurueckgegeben, nur die `properties`-Daten sind `null`.

Korrekte Loesung: Statt den embedded Filter zu nutzen, die Units **nach** dem Fetch filtern:

```text
// Nach dem Fetch:
if (!demoEnabled) {
  units = units.filter(u => !u.properties?.is_demo);
}
```

Gleiche Logik fuer die Loans-Query: Nach dem Fetch die Demo-Property-IDs ausfiltern.

### Aenderung 3: Demo-Widget vereinfachen

Das Demo-Widget bleibt als visueller Indikator mit gruenem Rahmen sichtbar, wenn `demoEnabled` aktiv ist. Kein Klick-Zustand, kein `selectedDemoId`, kein Ring-Toggle. Optional: Klick auf das Widget navigiert zu `/portal/immobilien/d0000000-0000-4000-a000-000000000001` (Property-Detailseite).

### Betroffene Dateien

Nur eine Datei: `src/pages/portal/immobilien/PortfolioTab.tsx`

- `selectedDemoId` State entfernen
- `DEMO_DOSSIER_DATA` Konstante entfernen (ca. Zeilen 678-765)
- Inline-Dossier Block entfernen (Zeilen 935-943)
- Demo-Widget onClick aendern (kein Toggle, optional Navigation)
- Post-Fetch-Filter statt embedded `.eq()` fuer `is_demo`
- `UnitDossierView` Import entfernen (falls nicht anderswo gebraucht)

### Ergebnis

- **Demo AN**: Portfolio zeigt 3 Objekte in Tabelle, KPIs, Charts, EUeR. Demo-Widget leuchtet gruen als Indikator. Kein Inline-Dossier.
- **Demo AUS**: Portfolio ist komplett leer (keine Daten, keine Charts). Demo-Widget nicht sichtbar.
- Klick auf eine Tabellenzeile navigiert wie gewohnt zur Property-Detailseite.
