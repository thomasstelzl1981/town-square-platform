

## Analyse: Kalkulator-Berechnung und Intake-Lücken

---

### 1. UNITYS-Tenant: Status nach Löschung

| Tabelle | Anzahl |
|---|---|
| dev_projects | 0 |
| dev_project_units | 0 |
| storage_nodes | 0 |
| properties | 0 |
| listings | 0 |
| contacts | 0 |

**Der Account von Ralf Reinhold ist komplett leer.** Bereit für einen neuen Intake.

---

### 2. Befund: Woher kamen die 4,8 Mio.?

Die Zahl kam aus dem alten Seed-Objekt. Da `purchase_price` im Projekt NULL war, griff der Fallback in `ProjectAufteilerCalculation.tsx`, Zeile 53:

```typescript
const defaultPurchasePrice = project.purchase_price || Math.round(totalListPrice / 1.25 * 0.72);
```

**Formel: `totalListPrice / 1.25 * 0.72 = totalListPrice * 0.576`** — das ist mathematischer Unsinn. Es multipliziert zwei unabhängige Abschläge, die zusammen 42% abziehen statt der gewünschten 20% Marge.

---

### 3. Korrekte Geschäftslogik (Bauträgermarge 20%)

Die Regel lautet: **Wenn kein Kaufpreis bekannt ist, schätze den Kaufpreis so, dass eine Bauträgermarge von 20% auf den Gesamtverkaufserlös unterstellt wird.**

Formel: `purchasePrice = totalListPrice / 1.20`

Beispiel mit totalListPrice = 10.000.000 EUR:
- **IST (falsch):** `10.000.000 / 1.25 * 0.72 = 5.760.000 EUR` (42% unter Verkaufspreis)
- **SOLL (korrekt):** `10.000.000 / 1.20 = 8.333.333 EUR` (20% Marge)

---

### 4. Zweiter Befund: Intake Edge Function setzt KEINE Finanzkennzahlen

In `sot-project-intake/index.ts` (Zeile 602-630) fehlen bei der Projekt-INSERT-Anweisung vollständig:

| Feld | Status | Auswirkung |
|---|---|---|
| `purchase_price` | **NICHT GESETZT** | Kalkulator hat keinen Ausgangswert |
| `total_sale_target` | **NICHT GESETZT** | Vertriebsstatusreport zeigt 0 EUR |
| `commission_rate_percent` | **NICHT GESETZT** | Standard 3.57% greift nicht automatisch |
| `ancillary_cost_percent` | **NICHT GESETZT** | Standard 10% greift nicht automatisch |

Die Edge Function insertet die Units korrekt mit `list_price`, berechnet aber **keine Aggregation** auf Projektebene. Alle Finanzkennzahlen bleiben NULL, bis der User manuell im Kalkulator speichert.

---

### 5. Reparaturplan

#### FIX-A: Intake Edge Function — Finanzkennzahlen automatisch berechnen (Prio 1)

**Datei:** `supabase/functions/sot-project-intake/index.ts`

Nach dem Units-Insert (Zeile 658) muss ein UPDATE auf `dev_projects` folgen, das die Summen aus den Einheiten aggregiert:

```typescript
// Nach Units-Insert: Projekt-Finanzkennzahlen aggregieren
const totalListPrice = unitRows.reduce((s, u) => s + (u.list_price || 0), 0);
const totalYearlyRent = unitRows.reduce((s, u) => s + ((u.current_rent || 0) * 12), 0);

// Ersteinschätzung: 20% Bauträgermarge unterstellen
const estimatedPurchasePrice = Math.round(totalListPrice / 1.20);

await supabase.from('dev_projects').update({
  purchase_price: estimatedPurchasePrice,
  total_sale_target: totalListPrice,
  commission_rate_percent: reviewedData.commissionRate || 3.57,
  ancillary_cost_percent: reviewedData.ancillaryCostPercent || 10,
}).eq('id', project.id);
```

**Effekt:** Sofort nach Projekt-Erstellung sind alle Finanzkennzahlen gefüllt. Der Kalkulator zeigt sofort eine plausible Ersteinschätzung.

---

#### FIX-B: Kalkulator-Fallback — Formel korrigieren (Prio 1)

**Datei:** `src/components/projekte/blocks/ProjectAufteilerCalculation.tsx`, Zeile 53

```typescript
// IST (falsch):
const defaultPurchasePrice = project.purchase_price || Math.round(totalListPrice / 1.25 * 0.72);

// SOLL (korrekt — 20% Bauträgermarge):
const defaultPurchasePrice = project.purchase_price || Math.round(totalListPrice / 1.20);
```

**Effekt:** Auch wenn die Edge Function (FIX-A) den Wert setzt, bleibt der Client-Fallback als Safety-Net korrekt.

---

#### FIX-C: Delete-Button auf Projektakte (Prio 1) — BUG-010

**Datei:** `src/pages/portal/projekte/ProjectDetailPage.tsx`

Den bestehenden "..." Button (`MoreHorizontal`) um ein DropdownMenu mit "Projekt löschen" erweitern. Das `ProjectDeleteDialog` ist bereits implementiert und wird importiert.

---

#### FIX-D: Etagen-Labels (Prio 3) — BUG-011

**Datei:** Einheiten-Tabelle in der Projektakte

Mapping: `0 → EG`, `1 → 1. OG`, `2 → 2. OG`, `-1 → UG`

---

### 6. Engine-Governance-Check

| Regel | Status |
|---|---|
| Berechnung in Engine (`calcAufteilerProject`) | OK — keine Businesslogik im Component |
| Fallback-Formel `totalListPrice / 1.20` ist keine Businesslogik | OK — reine Default-Vorbelegung eines Input-Parameters |
| Aggregation in Edge Function ist Data-Prep, nicht Kalkulation | OK — reine Summenbildung, kein Engine-Eingriff |
| `AUFTEILER_DEFAULTS` in spec.ts korrekt | OK — wird für Slider-Defaults verwendet |

**Kein Engine-Violation.** Die Korrektur betrifft nur die Input-Vorbelegung, nicht die Kalkulationslogik selbst.

---

### 7. Zusammenfassung

| Ticket | Prio | Aufwand | Beschreibung |
|---|---|---|---|
| FIX-A | 1 | 15 min | Intake: `purchase_price` und `total_sale_target` automatisch aus Units berechnen (20% Marge) |
| FIX-B | 1 | 2 min | Kalkulator: Fallback-Formel `/ 1.25 * 0.72` korrigieren auf `/ 1.20` |
| FIX-C | 1 | 15 min | Delete-Button auf Projektakte (BUG-010) |
| FIX-D | 3 | 5 min | Etagen-Labels EG/OG/UG (BUG-011) |

**Gesamtaufwand:** ~37 Minuten

Nach diesen Fixes kann ein neuer Intake durchgeführt werden. Der Kalkulator wird sofort eine plausible Ersteinschätzung mit 20% Bauträgermarge anzeigen, und das Projekt kann bei Bedarf direkt aus der Projektakte gelöscht werden.

