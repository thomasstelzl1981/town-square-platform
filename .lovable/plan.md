
# CI/UX-Analyse und Optimierung: Modul Finanzierung (MOD-07)

## Befunde aus der Analyse

### 1. Selbstauskunft-Tab
**Problem A: Fortschrittsbalken (Progress Bar)**
Der sticky Header in `SelbstauskunftFormV2.tsx` (Zeile 370-400) zeigt einen prominenten `<Progress>` Balken plus eine Badge mit Prozentzahl. Das ist visuell zu dominant und passt nicht zum CI-Standard.

**Loesung**: Progress-Balken komplett entfernen. Stattdessen nur die bereits vorhandene Badge (Zeile 374) rechts oben im Header belassen — diese zeigt bereits den Prozentsatz in kompakter Form. Die Badge wird dezenter gestaltet (kleiner, `variant="outline"`).

**Problem B: Fehlende Ueberschrift**
Kein `ModulePageHeader` vorhanden.

**Loesung**: `ModulePageHeader` mit title="Private Selbstauskunft" und description="Ihre permanente Bonitaetsauskunft" einfuegen.

---

### 2. Dokumente-Tab
**Problem: Eigenstaendiges Status-Header-Widget passt nicht zum DMS-Standard**
Die `FinanceDocumentsManager.tsx` rendert eine separate Status-Card (Zeilen 361-392) mit Progress-Bar, Badges und DocumentReminderToggle OBERHALB des `StorageFileManager`. Das widerspricht dem Storage-System-Standard (Spaltenansicht als primaeres UI-Element, keine zusaetzlichen Karten darueber).

**Loesung**:
- Die gesamte Status-Card (Dokumentenstatus mit Progress, Badges) entfernen
- Stattdessen einen `ModulePageHeader` mit title="Dokumente" und description="Bonitaets- und Objektunterlagen" einfuegen
- Den Completion-Prozentsatz als dezente Badge im Header oder gar nicht anzeigen (analog zur Selbstauskunft)
- Der `StorageFileManager` wird direkt als Hauptelement gerendert, wie im DMS-Standard vorgeschrieben

---

### 3. Anfrage-Tab: "Objekte aus Kaufy"-Kachel
**Problem: Inkonsistentes Design gegenueber MagicIntakeCard**
Die MagicIntakeCard hat: Icon + Titel + ausfuehrliche Beschreibung + Eingabefelder + blauer Button (Zeilen 127-172).
Die Kaufy-Card hat: Icon + Titel + kurze Beschreibung + nur ein Input-Feld, KEIN blauer Button (Zeilen 122-159 in AnfrageTab.tsx). Es fehlt der visuelle Abschluss mit dem blauen CTA-Button.

In MOD-11 (`FMFinanzierungsakte.tsx`) gibt es das identische Problem — es existieren ZWEI separate Inline-Renderings der Kaufy-Card (Zeilen 259-301 fuer Split-View und Zeilen 410-450 fuer Normal-View), die ebenfalls keinen blauen Button haben.

**Loesung fuer MOD-07 (AnfrageTab.tsx)**:
- Einen blauen Suche-Button unter dem Input einfuegen (analog zur Magic Intake "aktivieren"-Struktur)
- Das Dropdown-Ergebnis in 3 Zeilen formatieren:
  - Zeile 1: Public-ID + Titel
  - Zeile 2: PLZ + Ort
  - Zeile 3: Preis + Flaeche + Typ
- Button-Label: "Marktplatz durchsuchen" mit ShoppingBag-Icon

Fuer MOD-11 wird nur die MOD-07-Kachel korrigiert, da MOD-11 ein separates Arbeitspaket ist.

---

### 4. Status-Tab
Keine wesentlichen CI-Verstoesse festgestellt. Der Progress-Balken im Status-Tab ist hier kontextuell korrekt (zeigt den Fallfortschritt, nicht die Formular-Vollstaendigkeit).

---

## Umsetzungsplan

| Nr | Datei | Aenderung |
|----|-------|-----------|
| 1 | `SelbstauskunftTab.tsx` | `ModulePageHeader` einfuegen (title="Private Selbstauskunft", description="Ihre permanente Bonitaetsauskunft") |
| 2 | `SelbstauskunftFormV2.tsx` | Progress-Bar (Zeile 399) aus dem sticky Header entfernen. Badge bleibt, wird auf `variant="outline"` und kleinere Schrift gesetzt |
| 3 | `FinanceDocumentsManager.tsx` | Status-Card (Zeilen 361-392) komplett entfernen. `ModulePageHeader` einfuegen. `StorageFileManager` direkt rendern |
| 4 | `AnfrageTab.tsx` | Kaufy-Card: Blauen Button "Marktplatz durchsuchen" unter dem Input einfuegen. Dropdown-Ergebnisse im 3-Zeilen-Format (ID/Titel, Adresse, Preis/Flaeche) |

## Keine DB- oder Schema-Aenderungen erforderlich
