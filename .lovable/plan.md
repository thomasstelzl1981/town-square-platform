

# Mobile-Ansicht: Keine Neuanlage-Widgets, nur funktionale Buttons

## Problem

Auf Mobile werden aktuell dieselben Widgets und Dialoge wie auf Desktop angezeigt:
- "Neues Fahrzeug anlegen"-Formulare
- "Objekt hinzufuegen"-Buttons
- Leere Zustaende mit "Erstellen Sie..."-Aufforderungen
- CreatePropertyDialog, CreateProjectDialog, CreateReservationDialog etc.

Das ist auf einem kleinen Bildschirm unpraktisch. Neuanlagen sollen nur via Armstrong-Actions oder Desktop/PWA-Browser moeglich sein.

## Loesung: Zentraler `DesktopOnly`-Wrapper + `useIsMobile`-Guards

Statt 27+ Module einzeln umzubauen, wird ein wiederverwendbarer Ansatz verfolgt:

### Schritt 1: Shared Wrapper-Komponente `DesktopOnly`

Eine kleine Utility-Komponente, die ihre Kinder auf Mobile ausblendet:

```text
src/components/shared/DesktopOnly.tsx

export function DesktopOnly({ children }) {
  const isMobile = useIsMobile();
  if (isMobile) return null;
  return <>{children}</>;
}
```

Damit koennen Neuanlage-Buttons und -Formulare in den Modulen einfach umschlossen werden:

```text
<DesktopOnly>
  <Button onClick={() => setIsCreatingNew(true)}>Neues Fahrzeug anlegen</Button>
</DesktopOnly>
```

### Schritt 2: Betroffene Module identifiziert

Die folgenden Bereiche enthalten Neuanlage-UI, die auf Mobile ausgeblendet wird:

| Modul/Datei | Element | Aktion |
|-------------|---------|--------|
| `CarsFahrzeuge.tsx` | "Neues Fahrzeug anlegen" Button + Inline-Formular | `DesktopOnly` |
| `FinanceRequestWidgets.tsx` | "Neue Anfrage" Widget-Kachel (leer) | `DesktopOnly` |
| `CreatePropertyDialog.tsx` (Trigger) | "Neue Immobilie" Button in Portfolio | `DesktopOnly` |
| `CreateProjectDialog.tsx` (Trigger) | "Neues Projekt" Button | `DesktopOnly` |
| `CreateReservationDialog.tsx` (Trigger) | "Neue Reservierung" Button | `DesktopOnly` |
| `AnalysisTab.tsx` (Akquise) | "Objekt hinzufuegen" Button + leerer Zustand | `DesktopOnly` fuer Button, angepasster Leertext |
| `SimulationTab.tsx` | "Neues Objekt hinzufuegen" Karte | `DesktopOnly` |
| `AbonnementsTab.tsx` | "Abonnement hinzufuegen" Karte | `DesktopOnly` |
| `KalenderTab.tsx` | "Neuer Termin" Button + Dialog | `DesktopOnly` |
| `InspirationPage.tsx` | "Quelle hinzufuegen" Button | `DesktopOnly` |
| `KnowledgePage.tsx` | "Hinzufuegen" Button | `DesktopOnly` |

### Schritt 3: Leere Zustaende auf Mobile anpassen

Wenn ein Modul keine Daten hat, zeigt der leere Zustand auf Mobile statt "Erstellen Sie..." den Hinweis:

```text
"Nutzen Sie Armstrong oder die Desktop-Version, um neue Eintraege anzulegen."
```

Dies wird als optionale `mobileEmptyText`-Prop in betroffenen Leerzustand-Karten umgesetzt.

### Schritt 4: WidgetGrid — Leere Neuanlage-Kacheln auf Mobile ausblenden

Einige Module haben eine dedizierte "Plus-Kachel" am Ende des Grids (z.B. Abonnements, Simulation). Diese werden mit `DesktopOnly` umschlossen.

## Technische Details

### Dateien

| Datei | Aktion | Beschreibung |
|-------|--------|-------------|
| `src/components/shared/DesktopOnly.tsx` | CREATE | Utility-Wrapper (3 Zeilen) |
| `src/components/portal/cars/CarsFahrzeuge.tsx` | EDIT | Button + Inline-Formular mit `DesktopOnly` umschliessen |
| `src/components/finanzierung/FinanceRequestWidgets.tsx` | EDIT | Leere Anfrage-Kachel ausblenden |
| `src/pages/portal/investments/SimulationTab.tsx` | EDIT | "Neues Objekt" Karte ausblenden |
| `src/pages/portal/finanzanalyse/AbonnementsTab.tsx` | EDIT | "Abo hinzufuegen" Karte ausblenden |
| `src/pages/portal/office/KalenderTab.tsx` | EDIT | "Neuer Termin" Button ausblenden |
| `src/pages/portal/akquise-manager/components/AnalysisTab.tsx` | EDIT | Button + Leerzustand anpassen |
| `src/pages/portal/communication-pro/social/InspirationPage.tsx` | EDIT | Button ausblenden |
| `src/pages/portal/communication-pro/social/KnowledgePage.tsx` | EDIT | Button ausblenden |
| Portfolio/Projekte-Seiten (Trigger-Buttons) | EDIT | Buttons mit `DesktopOnly` wrappen |

### Kein Breaking Change

- Desktop bleibt vollstaendig unveraendert
- `DesktopOnly` ist rein visuell (rendert `null` auf Mobile)
- Keine Aenderung an Hooks, Datenstrukturen oder Armstrong-Actions
- Alle Neuanlagen bleiben ueber Armstrong-Actions auf Mobile erreichbar
