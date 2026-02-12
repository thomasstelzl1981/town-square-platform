
# Plan: Acquiary als 4. Brand-Widget hinzufuegen

## Ist-Zustand

Die Komponente `src/components/dashboard/BrandWidgets.tsx` zeigt 3 Kacheln:
- KAUFY (blau)
- FutureRoom (gruen)
- SystemOfaTown (dunkel/grau)

Das Grid ist `grid-cols-1 md:grid-cols-3`.

## Aenderungen

### Datei: `src/components/dashboard/BrandWidgets.tsx`

1. **Grid auf 4 Spalten erweitern**: `md:grid-cols-3` wird zu `md:grid-cols-4`

2. **Neues Acquiary-Widget** nach dem SoT-Widget einfuegen:
   - Farbschema: Azure-Blue Gradient (`from-[hsl(210,80%,50%)]` zu `to-[hsl(200,70%,40%)]`) — passend zum Acquiary-Branding
   - Icon: `Search` (Lucide) — passend zum Sourcing-Thema
   - Titel: **ACQUIARY**
   - Untertitel: "Sourcing & Akquisition"
   - Beschreibung: "Immobilien-Sourcing, Analyse und strategische Akquisition."
   - Badge: "Investment House"
   - Link: `/website/acquiary`

3. **Kommentar und Docstring** aktualisieren: "3 branded tiles" wird zu "4 branded tiles"

4. **Import** erweitern: `Search` aus lucide-react hinzufuegen

### Keine weiteren Dateien betroffen

Da `BrandWidgets` bereits in allen 3 Dashboards (Portal, FM, Akquise) eingebunden ist, erscheint das 4. Widget automatisch ueberall.
