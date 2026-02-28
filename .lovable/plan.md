

# Finanzanalyse (MOD-18) — Komplett-Reparatur + Zone-2 Save-Feedback

## Freeze-Status
- **MOD-18**: UNFREEZE erteilt (user approved)
- **ENG-FINUEB**: UNFREEZE erteilt (user approved)
- **Infra-manifests**: Bleibt frozen (keine Manifest-Änderungen nötig)

---

## Defekte & Fixes

### 1. Einkommensfelder: Beide Status-Typen immer sichtbar
**Problem:** `UebersichtTab.tsx` zeigt Angestellten-Felder NUR bei `employment_status === 'angestellt'` und Selbstständig-Felder NUR bei `'selbstaendig'`. Beim Wechsel verschwinden die Felder, vorhandene Daten bleiben in DB, werden aber im Report weiter angezeigt.

**Fix (`src/pages/portal/finanzanalyse/UebersichtTab.tsx`):**
- Angestellten-Felder (Arbeitgeber, Brutto, Netto, Steuerklasse, Kinderfreibeträge) und Selbstständig-Felder (Firmenname, Einkünfte Gewerbebetrieb) werden IMMER angezeigt, außer bei `beamter`, `rentner`, `nicht_erwerbstaetig`.
- Beamter zeigt weiterhin sein eigenes Feldset.
- PV-Einkünfte bleiben immer sichtbar (bereits korrekt).
- Neues Feld: **"Sonstige Einnahmen (€/mtl.)"** unter PV-Einkünfte (mappt auf DB-Feld `other_income_monthly` in `household_persons`).
- Werte bleiben beim Status-Wechsel erhalten (keine Löschung).

### 2. "Sonstige Einnahmen" — DB + Engine + UI
**a) DB-Migration:** `ALTER TABLE household_persons ADD COLUMN IF NOT EXISTS other_income_monthly numeric DEFAULT 0;`

**b) Engine (`src/engines/finanzuebersicht/spec.ts`):**
- `FUHouseholdPerson` erweitern um `other_income_monthly?: number | null;`

**c) Engine (`src/engines/finanzuebersicht/engine.ts`):**
- In `calcIncome()`: `otherIncome` aus `householdPersons` aggregieren statt fix 0.

**d) Hook (`src/hooks/useFinanzberichtData.ts`):**
- `other_income_monthly` in die `select()`-Query von `fb-household-persons` aufnehmen.

**e) UI (`UebersichtTab.tsx`):**
- FormInput "Sonstige Einnahmen (€/mtl.)" hinzufügen.

### 3. Konto-Widget "Konto hinzufügen" entfernen
**Problem:** `KontenTab.tsx` zeigt am Ende des WidgetGrid eine dashed Kachel "Konto hinzufügen" (Zeilen 387-401). Diese verbraucht zu viel Platz — alles geht über den Plus-Button im Header.

**Fix (`src/pages/portal/finanzanalyse/KontenTab.tsx`):**
- Zeilen 387-401 (die `<WidgetCell>` mit "Konto hinzufügen") entfernen.

### 4. Globales Zone-2 Save-Feedback
**Problem:** Kein konsistentes Feedback nach Speichern über alle Module. Toast + Query-Invalidierung fehlt an vielen Stellen.

**Fix (neuer Shared-Hook `src/hooks/useSaveFeedback.ts`):**
- Wrapper um `useMutation`, der automatisch `toast.success('Gespeichert')` und `queryClient.invalidateQueries()` ausführt.
- Betroffene Stellen in MOD-18 UebersichtTab.tsx bereits korrekt (hat `toast.success` + `invalidateQueries`).
- ManualExpensesSection ebenfalls korrekt.
- **Prüfung/Fix** für folgende Module, die `toast.success` OHNE `invalidateQueries` haben:
  - Wir erstellen den Hook und setzen ihn in MOD-18 ein. Weitere Module folgen via selbes Pattern (nicht-frozen Module können direkt, frozen Module beim nächsten Unfreeze).

### 5. FinAPI-Request schlägt fehl
**Problem:** Keine aktuellen Logs für `sot-finapi-sync`. Secrets (`FINAPI_CLIENT_ID`, `FINAPI_CLIENT_SECRET`) sind konfiguriert. Die Edge Function nutzt `getClaims()`, was in neueren Supabase-JS-Versionen nicht existiert.

**Fix (`supabase/functions/sot-finapi-sync/index.ts`):**
- `getClaims(token)` → `getUser(token)` umstellen (gleicher Pattern wie in `sot-phone-provision`).
- Sandbox-URL validieren (aktuell `https://sandbox.finapi.io` — korrekt für Sandbox-Umgebung).

---

## Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | Einkommensfelder immer anzeigen + "Sonstige Einnahmen" |
| `src/pages/portal/finanzanalyse/KontenTab.tsx` | Widget "Konto hinzufügen" entfernen |
| `src/engines/finanzuebersicht/spec.ts` | `other_income_monthly` zu `FUHouseholdPerson` |
| `src/engines/finanzuebersicht/engine.ts` | `otherIncome` aus household_persons aggregieren |
| `src/hooks/useFinanzberichtData.ts` | `other_income_monthly` in Query |
| `src/hooks/useSaveFeedback.ts` | NEU: Shared save-feedback hook |
| `supabase/functions/sot-finapi-sync/index.ts` | `getClaims` → `getUser` Fix |
| DB-Migration | `other_income_monthly` Spalte |

---

## Nicht betroffen / Kein Handlungsbedarf
- Routing/Tabs: `FinanzanalysePage.tsx` + Manifest sind korrekt — 9 Tabs funktionieren.
- ManualExpensesSection: Bereits korrekt implementiert mit Toast + Invalidierung.
- FinanzberichtSection: Zeigt `income.otherIncome` bereits an (Zeile 167), nur Engine liefert aktuell 0.

