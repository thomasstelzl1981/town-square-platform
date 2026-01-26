
# Plan: Klassische Menüstruktur und Module-Pages korrigieren

## Problemanalyse

Nach gründlicher Analyse habe ich folgende Diskrepanzen gefunden:

### 1. Navigation-Problem
Die aktuelle `PortalNav.tsx` ist **hardcoded** und nutzt die `tile_catalog`-Datenbank NICHT. Wenn du auf "Stammdaten" klickst, öffnen sich keine Untermenüpunkte.

### 2. Falsche Sub-Tiles in den Module-Pages
Die Module-Pages zeigen falsche Cards:

| Modul | IST (falsch) | SOLL (laut Docs) |
|-------|--------------|------------------|
| MOD-01 Stammdaten | Kontakte, Adressen, Bankdaten, Einstellungen | Profil, Firma, Abrechnung, Sicherheit |
| MOD-02 KI Office | Chat, Aufgaben, Kalender, Notizen | E-Mail, Brief, Kontakte, Kalender |
| MOD-03 DMS | Ablage, Posteingang, Sortieren, Einstellungen | Storage, Posteingang, Sortieren, Einstellungen |

Die DB hat die richtigen Sub-Tiles, aber die Pages sind hardcoded mit falschen Daten.

### 3. Keine funktionalen Sub-Routes
Klick auf die Cards führt nirgendwo hin (keine onClick-Handler).

---

## Lösungsplan

### Phase 1: Klassische Sidebar-Navigation mit Collapsible-Menü

**Datei:** `src/components/portal/PortalNav.tsx`

Änderungen:
1. Navigation aus `tile_catalog` laden (nicht hardcoded)
2. Collapsible/Accordion-Menü implementieren
3. Wenn Modul geklickt → 4 Sub-Tiles aufklappen
4. Active-State für Parent und Children

```
Menü-Struktur:
├── Home
├── ▼ Stammdaten (klickbar → aufklappen)
│   ├── Profil
│   ├── Firma
│   ├── Abrechnung
│   └── Sicherheit
├── ▼ KI Office
│   ├── E-Mail
│   ├── Brief
│   ├── Kontakte
│   └── Kalender
├── ...
```

### Phase 2: tile_catalog Sub-Tiles korrigieren (DB)

Die DB hat teilweise noch falsche Sub-Tiles:

| MOD | Aktuell in DB | Korrektur nötig |
|-----|---------------|-----------------|
| MOD-01 | Profil, Kontakte, Adressen, Einstellungen | → Profil, Firma, Abrechnung, Sicherheit |
| MOD-02 | E-Mail, Brief, Kontakte, Kalender | Korrekt |
| MOD-03 | Ablage, Posteingang, Sortieren, Einstellungen | → Storage, Posteingang, Sortieren, DMS-Einstellungen |
| MOD-04 | Liste, Neu, Karte, Analyse | → Kontexte, Portfolio, Sanierung, Bewertung |
| MOD-05 | Übersicht, Mieter, Zahlungen, Mahnungen | → Dashboard, Listen, Mieteingang, Vermietung |
| MOD-06 | Inserate, Anfragen, Reservierungen, Transaktionen | → Objekte, Aktivitäten, Anfragen, Vorgänge |
| MOD-07 | Fälle, Dokumente, Export, Status | Korrekt |
| MOD-08 | Suche, Favoriten, Profile, Alerts | → Suche, Favoriten, Mandat, Simulation |
| MOD-09 | Dashboard, Katalog, Auswahl, Netzwerk | → Objektkatalog, Auswahl, Beratung, Netzwerk |
| MOD-10 | Inbox, Kampagnen, Pipeline, Quellen | → Inbox, Meine Leads, Pipeline, Werbung |

### Phase 3: Module-Pages dynamisch machen

**Änderung für alle Module-Pages:**

Statt hardcodierter Cards:
1. Sub-Tiles aus `tile_catalog` laden (oder Props übergeben)
2. Jede Card ist ein Link zur entsprechenden Sub-Route
3. Icon-Mapping basierend auf Route/Title

### Phase 4: Sub-Routes in App.tsx vervollständigen

Für jedes Modul alle 4 Sub-Routes registrieren:

```tsx
// MOD-01: Stammdaten
<Route path="stammdaten" element={<StammdatenPage />} />
<Route path="stammdaten/profil" element={<StammdatenProfilPage />} />
<Route path="stammdaten/firma" element={<StammdatenFirmaPage />} />
<Route path="stammdaten/abrechnung" element={<StammdatenAbrechnungPage />} />
<Route path="stammdaten/sicherheit" element={<StammdatenSicherheitPage />} />
```

---

## Umsetzungsreihenfolge

1. **Sidebar-Navigation mit Collapsible** erstellen
2. **tile_catalog** in DB korrigieren (Sub-Tiles gemäß Docs)
3. **Module-Dashboard-Pages** auf dynamische Sub-Tile-Anzeige umstellen
4. **Sub-Route-Pages** als Placeholder erstellen (40 Seiten: 10 Module × 4 Sub-Tiles)
5. **App.tsx** mit allen Sub-Routes aktualisieren

---

## Technische Details

### Neue Komponente: CollapsibleNavItem

```tsx
interface NavItem {
  code: string;
  label: string;
  icon: LucideIcon;
  route: string;
  subItems?: {
    title: string;
    route: string;
  }[];
}

function CollapsibleNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const [isOpen, setIsOpen] = useState(isActive);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="...">
          <Icon /> {item.label}
          <ChevronDown className={isOpen ? "rotate-180" : ""} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {item.subItems?.map(sub => (
          <Link to={sub.route}>{sub.title}</Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

### Datenbankänderung (Migration)

```sql
-- MOD-01 korrigieren
UPDATE tile_catalog 
SET sub_tiles = '[
  {"title": "Profil", "route": "/portal/stammdaten/profil"},
  {"title": "Firma", "route": "/portal/stammdaten/firma"},
  {"title": "Abrechnung", "route": "/portal/stammdaten/abrechnung"},
  {"title": "Sicherheit", "route": "/portal/stammdaten/sicherheit"}
]'::jsonb
WHERE tile_code = 'MOD-01';

-- (Analog für alle 10 Module)
```

---

## Erwartetes Ergebnis

Nach Umsetzung:
- Sidebar zeigt alle 10 Module als aufklappbare Menüpunkte
- Klick auf "Stammdaten" öffnet 4 Untermenüpunkte
- Klick auf "Profil" → navigiert zu `/portal/stammdaten/profil`
- Module-Dashboard zeigt die 4 Sub-Tiles als klickbare Cards
- Alle 40 Sub-Routes funktionieren (zunächst als Placeholder)

---

## Zeitschätzung

| Phase | Aufwand |
|-------|---------|
| Collapsible Sidebar | 1 Session |
| DB Sub-Tiles korrigieren | 1 Migration |
| 10 Module-Pages anpassen | 1-2 Sessions |
| 40 Sub-Pages erstellen | 2-3 Sessions |
| App.tsx Routes | 1 Session |

**Gesamt:** 5-7 Sessions für vollständige Umsetzung
