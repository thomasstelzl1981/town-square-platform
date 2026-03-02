

# Vollständiger End-to-End Audit: TLC + SLC — Alle Zonen, Engines, Golden Paths

## Geprüfte Dateien (22 Dateien)

| Bereich | Dateien |
|---------|---------|
| **SLC Engine** | `src/engines/slc/spec.ts`, `engine.ts` |
| **TLC Engine** | `src/engines/tenancyLifecycle/spec.ts`, `engine.ts` (1031 Zeilen) |
| **SLC Cron** | `supabase/functions/sot-slc-lifecycle/index.ts` |
| **TLC Cron** | `supabase/functions/sot-tenancy-lifecycle/index.ts` (733 Zeilen) |
| **Golden Path** | `src/manifests/goldenPaths/GP_VERKAUF.ts`, `index.ts` |
| **Context Resolvers** | `src/goldenpath/contextResolvers.ts` (gpVerkaufResolver, gpVermietungResolver) |
| **SLC Event Recorder** | `src/hooks/useSLCEventRecorder.ts` |
| **Zone 1 UI** | `PropertyDesk.tsx`, `SLCMonitorTab.tsx`, `SalesDeskSubPages.tsx` |
| **Zone 2 Hooks** | `useSalesReservations.ts`, `useSalesSettlement.ts`, `useSalesDeskListings.ts`, `useSLCInquiry.ts` |
| **Zone 2 UI** | `VorgaengeTab.tsx` |
| **Manifests** | `goldenPaths/index.ts` (Registry + Ledger Whitelist) |

---

## Befunde

### K1: CRITICAL — `deal.commission_calculated` still triggers phase transition

**Betrifft:** `src/engines/slc/spec.ts:175` + `SLCMonitorTab.tsx:55`

**Problem:** `SLC_EVENT_PHASE_MAP` enthält KEINEN Eintrag fuer `deal.commission_calculated` (korrekt bereinigt — nur `deal.platform_share_settled` mappt auf `settlement`). ABER: `SLCMonitorTab.tsx:55` verwendet `deal.commission_calculated` als Action-Button Event fuer die Phase `handover → settlement`. Da `deal.commission_calculated` KEIN Phase-Mapping hat, wird der Case NICHT weitergeschaltet. Der Button "Abrechnung erstellt" tut effektiv nichts (schreibt ein Event, aber die Phase bleibt auf `handover`).

**Fix:** `PHASE_ACTIONS` in `SLCMonitorTab.tsx:55` aendern: `handover` soll `deal.platform_share_settled` verwenden (das Event, das tatsaechlich auf `settlement` mappt).

**Risiko:** Hoch — Sales Desk Admins klicken den Button, denken der Case ist in Settlement, aber er bleibt stuck in Handover.

---

### K2: CRITICAL — `determineCurrentPhase` startet bei `mandate_active`, ignoriert `captured`/`readiness_check`

**Betrifft:** `src/engines/slc/engine.ts:34`

**Problem:** `determineCurrentPhase()` setzt den Default auf `'mandate_active'`. Das bedeutet: Wenn keine Events vorhanden sind oder nur nicht-gemappte Events, wird immer `mandate_active` zurueckgegeben — nie `captured` oder `readiness_check`. Obwohl diese Phasen jetzt in der Spec existieren und im Resolver verwendet werden, werden sie von der Engine nie als Default erkannt.

**Fix:** Default auf `'captured'` setzen (erste Phase in `SLC_PHASE_ORDER`).

---

### K3: MEDIUM — `PHASE_ACTIONS` hat Luecken fuer neue Phasen

**Betrifft:** `SLCMonitorTab.tsx:51-57`

**Problem:** `PHASE_ACTIONS` definiert Actions nur fuer `inquiry`, `contract_draft`, `notary_completed`, `handover`, `settlement`. Es fehlen:
- `captured` → kein Button fuer "Readiness Check bestehen"
- `readiness_check` → kein Button fuer "Mandat aktivieren"  
- `mandate_active` → kein Button fuer "Veroeffentlichen"
- `published` → kein Button fuer "Reservieren"
- `reserved` → kein Button fuer "Finanzierung eingereicht" oder "Kaufvertrag"
- `finance_submitted` → kein Button fuer "Kaufvertrag erstellt"
- `notary_scheduled` → kein Button fuer "Beurkundung erfolgt"

