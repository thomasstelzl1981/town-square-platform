

# Fix: Miety-Texte neutralisieren (Home statt Zuhause)

## Kontext

Die Ansicht unter `/portal/immobilien/zuhause` heisst aktuell "Miety" mit "Ihr Zuhause auf einen Blick". Das muss neutraler werden, damit es auch fuer Buero-Immobilien funktioniert -- nicht nur fuer private Wohnungen.

## Aenderungen

### 1. Tab-Titel im Menue (routesManifest.ts)

- Zeile 268: `title: "ZUHAUSE"` aendern auf `title: "HOME"`

### 2. Ueberschrift und Beschreibung (UebersichtTile.tsx)

| Zeile | Alt | Neu |
|---|---|---|
| 171 | `title="Miety"` | `title="Home"` |
| 172 | `description="Ihr Zuhause auf einen Blick"` | `description="Ihre Objekte auf einen Blick"` |
| 187 | `Ihr Zuhause einrichten` | `Objekt einrichten` |
| 219 | `Mein Zuhause` | `Mein Objekt` |
| 95 | `name: 'Mein Zuhause'` (Auto-Create Default) | `name: 'Mein Zuhause'` (bleibt -- ist ein sinnvoller Default fuer private Nutzer) |
| 80 | `toast.success('Zuhause geloescht')` | `toast.success('Objekt geloescht')` |
| 209 | `title={home.name \|\| 'Zuhause'}` | `title={home.name \|\| 'Objekt'}` |

### 3. NoHomeBanner (shared/NoHomeBanner.tsx)

- Zeile 11: `Zuhause anlegen` → `Objekt anlegen`
- Zeile 12: `Legen Sie zuerst Ihr Zuhause an...` → `Legen Sie zuerst ein Objekt an, um Vertraege zu speichern.`

### 4. Dynamic Route Titel (routesManifest.ts)

- Zeile 569: `title: "Zuhause-Akte"` → `title: "Home-Akte"`

## Nicht geaendert (bewusst)

- `name: 'Mein Zuhause'` als Default-Name beim Auto-Create bleibt -- der User kann das jederzeit umbenennen
- Golden Path Prozess-ID `GP-ZUHAUSE` bleibt (interne ID, nicht sichtbar)
- Route-Pfad `/portal/immobilien/zuhause` bleibt (URL-Stabilitaet)
- Datenbank-Tabellennamen `miety_*` bleiben (keine Schema-Aenderung noetig)

## Betroffene Dateien

| Datei | Modul | Aenderung |
|---|---|---|
| `src/manifests/routesManifest.ts` | -- (shared) | Tab-Titel und Dynamic-Route-Titel |
| `src/pages/portal/miety/tiles/UebersichtTile.tsx` | MOD-20 | Header, Labels, Toasts |
| `src/pages/portal/miety/shared/NoHomeBanner.tsx` | MOD-20 | Banner-Text |

