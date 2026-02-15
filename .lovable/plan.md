

# Reparaturplan: MOD-13 Demo-Widget zu klein

## Fehleranalyse

**Root Cause** — Eine einzige Zeile in `ProjectCard.tsx`, Zeile 68:

```
!isDemo && 'aspect-square'
```

Diese Bedingung bedeutet: **Nur wenn NICHT Demo, dann quadratisch**. Das Demo-Widget bekommt daher KEIN `aspect-square` und schrumpft auf seine Content-Hoehe — es wird KLEINER als die anderen Widgets.

Der `ProjectCardPlaceholder` daneben hat `aspect-square` fest eingebaut (Zeile 122), deshalb hat er die korrekte Groesse. Das Demo-Widget daneben ist zu klein, weil es nur so hoch wird wie sein Inhalt (Status-Badge + Icon + Text + Progressbar).

```text
IST-ZUSTAND:
+------------------+  +------------------+
|  [Demo-Widget]   |  | [Neues Projekt]  |
|  Residenz am     |  |                  |
|  Stadtpark       |  |  Demo-Projekt    |
|  (zu klein!)     |  |                  |
+------------------+  |  (korrekt,       |
                      |   aspect-square) |
                      +------------------+

SOLL-ZUSTAND:
+------------------+  +------------------+
|  [Demo-Widget]   |  | [Neues Projekt]  |
|                  |  |                  |
|  Residenz am     |  |  Demo-Projekt    |
|  Stadtpark       |  |                  |
|                  |  |                  |
|  (aspect-square) |  |  (aspect-square) |
+------------------+  +------------------+
```

## Fix

### Datei: `src/components/projekte/ProjectCard.tsx`

**Zeile 68 aendern:**

Alt:
```typescript
!isDemo && 'aspect-square',
```

Neu:
```typescript
'aspect-square',
```

Das ist alles. `aspect-square` gilt dann fuer ALLE ProjectCards — normale UND Demo. Das Demo-Widget behaelt sein gruenes `DEMO_WIDGET.CARD` Styling (Zeile 70) und bekommt zusaetzlich die korrekte quadratische Form.

**Eine Zeile, ein Fix, kein Seiteneffekt.**

### Zusaetzlich: Dashboard-Reihenfolge (Problem 1 aus dem vorherigen Plan)

Die Widgets und KPIs auf `/portal/projekte/dashboard` muessen nach oben verschoben werden (unter den Header, vor den Magic Intake). Das wird in `ProjekteDashboard.tsx` durch Umordnung der JSX-Sektionen geloest:

1. ModulePageHeader
2. KPI-Stats
3. WidgetGrid (Meine Projekte)
4. "So funktioniert's" Steps
5. Magic Intake Upload-Zone

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/projekte/ProjectCard.tsx` | Zeile 68: `aspect-square` fuer alle Karten |
| `src/pages/portal/projekte/ProjekteDashboard.tsx` | Sektionsreihenfolge: KPIs + Widgets nach oben |