Ergebnis: Fuer die Mehrheit der Phasen gibt es keine Admin-Aktion im SLC Monitor.

**Fix:** `PHASE_ACTIONS` um die fehlenden Phasen erweitern mit den korrekten Events aus `SLC_EVENT_PHASE_MAP`.

---

### K4: MEDIUM — `findOrCreateCase` setzt neue Cases auf `mandate_active` statt `captured`

**Betrifft:** `src/hooks/useSLCEventRecorder.ts:112`

**Problem:** Neue Cases werden mit `current_phase: 'mandate_active'` erstellt. Die Spec definiert jetzt aber `captured` als erste Phase. Neue Cases ueberspringen damit die ersten beiden Phasen (`captured`, `readiness_check`).

**Fix:** Abhaengig vom Use-Case — wenn `findOrCreateCase` von einem Listing aus aufgerufen wird (Mandat bereits erteilt), ist `mandate_active` korrekt. Wenn es von einem reinen Erfassungs-Flow kommt, sollte `captured` verwendet werden. Empfehlung: Parameter `initialPhase` hinzufuegen, Default bleibt `mandate_active` fuer Abwaertskompatibilitaet.

---

### D1: DEAD CODE — `determineCurrentPhase` wird nirgends aufgerufen

**Betrifft:** `src/engines/slc/engine.ts:29`

**Problem:** Die Funktion `determineCurrentPhase()` wird in keiner einzigen Datei importiert oder verwendet. Die Phase-Bestimmung laeuft stattdessen ueber:
- `useSLCEventRecorder` (nutzt `SLC_EVENT_PHASE_MAP` direkt)
- `sot-slc-lifecycle/index.ts` (liest `current_phase` aus DB)
- Context Resolver (liest `sales_cases.phase` aus DB)

**Empfehlung:** Funktion als "Recovery/Audit-Tool" dokumentieren oder entfernen. Aktuell ist es Dead Code.

---

### D2: DEAD CODE — `groupEventsByCategory` wird nirgends aufgerufen

**Betrifft:** `src/engines/slc/engine.ts:136`

**Problem:** Exportierte Funktion ohne Verwendung im gesamten Codebase. Potentiell nuetzlich fuer Dashboard-Visualisierung, aber aktuell Dead Code.

---

### D3: DEAD CODE — `findLastEventOfType` wird nirgends aufgerufen

**Betrifft:** `src/engines/slc/engine.ts:148`

**Problem:** Exportierte Funktion ohne Verwendung.

---

### D4: DEAD CODE — `countDriftedChannels` wird nirgends aufgerufen

**Betrifft:** `src/engines/slc/engine.ts:89`

**Problem:** Exportierte Funktion ohne Verwendung. Der Channel-Drift wird direkt im Cron berechnet (inline) und in `useChannelDrift` Hook (vermutlich eigene Implementierung).

---

### D5: DEAD CODE — `computeChannelDrift` wird nirgends aufgerufen

**Betrifft:** `src/engines/slc/engine.ts:74`

**Problem:** Selbes Muster — die Cron-Funktion implementiert Drift-Detection inline statt die Engine-Funktion zu verwenden. Verstoesst gegen das Engine-Governance-Muster (Logik gehoert in die Engine).

---

### E1: LOGIC — TLC Cron Rent-Increase Proposals berechnen ohne `rentThreeYearsAgo`

**Betrifft:** `supabase/functions/sot-tenancy-lifecycle/index.ts:385-395`

**Problem:** Der TLC-Cron berechnet Proposals als `maxIncrease = currentRent * (capPercent / 100)` — das ist die Kappungsgrenze bezogen auf die AKTUELLE Miete. Die Client-Engine (`engine.ts:328`) berechnet korrekt auf Basis von `rentThreeYearsAgo`. Der Cron hat keinen Zugriff auf die historische Miete und rechnet daher falsch.

