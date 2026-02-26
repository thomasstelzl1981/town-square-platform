

## Plan: AfA-Override systemweit durchsetzen (MOD-04 unfreeze + MOD-08/09/Zone 3)

### Kontext

MOD-04 wird hiermit UNFROZEN fuer diesen Change.

Der `afaRateOverride` wurde bereits in der Edge Function und im Hook implementiert. Das Problem: **Nur MOD-13** reicht den Wert durch. Alle anderen Module, die die Investment Engine nutzen, ignorieren die AfA-Daten aus der Immobilienakte (`property_accounting`-Tabelle) komplett und rechnen mit den Defaults (`afaModel: 'linear'`, `buildingShare: 0.8`, `afaRate: 2%`).

### Ist-Zustand (fehlerhaft)

```text
MOD-08 SucheTab:        CalculationInput = { ...defaultInput, purchasePrice, monthlyRent, equity, zve }
                         → afaModel = 'linear', buildingShare = 0.8, afaRateOverride = undefined
                         → Engine nutzt Default 2% aus tax_parameters

MOD-08 ExposePage:      setParams({ purchasePrice, monthlyRent })
                         → afaModel/buildingShare/afaRateOverride: NICHT gesetzt
                         → User kann manuell ueber Slider aendern, aber Default ist falsch

MOD-09 BeratungTab:     Gleich wie SucheTab — kein property_accounting-Fetch

Zone 3 Kaufy:           Gleich — Defaults aus defaultInput

ABER: MOD-06 ExposeDetail und MOD-09 KatalogDetailPage FETCHEN bereits
      property_accounting — nutzen es aber nicht fuer den Engine-Call!
```

### Soll-Zustand

Jeder Ort, der die Investment Engine aufruft und einen Bezug zu einer konkreten Immobilie (property_id) hat, MUSS die AfA-Daten aus `property_accounting` laden und als Override uebergeben. Die Hierarchie ist:

```text
1. property_accounting.afa_rate_percent   ← SSOT aus der Immobilienakte
2. Slider-Aenderung durch den User        ← manueller Override im UI
3. tax_parameters Default (2%)            ← Fallback wenn nichts erfasst
```

### Aenderungen

#### 1. MOD-08: InvestmentExposePage.tsx — property_accounting laden und durchreichen

**Neuer Query:** Wenn `listing.property_id` vorhanden, `property_accounting` abfragen (analog zu MOD-06/09 die das bereits tun). Die geladenen Werte (`afa_rate_percent`, `afa_model`, `land_share_percent`, `building_share_percent`) werden als Defaults in den `params`-State geschrieben.

```typescript
// Neuer useQuery fuer property_accounting
const { data: accountingData } = useQuery({
  queryKey: ['property-accounting-expose', listing?.property_id],
  queryFn: async () => {
    const { data } = await supabase
      .from('property_accounting')
      .select('afa_rate_percent, afa_model, land_share_percent, building_share_percent')
      .eq('property_id', listing!.property_id)
      .maybeSingle();
    return data;
  },
  enabled: !!listing?.property_id,
});

// Im useEffect wo params initialisiert werden:
setParams(prev => ({
  ...prev,
  purchasePrice: listing.asking_price,
  monthlyRent: listing.monthly_rent,
  afaRateOverride: accountingData?.afa_rate_percent ?? undefined,
  buildingShare: accountingData?.building_share_percent
    ? accountingData.building_share_percent / 100
    : 0.8,
  afaModel: mapAfaModel(accountingData?.afa_model) ?? 'linear',
}));
```

#### 2. MOD-08: SucheTab.tsx — property_accounting batch-laden

Fuer die Suche werden mehrere Listings parallel berechnet. Hier muss fuer alle property_ids in einem Batch die accounting-Daten geladen werden.

```typescript
// Nach dem Listings-Fetch: property_accounting fuer alle property_ids laden
const propertyIds = allListingsToProcess.map(l => l.property_id).filter(Boolean);
const { data: accountingRows } = await supabase
  .from('property_accounting')
  .select('property_id, afa_rate_percent, afa_model, land_share_percent, building_share_percent')
  .in('property_id', propertyIds);

const accountingMap = new Map(
  (accountingRows || []).map(r => [r.property_id, r])
);

// Im calculate-Aufruf pro Listing:
const acct = accountingMap.get(listing.property_id);
const input: CalculationInput = {
  ...defaultInput,
  purchasePrice: listing.asking_price,
  monthlyRent,
  equity,
  taxableIncome: zve,
  maritalStatus,
  hasChurchTax,
  afaRateOverride: acct?.afa_rate_percent ?? undefined,
  buildingShare: acct?.building_share_percent ? acct.building_share_percent / 100 : 0.8,
  afaModel: mapAfaModel(acct?.afa_model) ?? 'linear',
};
```

