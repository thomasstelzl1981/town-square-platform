
# KI-Office Designanalyse — Homogenisierungsplan

## Ist-Zustand: 6 verschiedene Designs in einem Modul

Jeder Tab im KI-Office sieht anders aus. Hier die konkreten Unterschiede:

### Analyse pro Tab

| Tab | Aeusserer Container | Hintergrund | Hoehe | Layout-Typ |
|-----|---------------------|-------------|-------|------------|
| **E-Mail** | Kein Card-Wrapper, rohe `div` + `border rounded-lg` | `bg-background` (opak) | `h-[calc(100vh-280px)]` | 3-Panel Grid (12-col) |
| **WhatsApp** | Kein Card-Wrapper, rohe `div` + `border rounded-lg` | `bg-background` (opak) | `h-[calc(100vh-200px)]` | 2-Panel Flex |
| **Brief** | Mehrere `<Card>` Kacheln | Card-Standard (backdrop-blur) | Natuerlich (kein feste Hoehe) | Grid 12-col (8+4) |
| **Kontakte** | DataTable (eigenes Pattern) | Kein Wrapper | Natuerlich | Vollbreite Tabelle |
| **Kalender** | `<Card>` Kacheln | Card-Standard | Natuerlich | Grid 12-col (8+4) |
| **Widgets** | Mischung: `glass-card` + TabsList | Teils glass-card, teils nackt | Natuerlich | Listen |

### Konkrete Inkonsistenzen

**1. Container-Strategie (3 verschiedene)**
- E-Mail + WhatsApp: Rohe `div` mit `border rounded-lg` — kein `<Card>`, kein Glassmorphism
- Brief + Kalender: `<Card>` Komponenten mit Standard-Styling (hat backdrop-blur via card.tsx)
- Kontakte: Gar kein aeusserer Container, nur DataTable
- Widgets: `glass-card` Klasse (extra CSS aus index.css)

**2. Hoehenberechnung (3 verschiedene)**
- E-Mail: `calc(100vh - 280px)`
- WhatsApp: `calc(100vh - 200px)`
- Alle anderen: Natuerliche Hoehe (kein calc)

**3. Padding / Spacing**
- Widgets: `p-4 md:p-6 lg:p-8` (responsive)
- Brief: Kein aeusseres Padding (Cards haben eigenes p-6)
- E-Mail: `space-y-4` als aeusserer Wrapper
- WhatsApp: Kein aeusseres Padding
- Kontakte: Eigenes EmptyState-Pattern

**4. Farben und Hintergruende**
- `glass-card` (Widgets): Explizites `backdrop-filter: blur(12px)` + card-bg
- Standard `<Card>`: `backdrop-blur-sm` (dezenter)
- E-Mail/WhatsApp: Reines `bg-background` — kein Blur-Effekt, wirkt "flach"

---

## Ziel-Design: Einheitliches Kommunikations-Layout

Alle 6 Tabs sollen dem gleichen visuellen Pattern folgen:

### Design-Standard

```text
+------------------------------------------------------------------+
| [glass-card Container, volle Breite]                             |
|                                                                    |
|   Inhalt des Tabs (je nach Typ):                                  |
|   - Messenger: 2-3 Panel Layout                                  |
|   - Formular: Card-Grid (8+4)                                    |
|   - Tabelle: DataTable mit Card-Wrapper                          |
|   - Archiv: Filterliste                                          |
|                                                                    |
+------------------------------------------------------------------+
```

### Vereinheitlichungsregeln

1. **Gleicher aeusserer Container**: Alle Tabs bekommen einen `<Card className="glass-card">` als aeusseren Wrapper
2. **Gleiche Hoehe fuer Messenger-Tabs**: E-Mail und WhatsApp nutzen beide `h-[calc(100vh-220px)]`
3. **Gleiche innere Panel-Borders**: Statt `border rounded-lg` auf rohen divs werden innere Trennungen mit `<Separator>` oder `border-r` / `border-l` gemacht
4. **Einheitliches Padding**: Alle Tabs nutzen `p-0` im Card (Content fuellt Card komplett), innere Bereiche steuern eigenes Padding
5. **Header-Pattern**: Jeder Tab hat einen einheitlichen Header-Bereich innerhalb des Cards mit Icon + Titel + Aktionsbuttons

---

## Aenderungsplan (6 Dateien)

### Schritt 1: EmailTab.tsx — Card-Wrapper + Hoehe angleichen

- Aeusseren `div.space-y-4` durch `<Card className="glass-card overflow-hidden">` ersetzen
- Innere Panel-Divs (`border rounded-lg`) ersetzen durch rahmenlose Bereiche mit `border-r` Trennern
- Hoehe von `calc(100vh-280px)` auf `calc(100vh-220px)` angleichen

### Schritt 2: WhatsAppTab.tsx — Card-Wrapper + gleiches Pattern

- Aeusseren `div` mit `border rounded-lg bg-background` durch `<Card className="glass-card overflow-hidden">` ersetzen
- Hoehe von `calc(100vh-200px)` auf `calc(100vh-220px)` angleichen
- Innere Trennungen bleiben (border-r ist bereits korrekt)

### Schritt 3: BriefTab.tsx — Glass-Card auf Hauptkarte

- Aeussere `<Card>` Instanzen mit `glass-card` Klasse versehen
- Sidebar-Card (letzte Entwuerfe) ebenfalls `glass-card` hinzufuegen
- Layout 8+4 bleibt erhalten (ist korrekt)

### Schritt 4: KontakteTab.tsx — Card-Wrapper um DataTable

- Gesamten Inhalt in `<Card className="glass-card overflow-hidden">` wrappen
- Header-Bereich (Suche + Buttons) in `CardHeader` verschieben
- DataTable erhaelt einheitliches Padding

### Schritt 5: KalenderTab.tsx — Glass-Card auf bestehende Cards

- Bestehende `<Card>` Instanzen mit `glass-card` Klasse versehen
- Kalender-Card (col-span-8) und Sidebar-Card (col-span-4) gleichmaessig stylen

### Schritt 6: WidgetsTab.tsx — Bereits nahe am Ziel

- Container-Padding vereinheitlichen
- `glass-card` auf leeren State und Widget-Items ist korrekt, nur Konsistenz mit den TabsList pruefen

---

## Zusammenfassung der Aenderungen

| Datei | Aenderung | Aufwand |
|-------|-----------|---------|
| `EmailTab.tsx` | Card-Wrapper, Hoehe, Panel-Borders | Mittel |
| `WhatsAppTab.tsx` | Card-Wrapper, Hoehe | Klein |
| `BriefTab.tsx` | glass-card Klasse auf Cards | Klein |
| `KontakteTab.tsx` | Card-Wrapper um Tabelle | Klein |
| `KalenderTab.tsx` | glass-card auf Cards | Klein |
| `WidgetsTab.tsx` | Padding-Anpassung | Minimal |

Ergebnis: Alle 6 Tabs haben den gleichen Glassmorphism-Effekt, einheitliche Hintergruende und harmonische Proportionen.
