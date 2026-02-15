

# Reparaturplan: Investment-Suche (MOD-08, MOD-09, Zone 3)

## Analyse: Soll-Flow vs. Ist-Zustand

### Soll-Flow (alle 3 Search Engines identisch)

```text
1. User oeffnet die Seite
2. Sieht NUR das Eingabeformular (zVE, EK, Familienstand, Kirchensteuer)
3. Drueckt "Ergebnisse anzeigen"
4. Investment Engine berechnet fuer JEDES Objekt die Belastung
5. Ergebnisse erscheinen MIT Bildern und MIT Berechnungsergebnissen
   (Miete, Zinsen, Tilgung, Steuerersparnis, Monatsbelastung)
```

### Ist-Zustand (kaputt)

| Problem | MOD-08 | MOD-09 | Zone 3 |
|---------|--------|--------|--------|
| Ergebnisse vor Klick sichtbar | Ja (kaputt) | Ja (kaputt) | Nein (korrekt als Demo-Preview) |
| Bilder bei Demo-Objekten | Nein | Ja | Ja |
| Berechnungsergebnisse | Nur "---" | Nur "---" | Funktioniert |
| Familienstand/Kirchensteuer lesbar | Versteckt hinter Collapsible | Versteckt hinter Collapsible | Im Suchfeld integriert |
| Phantom-Objekte | Nein | Moeglich | Nein |

---

## Ursachen-Analyse

### Problem 1: Ergebnisse erscheinen sofort ohne Berechnung
In der letzten Aenderung wurde der `hasSearched`-Gate in MOD-08 entfernt. Jetzt zeigen die Demo-Listings sofort, aber OHNE Metrics (alles "---"). In MOD-09 ist dasselbe Problem: Die `visibleListings`-Grid wird immer gerendert (Zeile 276), nicht hinter `hasSearched` geschuetzt.

**Loesung**: `hasSearched`-Gate wiederherstellen. Vor dem Druecken des Buttons zeigt MOD-08 nur das Suchformular und einen Hinweistext. Nach dem Druecken erscheinen die Ergebnisse MIT berechneten Metrics.

### Problem 2: Keine Bilder in MOD-08
Die Demo-Listings in `useDemoListings` haben `hero_image_path` mit importierten Bildern (demo-berlin.jpg etc.). ABER: Es existieren auch echte DB-Listings mit identischem Titel+Stadt. Die Dedup-Logik (Zeile 243-246 in SucheTab) bevorzugt DB-Eintraege -- und diese haben KEINE Bilder, weil `document_links` leer ist.

**Loesung**: Bei der Deduplizierung muessen die Demo-Bilder auf die DB-Listings uebertragen werden, ODER die Demo-Listings muessen Vorrang haben, wenn sie ein Bild mitbringen.

### Problem 3: Keine Berechnungsergebnisse
Die `handleInvestmentSearch`-Funktion berechnet Metrics und speichert sie unter `listing_id` als Key im Cache. Wenn Demo-Listings mit ID `demo-listing-xxx` berechnet werden, aber nach der Dedup die DB-Listings mit ID `e0000000-xxx` angezeigt werden, passen die Cache-Keys nicht zusammen. Ergebnis: alle Kacheln zeigen "---".

**Loesung**: Die Berechnung muss mit den FINALEN (nach Dedup) Listing-IDs arbeiten, nicht mit den Roh-IDs.

### Problem 4: Familienstand/Kirchensteuer nicht lesbar
Beide Felder sind hinter "Mehr Optionen" (Collapsible) versteckt. Da Familienstand und Kirchensteuer zur Kernberechnung gehoeren, sollten sie direkt sichtbar sein.

**Loesung**: Familienstand und Kirchensteuer werden in die Hauptzeile des Formulars verschoben (4-Spalten-Grid statt 3). "Mehr Optionen" wird entfernt.

### Problem 5: Phantom-Objekte in MOD-09
Die 3 DB-Listings (Berlin, Muenchen, Hamburg) existieren sowohl als Demo-Daten als auch als echte DB-Eintraege. Wenn die Dedup nicht korrekt greift (z.B. wegen Titelunterschieden), erscheinen Duplikate. Zusaetzlich: MOD-09 `BeratungTab` zeigt Demo-Listings auch OHNE dass `handleSearch` gedrueckt wurde.

