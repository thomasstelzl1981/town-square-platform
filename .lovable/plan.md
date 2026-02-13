
# StatusTab Widget-Leiste + DokumenteTab Breitenkorrektur

## Befunde

### 1. StatusTab: Fehlende Widget-Leiste
Die StatusTab zeigt aktuell alle Anfragen als grosse, vertikale Cards untereinander an. Es fehlt die Widget-Leiste oben, mit der der Nutzer durch seine Faelle klicken kann, um den jeweiligen Status zu sehen. Stattdessen sollte:
- Oben eine `WidgetGrid` mit `WidgetCell`-Kacheln fuer jeden `finance_request` stehen (Public-ID, Status-Badge, Adresse)
- Ein Klick auf eine Kachel waehlt den Fall aus und zeigt darunter die Detail-Ansicht (Timeline, Manager-Card, Progress)
- Ohne Auswahl wird der neueste Fall angezeigt

### 2. DokumenteTab: StorageFileManager ueber volle Breite
Die `FinanceDocumentsManager`-Komponente ist in ein einfaches `<div className="space-y-4">` gehuelelt, ohne `PageShell`. Der `StorageFileManager` nimmt dadurch die gesamte Breite ein. Loesung: In eine `PageShell` einbetten, damit `max-w-7xl` greift.

---

## Aenderungen

### Datei 1: `src/pages/portal/finanzierung/StatusTab.tsx`
- `WidgetGrid` und `WidgetCell` importieren
- State `selectedRequestId` einfuehren (default: erster Request)
- Oben eine `WidgetGrid` rendern mit einer `WidgetCell` pro `finance_request`:
  - Public-ID oder Adresse als Titel
  - Status-Badge
  - Erstelldatum
  - Visuell hervorgehoben wenn selektiert (Ring/Border)
- Darunter nur die Detail-Card des selektierten Falls (Timeline, Progress, Manager) anzeigen statt aller Requests auf einmal

### Datei 2: `src/components/finanzierung/FinanceDocumentsManager.tsx`
- `PageShell` importieren
- Den aeusseren `<div className="space-y-4">` durch `<PageShell>` ersetzen, damit der Datenraum auf `max-w-7xl` begrenzt wird

---

## Technische Details

```text
StatusTab Layout (NACHHER):

WidgetGrid (max 4 Spalten, aspect-square)
+-----------+-----------+-----------+-----------+
| FR-001    | FR-002    | FR-003    | ...       |
| Musterstr | Hauptstr  | Ringweg   |           |
| [Badge]   | [Badge]   | [Badge]   |           |
+-----------+-----------+-----------+-----------+

Detail-Card (nur der selektierte Fall)
+--------------------------------------------------+
| Adresse / Public-ID          [Status-Badge]       |
| Progress-Bar                                      |
| Manager-Card (falls zugewiesen)                   |
| Timeline                                          |
+--------------------------------------------------+
```

Keine Datenbank-Aenderungen erforderlich.
