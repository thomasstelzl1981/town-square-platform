
# Implementierungsplan: Source of Truth & Unit-basierter Workflow

## Bestätigtes Architektur-Prinzip

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   MOD-04 EXPOSÉ = SINGLE SOURCE OF TRUTH                │
│                                                                         │
│   PropertyDetail.tsx (/portal/immobilien/:id)                          │
│   ═══════════════════════════════════════════                          │
│   • Einzige Stelle für Dateneingabe/-änderung                          │
│   • Objektdaten, Finanzierung, Mieter, Grafiken                        │
│   • Alle anderen Module lesen NUR von hier                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ READ-ONLY
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
           ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
           │   MOD-04     │ │   MOD-05     │ │   MOD-06     │
           │  Portfolio   │ │  Vermietung  │ │   Verkauf    │
           │    Liste     │ │   Exposé     │ │   Exposé     │
           └──────────────┘ └──────────────┘ └──────────────┘
                                    │               │
                                    │               │
                              Sichtbarkeit    Sichtbarkeit
                              anpassbar       anpassbar
                              (nicht Daten)   (nicht Daten)
```

---

## Phase 1: Schema-Erweiterung

### 1.1 Datenbank-Migration

Neue Spalte für Unit-basierte Listings:

```sql
ALTER TABLE listings ADD COLUMN unit_id UUID REFERENCES units(id);
```

---

## Phase 2: TestDataManager erweitern

### 2.1 Datei
`src/components/admin/TestDataManager.tsx`

### 2.2 Änderungen
- Excel-Parser für `Immobilienaufstellung_Vorlage-3.xlsx`
- Mapping: 1 Excel-Zeile = 1 Unit = 1 Zeile in Listen

### 2.3 Feld-Mapping

| Excel-Feld | Transformation | Ziel-Tabelle |
|------------|----------------|--------------|
| Objekt (ZL002) | → property_code | properties.code |
| Art (MFH) | → multi_family | properties.property_type |
| Adresse, Ort | → direkt | properties.address, city |
| qm | → Komma→Punkt | units.area_sqm |
| Kaltmiete | → monatlich | units.current_monthly_rent |
| Mieter | → Split | contacts + leases |
| Kaufpreis | → Integer | properties.purchase_price |
| Restschuld, Zinssatz | → Zahlen | property_financing |

---

## Phase 3: PortfolioTab Unit-Query

### 3.1 Datei
`src/pages/portal/immobilien/PortfolioTab.tsx`

### 3.2 Änderungen
Query von `properties` auf `units LEFT JOIN properties` umstellen

### 3.3 Neue Spalten

| Spalte | Quelle |
|--------|--------|
| Code | properties.code |
| Adresse | properties.address, city |
| Wohnung | units.unit_number |
| m² | units.area_sqm |
| Mieter | contacts.name via leases |
| Miete | units.current_monthly_rent |

---

## Phase 4: ObjekteTab (Verkauf) Unit-Query

### 4.1 Datei
`src/pages/portal/verkauf/ObjekteTab.tsx`

### 4.2 Änderungen
Query auf `units` umstellen (identisch zu PortfolioTab)

### 4.3 Spalten

| Spalte | Quelle | Editierbar? |
|--------|--------|-------------|
| Code | properties.code | Nein (aus MOD-04) |
| Adresse | properties.address | Nein (aus MOD-04) |
| Miete | units.current_monthly_rent | Nein (aus MOD-04) |
| Preis | listings.asking_price | Nur in Exposé |
| Status | listings.status | Via Consent |
| Kanäle | listing_publications | Via Toggles |

---

## Phase 5: ExposeDetail (Verkauf) anpassen

### 5.1 Datei
`src/pages/portal/verkauf/ExposeDetail.tsx`

### 5.2 Änderungen

1. Route-Parameter: `:propertyId` → `:unitId`
2. Objektdaten-Karte: READ-ONLY (aus MOD-04)
3. Editierbare Felder NUR:
   - Titel (für Inserat)
   - Beschreibung (für Inserat)
   - Kaufpreis
   - Provision
4. Hinweistext: "Stammdaten bearbeiten Sie im Immobilien-Exposé"
5. Grafiken (Wertentwicklung, Tilgung) → aus MOD-04 Finanzierungsdaten

---

## Phase 6: VorgaengeTab PropertyTable

### 6.1 Datei
`src/pages/portal/verkauf/VorgaengeTab.tsx`

### 6.2 Änderungen
Von EmptyState zu PropertyTable-Pattern

### 6.3 Reservierungen-Tabelle (immer sichtbar)

| Spalte | Bei 0 Daten |
|--------|-------------|
| Objekt | – |
| Käufer | – |
| Preis | – |
| Status | – |
| Notartermin | – |
| Bestätigung | – |

### 6.4 Transaktionen-Tabelle (immer sichtbar)

| Spalte | Bei 0 Daten |
|--------|-------------|
| Objekt | – |
| Käufer | – |
| Kaufpreis | – |
| Provision | – |
| Status | – |
| Termine | – |

---

## Phase 7: ReportingTab PropertyTable

### 7.1 Datei
`src/pages/portal/verkauf/ReportingTab.tsx`

### 7.2 Performance-Tabelle (immer sichtbar)

| Spalte | Bei 0 Daten |
|--------|-------------|
| Objekt | – |
| Preis | – |
| Status | – |
| Kanäle | – |
| Views | 0 |
| Anfragen | 0 |

---

## Phase 8: MOD-09 KatalogTab

### 8.1 Datei
`src/pages/portal/vertriebspartner/KatalogTab.tsx`

### 8.2 Änderungen
- Query auf Units mit partner_network = active
- PropertyTable-Pattern
- "Deal starten" Button

---

## Phase 9: MOD-09 PipelineTab

### 9.1 Datei
`src/pages/portal/vertriebspartner/PipelineTab.tsx`

### 9.2 Pipeline-Tabelle (immer sichtbar)

| Spalte | Bei 0 Daten |
|--------|-------------|
| Objekt | – |
| Kunde | – |
| Status | – |
| Preis | – |
| Provision | – |
| Nächster Schritt | – |

---

## Phase 10: Dokumentation

### 10.1 Datei
`DECISIONS.md`

### 10.2 Neue ADRs

- ADR-040: Scope-Trennung (MOD-06 Bestand, MOD-12 Projekte)
- ADR-041: Unit-basierte Listings
- ADR-042: Source of Truth MOD-04 Exposé
- ADR-043: Modul-Nummerierung (MOD-11 Finanzierungsmanager, MOD-12 Projekte)

---

## Zusammenfassung

| Phase | Datei/Bereich | Aufwand |
|-------|---------------|---------|
| 1 | Schema-Migration | 10 min |
| 2 | TestDataManager | 45 min |
| 3 | PortfolioTab | 25 min |
| 4 | ObjekteTab (Verkauf) | 25 min |
| 5 | ExposeDetail | 30 min |
| 6 | VorgaengeTab | 25 min |
| 7 | ReportingTab | 20 min |
| 8 | MOD-09 KatalogTab | 25 min |
| 9 | MOD-09 PipelineTab | 20 min |
| 10 | DECISIONS.md | 10 min |

**Gesamt: ~4 Stunden**

---

## Erwartetes Ergebnis

Nach Implementierung:

1. Excel-Import lädt 8 Properties mit Units in MOD-04
2. MOD-04 Portfolio zeigt Unit-basierte Liste
3. MOD-04 Exposé ist editierbar (Source of Truth)
4. MOD-06 Objekte zeigt dieselben Units (READ-ONLY)
5. MOD-06 Exposé zeigt Daten aus MOD-04, nur Verkaufsfelder editierbar
6. Vorgänge/Reporting zeigen Tabellenstruktur mit Platzhaltern
7. MOD-09 Katalog/Pipeline bereit für Partner-Flow