**Fix:** Entweder historische Mieten in der DB speichern und im Cron abfragen, oder den Cron-Vorschlag als "geschaetzt" markieren mit Disclaimer.

---

### E2: INCONSISTENCY — TLC Cron Payment-Threshold unterscheidet sich von Engine

**Betrifft:** `sot-tenancy-lifecycle/index.ts:91` vs `src/engines/tenancyLifecycle/engine.ts:98`

**Problem:** 
- Client-Engine: `received < expectedMonthly * 0.95` → `partial` (5% Toleranz)
- Cron: `received < expectedMonthly * 0.5` bei `daysOverdue` Berechnung (50% Toleranz!)

Das bedeutet: Ein Mieter der 60% zahlt wird vom Cron als "paid" behandelt (kein Overdue-Berechnung), aber von der Client-Engine als "partial" flagged. Inkonsistentes Verhalten zwischen wochentlichem Cron und Echtzeit-UI.

**Fix:** Cron-Threshold auf 0.95 angleichen (wie Client-Engine).

---

### E3: INCONSISTENCY — TLC Engine Version Mismatch

**Betrifft:** `src/engines/tenancyLifecycle/spec.ts:329` vs `engine.ts:8`

**Problem:** Spec deklariert `TLC_ENGINE_VERSION = '1.5.0'`, aber Engine-Header sagt `@version 1.1.0`. Kosmetisch, aber verwirrend fuer Audit-Trails.

**Fix:** Engine-Header auf `@version 1.5.0` aktualisieren.

---

### G1: GP-VERKAUF — `finance_submitted` Phase fehlt im Golden Path

**Betrifft:** `src/manifests/goldenPaths/GP_VERKAUF.ts`

**Problem:** Die SLC-Spec definiert 14 Phasen inkl. `finance_submitted`. Der Golden Path hat nur 11 Steps. Die Phase `finance_submitted` (Finanzierungsbestaetigung eingereicht) existiert im State-Machine, hat aber keinen Golden-Path-Step, keinen on_timeout Fail-State und keine UI-Aktion.

**Fix:** Entweder Phase `finance_submitted` als Step 5a zwischen Reserved und Contract Draft einfuegen, oder (minimal) den on_timeout fuer diese Phase im GP dokumentieren.

---

### G2: GP-VERMIETUNG Resolver — `nk_settlement_exists` ist Fake-Flag

**Betrifft:** `src/goldenpath/contextResolvers.ts:392`

**Problem:** `flags.nk_settlement_exists` wird auf den gleichen Wert wie `flags.lease_active` gesetzt. Das ist semantisch falsch — ein aktiver Lease bedeutet nicht, dass eine NK-Abrechnung existiert. Der Flag sollte gegen eine `nk_settlements` Tabelle oder aehnlich pruefen.

**Fix:** Entweder den Flag korrekt gegen tatsaechliche NK-Abrechnungsdaten pruefen, oder als `N/A` markieren bis die NK-Settlement-Tabelle existiert.

---

### U1: SLCMonitorTab — `PHASE_COLORS` fehlt fuer neue Phasen

**Betrifft:** `SLCMonitorTab.tsx:27-39`

**Problem:** `PHASE_COLORS` hat keine Eintraege fuer `captured`, `readiness_check`, `finance_submitted`. Diese Phasen werden ohne Farb-Styling angezeigt (kein CSS-Klassen-Match).

**Fix:** Farben ergaenzen:
- `captured: 'bg-slate-500/15 text-slate-600'`
- `readiness_check: 'bg-yellow-500/15 text-yellow-600'`
- `finance_submitted: 'bg-cyan-500/15 text-cyan-600'`

---

### U2: VorgaengeTab — fehlende Phase-Badge-Colors fuer neue Phasen

**Betrifft:** `src/pages/portal/verkauf/VorgaengeTab.tsx`

**Problem:** Analog zu U1 — die Zone 2 Verkauf-Seite hat vermutlich eigene Badge-Colors ohne die neuen Phasen.

---

### S1: STABILITY — SLC Cron hat keine Channel-Drift Idempotenz

**Betrifft:** `supabase/functions/sot-slc-lifecycle/index.ts:201-222`

