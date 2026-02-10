

# Fix: Vertriebsauftrag-Sektion wird nicht angezeigt

## Ursache

Die `SalesApprovalSection` hat auf Zeile 233-235 ein Guard:

```text
if (!projectId) {
  return null;
}
```

Wenn keine Projekte in der Datenbank existieren, ist `activeProjectId = undefined` und die gesamte Sektion verschwindet. Dasselbe galt fuer die alte Version — aber dort gab es die "Projekt-Status"-Karte darueber, die jetzt entfernt wurde. Daher sieht es so aus, als haette sich nichts geaendert.

## Loesung

1. **Fallback statt null**: Wenn kein Projekt vorhanden ist, zeigt die `SalesApprovalSection` trotzdem die Card "Vertriebsauftrag" an — aber mit einem Hinweis: "Bitte legen Sie zuerst ein Projekt an, um den Vertrieb zu aktivieren." Die Switches sind disabled.

2. **Projekt-Selektor hinzufuegen**: Wenn mehrere Projekte existieren, soll im VertriebTab ein Dropdown oben erscheinen, mit dem man das aktive Projekt waehlen kann. Aktuell wird immer nur `projects[0]` verwendet.

## Aenderungen

### Datei 1: `src/components/projekte/SalesApprovalSection.tsx`

- Zeile 233-235: Statt `return null` bei fehlendem `projectId` → Card mit Hinweis-Text und deaktivierten Switches rendern
- Die Feature-Liste wird weiterhin angezeigt, alle Switches sind disabled
- Unter dem Titel erscheint ein Info-Text: "Erstellen Sie ein Projekt, um den Vertriebsauftrag zu aktivieren."

### Datei 2: `src/pages/portal/projekte/VertriebTab.tsx`

- Projekt-Selector: Select-Dropdown im Header, der zwischen den verfuegbaren Projekten wechselt
- Der Selector zeigt Projektname + Adresse und setzt `selectedProject`
- Die `SalesApprovalSection` bekommt immer Props — auch wenn `projectId` undefined ist

## Ergebnis

Die Vertriebsauftrag-Sektion ist immer sichtbar. Bei keinem Projekt: Info-Hinweis. Bei Projekten: voller Agreement-Flow wie geplant.
