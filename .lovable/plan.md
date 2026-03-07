

# Smoke-Test & Audit — Akquise-Manager (MOD-12)

## Test-Ergebnisse

### ✅ BESTANDEN

| Bereich | Status | Details |
|---|---|---|
| Header KPIs | ✅ | Rendite/Faktor zeigt 10.3% · 9.8x (328.181 / 3.200.000 = 10.26%) — korrekt dynamisch berechnet |
| Gesamtinvestition (Aufteiler) | ✅ | 3.820.157 € > 3.200.000 € Kaufpreis — Bug-Fix greift, keine negative Finanzierung mehr |
| Bestand-Tab Sektionen 1-5 | ✅ | Alle NumberedSectionCards rendern, Charts (Tilgungsplan + Vermoegensentwicklung) funktionieren |
| Bestand KPIs | ✅ | Bruttorendite 10.26%, Cashflow 3.564 €, Cash-on-Cash 6.0%, ROI 889.5% |
| Bewertung-Tab | ✅ | "Bewertung starten" Button erscheint, 20 Credits angezeigt |
| Datenraum | ✅ | Ordnerstruktur (01_Expose, 02_Unterlagen, 03_Bewertung) korrekt |
| Ankaufsnebenkosten | ✅ | PLZ 24768 → Schleswig-Holstein → GrESt 6.5%, Gesamt 11.57% korrekt |
| Alternativenmatrix | ✅ | Bei 0 € Baukosten identische Zeilen = erwartetes Verhalten (0 × ±10% = 0) |

### ⚠️ BUGS GEFUNDEN

**BUG 1 — Schnellanalyse nutzt falsche Nebenkosten (Prioritaet: MITTEL)**

Die Schnellanalyse (Zeile 77 in `ObjekteingangDetail.tsx`) nutzt `AUFTEILER_DEFAULTS.ancillaryCostPercent = 10%`, waehrend der Aufteiler-Tab den PLZ-basierten Wert `11.6%` verwendet. Ergebnis:

- Schnellanalyse: Gewinn 4.438.128 € / Marge 54.1%
- Aufteiler-Tab: Gewinn 4.384.371 € / Marge 53.4%

Abweichung: 53.757 € — inkonsistent und verwirrend fuer den Nutzer.

**Fix**: Schnellanalyse soll den gleichen `ancillaryCostPercent`-Wert nutzen, der auch an die Kalkulations-Tabs uebergeben wird.

**BUG 2 — Mieteinnahmen-Zeile in Finanzierungs-Sektion ist irrefuehrend (Prioritaet: NIEDRIG)**

Zeile 137 in `AufteilerCalculation.tsx` zeigt "− Mieteinnahmen −656.362 €" in der Finanzierungs-Card. Seit dem Bug-Fix wird dieser Wert aber NICHT mehr in `totalFinancingCosts` eingerechnet (Summe Finanzierung = 249.917 € = reine Zinsen). Die Zeile suggeriert eine Kostenreduktion, die nicht stattfindet. Dieselbe Position erscheint korrekt als Erloes in Sektion 5 "Exit / Erloese" → Doppel-Anzeige.

**Fix**: Die Mieteinnahmen-Zeile aus Sektion 4 (Finanzierung) entfernen. Sie ist bereits in Sektion 5 (Exit) als "+Mieterloese Haltedauer" korrekt dargestellt.

## Geplante Aenderungen

| Datei | Aenderung |
|---|---|
| `src/pages/portal/akquise-manager/ObjekteingangDetail.tsx` | Schnellanalyse: `ancillaryCostPercent` aus PLZ-Mapping statt DEFAULTS nutzen |
| `src/pages/portal/akquise-manager/components/AufteilerCalculation.tsx` | Zeile 137: Mieteinnahmen-Zeile aus Finanzierungs-Sektion entfernen |

Keine Freeze-Konflikte. Rein kosmetisch + Konsistenz-Fix.

