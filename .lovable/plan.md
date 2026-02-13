
# Sanierung: Inline-Formular statt Pop-up

## Konzept

Klick auf das CTA-Widget "Neue Sanierung starten" oeffnet kein Dialog-Popup mehr, sondern blendet unterhalb des Widget-Grids ein Inline-Formular ein. Der Vorgang wird erst beim Klick auf "Weiter" tatsaechlich in der Datenbank angelegt.

## Aenderungen

### 1. `src/pages/portal/immobilien/SanierungTab.tsx`
- State `createDialogOpen` wird zu `showCreateForm` (boolean)
- Klick auf CTA-Widget setzt `showCreateForm = true`
- Unterhalb des `WidgetGrid` wird bei `showCreateForm === true` eine neue Inline-Komponente `ServiceCaseCreateInline` gerendert
- `ServiceCaseCreateDialog`-Import und -Aufruf werden entfernt

### 2. Neue Datei: `src/components/portal/immobilien/sanierung/ServiceCaseCreateInline.tsx`
- Enthaelt die gleiche Logik wie der bisherige Dialog (Property-Select, Unit-Select, Beschreibung, Dictation-Button, KI-Hinweis)
- Aber als `Card` statt als `Dialog` gerendert — volle Breite, unterhalb des Grids
- Props: `onCancel` (klappt zu), `onSuccess` (navigiert zum Case)
- Beim Oeffnen werden die Queries fuer Properties/Units aktiviert (wie bisher mit `enabled`)
- "Abbrechen"-Button klappt das Formular wieder zu
- "Weiter"-Button erstellt den Vorgang (wie bisher `handleSubmit`)

### 3. `ServiceCaseCreateDialog.tsx`
- Bleibt vorerst bestehen (wird evtl. noch anderswo verwendet), aber wird aus SanierungTab nicht mehr importiert

## Layout nach Klick

```text
+--- Widget Grid (4 Spalten) --------------------------------+
| [+ Neue Sanierung]  [Case 1]  [Case 2]  [Case 3]          |
+------------------------------------------------------------+

+--- Inline-Formular (volle Breite, Card) -------------------+
| Sanierung erfassen                                          |
|                                                             |
| Objekt:      [Dropdown _______________]                     |
| Einheit:     [Dropdown _______________]                     |
| Beschreibung: [Textarea ______________]          [Mikrofon] |
|                                                             |
| Sparkles  KI erstellt Leistungsverzeichnis...               |
|                                                             |
|                          [Abbrechen]  [Weiter ->]           |
+------------------------------------------------------------+
```

## Technische Details

- Die neue Inline-Komponente uebernimmt 1:1 die Formularlogik aus `ServiceCaseCreateDialog` (Queries, States, handleSubmit)
- Statt `Dialog`/`DialogContent` wird `Card`/`CardContent`/`CardHeader`/`CardFooter` verwendet
- Die `enabled`-Bedingung der Queries nutzt einen `visible`-Prop statt `open`
- Animation: `animate-in` oder einfaches Einblenden via bedingtes Rendering