**Loesung**: `hasSearched`-Gate auch in MOD-09 wiederherstellen. Demo-Listings nur nach Suche anzeigen, und korrekt mit DB-Listings deduplizieren.

---

## Reparaturplan

### Aenderung 1: MOD-08 SucheTab — hasSearched-Gate + Dedup-Fix

**Datei**: `src/pages/portal/investments/SucheTab.tsx`

- `hasSearched`-Gate wiederherstellen: Ergebnisse erst nach Button-Klick zeigen
- Vor der Suche: Nur Formular + Hinweisbox ("Geben Sie Ihre Daten ein...")
- Dedup-Logik anpassen: Wenn ein Demo-Listing ein Bild hat und das DB-Listing keines, das Demo-Bild auf das DB-Listing uebertragen
- Metrics-Cache mit den finalen (nach Dedup) Listing-IDs aufbauen
- Familienstand + Kirchensteuer aus dem Collapsible herausnehmen und direkt ins Hauptformular setzen (4er-Grid)

```text
Neues Layout:
+----------------------------------------------------------+
| SUCHE                                                     |
+----------------------------------------------------------+
| [zVE: 60.000 €] [EK: 50.000 €] [Ledig v] [KiSt: Nein v]|
|                                                           |
|              [ Ergebnisse anzeigen ]                      |
+----------------------------------------------------------+
|                                                           |
| (Vor Suche: Hinweisbox mit Icon)                         |
| "Geben Sie Ihr zVE und Eigenkapital ein, um passende     |
|  Objekte mit individueller Belastungsberechnung zu finden"|
|                                                           |
| (Nach Suche: Grid mit berechneten Ergebnissen)            |
| +----------+ +----------+ +----------+ +----------+      |
| | [BILD]   | | [BILD]   | | [BILD]   | | [BILD]   |     |
| | 280.000€ | | 420.000€ | | 175.000€ | |          |     |
| | Berlin   | | Muenchen | | Hamburg  | |          |     |
| | +24€/Mo  | | -180€/Mo | | +65€/Mo  | |          |     |
| +----------+ +----------+ +----------+ +----------+      |
+----------------------------------------------------------+
```

### Aenderung 2: MOD-09 BeratungTab — hasSearched-Gate + Demo-Berechnung

**Datei**: `src/pages/portal/vertriebspartner/BeratungTab.tsx`

- `hasSearched`-Gate wiederherstellen: Grid erst nach Suche zeigen
- Demo-Listings in die `handleSearch`-Berechnung einbeziehen (wie in MOD-08)
- Vor der Suche: PartnerSearchForm + Hinweistext
- Such-Button in `PartnerSearchForm` zentrieren

### Aenderung 3: PartnerSearchForm — Familienstand/Kirchensteuer sichtbar machen

**Datei**: `src/components/vertriebspartner/PartnerSearchForm.tsx`

- Collapsible "Mehr Optionen" entfernen
- Alle 4 Felder (zVE, EK, Familienstand, Kirchensteuer) in ein 4-Spalten-Grid
- Such-Button zentriert darunter

### Aenderung 4: MOD-08 SucheTab Investment-Form — Gleiche Aenderung

**Datei**: `src/pages/portal/investments/SucheTab.tsx`

- Collapsible "Mehr Optionen" im Investment-Modus entfernen
- 4-Spalten-Grid: zVE, EK, Familienstand, Kirchensteuer
- Such-Button zentriert

### Aenderung 5: Klassische Suche Button zentrieren

**Datei**: `src/pages/portal/investments/SucheTab.tsx`

- Button bei der klassischen Suche ebenfalls zentriert (`flex justify-center`)

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/investments/SucheTab.tsx` | hasSearched-Gate, Dedup-Fix, Bild-Uebernahme, 4-Spalten-Form, Button zentriert |
| `src/pages/portal/vertriebspartner/BeratungTab.tsx` | hasSearched-Gate, Demo-Berechnung einbeziehen |
| `src/components/vertriebspartner/PartnerSearchForm.tsx` | Collapsible entfernen, 4-Spalten-Grid, Button zentriert |

**Keine DB-Migration noetig.**

