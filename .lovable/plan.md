

# Fix: ENG-VALUATION Dokumentation in ENGINE_REGISTRY.md korrigieren

## Befund

ENG-VALUATION existiert in der Registry (v1.8 Changelog), hat aber:
- **Falschen Status**: `🔲 Geplant` statt `⚡ Teilweise` (Engine ist gebaut, Deep Mapper aktiv, 400-Bug gefixt)
- **Falsche Kategorie**: Steht in "Kalkulation (10 Engines)" — ist aber eine Hybrid-Engine (Client `src/engines/valuation/` + Edge Function `sot-valuation-engine`)
- **Keine Detail-Sektion**: Alle anderen komplexen Engines (TLC, FLC, etc.) haben beschreibende Absätze — ENG-VALUATION nicht

## Umsetzung (1 Datei)

### `spec/current/06_engines/ENGINE_REGISTRY.md`

1. **Status korrigieren** (Zeile 59): `🔲 Geplant` → `⚡ Teilweise`
2. **Eigene Kategorie-Sektion** nach Orchestrierung (nach Zeile 70) einfügen:

```
### Bewertung (1 Engine)

| Code | Name | Status | Billing | Ausfuehrung |
|------|------|--------|---------|-------------|
| ENG-VALUATION | SoT Valuation Engine | ⚡ Teilweise | 20 Credits/Case | Edge Function (`sot-valuation-engine`, 6-Stage Pipeline) + Client Engine (`src/engines/valuation/`) |

> **ENG-VALUATION** ersetzt Sprengnetter + GeoMap. 6-Stage Pipeline:
> Stage 0 Preflight (Credit-Check), Stage 1 Intake (Datenextraktion),
> Stage 2 Norm+Location (Google Maps APIs), Stage 3 Comps (Portal-Scraping),
> Stage 4 Calc (Ertragswert/Comp-Proxy/Sachwert), Stage 5 Report (Web Reader + PDF).
> Scope: MOD-04 (Portfolio-Bewertung, SSOT_FINAL Mode), MOD-12/MOD-13 (Akquise-Exposé-Bewertung).
> Deep Mapper in useValuationCase normalisiert snake_case DB-Output zu camelCase UI-DTO.
> DB: valuation_cases, valuation_inputs, valuation_results, valuation_reports.
```

3. **Kalkulation-Header** anpassen: ENG-VALUATION aus der Kalkulation-Tabelle entfernen (es ist keine pure TS Function) oder dort belassen mit Verweis auf die Detail-Sektion. Empfehlung: In Kalkulation belassen (da `src/engines/valuation/engine.ts` client-side Calc-Funktionen exportiert) aber Status korrigieren.

4. **Changelog v2.0** anfügen: "ENG-VALUATION Status von Geplant auf Teilweise korrigiert. Detail-Sektion mit 6-Stage Pipeline, Scope (MOD-04/12/13) und Deep Mapper Architektur hinzugefuegt."

Keine anderen Dateien betroffen — reine Dokumentationskorrektur.

