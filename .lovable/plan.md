
# CTA-Widgets durch Header-Plus-Button ersetzen

## Problem
Die leeren Platzhalter-Widgets (gestrichelte Rahmenkacheln mit "Hinzufuegen") belegen eine volle Kachelposition im WidgetGrid und stoeren das visuelle Layout.

## Loesung
Jede `ModulePageHeader`-Zeile erhaelt einen runden Plus-Button als `actions`-Prop. Die bestehenden CTA-WidgetCells werden entfernt.

## Betroffene Dateien

### 1. UebersichtTab.tsx
- **Entfernen:** CTA-WidgetCell "Person hinzufuegen" (Zeilen ~370-387)
- **Aendern:** `ModulePageHeader` erhaelt `actions`-Prop mit rundem Plus-Button, der `setShowNewPerson(true)` auslst

### 2. SachversicherungenTab.tsx
- **Entfernen:** CTA-WidgetCell "Versicherung hinzufuegen" (Zeilen ~345-362)
- **Aendern:** `ModulePageHeader` erhaelt `actions`-Prop mit rundem Plus-Button, der `setShowNew(true)` ausloest

### 3. VorsorgeTab.tsx
- **Entfernen:** CTA-WidgetCell "Vorsorgevertrag hinzufuegen" (Zeilen ~250-267)
- **Aendern:** `ModulePageHeader` erhaelt `actions`-Prop mit rundem Plus-Button, der `setShowNew(true)` ausloest

### 4. AbonnementsTab.tsx
- **Entfernen:** CTA-WidgetCell "Abonnement hinzufuegen" (Zeilen ~254-272, inkl. DesktopOnly-Wrapper)
- **Aendern:** `ModulePageHeader` erhaelt `actions`-Prop mit rundem Plus-Button, der `setShowNew(true)` ausloest

### 5. KrankenversicherungTab.tsx und VorsorgedokumenteTab.tsx
- Keine CTA-Widgets vorhanden — keine Aenderung noetig

## Button-Muster (einheitlich fuer alle Tabs)

```text
<ModulePageHeader
  title="..."
  description="..."
  actions={
    <Button
      size="icon-round"
      onClick={() => { setShowNew(true); setSelectedId(null); }}
      className="h-10 w-10"
    >
      <Plus className="h-5 w-5" />
    </Button>
  }
/>
```

Der `icon-round` Variant existiert bereits in der Button-Komponente (`h-12 w-12 rounded-full`). Es wird `h-10 w-10` per className angepasst fuer ein kompakteres Erscheinungsbild.

## Zusammenfassung der Aenderungen

| Datei | Entfernt | Hinzugefuegt |
|-------|----------|--------------|
| UebersichtTab.tsx | CTA-WidgetCell (Person) | Plus-Button in Header |
| SachversicherungenTab.tsx | CTA-WidgetCell (Versicherung) | Plus-Button in Header |
| VorsorgeTab.tsx | CTA-WidgetCell (Vorsorge) | Plus-Button in Header |
| AbonnementsTab.tsx | CTA-WidgetCell + DesktopOnly (Abo) | Plus-Button in Header |

Keine strukturellen Aenderungen an `ModulePageHeader` selbst noetig — die `actions`-Prop wird bereits unterstuetzt.
