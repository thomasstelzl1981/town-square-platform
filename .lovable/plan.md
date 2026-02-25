

## Strategie-Fixierung und Code-Audit: MOD-13 Intake-Flow

---

### 1. Strategie: Goldener Tenant vs. UNITYS-Tenant

Alle Code-Aenderungen betreffen das **gesamte System** und wirken fuer ALLE Tenants gleichermassen:

```text
Code-Fixes (global)                  Operative Daten (tenant-isoliert)
─────────────────────                ─────────────────────────────────
Edge Functions                       Projekt MENDEN LIVING
  → sot-project-intake                 → NUR im UNITYS-Tenant (rr@unitys.com)
UI-Komponenten                       Golden Tenant (a0000000-...)
  → ProjectDetailPage                   → 0 Projekte (bleibt sauber)
  → UnitPreislisteTable              Demo Tenant (c3123104-...)
  → LandingPageInvestmentTab           → Unveraendert (Showcase-Daten)
Engine-Logik
  → ProjectAufteilerCalculation
```

**Regel:** Code ist global. Daten sind tenant-isoliert. Der Golden Tenant bekommt KEINE operativen Daten. Das Projekt wird ausschliesslich bei Herrn Reinhold angelegt und durchlaeuft dort den Golden Path: MOD-13 → Zone 1 Sales Desk → MOD-08/MOD-09/Zone 3.

---

### 2. Ist-Zustand: UNITYS-Tenant NICHT leer

Die Loeschung aus der vorherigen Runde hat **nicht gewirkt**. Das alte Projekt existiert noch:

| Tabelle | Anzahl | Erwartung |
|---|---|---|
| dev_projects | 1 (MENDEN LIVING) | 0 |
| dev_project_units | 72 | 0 |
| storage_nodes | 468 (462 Ordner, 6 System, 0 Dateien) | 0 |
| purchase_price | **NULL** | Sollte berechnet sein |
| total_sale_target | **NULL** | Sollte berechnet sein |

**Das Projekt muss zuerst geloescht werden, bevor ein neuer Intake getestet wird.** Die FIX-A Aggregation im Edge Function Code ist zwar vorhanden, wurde aber fuer dieses Projekt nie ausgefuehrt (es wurde VOR dem Deploy erstellt).

---

### 3. Code-Audit: Was ist bereits gefixt, was fehlt?

| Fix | Status | Pruefung |
|---|---|---|
| FIX-A: Intake Aggregation (purchase_price, total_sale_target) | **Deployed** | Zeile 659-678 im Edge Function — korrekt: `totalListPrice / 1.20` |
| FIX-B: Kalkulator-Fallback | **Deployed** | Zeile 53: `Math.round(totalListPrice / 1.20)` — korrekt |
| FIX-C: Delete-Button auf Projektakte | **Deployed** | DropdownMenu mit Trash2 + ProjectDeleteDialog — korrekt |
| FIX-D: Etagen-Labels (EG/UG/OG) | **Teilweise** | ProjectDetailPage Zeile 378: korrekt. **2 Stellen fehlen noch** |
| BUG-009: DMS-Datei-Registrierung | **Deployed** | Zeilen 777-841: Expose und Preisliste werden als `node_type: 'file'` registriert |

---

### 4. Offene Fehler: FIX-D unvollstaendig

**2 Dateien verwenden noch das alte Format `{unit.floor}. OG`** ohne EG/UG-Mapping:

#### 4a. `src/components/projekte/UnitPreislisteTable.tsx` Zeile 166

```typescript
// IST (falsch):
<td className="px-3 py-2 text-center">{u.floor}. OG</td>

// SOLL:
<td className="px-3 py-2 text-center">
  {u.floor === 0 ? 'EG' : u.floor < 0 ? `${Math.abs(u.floor)}. UG` : `${u.floor}. OG`}
</td>
```

#### 4b. `src/components/projekte/landing-page/LandingPageInvestmentTab.tsx` Zeile 117

```typescript
// IST (falsch):
<td className="px-4 py-3 text-center">{unit.floor}. OG</td>

// SOLL:
<td className="px-4 py-3 text-center">
  {unit.floor === 0 ? 'EG' : unit.floor < 0 ? `${Math.abs(unit.floor)}. UG` : `${unit.floor}. OG`}
</td>
```

---

### 5. Freeze-Check

- **MOD-13:** `frozen: false` — Aenderungen erlaubt
- Beide betroffenen Dateien liegen in `src/components/projekte/` → MOD-13 → nicht gefroren

---

### 6. Zusammenfassung: Aktionsplan

| Schritt | Aktion | Aufwand |
|---|---|---|
| 1 | Altes Projekt MENDEN LIVING loeschen (DB-Bereinigung) | 2 min |
| 2 | FIX-D vervollstaendigen: Etagen-Labels in UnitPreislisteTable + LandingPageInvestmentTab | 3 min |
| 3 | Tenant-Leerstand verifizieren (0 Projekte, 0 Units, 0 Storage-Nodes) | 1 min |
| 4 | Neuen Intake durchfuehren (Expose + Preisliste Upload) | User-Aktion |
| 5 | Verifizieren: purchase_price, total_sale_target, DMS-Dateien, Etagen-Labels | 5 min |

**Gesamtaufwand:** ~11 Minuten

Nach diesen Schritten ist der UNITYS-Tenant sauber, alle Fixes sind global aktiv, und der neue Intake wird korrekt berechnet. Danach folgt der Golden Path weiter: Vertrieb (MOD-08/09), Zone 3 (Kaufy), und spaeter die Landingpage.