#### 3. MOD-09: BeratungTab.tsx — property_accounting laden

Gleiche Logik wie SucheTab: Batch-Query fuer alle Listings, dann pro Listing die accounting-Werte einsetzen.

#### 4. Zone 3: Kaufy2026Expose.tsx — property_accounting laden

Gleiche Logik wie InvestmentExposePage: Einzelquery wenn listing geladen, Defaults in params setzen.

#### 5. AfA-Model-Mapping-Funktion

Die Immobilienakte verwendet detaillierte AfA-Keys (`7_4_1`, `7_4_2b`, `7_5a`, `7b`, `7h`, `7i`, `rnd`), die Engine akzeptiert aber nur `linear | 7i | 7h | 7b`. Es braucht eine Mapping-Funktion:

```typescript
// src/lib/mapAfaModel.ts (neues Shared Utility)
export function mapAfaModelToEngine(akteModel?: string | null): 'linear' | '7i' | '7h' | '7b' {
  if (!akteModel) return 'linear';
  if (akteModel === '7i') return '7i';
  if (akteModel === '7h') return '7h';
  if (akteModel === '7b') return '7b';
  if (akteModel === '7_5a') return '7b'; // Degressiv → nächster Sonder-AfA Typ
  // Alle linearen Varianten (7_4_1, 7_4_2a, 7_4_2b, 7_4_2c, rnd) → 'linear'
  return 'linear';
}
```

Diese Funktion wird auch in MOD-13 (InvestEngineTab, InvestEngineExposePage) verwendet, wo bisher `project.afa_model` direkt gecastet wird.

#### 6. MOD-04: PropertyDetailPage.tsx — Sicherstellen dass accounting-Daten korrekt an Simulation/KPIs fliessen

Die Datei laedt bereits `property_accounting` (Z.217-224). Hier muss geprueft werden, ob die geladenen Werte korrekt an Investment-KPI-Blöcke weitergegeben werden. Falls der PropertyDetailPage eine Investment-Simulation hat, muss `afaRateOverride` durchgereicht werden.

---

### Dateien-Uebersicht

| Datei | Aenderung | Modul |
|---|---|---|
| `src/lib/mapAfaModel.ts` | **NEU:** Shared Mapping-Funktion AfA-Akte → Engine-Modell | Shared |
| `src/pages/portal/investments/InvestmentExposePage.tsx` | property_accounting Query + afaRateOverride/buildingShare/afaModel in params | MOD-08 |
| `src/pages/portal/investments/SucheTab.tsx` | Batch property_accounting Query + Override im calculate-Input | MOD-08 |
| `src/pages/portal/vertriebspartner/BeratungTab.tsx` | Batch property_accounting Query + Override im calculate-Input | MOD-09 |
| `src/pages/zone3/kaufy2026/Kaufy2026Expose.tsx` | property_accounting Query + Override in params | Zone 3 |
| `src/pages/portal/projekte/InvestEngineTab.tsx` | `mapAfaModelToEngine()` statt direkter Cast | MOD-13 |
| `src/pages/portal/projekte/InvestEngineExposePage.tsx` | `mapAfaModelToEngine()` statt direkter Cast | MOD-13 |

### Was NICHT geaendert wird

| Punkt | Begruendung |
|---|---|
| Edge Function `sot-investment-engine` | `afaRateOverride` bereits implementiert |
| `useInvestmentEngine.ts` Hook | `afaRateOverride` bereits im Interface |
| `InvestmentSliderPanel.tsx` | Slider fuer afaModel bleibt — User kann manuell ueberschreiben |
| `property_accounting`-Tabelle | Schema bereits korrekt mit allen benoetigten Spalten |
| Aufteiler-Kalkulator (Block D) | Umlaufvermoegen, keine AfA |

### Freeze-Status

| Modul | Status |
|---|---|
| MOD-04 | UNFROZEN (User hat explizit "unfreeze Modul 4" gesagt) |
| MOD-08 | Bereits unfrozen in modules_freeze.json |
| MOD-09 | Bereits unfrozen in modules_freeze.json |
| MOD-13 | Bereits unfrozen in modules_freeze.json |
| Zone 3 | Kein Modul-Freeze |

