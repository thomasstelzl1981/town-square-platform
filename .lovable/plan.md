
# System of a Town — Neue Hauptwebsite (Markenkonsolidierung)

## Strategische Zusammenfassung

Kaufy und Miety werden als eigenständige Marken aufgelöst. Die neue Hauptwebsite **System of a Town** übernimmt die gesamte öffentliche Präsenz — mit dem Marketplace als Herzstück. FutureRoom bleibt unangetastet.

## Architektur-Entscheidung

Wir bauen die neue Seite parallel und verbinden sie schrittweise:
- Die bestehende SoT-Website (`/website/sot`) wird zur neuen Hauptwebsite umgebaut
- Kaufy-Funktionalität (Investment Engine, Exposé, Armstrong) wird technisch wiederverwendet
- Keine Golden-Path-Logik wird verändert

## Layout-Spezifikation

```
+------------------------------------------------------------------+
| HEADER: Logo | (minimal Nav) | Theme Toggle | Login | Starten    |
+------------------------------------------------------------------+
| ARMSTRONG      |                        |  WIDGET SIDEBAR        |
| (transparenter |   MAIN CONTENT         |  (Dashboard-sized      |
|  Stripe, links)|   (Marketplace etc.)   |   aspect-square        |
|  nur Chat-     |                        |   Widgets, 1 Spalte)   |
|  Eingabe       |                        |                        |
|  sichtbar)     |                        |                        |
+------------------------------------------------------------------+
| FOOTER                                                            |
+------------------------------------------------------------------+
```

### Armstrong (linker Stripe)
- Nahezu transparent (glass, opacity ~0.05)
- Nur Chat-Eingabefeld sichtbar (unten)
- Bei Interaktion/Begrüssung wird Inhalt sichtbar
- Breite: ~60px collapsed, ~280px bei Interaktion
- Kein festes Panel — eher ein "Hauch" am linken Rand

### Widget-Sidebar (rechts)
- **Verwendet exakt die Dashboard-Widget-Größe**: `h-[260px] md:h-auto md:aspect-square` (aus WIDGET_CELL)
- **1 Spalte**, vertikal gestapelt
- Jedes Widget ist eine Glass-Card im aspect-square Format (~280px)
- Bei Klick navigiert der Main Content zur jeweiligen Kategorie
- Aktives Widget wird visuell hervorgehoben

### Widgets (7 Stück):
| Widget | Route | Icon |
|--------|-------|------|
| Real Estate | /website/sot/real-estate | Building2 |
| Capital | /website/sot/capital | TrendingUp |
| Projects | /website/sot/projects | FolderKanban |
| Management | /website/sot/management | Settings |
| Energy | /website/sot/energy | Zap |
| Career | /website/sot/karriere | Users |
| Login | /auth | LogIn |

### Mobile
- Armstrong-Stripe verschwindet
- Widgets werden horizontal scrollbar über dem Content

## Seitenstruktur

```
/website/sot/                    -> Home = Marketplace
/website/sot/real-estate         -> Immobilien verwalten
/website/sot/capital             -> Kapital strukturieren
/website/sot/projects            -> Projekt einreichen
/website/sot/energy              -> Energie optimieren
/website/sot/management          -> KI-gestützte Verwaltung
/website/sot/karriere            -> Partner werden
/website/sot/immobilien/:publicId -> Exposé-Detailseite
```

## Phasen

### Phase 1 (AKTUELL): Layout + Routing + Home + Widgets
- SotLayout: 3-Spalten-Grid (Armstrong | Main | Widgets)
- SotWidgetSidebar: 7 Dashboard-sized Widgets
- SotHome: Hero + Investment Engine + Suchergebnisse
- SotHeader: Minimale Nav (nur Logo + Auth)
- Routing: Neue Routen im Manifest

### Phase 2: Unterseiten
- SotRealEstate, SotCapital, SotProjects, SotEnergy, SotManagement, SotKarriere

### Phase 3: Exposé + Armstrong-Adaption + Legacy-Redirects

## Was NICHT verändert wird
- FutureRoom Website
- Golden Path Engine, Zone 1 Backbone
- Investment Engine Hook
- InvestmentResultTile
- Zone 2 Module
- Datenbank-Schema
