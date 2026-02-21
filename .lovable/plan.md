
# Fix: KI-Browser URL-Leiste und Impressum-Link

## Probleme

1. **URL-Eingabezeile verschwindet hinter dem Menu** -- Die Session-Seite nutzt `h-[calc(100vh-4rem)]` mit `-mt-6`, aber die tatsaechliche Hoehe von SystemBar + AreaNav + ModulTabs ist groesser als 4rem. Dadurch wird die URL-Toolbar hinter der Navigation versteckt.

2. **"Impressum"-Link im Header** -- In `SystemBar.tsx` (Zeile 230-238) wurde ein Link zum Impressum neben "SYSTEM OF A TOWN" eingefuegt. Das gehoert dort nicht hin.

## Loesung

### 1. Impressum-Link aus SystemBar entfernen (SystemBar.tsx)

- Zeilen 230-238: Den "Impressum"-Link entfernen, nur "SYSTEM OF A TOWN" stehen lassen
- Das Impressum ist bereits unter `/portal/stammdaten/rechtliches` erreichbar -- das reicht. Ein eigener Link im Header ist nicht noetig.

### 2. URL-Toolbar sichtbar machen (KiBrowserSession.tsx)

- Den negativen Margin `-mt-6` entfernen
- Die Hoehe von `h-[calc(100vh-4rem)]` auf einen realistischen Wert anpassen, der SystemBar (~3.5rem) + AreaNav (~3rem) + ModulTabs (~3rem) + Padding beruecksichtigt -- also ca. `h-[calc(100vh-12rem)]`
- Alternativ: kein festes `calc()`, sondern `flex-1` mit `min-h-0` im uebergeordneten Layout nutzen, damit die Seite den verbleibenden Platz fuellt

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/components/portal/SystemBar.tsx` | Impressum-Link entfernen (Zeilen 230-238) |
| `src/pages/portal/ki-browser/KiBrowserSession.tsx` | Layout-Fix: negativen Margin entfernen, Hoehe korrigieren |

## Zur Frage "Impressum bei Rechtliches"

Ja, es reicht voellig, wenn das Impressum unter "Stammdaten > Rechtliches" erreichbar ist. Es muss nicht auf jeder Seite im Header klickbar sein. Gesetzlich muss ein Impressum nur "leicht erreichbar" sein -- ein Menuepunkt im Portal genuegt.
