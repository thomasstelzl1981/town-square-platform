

## Analyse: 3 kritische Probleme im Valuation Engine

### Problem 1: MFH-Einheitenerkennung schlägt fehl
Die Logs zeigen: `SSOT loaded: 1 units, 1 leases`. Das Parkweg-17-Objekt hat nur **1 Unit-Record** in der Datenbank, obwohl es physisch 3 Wohnungen hat. Die MFH-Logik (Zeile 465) prüft `units.length > 1` — das ist bei 1 Unit immer `false`.

**Ursache:** Es gibt kein Feld in der Immobilienakte, wo der Nutzer die tatsächliche Anzahl der Wohneinheiten eingeben kann. Die `units`-Tabelle enthält nur angelegte Units, nicht die physische Realität.

**Lösung:** Ein neues Feld `unit_count_actual` in der `properties`-Tabelle, das die tatsächliche Anzahl der Wohneinheiten erfasst. Die Engine nutzt dieses Feld als Fallback: Wenn `units.length === 1` aber `unit_count_actual > 1`, wird trotzdem MFH-Einheitenbewertung aktiviert und die Gesamtfläche gleichmäßig auf die Einheiten verteilt.

### Problem 2: Kernsanierung wird ignoriert
`core_renovated` und `renovation_year` existieren in der DB, werden aber in `buildServerSSOTSnapshot` (Zeile 433-519) **nie gelesen**. Die RND-Berechnung (Zeile 987) berechnet einfach `gnd - alter` ohne Modernisierungsbonus. Ein Haus BJ 1978 mit Kernsanierung 2021 bekommt RND = 80-48 = 32 Jahre statt korrekterweise ~60 Jahre (SWE-Richtlinie: Kernsanierung verlängert RND um ~70% der Gesamtnutzungsdauer).

**Lösung:** `core_renovated` und `renovation_year` ins Snapshot aufnehmen und in Stage 4 einen Modernisierungsbonus (ImmoWertV-konform) auf die RND anwenden.

### Problem 3: KI-Preflight-Validierung fehlt
Die Engine nimmt alle SSOT-Daten blind an. Logische Fehler (MFH mit nur 1 Unit, fehlende Grundstücksfläche, unrealistische Mieten) werden nicht erkannt. 

**Lösung:** Neue Stage 0.5 "Data Validation" — ein KI-gestützter Plausibilitätscheck VOR der Berechnung, der:
- Widersprüche erkennt (MFH aber nur 1 Unit, Kernsanierung ohne Jahr)
- Fehlende kritische Daten markiert
- Optional Rückfragen an den Nutzer stellt bevor Credits abgezogen werden

### Technische Änderungen

**1. DB Migration: `unit_count_actual` Feld + Status-Fix**
```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS unit_count_actual integer DEFAULT NULL;
```
Damit kann der Nutzer in der Immobilienakte angeben: "Dieses MFH hat 3 Wohneinheiten" — auch wenn nur 1 Unit-Record existiert.

**2. `supabase/functions/sot-valuation-engine/index.ts`**

a) **buildServerSSOTSnapshot** erweitern:
- `core_renovated` und `renovation_year` aus `p.*` lesen
- `unit_count_actual` aus `p.unit_count_actual` lesen
- MFH-Detection ändern: `mfhMultiUnit = isMfh && (units.length > 1 || p.unit_count_actual > 1)`
- Wenn `unit_count_actual > 1` aber nur 1 Unit → synthetische `units_detail` erzeugen (Fläche gleichmäßig aufgeteilt)

b) **Stage 4 — RND mit Modernisierungsbonus**:
```
if (core_renovated && renovation_year) {
  const yearsSinceRenovation = currentYear - renovation_year;
  const modernisierungsbonus = Math.round(gnd * 0.7) - yearsSinceRenovation;
  rnd = Math.max(rnd, Math.min(gnd, rnd + modernisierungsbonus));
}
```

c) **Neue Stage 0.5: KI-Preflight-Validierung** (im `preflight` Action):
- Gemini-Flash-Lite Call mit dem SSOT-Snapshot
- Prüft: Objektart vs. Einheiten, Miete vs. Fläche (€/m²-Plausibilität), Kernsanierung ohne Jahr, fehlende Pflichtfelder
- Gibt `warnings[]` und `blockers[]` zurück
- UI zeigt diese VOR dem "Bewertung starten"-Button

**3. `src/engines/valuation/spec.ts`**
- `PreflightOutput` um `warnings` und `blockers` Arrays erweitern
- `ValuationResult` um `coreRenovated`, `renovationYear`, `modernisierungsbonus` erweitern

**4. Immobilienakte UI: Einheiten-Anzahl Feld**
- `src/components/immobilienakte/editable/EditableBuildingBlock.tsx`: Neues Eingabefeld "Anzahl Wohneinheiten" (nur sichtbar wenn property_type = MFH/mfh)
- `src/hooks/useDossierMutations.ts`: `unit_count_actual` persistieren
- `src/hooks/useUnitDossier.ts`: Feld laden

**5. `src/components/shared/valuation/ValuationPreflight.tsx`**
- Warnings/Blockers-Anzeige im Preflight-Panel
- Blocker verhindern den Start (Button disabled + Erklärung)
- Warnings werden als gelbe Hinweise dargestellt

**6. `src/components/shared/valuation/ValuationReportReader.tsx`**
- Modernisierungsbonus in Sektion 5 (RND) anzeigen
- Kernsanierungsjahr im Objektdaten-Block

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| DB Migration | `unit_count_actual` Spalte |
| `sot-valuation-engine/index.ts` | Snapshot, RND-Bonus, MFH-Detection, KI-Preflight |
| `src/engines/valuation/spec.ts` | Types erweitern |
| `src/components/immobilienakte/editable/EditableBuildingBlock.tsx` | Einheiten-Anzahl Feld |
| `src/hooks/useDossierMutations.ts` | Feld persistieren |
| `src/hooks/useUnitDossier.ts` | Feld laden |
| `src/components/shared/valuation/ValuationPreflight.tsx` | Warnings/Blockers UI |
| `src/components/shared/valuation/ValuationReportReader.tsx` | Kernsanierung + Modernisierung anzeigen |

