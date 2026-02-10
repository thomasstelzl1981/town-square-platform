

# Fix: Zurück-Button im Demo-Exposé

## Problem

Der Zurück-Pfeil im Demo-Verkaufsexposé navigiert zu `/portal/projekte/demo-project-001`. Diese URL matcht die Route `:projectId` und versucht, das Projekt `demo-project-001` aus der Datenbank zu laden. Da es kein echtes Projekt ist, erscheint die Fehlermeldung "Projekt nicht gefunden".

## Ursache

In `src/pages/portal/projekte/UnitDetailPage.tsx`, Zeile 81:

```typescript
onClick={() => navigate(`/portal/projekte/${projectId}`)}
```

`projectId` ist `demo-project-001`, was kein realer DB-Eintrag ist.

## Lösung

Eine einzige Zeile ändern: Der Zurück-Button in `DemoUnitExpose` navigiert stattdessen zur Portfolio-Seite (Preisliste):

```typescript
onClick={() => navigate('/portal/projekte/projekte')}
```

Das bringt den Nutzer direkt zurück zur Wohnungsliste, wo er hergekommen ist.

## Betroffene Datei

| Aktion | Datei |
|--------|-------|
| Ändern | `src/pages/portal/projekte/UnitDetailPage.tsx` (Zeile 81) |

## Risiko

Minimal. Nur eine Navigation-URL wird geändert, keine Logik betroffen.

