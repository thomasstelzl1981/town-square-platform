

## Analyse: 4 Probleme beim Magic Intake — Expose-Extraktion + Spalten-Mapping

### Befund 1: Expose-AI-Extraktion schlaegt still fehl

Die Edge-Function-Logs zeigen:
```
00:39:50 — Project intake v3: { mode: "analyze", storagePaths: { expose: "...", pricelist: "..." } }
00:40:50 — [tabular-parser] Direct XLSX parsing: ...
00:40:50 — Pricelist: 72 units extracted
```

Zwischen 00:39:50 und 00:40:50 fehlt JEDE Expose-Log-Zeile. Kein `"Expose extraction (tool-calling):"`, kein `"AI error:"`, kein `"Expose extraction error:"`. Das bedeutet: Die AI-Antwort kam mit Status 200, enthielt aber weder `tool_calls` noch `content` — und der Code verschluckt diesen Fall **komplett ohne Logging**.

Im Code (Z.299-358): Wenn `aiResponse.ok` ist, aber `toolCall?.function?.arguments` leer UND `content` leer → es passiert **nichts**. Kein Log, kein Fallback, keine Fehlermeldung.

**Fix:** Logging hinzufuegen wenn AI 200 zurueckgibt aber keine verwertbaren Daten enthaelt. Ausserdem die vollstaendige AI-Response-Struktur loggen, damit wir debuggen koennen warum die Tool-Calls leer sind.

---

### Befund 2: Falsches Spalten-Mapping — "Kaufpreis Einheit Brutto/qm" wird als Gesamtpreis interpretiert

Die XLSX-Spalten (0-basiert):
```
Index 13: "Kaufpreis Einheit Brutto/qm"  → €/m² (z.B. 2.300)
Index 14: "Gesamtkaufpreis"              → Gesamtpreis (z.B. 205.666)
```

Das aktuelle `price`-Pattern: `/^(kaufpreis|preis|vk|verkaufspreis|kp|gesamt.*preis|gesamtkauf)/i`

Problem: "Kaufpreis Einheit Brutto/qm" matcht auf `kaufpreis` → Spalte 13 wird als `price` zugeordnet. Spalte 14 ("Gesamtkaufpreis") wird dann uebersprungen, weil `price` bereits vergeben ist.

Konsequenzen:
- Jede Einheit zeigt 2.300 € statt 205.666 € als Kaufpreis
- €/m²-Spalte zeigt ~26 (= 2300/89.4) statt 2.300
- Rendite zeigt ~340% statt ~4.5%
- Preisspanne zeigt "2.300 – 2.300 €" statt "178.020 – 226.194 €"

**Fix:** Neues Pattern `pricePerSqm` hinzufuegen, das VOR `price` geprueft wird:
```
pricePerSqm: /^(kaufpreis.*(?:qm|m²|m2)|preis.*(?:\/\s*(?:qm|m²|m2)))/i
price: anpassen, damit es NICHT auf "/qm" oder "/m²" matcht
```

Wenn `pricePerSqm` vorhanden aber `price` fehlt → `unit.price = pricePerSqm * area`.

---

### Befund 3: totalArea nicht gerundet

Z.479: `units.reduce((s, u) => s + (u.area || 0), 0)` ergibt `6120.509999999998`.

**Fix:** `Math.round(... * 100) / 100` anwenden.

---

### Befund 4: UI-Label "Preisspanne" irrefuehrend

Wenn die Gesamtpreise korrekt berechnet werden, zeigt "Preisspanne" den Min-Max-Bereich der Kaufpreise. Das Label ist grundsaetzlich korrekt, aber zusaetzlich sollte der Ø €/m² angezeigt werden.

---

### Implementierungsplan

#### 1. tabular-parser.ts — Neues `pricePerSqm` Pattern

- `pricePerSqm`-Pattern VOR `price` in `STANDARD_COLUMN_PATTERNS` einfuegen
- `price`-Pattern verschaerfen: Negative Lookahead fuer "/qm", "/m²", "/m2"
- Neues Pattern: `totalPrice` als Alias fuer "Gesamtkaufpreis" hinzufuegen

#### 2. sot-project-intake/index.ts — pricePerSqm-Logik + Logging

- Bei Unit-Erstellung: Wenn `colMap.pricePerSqm` vorhanden und `colMap.price` fehlt:
  `unit.price = pricePerSqm * area`
- Wenn `colMap.price` UND `colMap.pricePerSqm` vorhanden: `colMap.price` verwenden (Gesamtpreis hat Vorrang)
- `totalArea` runden auf 2 Nachkommastellen
- **Expose-Debugging:** Log-Zeile hinzufuegen wenn AI 200 zurueckgibt aber keine tool_calls/content enthaelt
- AI-Response-Struktur (keys, finish_reason) loggen

#### 3. ProjekteDashboard.tsx — UI-Verbesserungen

- `totalArea` in Badge: `.toFixed(2)` statt `.toFixed(0)`
- Label "Preisspanne" um "Ø €/m²" ergaenzen und den Durchschnitt berechnen
- Placeholder-Texte in Metadaten-Feldern wenn Expose fehlt

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/_shared/tabular-parser.ts` | `pricePerSqm` + `totalPrice` Patterns, `price` verschaerfen |
| `supabase/functions/sot-project-intake/index.ts` | pricePerSqm→Gesamtpreis-Berechnung, totalArea runden, Expose-Logging |
| `src/pages/portal/projekte/ProjekteDashboard.tsx` | totalArea-Formatierung, Labels, Placeholders |

### Was sich NICHT aendert
- Expose-AI-Logik selbst bleibt unveraendert (Tool-Calling + Fallback)
- Create-Mode bleibt unveraendert
- Keine DB-Aenderungen, keine neuen Edge Functions
- MOD-13 ist NICHT frozen ✅

