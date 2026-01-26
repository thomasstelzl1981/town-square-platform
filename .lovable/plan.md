
# MOD-05 MSV — Korrekturplan für UI-Probleme

## Zusammenfassung der identifizierten Probleme

| Problem | Beschreibung | Lösung |
|---------|-------------|--------|
| **Responsivität** | Tabelle zu breit, Spalten gequetscht auf kleineren Bildschirmen | Responsive Card-Layout für Mobile |
| **Sidebar-Dopplung** | Sub-Tiles erscheinen sowohl in der Sidebar als auch als Tabs | Sidebar-Sub-Tiles für MSV entfernen (nur Tabs benutzen) |
| **Vermietungsexposé-Flow** | Wizard-Dialog statt Exposé-Seite (wie MOD-04) | Button in Liste → Exposé-Detailseite + Beispiel-Exposé |

---

## Problem 1: Responsivität der Tabelle

### Aktueller Zustand
Die 8-Spalten-Tabelle (`ObjekteTab.tsx` und `VermietungTab.tsx`) hat `min-w-[]` Constraints, die auf kleineren Bildschirmen zu horizontalem Scrolling führen.

### Lösung: Responsive Card-Layout

Für Mobile-Ansichten (unter `lg:`) werden Cards statt Tabellen gerendert:

```
┌─────────────────────────────────────────────┐
│ Desktop (lg+)                               │
│ ┌─────────────────────────────────────────┐ │
│ │ ID | Adresse | Mieter | Kalt | ... | ⚡ │ │
│ │ ... Tabelle mit allen Spalten ...       │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Mobile (<lg)                                │
│ ┌─────────────────────────────────────────┐ │
│ │ 📍 ZL002 · Marktstr. 12           [⚡] │ │
│ │    Müller, Hans                        │ │
│ │    Warmmiete: 950 €                    │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ 📍 ZL005 · Bahnhofstr. 5          [⚡] │ │
│ │    ⚠ Leerstand                         │ │
│ │    —                                   │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Technische Umsetzung

**ObjekteTab.tsx** und **VermietungTab.tsx**:
- Desktop: Bestehende Tabelle bleibt (`hidden lg:block`)
- Mobile: Neue Card-Liste (`lg:hidden`)

---

## Problem 2: Sidebar-Dopplung entfernen

### Aktueller Zustand
Die `PortalNav.tsx` lädt Sub-Tiles aus der `tile_catalog`-Tabelle und zeigt diese als collapsible Accordion-Einträge. Das führt zu:
- Sidebar: "MSV" → Objekte, Mieteingang, Vermietung, Einstellungen
- Content: Tabs mit denselben 4 Einträgen

### Lösung: Sub-Tiles aus Sidebar entfernen (nur für Module mit internen Tabs)

**Option A (Empfohlen)**: In `PortalNav.tsx` prüfen, ob ein Modul interne Tabs verwendet, und dann keine Sub-Tiles in der Sidebar anzeigen.

**Option B**: `tile_catalog.sub_tiles` für MOD-05 auf `null` setzen und nur die in-page Tabs nutzen.

### Technische Umsetzung

In `PortalNav.tsx` Zeile 218-284:
- Für Module mit internem Tab-System (MOD-01 bis MOD-10) die Sub-Tiles in der Sidebar NICHT anzeigen
- Stattdessen nur den Haupteintrag (MSV) als Link rendern

```tsx
// Wenn ein Modul interne Tabs hat, keine Sub-Tiles in Sidebar zeigen
const modulesWithInternalTabs = ['MOD-01', 'MOD-02', 'MOD-03', 'MOD-04', 'MOD-05', ...];

