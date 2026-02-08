

# Korrekturplan: MOD-09 Katalog vs. Beratung — Investment Engine Positionierung

## Zusammenfassung

Die aktuelle Implementierung verstößt gegen die architektonische Trennung zwischen **Katalog** (Verkaufsexposé) und **Beratung** (Investment Engine). Die Analyse zeigt:

| Bereich | IST-Zustand | SOLL-Zustand |
|---------|-------------|--------------|
| **Katalog → Detail** | Investment Engine (MasterGraph, Slider) | Read-Only Verkaufsexposé |
| **Beratung → Modal** | Investment Engine (Modal) | ✓ Korrekt |
| **ExposeDetail (MOD-06)** | Tab-Bug + Map oben | Tab-Fix + Map unten |

---

## Identifizierte Probleme

### Problem 1: KatalogDetailPage zeigt Investment Engine

Die Datei `KatalogDetailPage.tsx` (Zeilen 419-441) enthält die Investment-Engine-Komponenten:
- `MasterGraph`
- `Haushaltsrechnung`
- `DetailTable40Jahre`
- `InvestmentSliderPanel` (Sidebar)

Diese gehören in den **Beratung-Tab**, nicht in den Katalog.

### Problem 2: Fehlende Objektdaten im Katalog-Exposé

Die aktuelle Query (Zeile 63-80) lädt nur minimale Daten:
- Fehlt: `renovation_year`, `energy_source`, `heating_type`
- Fehlt: `units` (für Mietdaten pro Einheit)
- Fehlt: `property_accounting` (für AfA-Daten)

### Problem 3: Tab-Bug in ExposeDetail.tsx

Zeile 763 hat falschen TabsContent-Value:
```typescript
// IST (FALSCH):
<TabsContent value="rendite" className="mt-4">
  // Energie-Inhalt

// SOLL:
<TabsContent value="energie" className="mt-4">
```

### Problem 4: Google Maps Position

In `ExposeDetail.tsx` (Zeile 470-476) steht die Karte direkt nach der Bildergalerie. Laut UX-Anforderung soll sie ganz unten stehen.

### Problem 5: BeratungTab → Modal korrekt

Die `BeratungTab.tsx` verwendet `PartnerExposeModal` mit Investment-Engine — das ist **architektonisch korrekt** und muss nicht geändert werden.

---

## Architektur-Klarstellung (Final)

```
MOD-09 Vertriebspartner
│
├── /katalog
│   └── KatalogDetailPage → READ-ONLY VERKAUFSEXPOSÉ
│       ├── Bildergalerie
│       ├── Key Facts (Preis, Fläche, Rendite)
│       ├── Tabs: Objektdaten | Rendite & AfA | Energie
│       ├── Unterlagen-Download
│       ├── Standortkarte (UNTEN)
│       └── [Sidebar] Kennzahlen + "Deal starten"
│       └── KEINE Investment-Engine!
│
└── /beratung
    └── BeratungTab + PartnerExposeModal → INVESTMENT ENGINE
        ├── Suchformular (zVE, Eigenkapital)
        ├── Property-Grid mit berechneten Metrics
        └── Modal mit MasterGraph, Slider, Tabelle
        └── ✓ KORREKT wie implementiert
```

---

## Technische Lösung

### Phase 1: KatalogDetailPage komplett umbauen

Die gesamte Komponente wird auf das `ExposeDetail.tsx`-Layout umgestellt (aber read-only, ohne Formularfelder):

**1. Query erweitern:**
```typescript
.select(`
  id, public_id, title, description, asking_price,
  properties!inner (
    id, property_type, address, city, postal_code,
    total_area_sqm, year_built, renovation_year,
    energy_source, heating_type, annual_income
  )
`)
```

**2. Investment-Engine entfernen:**
- `MasterGraph` → entfernen
- `Haushaltsrechnung` → entfernen
- `DetailTable40Jahre` → entfernen
- `InvestmentSliderPanel` → entfernen
- `useInvestmentEngine` Hook → entfernen

**3. Tab-Struktur hinzufügen:**
```
<Tabs defaultValue="objekt">
  <TabsTrigger value="objekt">Objektdaten</TabsTrigger>
  <TabsTrigger value="rendite">Rendite & AfA</TabsTrigger>
  <TabsTrigger value="energie">Energie</TabsTrigger>
</Tabs>
```

**4. Map-Komponente unten positionieren:**
- `ExposeLocationMap` nach den Tabs und Dokumenten einfügen

**5. Sidebar mit Kennzahlen:**
- Kaufpreis (groß)
- Bruttorendite
- Fläche
- "Deal starten" Button
- "Anfrage senden" Button

