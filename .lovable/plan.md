
# Fehlende Plus-Buttons in Investment und Krankenversicherung

## Problem

Zwei Tabs in MOD-18 haben keinen runden Plus-Button zum Anlegen neuer Eintraege:

1. **Krankenversicherung** — `ModulePageHeader` hat gar keine `actions`-Property
2. **Investment** — Der obere Header (Depot-Bereich) zeigt nur ein Badge "Depot aktiv", aber keinen Add-Button

Alle anderen Tabs (Uebersicht, Sachversicherungen, Vorsorge, Abonnements, Darlehen) nutzen korrekt den CI-Standard: `Button variant="glass" size="icon-round"` mit Plus-Icon.

## CI-Pruefung

Der CI-Standard ist durchgaengig korrekt umgesetzt in den funktionierenden Tabs:
- `variant="glass"` (nicht `default`, nicht `outline`)
- `size="icon-round"` (rund, nicht eckig)
- `Plus`-Icon aus lucide-react mit `h-5 w-5`
- Platzierung ueber die `actions`-Property von `ModulePageHeader`

Kein Tab verwendet einen abweichenden Button-Stil — die beiden fehlenden sind die einzigen Abweichungen.

## Technische Umsetzung

### Datei 1: `src/pages/portal/finanzanalyse/KrankenversicherungTab.tsx`

Plus-Button in den `ModulePageHeader` einfuegen:
- Import von `Plus` aus lucide-react ergaenzen
- `actions`-Property mit dem Standard-Button hinzufuegen
- Neuen State `showNew` anlegen fuer das Anlage-Formular
- Da KV aktuell rein auf Demo-Daten basiert, oeffnet der Button zunaechst einen Platzhalter-Flow (Toast-Hinweis oder leeres Formular), der spaeter mit echten CRUD-Operationen befuellt wird

### Datei 2: `src/pages/portal/finanzanalyse/InvestmentTab.tsx`

Der obere `ModulePageHeader` (Zeile 267-275) bekommt zusaetzlich zum Badge einen Plus-Button:
- Der Button wird neben dem bestehenden "Depot aktiv"-Badge platziert
- Aktion: Oeffnet den Depot-Onboarding-Flow oder scrollt zum Sparplan-Bereich

### Keine weiteren Dateien betroffen

Reine Ergaenzung der `actions`-Property in zwei bestehenden `ModulePageHeader`-Aufrufen.
