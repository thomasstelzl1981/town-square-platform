

# Investment-Tab Redesign: Ein Plus-Button fuer FinAPI-Depot

## Problem (IST-Zustand)

Die Seite hat 3 separate Plus-Buttons/Header:
1. "INVESTMENT" Header + Plus (Depot-Person)
2. "INVESTMENT-SPARPLAENE" Header + Plus (Sparplan anlegen)
3. "WERTPAPIER-DEPOTS (READ-ONLY)" Header + eigener Button

## Loesung (SOLL-Zustand)

**Ein einziger [+] Button** im Header. Klick oeffnet einen Dialog mit:
1. Info-Text (Erklaerung)
2. **Einen** Aktions-Button: "Depot anbinden (FinAPI)"

Kein Sparplan-Button im Dialog — Sparplaene sind Demo-Daten und brauchen keine Neuanlage.

## Neue Seitenstruktur (Skizze)

```text
+------------------------------------------------------------------+
| INVESTMENT                                           [+]         |
| Wertpapiere, ETFs und Depot-Verwaltung                           |
+------------------------------------------------------------------+
|                                                                  |
| Klick auf [+] oeffnet Dialog:                                    |
| +----------------------------------------------------------+    |
| | "Wenn Sie hier ein eigenes Depot anbinden, koennen Sie    |    |
| | darueber nicht traden. Es dient nur der Ueberwachung.     |    |
| | Wenn Sie direkt aus Ihrem Portal heraus mit Wertpapieren  |    |
| | handeln moechten, koennen Sie unten ueber unseren Partner |    |
| | Upvest direkt im Portal ein eigenes Depot anlegen."       |    |
| |                                                           |    |
| |                      [Depot anbinden (FinAPI)]             |    |
| +----------------------------------------------------------+    |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
| [Person 1] [Person 2] [Person 3]    (Person-Kacheln WidgetGrid) |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
| [Sparplan A (DEMO)] [Sparplan B (DEMO)] [FinAPI Depot 1]        |
|  (Alle Investments in einem WidgetGrid — kein eigener Header)    |
|                                                                  |
+------------------------------------------------------------------+
| (Inline-Detail wenn Sparplan angeklickt)                         |
| (Inline-Positionen-Tabelle wenn FinAPI-Depot angeklickt)         |
+------------------------------------------------------------------+
| Polling-Card (nur sichtbar waehrend FinAPI-Verbindung)           |
+------------------------------------------------------------------+
|                                                                  |
| ARMSTRONG DEPOT                                                   |
| (Upvest Promo + Onboarding — unveraendert)                      |
|                                                                  |
+------------------------------------------------------------------+
```

## Funktionsbeschreibung

### Plus-Button und Dialog

Der [+] Button oben rechts oeffnet einen **AlertDialog**:

- **Info-Text**: "Wenn Sie hier ein eigenes Depot anbinden, koennen Sie darueber nicht traden. Es dient nur der Ueberwachung. Wenn Sie direkt aus Ihrem Portal heraus mit Wertpapieren handeln moechten, koennen Sie unten ueber unseren Partner Upvest direkt im Portal ein eigenes Depot anlegen."
- **Ein Button**: "Depot anbinden (FinAPI)" — startet den Web Form 2.0 Flow (Popup + Polling)
- Kein Sparplan-Button. Sparplaene sind Demo-Daten und benoetigen keine Neuanlage.

### Entfallende Elemente

- **"Investment-Sparplaene" Header** (Zeile 343-355): Komplett entfernen. Die Sparplan-Kacheln bleiben, aber ohne eigenen Header/Plus-Button.
- **FinAPIDepotSection** als separate Komponente: Entfernen. Logik (connect, poll, sync, delete, Queries) wandert direkt in InvestmentTab.

### Gemeinsames WidgetGrid

Sparplan-Kacheln und FinAPI-Depot-Kacheln werden in **einem Grid** dargestellt (kein separater Header). Reihenfolge: Sparplaene zuerst, dann FinAPI-Depots.

### Inline-Details

- Klick auf Sparplan: Bestehendes Detail-Formular oeffnet sich darunter (unveraendert)
- Klick auf FinAPI-Depot: Positionen-Tabelle oeffnet sich darunter (aus FinAPIDepotSection uebernommen)

### Polling-Card

Direkt in InvestmentTab gerendert, erscheint nur waehrend einer aktiven FinAPI-Verbindung.

### Armstrong Depot

Bleibt komplett unveraendert am Ende der Seite.

## Technische Aenderungen

### 1. InvestmentTab.tsx

- **Header-Plus-Button**: Oeffnet `AlertDialog` mit Info-Text und einem "Depot anbinden"-Button (statt direkt Depot-Status zu toggeln)
- **Neuer State**: `showDepotDialog: boolean`, plus alle States/Queries/Mutations aus FinAPIDepotSection (isPolling, selectedDepotId, pollIntervalRef, pollTimeoutRef, connectMutation, syncMutation, deleteMutation, depotAccounts-Query, depotPositions-Query)
- **Entfernen**: `ModulePageHeader` fuer "Investment-Sparplaene" (Zeile 343-355) inkl. Plus-Button
- **Entfernen**: `<FinAPIDepotSection>` Import und Aufruf (Zeile 35, 459)
- **Entfernen**: `showNewSpar` State und das "Neuer Investment-Sparplan"-Formular (Zeile 118-123, 442-455) — Demo-Daten brauchen keine Anlage
- **WidgetGrid**: Kombiniert `investmentContracts.map(...)` + `depotAccounts.map(...)` in einem Grid
- **Inline-Positionen**: Wenn `selectedDepotId` gesetzt, erscheint die Positionen-Tabelle unter dem Grid
- **Polling-Card**: Direkt in InvestmentTab gerendert

### 2. FinAPIDepotSection.tsx

- Wird **geloescht** — alle Logik und UI wandern in InvestmentTab

### Zu aendernde Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/finanzanalyse/InvestmentTab.tsx` | Dialog statt 3 Plus-Buttons, FinAPI-Logik integriert, ein WidgetGrid |
| `src/components/finanzanalyse/depot/FinAPIDepotSection.tsx` | Loeschen |