if (!hasSubTiles || modulesWithInternalTabs.includes(tile.tile_code)) {
  // Nur Hauptlink ohne Collapsible
  return (
    <Link key={tile.tile_code} to={tile.route} ... />
  );
}
```

---

## Problem 3: Vermietungsexposé → Detailseite (analog MOD-04)

### Aktueller Zustand
- `VermietungTab.tsx` hat einen "Neues Vermietungsexposé erstellen" Button
- Dieser öffnet `RentalListingWizard.tsx` (Dialog)
- Kein dediziertes Exposé-Ansicht wie in MOD-04

### Gewünschter Flow (analog MOD-04)

```
┌────────────────────────────────────────────────────────────┐
│  VermietungTab (Liste)                                      │
│                                                              │
│  [+ Beispiel-Exposé ansehen]     [+ Neues Objekt vermieten] │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Objekt   │ Adresse       │ Miete  │ Status │ Aktionen │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ ZL002    │ Marktstr. 12  │ 950 €  │ Aktiv  │ [Exposé] │ │
│  │ ZL005    │ Bahnhofstr. 5 │ 720 €  │ Entwurf│ [Exposé] │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                              ↓
              Klick auf "Exposé" (oder Zeile)
                              ↓
┌────────────────────────────────────────────────────────────┐
│  /portal/msv/vermietung/:id                                 │
│                                                              │
│  ← Zurück                           [Bearbeiten] [Publish]  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         📷 Bildergalerie (Placeholder)                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Marktstraße 12, 12345 Musterstadt                          │
│  Wohnung · 85 m² · 3 Zimmer                                 │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Kaltmiete: 850 € │  │ Warmmiete: 950 € │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                              │
│  [🏠 Bei Scout24 veröffentlichen]                            │
│  [📢 Zu Kleinanzeigen exportieren]                           │
│  [📄 Als PDF exportieren]                                    │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Neue Dateien und Routen

| Datei | Route | Beschreibung |
|-------|-------|--------------|
| `RentalExposeDetail.tsx` | `/portal/msv/vermietung/:id` | Vermietungsexposé-Detailansicht |
| `RentalExposeVorlage.tsx` | `/portal/msv/vermietung/vorlage` | Beispiel-Exposé (analog ExposeVorlage.tsx) |

### Änderungen in bestehenden Dateien

**App.tsx** — Neue Routen hinzufügen:
```tsx
<Route path="msv/vermietung/:id" element={<RentalExposeDetail />} />
<Route path="msv/vermietung/vorlage" element={<RentalExposeVorlage />} />
```

**VermietungTab.tsx** — UI anpassen:
1. "Neues Vermietungsexposé" Button → "Objekt zur Vermietung vorbereiten" (öffnet vereinfachten Wizard zur Objektauswahl)
2. Neuer Button "Beispiel-Exposé ansehen" → Link zu `/portal/msv/vermietung/vorlage`
3. In jeder Zeile: "Exposé"-Button → Link zu `/portal/msv/vermietung/:id`
4. Zeilen-Klick → Ebenfalls zur Detailseite

---

## Zusammenfassung der Änderungen

| Bereich | Dateien | Änderungen |
|---------|---------|------------|
| **Responsivität** | `ObjekteTab.tsx`, `VermietungTab.tsx` | Dual-Layout: Table (lg+) + Cards (mobile) |
| **Sidebar** | `PortalNav.tsx` | Sub-Tiles für Module mit internen Tabs ausblenden |
| **Vermietung** | Neue: `RentalExposeDetail.tsx`, `RentalExposeVorlage.tsx` | Exposé-Detailseite analog MOD-04 |
| **Routing** | `App.tsx` | Neue Routen für Vermietungsexposé |
| **Bestehend** | `VermietungTab.tsx` | Button-Labels + Row-Links anpassen |

---

## Implementierungsreihenfolge

1. **Sidebar-Dopplung beheben** (PortalNav.tsx)
2. **Responsivität verbessern** (ObjekteTab.tsx, VermietungTab.tsx)
3. **Neue Exposé-Seiten erstellen** (RentalExposeDetail.tsx, RentalExposeVorlage.tsx)
4. **Routen hinzufügen** (App.tsx)
5. **VermietungTab anpassen** (Buttons, Row-Links)
