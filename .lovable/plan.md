
# Homogenes Layout fuer alle Base-Module

## Problem

Jeder Tab hat ein anderes aeusseres Layout — unterschiedliche `max-width`, unterschiedliches Padding, fehlende oder vorhandene Ueberschriften. Das fuehrt zu einem spuerbaren "Springen" beim Durchklicken.

### Ist-Zustand der aeusseren Wrapper:

```text
Modul            | max-width  | Padding           | Ueberschrift
-----------------+------------+-------------------+------------------
Miety/Uebersicht | KEINE      | p-4               | "Willkommen" (h2)
Miety/Versorgung | max-w-5xl  | p-4               | TileShell h2
KI-Office/Email  | KEINE      | KEIN              | KEINE
KI-Office/Brief  | KEINE      | KEIN              | KEINE
KI-Office/Kontak | KEINE      | KEIN              | KEINE
KI-Office/Kalend | KEINE      | KEIN              | KEINE
KI-Office/Whatsa | KEINE      | KEIN              | KEINE
KI-Office/Widget | KEINE      | p-4 md:p-6 lg:p-8 | h2 inline
DMS/Storage      | KEINE      | p-4 md:p-6        | h1 "Dateien"
DMS/Posteingang  | ?          | ?                 | ?
Stammdaten/Profi | max-w-7xl  | px-4 py-6         | h1 UPPERCASE
Stammdaten/Vertr | max-w-7xl  | px-4 py-6         | h1 UPPERCASE
Stammdaten/Abrec | max-w-7xl  | px-4 py-6         | h1 UPPERCASE
Stammdaten/Siche | max-w-7xl  | px-4 py-6         | h1 UPPERCASE
Shops/Amazon     | max-w-5xl  | p-4               | KEINE (Shop-Hero)
Shops/Bestellung | max-w-6xl  | p-4               | h2 inline
```

## Loesung: Einheitlicher Standard

Alle Tabs bekommen den gleichen aeusseren Container und eine einheitliche Ueberschrift. Vorlage ist das Stammdaten-Pattern, das bereits konsistent ist.

### Standard-Wrapper (fuer jeden Tab):
```text
<div className="p-4 md:p-6 space-y-6">
  <div>
    <h1 className="text-2xl font-bold tracking-tight uppercase">[MODUL-TITEL]</h1>
    <p className="text-muted-foreground mt-1">[Untertitel]</p>
  </div>
  [Tab-Inhalt]
</div>
```

Ausnahme: Full-Height-Panels (Email, WhatsApp, Kontakte, Kalender) behalten ihre spezielle Hoehe (`h-[calc(100vh-...)]`), bekommen aber denselben aeusseren Wrapper mit Ueberschrift.

### Aenderungen pro Datei:

| Datei | Aenderung |
|-------|-----------|
| `EmailTab.tsx` | Aeusseres `<div>` bekommt `p-4 md:p-6 space-y-4` + h1 "E-MAIL" + Untertitel |
| `BriefTab.tsx` | Wrapper `p-4 md:p-6 space-y-6` + h1 "BRIEFGENERATOR" + Untertitel |
| `KontakteTab.tsx` | Wrapper `p-4 md:p-6 space-y-4` + h1 "KONTAKTE" + Untertitel |
| `KalenderTab.tsx` | Wrapper `p-4 md:p-6 space-y-4` + h1 "KALENDER" + Untertitel |
| `WhatsAppTab.tsx` | Wrapper `p-4 md:p-6 space-y-4` + h1 "WHATSAPP" + Untertitel |
| `WidgetsTab.tsx` | Wrapper vereinheitlichen auf `p-4 md:p-6 space-y-6` + h1 "WIDGETS" |
| `StorageTab.tsx` | h1 Stil anpassen auf `text-2xl font-bold tracking-tight uppercase` |
| `MietyPortalPage.tsx` (UebersichtTile) | Wrapper `p-4 md:p-6 space-y-6` + h1 "MIETY" statt h2 |
| `MietyPortalPage.tsx` (TileShell) | max-width entfernen, h2 auf h1 UPPERCASE anpassen, Padding auf `p-4 md:p-6` |
| `ServicesPage.tsx` (ShopTab) | max-w-5xl entfernen, h1 "SHOPS" Ueberschrift vor Hero einfuegen |
| `ServicesPage.tsx` (BestellungenTab) | max-w-6xl entfernen, h1 auf UPPERCASE anpassen |
| `PosteingangTab.tsx` | Pruefen und ggf. gleichen Wrapper anwenden |
| `SortierenTab.tsx` | Pruefen und ggf. gleichen Wrapper anwenden |
| `EinstellungenTab.tsx` | Pruefen und ggf. gleichen Wrapper anwenden |

### Nicht betroffen (bereits korrekt):
- `ProfilTab.tsx` — hat schon `max-w-7xl mx-auto px-4 py-6` + UPPERCASE h1
- `VertraegeTab.tsx` — gleich
- `AbrechnungTab.tsx` — gleich
- `SicherheitTab.tsx` — gleich

**Hinweis**: `max-w-7xl mx-auto` wird bei Stammdaten beibehalten, aber bei den anderen Tabs wird es NICHT hinzugefuegt, da die Tabs im Portal-Layout bereits durch den Seitenbereich begrenzt sind. Stattdessen wird einheitlich `p-4 md:p-6 space-y-6` als Padding verwendet — genau wie `PageShell`.

### Ergebnis
Beim Durchklicken durch alle Tabs sieht man immer:
1. Gleichen Abstand zum Rand
2. Gleiche UPPERCASE-Ueberschrift mit grauem Untertitel
3. Dann der eigentliche Inhalt

Ca. 14 Dateien betroffen, alle nur minimale Wrapper-Aenderungen (2-5 Zeilen pro Datei).
