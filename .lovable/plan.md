

# Verwaltung → BWA umbenennen und Inhalt bereinigen

## Was passiert

Der Tab "Verwaltung" unter `/portal/immobilien/verwaltung` wird in "BWA" umbenannt. Der gesamte bisherige Inhalt (Mietliste, Aufgaben/Mahnwesen, BWA-Controlling) wird entfernt. Erhalten bleibt nur die obere CI-Struktur: ModulePageHeader + WidgetGrid mit den Vermieter-Einheiten (Property-Widgets) zur Objektauswahl.

## Analyse: Was kann geloescht werden?

Die drei Unter-Komponenten werden **ausschliesslich** in VerwaltungTab genutzt:
- `MietlisteTable` — nur in VerwaltungTab importiert
- `AufgabenSection` — nur in VerwaltungTab importiert
- `BWAControllingSection` — nur in VerwaltungTab importiert

Diese koennen komplett entfernt werden, ohne andere Module zu beeinflussen.

**Erhalten bleibt:**
- `useMSVData` Hook (liefert die Property-Widgets fuer die Objektauswahl)
- WidgetGrid mit den Vermieter-Einheiten + CTA-Widget
- Empty State fuer den Fall ohne Objekte

## Aenderungen

### 1. `src/manifests/routesManifest.ts`
- Zeile 249: `title: "Verwaltung"` aendern zu `title: "BWA"`

### 2. `src/pages/portal/immobilien/VerwaltungTab.tsx`
- ModulePageHeader: Titel "Verwaltung" → "BWA", Beschreibung anpassen
- Imports entfernen: `MietlisteTable`, `AufgabenSection`, `BWAControllingSection`
- JSX entfernen: Die drei Kacheln unterhalb des WidgetGrids und des Empty States
- Erhalten: PageShell, ModulePageHeader, WidgetGrid (Property-Widgets + CTA), Empty State

### 3. Dateien loeschen (optional, empfohlen)
- `src/components/msv/MietlisteTable.tsx`
- `src/components/msv/AufgabenSection.tsx`
- `src/components/msv/BWAControllingSection.tsx`
- `src/components/msv/PaymentBookingDialog.tsx` (nur von MietlisteTable genutzt)

### 4. Route und ImmobilienPage
- Die Route `/portal/immobilien/verwaltung` bleibt bestehen (gleiche URL, nur neuer Titel)
- Kein Redirect noetig, da GP_VERMIETUNG auf diese Route verweist

## Ergebnis

Nach dem Umbau zeigt der Tab "BWA" nur noch die Objektauswahl-Widgets. Neue Funktionen koennen dann Schritt fuer Schritt ergaenzt werden.
