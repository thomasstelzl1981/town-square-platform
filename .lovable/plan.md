

# Plan: Objekteingang — Fixierte Tabelle + Such-/Filterkarte

## Layout-Skizze

```text
┌──────────────────────────────────────────────────────────────┐
│  OBJEKTEINGANG — Alle eingehenden Objekte, Exposés …         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─── Aktive Ankaufsmandate (75%) ──┐  ┌─ Exposé-Upload ─┐  │
│  │ ▪ Alle Eingänge            [312] │  │                  │  │
│  │ ▪ APM-001 Meier  MFH      [24]  │  │   📄 PDF hier    │  │
│  │ ▪ APM-002 Schmidt Gewerbe [8]   │  │     ablegen      │  │
│  │ ▪ Ohne Mandat              [5]  │  │                  │  │
│  └──────────────────────────────────┘  └──────────────────┘  │
│                                                              │
│  ┌─── OBJEKTEINGÄNGE ── 47 von 312 ─────────────────────────┐
│  │                                                           │
│  │  ┌──────────────────────────────────────────────────────┐ │
│  │  │ Titel        │ Adresse │ Preis  │ Exposé│ Kalk│ …   │ │  ← sticky header
│  │  ├──────────────────────────────────────────────────────┤ │
│  │  │ MFH Rendsb.  │ 24768   │ 1.2M   │  PDF  │ Kalk│ …  │ │
│  │  │ Gewerbe HH   │ 20095   │ 3.4M   │  PDF  │ Kalk│ …  │ │
│  │  │ …            │         │        │       │     │     │ │  ← internes Scrollen
│  │  │              │         │        │       │     │     │ │     max-h-[560px]
│  │  └──────────────────────────────────────────────────────┘ │
│  │                                                           │
│  └───────────────────────────────────────────────────────────┘
│                                                              │
│  ┌─── SUCHE & FILTER ───────────────────────────────────────┐
│  │                                                           │
│  │  🔍 [Freitext-Suche …………………………]   📅 [Zeitraum ▼]      │
│  │                                                           │
│  │  ● Alle  ● Eingegangen  ● Analysiert  ● Akzeptiert       │
│  │                                                           │
│  └───────────────────────────────────────────────────────────┘
│                                                              │
│  ┌─── AKQUISE-DATENRAUM ────────────────────────────────────┐
│  │  📁 01_Exposes  │  📁 02_Recherche  │ …                   │
│  └───────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────┘
```

## Konzept

Die Tabelle wird zu einer **fixierten Card** mit eigenem Header ("OBJEKTEINGÄNGE · 47 von 312") und internem `ScrollArea` (`max-h-[560px]`). Der Tabellen-Header ist sticky. Die Tabelle wächst nicht die Seite hinunter, sondern scrollt intern.

**Unterhalb** der Tabellen-Card kommt eine neue **Such- und Filter-Card** mit:
- Freitext-Suche (durchsucht `title`, `address`, `city`, `postal_code`, `provider_name`, `notes`)
- Zeitraum-Dropdown (7 / 30 / 90 Tage / Alle)
- Status-Filter-Chips (von oben hierhin verschoben)

Die Filter-Chips und das Suchfeld wandern also aus der Zwischenzone in eine eigene Card unterhalb der Tabelle. Filter-Änderungen aktualisieren die Tabelle in Echtzeit.

## Umsetzung — 1 Datei

**`src/pages/portal/akquise-manager/ObjekteingangList.tsx`** (MOD-12):

1. **Tabellen-Card**: Neue `<Card>` mit eigenem `SECTION_HEADER` ("Objekteingänge · {count}"). Tabelle in `<ScrollArea className="max-h-[560px]">` wrappen. Header-Zeile erhält `sticky top-0 z-10 bg-card`.

2. **Such-/Filter-Card** (NEU, darunter): Eigene `<Card>` mit:
   - Zeile 1: Freitext-Input (links, flex-1) + Zeitraum-Select (rechts, w-40)
   - Zeile 2: Status-Chips (horizontal)
   - Neuer State: `timeRange` ('all' | '7' | '30' | '90')

3. **Filter-Logik erweitern**: `filteredOffers` Memo um `postal_code`, `provider_name`, `notes` + `timeRange`-Filter auf `created_at` erweitern.

4. **Query-Limit**: Von 500 auf 1000 erhöhen.

5. **Imports hinzufügen**: `ScrollArea` aus `@/components/ui/scroll-area`, `Calendar` Icon aus lucide.

