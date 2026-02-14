

# Typografie-Bereinigung — Graue Unterschriften entfernen, Hauptbeschriftungen vergroessern

## Problem

Ueberall in der Plattform gibt es dreifach beschriftete Elemente. Beispiel aus dem Projekte-Dashboard:
- "SCHRITT 1" (grau, klein)
- "Hochladen" (mittel)
- "Exposé + Preisliste" (grau, klein)

Drei Zeilen, wo eine genuegt. Das gleiche Muster wiederholt sich in Widgets, Karten, Formularen und Headern. Die kleinen grauen Untertitel (text-xs text-muted-foreground) liefern keinen Mehrwert und machen das Interface unruhig.

## Loesung: Zweistufiger Ansatz

### Schritt 1: Design-Manifest-Tokens vergroessern (Zentrale Aenderung)

In `src/config/designManifest.ts` werden die TYPOGRAPHY-Tokens angepasst:

| Token | Vorher | Nachher |
|---|---|---|
| PAGE_TITLE | text-xl md:text-2xl | text-2xl md:text-3xl |
| SECTION_TITLE | text-sm font-semibold uppercase | text-base font-semibold uppercase |
| CARD_TITLE | text-sm font-semibold | text-base font-semibold |
| LABEL | text-xs text-muted-foreground | text-sm text-muted-foreground |
| BODY | text-sm | text-base |
| MUTED | text-sm text-muted-foreground | text-sm text-muted-foreground (bleibt) |
| HINT | text-xs text-muted-foreground | **entfernt** (wird zu MUTED) |
| HEADER.WIDGET_TITLE | text-sm font-semibold | text-base font-semibold |
| HEADER.SECTION_TITLE | text-sm font-semibold | text-base font-semibold |
| HEADER.DESCRIPTION | text-muted-foreground mt-1 text-sm | **entfernt** |

Das wirkt sich automatisch auf alle Komponenten aus, die diese Tokens verwenden (KPICard, SectionCard, WidgetHeader, InfoBanner, etc.).

### Schritt 2: Graue Subtexte aus Shared-Komponenten entfernen

| Komponente | Aenderung |
|---|---|
| `ModulePageHeader.tsx` | `description`-Zeile (text-sm text-muted-foreground) entfernen |
| `WidgetHeader.tsx` | `description`-Prop und Rendering entfernen |
| `KPICard.tsx` | `subtitle`-Prop Rendering entfernen |
| `ModuleTilePage.tsx` | description-Zeilen unter Titeln entfernen |

### Schritt 3: Seitenspezifische Bereinigungen

Die haeufigsten Stellen mit redundanten Subtexten:

| Datei | Was entfernt wird |
|---|---|
| `ProjekteDashboard.tsx` | Die "SCHRITT X" Labels und die `desc`-Zeilen ("Exposé + Preisliste" etc.) — die Titel "Hochladen", "KI-Analyse" etc. genuegen allein |
| `WBDashboard.tsx` | Redundante Prozess-Beschreibungen |
| `ProcessStepper.tsx` | `description`-Prop aus den Steps |

### Schritt 4: Alle verbleibenden `description`-Props bereinigen

In den Seiten, die `ModulePageHeader` mit `description` aufrufen, wird der `description`-Prop entfernt. Der Titel allein ist aussagekraeftig genug.

---

## Auswirkung

- **Zentrale Tokens** (Manifest): Werden automatisch in ~30+ Komponenten wirksam
- **Shared-Komponenten**: 4 Dateien anpassen
- **Seitenspezifisch**: ~5-8 Dateien (vor allem Dashboard-Seiten)
- **Kein Risiko**: Keine Logik-Aenderungen, nur CSS-Klassen und entfernte JSX-Zeilen
