

# MOD-12 Akquise-Manager: Logische Struktur nach FM-Vorbild

## Problem

Aktuell fuehren "Dashboard" und "Mandate" im Seitenmenue auf dieselbe Ansicht, weil es keine Route fuer `/mandate` gibt -- der Catch-All leitet auf das Dashboard zurueck. Ausserdem ist der "Neues Mandat"-Wizard nur ein Stub-Platzhalter.

## Loesung: Klare Trennung nach FM-Muster

Wie beim Finanzierungsmanager (MOD-11) bekommt jede Kachel eine eigene Aufgabe:

```text
Dashboard               Mandate
+---------------------+ +---------------------+
| Aktive Mandate      | | Meine Mandate       |
| [Widget] [Widget]   | | [Widget] [Widget]   |
+---------------------+ +---------------------+
| Neue Auftraege      | | Neues Mandat        |
| [Widget] oder       | | =================== |
| "Keine neuen        | | Kontakt-First       |
|  Auftraege"         | | Workflow inline      |
+---------------------+ | (kein Modal/Popup)  |
                        +---------------------+
```

## Aenderungen im Detail

### 1. Neue Datei: AkquiseMandate.tsx (Mandate-Ansicht)

Neue Seite unter `/portal/akquise-manager/mandate` mit zwei Sektionen:

**Sektion A: Meine Mandate**
- Alle Mandate des Managers (aktiv, pausiert, abgeschlossen) als MandateCaseCard-Widgets im WidgetGrid
- Wenn leer: Platzhalter-Widget "Keine Mandate vorhanden"
- Klick auf ein Widget oeffnet die bestehende Detail-Ansicht (`mandate/:mandateId`)

**Sektion B: Neues Mandat erstellen**
- Direkt darunter als inline Workflow auf der Seite (kein Modal, kein Popup -- Memory-Vorgabe "Desktop-only Creation")
- Kontakt-First Formular mit den Feldern aus `CreateAcqMandateData`:
  - Kontaktname (client_display_name)
  - Suchgebiet (search_area -- Freitext Region)
  - Asset-Fokus (Mehrfachauswahl aus ASSET_FOCUS_OPTIONS)
  - Preisspanne (price_min / price_max)
  - Zielrendite (yield_target)
  - Ausschluesse / Notizen
- "Mandat erstellen"-Button am Ende des Formulars
- Nutzt den bestehenden `useCreateAcqMandate` Hook
- Erst nach Klick auf "Mandat erstellen" wird die DB-ID vergeben und das Mandat erscheint oben als Widget

### 2. Dashboard ueberarbeiten: AkquiseDashboard.tsx

**Sektion A: Aktive Mandate** (bleibt wie bisher)
- Aktive Mandate als MandateCaseCard-Widgets
- Wenn leer: Platzhalter-Widget "Keine aktiven Mandate"

**Sektion B: Neue Auftraege** (NEU -- ersetzt den InfoBanner)
- Pending-Mandate (assigned, noch nicht angenommen) als eigene Sektion mit Ueberschrift "Neue Auftraege"
- Wenn keine pending: Platzhalter-Widget "Keine neuen Auftraege"
- Der bisherige InfoBanner mit "X Mandate warten" wird entfernt und durch diese Sektion ersetzt

**Header-Action aendern**: "Neues Mandat"-Button navigiert jetzt zu `/portal/akquise-manager/mandate` (statt `/mandate/neu`)

### 3. Router anpassen: AkquiseManagerPage.tsx

- Neue Route hinzufuegen: `<Route path="mandate" element={<AkquiseMandate />} />`
- Die bestehende Route `mandate/neu` bleibt vorerst als Redirect auf `/mandate` (Rueckwaertskompatibilitaet)
- Reihenfolge: `mandate` VOR `mandate/:mandateId` und `mandate/neu`

### 4. Stub MandatCreateWizardManager.tsx entfernen

Wird nicht mehr benoetigt -- der Workflow lebt jetzt inline auf der Mandate-Seite. Die Datei wird durch einen Redirect ersetzt oder entfernt.

## Technische Details

### Datenbankzugriff
- Kein DB-Schema-Aenderung noetig
- Nutzt bestehende Hooks: `useAcqMandatesForManager()` (alle Mandate des Managers), `useAcqMandatesPending()`, `useAcqMandatesActive()`, `useCreateAcqMandate()`

### Bestehende Komponenten wiederverwendet
- `MandateCaseCard` + `MandateCaseCardPlaceholder` fuer die Widget-Darstellung
- `WidgetGrid` / `WidgetCell` fuer das Layout
- `PageShell`, `ModulePageHeader` fuer die Seitenstruktur
- `ASSET_FOCUS_OPTIONS` aus `@/types/acquisition` fuer die Auswahl

### Mandate-Erstellung (Workflow)

```text
Formular ausfuellen -> "Mandat erstellen" klicken
  -> useCreateAcqMandate() aufrufen (status: "draft")
  -> DB-Trigger vergibt Public ID (ACQ-XXXX)
  -> Widget erscheint oben in "Meine Mandate"
  -> Optional: Weiterleiten zur Detail-Ansicht
```

### Dateien die geaendert/erstellt werden
1. **NEU:** `src/pages/portal/akquise-manager/AkquiseMandate.tsx`
2. **EDIT:** `src/pages/portal/AkquiseManagerPage.tsx` (Route hinzufuegen)
3. **EDIT:** `src/pages/portal/akquise-manager/AkquiseDashboard.tsx` (2-Sektionen-Layout)
4. **EDIT:** `src/pages/portal/akquise-manager/MandatCreateWizardManager.tsx` (Redirect auf /mandate)

