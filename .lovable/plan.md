

## Bug: Steuervorteil in Portfolio-EÜR ignoriert gewerblichen Kontext

### Ursache

In `PortfolioTab.tsx`, Zeilen 1076-1099: Die **"Monatliche Übersicht (EÜR)"**-Karte berechnet den Steuervorteil mit einem **hardcodierten 42% Grenzsteuersatz** — ohne zu prüfen, ob der ausgewählte Vermieter-Kontext gewerblich (`BUSINESS`) ist.

Die Variable `selectedContext` ist im Scope verfügbar (Zeile 744), wird aber in diesem Block nicht genutzt. Das `PortfolioSummaryModal` macht es korrekt (Zeile 1422: `isCommercial={selectedContext?.context_type === 'BUSINESS'}`), aber die EÜR-Karte wurde nie angepasst.

### Fix

**Datei:** `src/pages/portal/immobilien/PortfolioTab.tsx` (Zeilen 1063-1103)

1. **`isCommercial`-Flag** ableiten: `const isCommercial = selectedContext?.context_type === 'BUSINESS';`
2. **Steuervorteil auf 0 setzen** wenn gewerblich: `const monthlyTaxBenefit = isCommercial ? 0 : taxDeduction / 12;`
3. **Steuervorteil-Zeile ausblenden** wenn gewerblich: `{!isCommercial && (<div>Steuervorteil...</div>)}`
4. **Summe Einnahmen** anpassen (ist bereits korrekt, da `monthlyTaxBenefit = 0`)

Zusätzlich: Den hardcodierten 42%-Steuersatz durch den tatsächlichen Steuersatz des Kontexts ersetzen (`selectedContext?.tax_rate_percent / 100 || 0.42`), falls ein privater Kontext vorliegt.

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/pages/portal/immobilien/PortfolioTab.tsx` | EÜR-Block: isCommercial-Check + dynamischer Steuersatz |