**Problem:** Channel-Drift Events (`channel.sync_failed`) werden bei JEDEM Cron-Lauf neu geschrieben, wenn der Hash-Mismatch besteht. Es gibt keinen Dedup-Guard wie bei Stuck-Events (Zeile 122-131). Das kann zu hunderten identischer Events fuehren.

**Fix:** Gleichen Idempotenz-Guard wie bei Stuck-Detection anwenden: Pruefen ob `channel.sync_failed` fuer diese `publication_id` heute bereits existiert.

---

### S2: STABILITY — SLC Cron Settlement-Check hat keine Idempotenz

**Betrifft:** `supabase/functions/sot-slc-lifecycle/index.ts:243-258`

**Problem:** `deal.settlement_pending` Events werden bei jedem Cron-Lauf neu geschrieben wenn >14 Tage vergangen sind. Kein Dedup-Guard.

**Fix:** Analog zu S1 — tagesbasierte Idempotenz ergaenzen.

---

## Zusammenfassung nach Prioritaet

| Prio | ID | Typ | Beschreibung |
|------|-----|-----|-------------|
| P0 | K1 | BUG | PHASE_ACTIONS: `deal.commission_calculated` bewirkt keine Phase-Transition |
| P0 | K2 | BUG | `determineCurrentPhase` Default `mandate_active` statt `captured` |
| P1 | E2 | INCONSISTENCY | Cron Payment-Threshold 50% vs Engine 5% |
| P1 | S1 | STABILITY | Channel-Drift Events ohne Dedup |
| P1 | S2 | STABILITY | Settlement-Pending Events ohne Dedup |
| P1 | K3 | UX | PHASE_ACTIONS fehlt fuer 7 von 14 Phasen |
| P2 | E1 | LOGIC | Cron Rent-Proposals ohne historische Miete |
| P2 | U1 | UX | PHASE_COLORS fehlt fuer 3 neue Phasen |
| P2 | G1 | GOVERNANCE | `finance_submitted` fehlt im Golden Path |
| P2 | G2 | LOGIC | `nk_settlement_exists` ist Fake-Flag |
| P2 | K4 | LOGIC | `findOrCreateCase` Default-Phase |
| P3 | E3 | DOC | TLC Engine Version Header Mismatch |
| P3 | D1-D5 | DEAD CODE | 5 ungenutzte SLC Engine Funktionen |

---

## Vorgeschlagene Implementierungsreihenfolge

**Batch 1 — Kritische Bugs (sofort):**
- K1: `SLCMonitorTab.tsx` PHASE_ACTIONS fixen (`deal.platform_share_settled`)
- K2: `engine.ts` Default auf `'captured'` setzen
- K3: Vollstaendige PHASE_ACTIONS fuer alle 14 Phasen
- U1: PHASE_COLORS fuer neue Phasen

**Batch 2 — Stabilitaet:**
- S1 + S2: Idempotenz-Guards in SLC Cron fuer Drift + Settlement
- E2: Cron Payment-Threshold auf 0.95 angleichen

**Batch 3 — Governance + Cleanup:**
- G1: `finance_submitted` Step in GP_VERKAUF.ts
- E1: Cron Rent-Proposals als "geschaetzt" markieren
- G2: `nk_settlement_exists` korrekt implementieren oder N/A
- E3: Version-Header korrigieren
- D1-D5: Dead Code mit `@internal @recovery` JSDoc markieren oder entfernen

---

## Betroffene Dateien

| Datei | Befunde |
|-------|---------|
| `src/pages/admin/sales-desk/SLCMonitorTab.tsx` | K1, K3, U1 |
| `src/engines/slc/engine.ts` | K2, D1-D5 |
| `supabase/functions/sot-slc-lifecycle/index.ts` | S1, S2 |
| `supabase/functions/sot-tenancy-lifecycle/index.ts` | E1, E2 |
| `src/engines/tenancyLifecycle/engine.ts` | E3 |
| `src/hooks/useSLCEventRecorder.ts` | K4 |
| `src/manifests/goldenPaths/GP_VERKAUF.ts` | G1 |
| `src/goldenpath/contextResolvers.ts` | G2 |

