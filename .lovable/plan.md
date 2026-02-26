

## Privatjet-Shop Upgrade: 6 Legacy → 12 NetJets-Eintraege (3 Bloecke)

### Korrekturen gegenueber dem gelieferten SQL

| Problem | Loesung |
|---------|---------|
| `shop_key = 'flugzeuge'` | Aendern auf `'privatjet'` (passt zu SubTab + Hook + Config) |
| `category = 'flugzeuge'` | Aendern auf `'privatjet'` |
| Alle 12 Eintraege nutzen dasselbe NetJets-Logo als `image_url` | Professionelle Flugzeugbilder pro Fleet-Klasse (Wikimedia Commons, lizenzfrei) |
| Programme/Add-ons haben andere Metadata-Struktur als die UI erwartet | UI anpassen: Gruppierung nach `sub_category`, unterschiedliche Karten-Layouts |

### Bild-Zuordnung (Wikimedia Commons / Unsplash)

| Eintrag | Bild |
|---------|------|
| 3x Programme (Jet Card / Lease / Share) | NetJets Logo (korrekt — kein einzelnes Flugzeug) |
| Phenom 300/E (Light) | `https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=600&h=400&fit=crop` |
| Citation XLS (Midsize) | `https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=600&h=400&fit=crop` |
| Citation Latitude (Midsize) | `https://images.unsplash.com/photo-1583202075514-4a0f9fdd1964?w=600&h=400&fit=crop` |
| Challenger 350 (Super-Midsize) | `https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=600&h=400&fit=crop` |
| Challenger 650 (Large) | `https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&h=400&fit=crop` |
| Global 6000 (Long-Range) | `https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=600&h=400&fit=crop` |
| 2x Add-ons | Kein Bild (`image_url = NULL`) — UI zeigt Icon-Karte |

### Metadata-Harmonisierung

Fleet-Klassen erhalten die bestehenden Schema-Felder (`manufacturer`, `passengers`, `range`, `typicalRoute`) plus die neuen NetJets-Felder:

```text
Fleet-Eintrag metadata:
{
  "vendor": "NetJets",
  "manufacturer": "Embraer",          ← bestehendes Feld
  "passengers": "8",                   ← bestehendes Feld
  "range": "3.700 km",                ← bestehendes Feld
  "typicalRoute": "Muenchen – Zuerich", ← bestehendes Feld
  "fleet_class": "Light",             ← neu
  "aircraft_examples": ["Phenom 300/E"], ← neu
  "source": "netjets.com"
}
```

Programme/Add-ons nutzen eigene Felder (`program`, `cta`, `addon`, `notes`).

### Datenstruktur (12 Eintraege)

| # | sub_category | badge | Name | sort_order |
|---|-------------|-------|------|------------|
| 1 | Programme | Entry | NetJets Private Jet Card | 10 |
| 2 | Programme | Standard | NetJets Lease | 20 |
| 3 | Programme | Premium | NetJets Share (Fractional) | 30 |
| 4 | Fleet | Klasse | Phenom 300/E — Light Jet | 110 |
| 5 | Fleet | Klasse | Citation XLS — Midsize | 120 |
| 6 | Fleet | Klasse | Citation Latitude — Midsize | 130 |
| 7 | Fleet | Klasse | Challenger 350 — Super-Midsize | 140 |
| 8 | Fleet | Klasse | Challenger 650 — Large Cabin | 150 |
| 9 | Fleet | Klasse | Global 6000 — Long-Range | 160 |
| 10 | Add-ons | Add-on | Partner-Abruf (Qualifikation) | 910 |
| 11 | Add-ons | Add-on | Angebotsanfrage (Quote Request) | 920 |

### UI-Anpassung: CarsPrivatjet.tsx

Die aktuelle UI zeigt alle Eintraege in einem flachen Grid. Neue Struktur:

1. **Gruppierung nach `sub_category`** — 3 Sektionen mit Ueberschriften (Programme / Fleet / Add-ons)
2. **Programme-Karten** — NetJets-Logo, Programmname, Badge, CTA-Button
3. **Fleet-Karten** — Flugzeugbild, Hersteller, Passagiere, Reichweite (bestehendes Layout)
4. **Add-on-Karten** — Icon-basiert (kein Bild), Beschreibungstext
5. **Inline-Detail** — Anpassung: Programme zeigen Programm-Info statt Hersteller/Reichweite; Fleet zeigt bestehende Felder

### Umsetzungsschritte

| # | Aktion | Detail |
|---|--------|--------|
| 1 | DB: DELETE | 6 Legacy-Rows loeschen (`shop_key = 'privatjet'`) |
| 2 | DB: INSERT | 11 neue Rows mit `shop_key = 'privatjet'`, korrekten Bildern, harmonisierter Metadata |
| 3 | UI: CarsPrivatjet.tsx | Gruppierung nach `sub_category`, 3 Karten-Varianten, Detail-Anpassung |
| 4 | DB: service_shop_config | `metadata_schema` erweitern um `fleet_class`, `program`, `cta` Felder |
| 5 | plan.md | Aktualisieren |