### Phase 2: Tab-Bug in ExposeDetail.tsx fixen

```typescript
// Zeile 763: Korrektur
<TabsContent value="energie" className="mt-4">
```

### Phase 3: Map-Position in ExposeDetail.tsx korrigieren

Die `ExposeLocationMap`-Komponente von Zeile 470-476 nach unten verschieben (nach den Tabs, vor der Sidebar).

---

## Betroffene Dateien

| Datei | Änderung | Aufwand |
|-------|----------|---------|
| `KatalogDetailPage.tsx` | **Komplett neu aufbauen** — Exposé statt Investment Engine | Hoch |
| `ExposeDetail.tsx` | Tab-Bug fixen (Zeile 763: `value="energie"`) | Niedrig |
| `ExposeDetail.tsx` | Map nach unten verschieben | Mittel |
| `BeratungTab.tsx` | Keine Änderung nötig ✓ | — |
| `PartnerExposeModal.tsx` | Keine Änderung nötig ✓ | — |

---

## Neue KatalogDetailPage-Struktur

```typescript
const KatalogDetailPage = () => {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Image Gallery */}
          <Card>...</Card>
          
          {/* Key Facts Bar */}
          <Card className="bg-primary/5 border-primary/20">
            <div className="grid grid-cols-4 gap-4">
              <div>Kaufpreis</div>
              <div>Wohnfläche</div>
              <div>Baujahr</div>
              <div>Bruttorendite</div>
            </div>
          </Card>
          
          {/* Beschreibung */}
          {listing.description && (
            <Card>
              <CardHeader><CardTitle>Beschreibung</CardTitle></CardHeader>
              <CardContent>{listing.description}</CardContent>
            </Card>
          )}
          
          {/* Tab-Content (READ-ONLY) */}
          <Tabs defaultValue="objekt">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="objekt">Objektdaten</TabsTrigger>
              <TabsTrigger value="rendite">Rendite & AfA</TabsTrigger>
              <TabsTrigger value="energie">Energie</TabsTrigger>
            </TabsList>
            
            <TabsContent value="objekt">
              {/* Grunddaten, Baujahr, Adresse */}
            </TabsContent>
            
            <TabsContent value="rendite">
              {/* Mieteinnahmen, AfA-Daten */}
            </TabsContent>
            
            <TabsContent value="energie">
              {/* Energieausweis */}
            </TabsContent>
          </Tabs>
          
          {/* Documents */}
          {documents.length > 0 && <Card>...</Card>}
          
          {/* Location Map — GANZ UNTEN */}
          <ExposeLocationMap 
            address={listing.address}
            city={listing.city}
            postalCode={listing.postal_code}
            showExactLocation={true}
          />
        </div>
        
        {/* Right Sidebar (1/3) */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-primary">
                {formatCurrency(listing.asking_price)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>Bruttorendite: X%</div>
              <div>Mieteinnahmen: X €/Mo</div>
              <Separator />
              <Button className="w-full">Deal starten</Button>
              <Button variant="outline" className="w-full">Anfrage senden</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
```

---

## Akzeptanzkriterien

| # | Test |
|---|------|
| 1 | **Katalog → Detail**: Zeigt Objektdaten in Tab-Layout (KEINE Investment-Grafiken) |
| 2 | **Katalog → Detail**: Tabs funktionieren korrekt (Objektdaten, Rendite, Energie) |
| 3 | **Katalog → Detail**: Google Maps erscheint ganz unten |
| 4 | **Katalog → Detail**: "Deal starten" und "Anfrage senden" Buttons vorhanden |
| 5 | **Katalog → Detail**: Provision ist NICHT sichtbar (nur in Katalog-Liste) |
| 6 | **Beratung → Modal**: Investment Engine funktioniert weiterhin (MasterGraph, Slider) |
| 7 | **MOD-06 ExposeDetail**: "Energie"-Tab zeigt Energie-Inhalt (nicht Rendite-Inhalt) |
| 8 | **MOD-06 ExposeDetail**: Google Maps erscheint unten, nicht oben |

---

## Implementierungsreihenfolge

1. **KatalogDetailPage.tsx** — Komplett umbauen auf Exposé-Layout ohne Investment Engine
2. **ExposeDetail.tsx** — Tab-Bug fixen (`value="energie"`)
3. **ExposeDetail.tsx** — Map-Position nach unten verschieben
4. **Testen** — Golden Path: MOD-04 → Verkaufsauftrag → MOD-09 Katalog → Detail-Exposé

