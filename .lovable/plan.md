
# MOD-09 Beratung: Angleichung an MOD-08/Zone 3

## Zusammenfassung

MOD-09 (Beratung) wird an MOD-08 und Zone 3 angeglichen:
- Suchfelder werden identisch zu MOD-08 (Collapsible für erweiterte Optionen)
- Ergebniskacheln verwenden `InvestmentResultTile` (T-Konto-Layout)
- Provision wird **nur im Katalog** angezeigt, nicht in der Beratung oder im Exposé
- Datenquelle bleibt `partner_network`-gefiltert (Golden Path)

## Klarstellung: Provision

| Bereich | Provisions-Badge |
|---------|------------------|
| **Katalog (Liste)** | ✅ Sichtbar |
| **Beratung (Kacheln)** | ❌ Nicht sichtbar |
| **Exposé (Detail)** | ❌ Nicht sichtbar |

Der Käufer (Endkunde) soll die Provision nicht sehen — nur der Partner im Katalog-Überblick.

---

## Änderungen

### 1. Suchformular angleichen (`PartnerSearchForm.tsx`)

**Aktuell:** Alle 4 Felder (zVE, Eigenkapital, Güterstand, Kirchensteuer) immer sichtbar.

**Neu:** Layout wie MOD-08:
- Hauptzeile: zVE + Eigenkapital + "Mehr Optionen"-Button + Berechnen
- Collapsible: Familienstand + Kirchensteuer (als Select-Dropdowns)

```
┌────────────────────────────────────────────────────────────────────────┐
│  zVE [60.000] €  │  Eigenkapital [50.000] €  │  [Mehr Optionen ▼]  │  [Berechnen] │
├────────────────────────────────────────────────────────────────────────┤
│  Familienstand: [Ledig ▼]    Kirchensteuer: [Nein ▼]                   │  (eingeklappt)
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Ergebniskacheln ersetzen (`BeratungTab.tsx`)

**Aktuell:** `PartnerPropertyGrid` (eigenes Layout mit "Cashflow + Steuervorteil = Netto-Belastung")

**Neu:** `InvestmentResultTile` mit **`showProvision={false}`**

```tsx
// Vorher
<PartnerPropertyGrid
  listings={visibleListings}
  onSelect={(listing) => setSelectedListing(listing)}
/>

// Nachher
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {visibleListings.map((listing) => (
    <InvestmentResultTile
      key={listing.id}
      listing={transformToPublicListing(listing)}
      metrics={metricsCache[listing.id] || null}
      linkPrefix="/portal/vertriebspartner/beratung/objekt"
      showProvision={false}  // ← Keine Provision in Beratung!
    />
  ))}
</div>
```

### 3. Metrics-Struktur angleichen

**Aktuell (MOD-09):**
```typescript
metricsCache[id] = { 
  cashFlowBeforeTax, 
  taxSavings, 
  netBurden 
};
```

**Neu (wie MOD-08):**
```typescript
metricsCache[id] = { 
  monthlyBurden,
  roiAfterTax,
  loanAmount,
  yearlyInterest,
  yearlyRepayment,
  yearlyTaxSavings,
};
```

### 4. Daten-Transformation hinzufügen

`InvestmentResultTile` erwartet das `PublicListing`-Interface. Die Datenstruktur muss gemappt werden:

```typescript
const transformToPublicListing = (listing: ListingWithMetrics): PublicListing => ({
  listing_id: listing.id,
  public_id: listing.public_id || '',
  title: listing.title,
  asking_price: listing.asking_price,
  property_type: listing.property_type || 'Unbekannt',
  address: listing.property_address,
  city: listing.property_city,
  postal_code: null,
  total_area_sqm: listing.total_area_sqm,
  unit_count: 1,
  monthly_rent_total: listing.annual_rent / 12,
  hero_image_path: listing.hero_image_path,
  // WICHTIG: Keine partner_commission_rate hier, da showProvision=false
});
```

### 5. Navigation anpassen

**Aktuell:** Modal (`PartnerExposeModal`)
**Neu:** Full-Page-Route wie MOD-08/Zone 3

```tsx
// In VertriebspartnerPage.tsx neue Route hinzufügen:
<Route path="beratung/objekt/:publicId" element={<PartnerExposePage />} />
```

Die `PartnerExposePage` kann die bestehende `InvestmentExposePage`-Struktur wiederverwenden.

---

## Dateiübersicht

| # | Datei | Änderung |
|---|-------|----------|
| 1 | `src/components/vertriebspartner/PartnerSearchForm.tsx` | Collapsible-Layout wie MOD-08 |
| 2 | `src/pages/portal/vertriebspartner/BeratungTab.tsx` | `InvestmentResultTile` mit `showProvision={false}`, Metrics-Struktur angleichen |
| 3 | `src/pages/portal/VertriebspartnerPage.tsx` | Route `/beratung/objekt/:publicId` hinzufügen |
| 4 | `src/pages/portal/vertriebspartner/PartnerExposePage.tsx` | **NEU**: Full-Page Exposé ohne Provisions-Anzeige |

---

## Technische Details

### PartnerSearchForm.tsx — Neues Layout

```tsx
// Hauptzeile: zVE, Eigenkapital, Button
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="space-y-2">
    <Label>zu versteuerndes Einkommen (zVE)</Label>
    <Input type="number" value={value.zve} ... />
  </div>
  <div className="space-y-2">
    <Label>Eigenkapital</Label>
    <Input type="number" value={value.equity} ... />
  </div>
  <div className="flex items-end">
    <CollapsibleTrigger>
      <Button variant="outline">Mehr Optionen ▼</Button>
    </CollapsibleTrigger>
  </div>
</div>

// Collapsible: Erweiterte Optionen (wie MOD-08)
<CollapsibleContent>
  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
    <Select value={maritalStatus}>Ledig / Verheiratet</Select>
    <Select value={hasChurchTax}>Nein / Ja</Select>
  </div>
</CollapsibleContent>

// Berechnen-Button bleibt am Ende
<Button onClick={onSearch}>Berechnen</Button>
```

### BeratungTab.tsx — Anpassungen

1. Import `InvestmentResultTile` statt `PartnerPropertyGrid`
2. Transformer-Funktion für Datenformat
3. Metrics-Berechnung auf MOD-08-Struktur umstellen
4. Link statt Modal für Objektdetail

---

## Akzeptanzkriterien

| # | Test | Erwartung |
|---|------|-----------|
| 1 | MOD-09 Beratung öffnen | Suchformular wie MOD-08 (Collapsible) |
| 2 | Suche durchführen | Kacheln mit T-Konto-Layout erscheinen |
| 3 | Provision auf Kacheln | **Keine Provision** sichtbar |
| 4 | Klick auf Kachel | Navigation zu Full-Page Exposé |
| 5 | Exposé-Ansicht | **Keine Provision** sichtbar |
| 6 | MOD-09 Katalog | Provision **sichtbar** in der Liste |
| 7 | MOD-08 Suche | Keine Regression, weiterhin funktional |
| 8 | Zone 3 KAUFY | Keine Regression, weiterhin funktional |
