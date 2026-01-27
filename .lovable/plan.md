

# RESPONSIVITÄTS-KORREKTURPLAN: MOD-04 Immobilien

## Problem-Zusammenfassung

Die Immobilienliste (PropertyTable) im Modul 4 verursacht Layout-Überläufe, die:
1. Die linke Sidebar zusammenquetschen
2. Den rechten Chatbot überdecken
3. Die Navigation unbrauchbar machen

Dieses Problem betrifft alle Module, die PropertyTable als Master-Komponente verwenden.

---

## Architektur-Diagramm: Aktuelles vs. Korrigiertes Layout

```text
AKTUELL (FEHLERHAFT):
┌─────────────────────────────────────────────────────────────────────────┐
│ Header                                                                   │
├───────┬─────────────────────────────────────────────────────────┬───────┤
│Sidebar│ Main Content (PropertyTable 2200px+)                    │Chat   │
│ 64px  │ ←────────── ÜBERLÄUFT BEIDE SEITEN ──────────→          │Panel  │
│GEQUETSCHT│                                                       │VERDECKT│
└───────┴─────────────────────────────────────────────────────────┴───────┘

KORRIGIERT:
┌─────────────────────────────────────────────────────────────────────────┐
│ Header                                                                   │
├───────┬─────────────────────────────────────────────────────────┬───────┤
│Sidebar│ Main Content (horizontal scrollbar bei Bedarf)          │Chat   │
│ 256px │ ←─── overflow-x-auto, respektiert Grenzen ───→          │Panel  │
│ FEST  │                                                         │ FEST  │
└───────┴─────────────────────────────────────────────────────────┴───────┘
```

---

## Korrekturen (4 Dateien)

### 1. PortalNav.tsx — Sidebar fixieren

**Datei:** `src/components/portal/PortalNav.tsx`

**Problem:** Sidebar hat nur `w-64`, kann vom Flex-Container komprimiert werden.

**Änderung:**
```typescript
// AKTUELL (Zeile ~170):
className="hidden lg:flex flex-col w-64 border-r bg-card h-[calc(100vh-var(--header-height))]"

// NEU:
className="hidden lg:flex flex-col w-64 min-w-64 shrink-0 border-r bg-card h-[calc(100vh-var(--header-height))]"
```

**Erklärung:**
- `min-w-64`: Verhindert Komprimierung unter 256px
- `shrink-0`: Verbietet Flexbox, die Sidebar zu schrumpfen

---

### 2. PortalLayout.tsx — Main-Container begrenzen

**Datei:** `src/components/portal/PortalLayout.tsx`

**Problem:** `<main>` mit `flex-1` hat keine Mindestbreite, Inhalte können überlaufen.

**Änderung:**
```typescript
// AKTUELL (Zeile ~82):
<main className="flex-1 pb-20 lg:pb-0 lg:mr-[var(--chat-panel-width)]">

// NEU:
<main className="flex-1 min-w-0 overflow-x-hidden pb-20 lg:pb-0 lg:mr-[var(--chat-panel-width)]">
```

**Erklärung:**
- `min-w-0`: Ermöglicht Flexbox-Kind, unter seine natürliche Breite zu schrumpfen
- `overflow-x-hidden`: Verhindert horizontalen Überlauf nach außen

---

### 3. index.css — Chat-Panel-Breite korrigieren

**Datei:** `src/index.css`

**Problem:** `--chat-panel-width: 190px` ist zu klein, das Panel ist tatsächlich breiter.

**Änderung:**
```css
/* AKTUELL: */
--chat-panel-width: 190px;

/* NEU: */
--chat-panel-width: 280px;
```

**Erklärung:** Die ChatPanel-Komponente ist 280px breit, der Margin muss übereinstimmen.

---

### 4. ImmobilienPage.tsx — Container-Constraints

**Datei:** `src/pages/portal/ImmobilienPage.tsx`

**Problem:** Keine Breitenbegrenzung auf dem Content-Container.

**Änderung:**
```typescript
// AKTUELL (Zeile ~58, Sub-Page Container):
<div className="p-6 pt-4">
  {subPage}
</div>

// NEU:
<div className="p-6 pt-4 w-full overflow-x-auto">
  {subPage}
</div>
```

**Erklärung:**
- `w-full`: Explizite Breitenbegrenzung auf Parent
- `overflow-x-auto`: Horizontaler Scroll innerhalb des Containers (nicht nach außen)

---

## Auswirkungen auf andere Module

Diese Korrekturen wirken sich positiv auf folgende Module aus, die PropertyTable verwenden:

| Modul | Route | Komponente |
|-------|-------|------------|
| MOD-04 | /portal/immobilien/portfolio | PortfolioTab |
| MOD-05 | /portal/msv/objekte | ObjekteTab |
| MOD-05 | /portal/msv/vermietung | VermietungTab |
| MOD-06 | /portal/verkauf/objekte | (geplant) |

---

## Implementierungs-Reihenfolge

1. **PortalNav.tsx** — Sidebar fixieren (verhindert Komprimierung)
2. **PortalLayout.tsx** — Main-Container begrenzen (verhindert Überlauf)
3. **index.css** — CSS-Variable korrigieren (Chat-Panel Abstand)
4. **ImmobilienPage.tsx** — Lokaler Scroll (Tabelle scrollbar)

---

## Akzeptanzkriterien

| AC | Kriterium |
|----|-----------|
| AC1 | Sidebar bleibt bei 256px Breite, wird nicht komprimiert |
| AC2 | PropertyTable überdeckt weder Sidebar noch Chat-Panel |
| AC3 | Bei breiten Tabellen erscheint horizontaler Scrollbalken im Content-Bereich |
| AC4 | Chat-Panel hat korrekten Abstand (280px) |
| AC5 | Layout funktioniert auf Desktop (1920px) bis Tablet (1024px) |

---

## Technische Details

**Betroffene CSS-Klassen:**
- `shrink-0`: Tailwind für `flex-shrink: 0`
- `min-w-0`: Tailwind für `min-width: 0` (kritisch für Flex-Overflow)
- `min-w-64`: Tailwind für `min-width: 16rem` (256px)
- `overflow-x-auto`: Horizontaler Scroll bei Bedarf
- `overflow-x-hidden`: Kein Überlauf nach außen

**Flexbox-Verhalten:**
Das Problem entsteht durch die Standard-Flexbox-Regel, dass Kinder ihre `min-width: auto` behalten. Bei einer Tabelle mit 2200px Breite führt das dazu, dass der Flex-Container die Sidebar komprimiert, um Platz zu schaffen.

