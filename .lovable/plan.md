
# MOD-04 + Investment Engine — Deep Audit v4.1

## Status: P1 + P3 BEHOBEN ✅

### Durchgeführte Fixes

| # | Issue | Status |
|---|-------|--------|
| P1 | units.current_monthly_rent → BER:1150, MUC:1580, HH:750 (war 850/1250/580) | ✅ Done |
| P3 | listings.public_id → DEMO-BER-01, DEMO-MUC-01, DEMO-HH-01 (war ohne Bindestrich) | ✅ Done |

### Verifikation

| Objekt | units.rent | annual_income/12 | Demo monthlyRent | listings.public_id | Demo public_id |
|--------|-----------|-------------------|------------------|--------------------|----------------|
| BER-01 | 1.150 ✅ | 1.150 ✅ | 1.150 ✅ | DEMO-BER-01 ✅ | DEMO-BER-01 ✅ |
| MUC-01 | 1.580 ✅ | 1.580 ✅ | 1.580 ✅ | DEMO-MUC-01 ✅ | DEMO-MUC-01 ✅ |
| HH-01 | 750 ✅ | 750 ✅ | 750 ✅ | DEMO-HH-01 ✅ | DEMO-HH-01 ✅ |

### Offene Sprint-Items (P2)

| # | Issue | Datei |
|---|-------|-------|
| P2-1 | MOD-04 Simulation nutzt Client-Engine ohne Steuer (Edge Function wäre besser) | InventoryInvestmentSimulation.tsx |
| P2-2 | NK-Engine hardcoded Personenzahlen | engine.ts |
