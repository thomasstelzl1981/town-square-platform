

## ManagerVisitenkarte Redesign: Profilbild als volle Kachel-Hoehe

### Ist-Zustand (ASCII-Skizze)

```text
┌──────────────────────────────────────────────┐
│ ██████████ gradient bar ██████████████████████│
│                                              │
│  ┌──┐  Max Mustermann                   [✏] │
│  │🧑│  FINANZIERUNGSMANAGER                  │
│  └──┘  ✉ max@example.de                     │
│        📞 +49 170 1234567                    │
│        📍 München, 80331                     │
│                                              │
│        [Badge 1] [Badge 2]                   │
└──────────────────────────────────────────────┘
       ↑ 48x48px runder Avatar (klein)
```

### Soll-Zustand (ASCII-Skizze)

```text
┌──────────────────────────────────────────────┐
│ ██████████ gradient bar ██████████████████████│
│                                              │
│  ┌────────┐  Max Mustermann            [✏]  │
│  │        │  FINANZIERUNGSMANAGER            │
│  │  FOTO  │                                  │
│  │ (aus   │  ✉ max@example.de               │
│  │ Profil)│  📞 +49 170 1234567             │
│  │        │  📍 München, 80331              │
│  │ 96x96  │                                  │
│  │rounded │  [Badge 1] [Badge 2]            │
│  │  -xl   │                                  │
│  └────────┘  {children}                      │
│                                              │
└──────────────────────────────────────────────┘
       ↑ 96x96px rounded-xl Avatar
         Zentriert ueber volle Inhaltshoehe
         Fallback: Gradient + User-Icon (wie bisher)
```

### Was sich aendert

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Avatar-Groesse | 48x48px (`h-12 w-12`) | 96x96px (`h-24 w-24`) |
| Avatar-Form | `rounded-full` (Kreis) | `rounded-xl` (abgerundetes Rechteck) |
| Avatar-Position | `items-start` inline mit Text | `items-center` / `self-center`, volle Hoehe links |
| Flex-Layout | `flex items-start gap-3` | `flex items-stretch gap-4` |
| Bild-Quelle | `profile?.avatar_url` (wie bisher) | Identisch — kommt aus Stammdaten-Profil via `useAuth()` |

### Betroffene Datei

Nur **eine** Datei: `src/components/shared/ManagerVisitenkarte.tsx`

Alle 5 Konsumenten (ProjekteDashboard, PMDashboard, BeratungTab, KatalogTab + evtl. weitere) erben die Aenderung automatisch.

### Umsetzungsschritte

| # | Aktion |
|---|--------|
| 1 | Avatar-Container von `h-12 w-12 rounded-full` auf `h-24 w-24 rounded-xl self-center` aendern |
| 2 | Aeusseres Flex-Layout auf `items-stretch gap-4` umstellen |
| 3 | Avatar-Bild ebenfalls auf `h-24 w-24 rounded-xl object-cover` |
| 4 | Fallback-Icon proportional vergroessern (`h-8 w-8`) |
| 5 | Testen in allen Manager-Modulen per Screenshot |

