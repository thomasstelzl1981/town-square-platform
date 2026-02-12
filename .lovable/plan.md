
# Konsolidierter Redesign-Plan: Immobilienakte + Split-View (systemweit)

## Zusammenfassung

Dieser Plan fasst beide vorherigen Vorschlaege zusammen und ergaenzt die systemweite Full-Width-Logik fuer alle Split-View-Stellen.

---

## Teil 1: PageShell — fullWidth-Prop (Grundlage fuer alles)

### Aenderung: `src/components/shared/PageShell.tsx`

Neue optionale Prop `fullWidth?: boolean`. Bei `true` wird `max-w-7xl` durch `max-w-full` ersetzt.

```text
Vorher:  className="max-w-7xl mx-auto p-4 md:p-6 space-y-6"
Nachher: className={cn(fullWidth ? 'max-w-full' : 'max-w-7xl', 'mx-auto p-4 md:p-6 space-y-6')}
```

---

## Teil 2: Immobilienakte — Neues Zeilen-Layout + Split-View

### Aenderung: `src/components/immobilienakte/EditableUnitDossierView.tsx`

Das bisherige 3-Spalten-Grid (Left 2/3 + Right 1/3) wird durch ein zeilenbasiertes Layout ersetzt:

```text
ROW 1: 3 schmale Kacheln (grid-cols-3)
+------------------+------------------+------------------+
| Identitaet       | Gebaeude/Flaeche | Investment-KPIs  |
+------------------+------------------+------------------+

ROW 2: Volle Breite
+====================================================+
| Adresse & Objektbeschreibung                        |
+====================================================+

ROW 3: 2 Spalten (grid-cols-2)
+---------------------------+---------------------------+
| Grundbuch & Erwerb        | Finanzierung              |
+---------------------------+---------------------------+

ROW 4: 2 Spalten (grid-cols-2)
+---------------------------+---------------------------+
| Mietverhaeltnis           | WEG & Hausgeld            |
+---------------------------+---------------------------+

ROW 5: 2/3 + 1/3 (grid-cols-3)
+------------------------------------+------------------+
| Dokumente-Checklist                | (leer / Reserve) |
+------------------------------------+------------------+
```

Die Simulation wird NICHT inline eingebettet, sondern ueber den Split-View neben der Akte angezeigt.

### Aenderung: `src/pages/portal/immobilien/PropertyDetailPage.tsx`

1. **Split-View Toggle** im Header (neben dem Zurueck-Button), identisch zum Muster in FMFallDetail:
   - Standard-Button (LayoutList-Icon)
   - Split-View-Button (LayoutPanelLeft-Icon)
   - Nur sichtbar ab `lg` Bildschirmbreite

2. **Split-View Modus:**
   - Tabs werden ausgeblendet
   - Linke Spalte: Akte (EditableUnitDossierView) — scrollbar
   - Rechte Spalte: Simulation (InventoryInvestmentSimulation) — scrollbar
   - Hoehe: `calc(100vh - 220px)`

3. **Standard Modus:** Tabs wie bisher (Akte, Simulation, Expose, etc.)

4. **PageShell:** Die Seite wird in `<PageShell fullWidth={splitView}>` gewrappt (aktuell nutzt sie kein PageShell).

### Aenderung: `src/components/immobilienakte/editable/EditableIdentityBlock.tsx`

Kompakter machen:
- Modul-Status-Indikatoren (Verkauf/Vermietung) in eine einzelne Zeile zusammenfassen
- Reporting-Regime und WEG-Flag zusammenruecken
- Ziel: ca. 30% weniger Hoehe, damit Row 1 funktioniert

### Aenderung: `src/components/immobilienakte/editable/EditableBuildingBlock.tsx`

Kompakter machen:
- Energieausweis-Felder (Typ, Wert, Gueltig bis) in eine Zeile zusammenfassen statt eigene Sektion
- Ziel: ca. 20% weniger Hoehe

---

## Teil 3: Bestehende Split-Views — Full-Width aktivieren

Es gibt genau 2 Stellen mit bestehendem Split-View, beide nutzen `PageShell` ohne `fullWidth`:

### Aenderung: `src/pages/portal/finanzierungsmanager/FMFallDetail.tsx` (Zeile 540)

```text
Vorher:  <PageShell>
Nachher: <PageShell fullWidth={splitView}>
```

### Aenderung: `src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx` (Zeile 202)

```text
Vorher:  <PageShell>
Nachher: <PageShell fullWidth={splitView}>
```

---

## Keine Datenbank-Aenderungen noetig

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/components/shared/PageShell.tsx` | `fullWidth` Prop hinzufuegen |
| `src/components/immobilienakte/EditableUnitDossierView.tsx` | Neues Zeilen-Layout (Row 1-5) |
| `src/pages/portal/immobilien/PropertyDetailPage.tsx` | Split-View Toggle + PageShell Wrapper |
| `src/components/immobilienakte/editable/EditableIdentityBlock.tsx` | Kompakter (Felder zusammenfassen) |
| `src/components/immobilienakte/editable/EditableBuildingBlock.tsx` | Kompakter (Energie-Sektion zusammenfassen) |
| `src/pages/portal/finanzierungsmanager/FMFallDetail.tsx` | `PageShell fullWidth={splitView}` |
| `src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx` | `PageShell fullWidth={splitView}` |
