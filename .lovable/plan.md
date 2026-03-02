

# Vollständiger TLC + SLC Audit — Befunde und Optimierungsvorschläge

## Zusammenfassung

Beide Wertschopfungsketten sind architektonisch solide aufgebaut. Die Engine-Logik (reine Funktionen), Cron-Automatisierung und KI-Integration folgen einem konsistenten Muster. Dennoch gibt es **12 konkrete Befunde** — von kritischen Inkonsistenzen bis zu UX-Verbesserungen.

---

## Kritische Befunde (Geld-relevant)

### K1: GP-VERKAUF Resolver — Phasen-Mismatch mit SLC Spec

**Problem:** Der `gpVerkaufResolver` (contextResolvers.ts:649-653) verwendet eine PHASE_ORDER mit 13 Einträgen (`captured`, `readiness_check`, `finance_submitted` etc.), die SLC spec.ts aber nur 11 Phasen definiert. `captured`, `readiness_check`, `finance_submitted` existieren NICHT in `SLCPhase`.

**Auswirkung:** Wenn `sales_cases.phase` den Wert `captured` oder `readiness_check` hat, werden die Resolver-Flags korrekt gesetzt — aber die Phasen sind nicht in der Engine registriert. Kein Stuck-Detection, kein Cron-Check, kein Event-Mapping.

**Fix:**
- SLC spec.ts um `captured`, `readiness_check`, `finance_submitted` erweitern ODER
- Resolver an die 11 existierenden Phasen angleichen
- `SLC_STUCK_THRESHOLDS` und `SLC_EVENT_PHASE_MAP` synchronisieren

### K2: SLC Cron — falscher Event-Type für Stuck-Detection

**Problem:** `sot-slc-lifecycle/index.ts:114` schreibt Stuck-Events als `case.reopened`. Das ist semantisch falsch — "reopened" bedeutet Wiederöffnung, nicht Stagnation. Das verfälscht Audit-Trails und KI-Analyse.

**Fix:** Eigenen Event-Type `case.stuck_detected` einführen oder zumindest `channel.sync_failed` (für Drift) verwenden.

### K3: SLC Cron — Settlement-Check schreibt `deal.commission_calculated`

**Problem:** `sot-slc-lifecycle/index.ts:223` nutzt `deal.commission_calculated` als Event-Type für "Settlement ausstehend". Aber `SLC_EVENT_PHASE_MAP` mappt diesen Event auf Phase `settlement` — der Cron-Job könnte damit unbeabsichtigt eine Phase-Transition triggern.

**Fix:** Dediziertes `deal.settlement_pending` Event einführen (ohne Phase-Mapping).

### K4: TLC Cron — Payment-Analyse nur 3 Monate

**Problem:** `sot-tenancy-lifecycle/index.ts:84` prüft nur 3 Monate (`for (let i = 0; i < 3; i++)`), die Client-Engine (`engine.ts:82`) prüft 12 Monate. Langfristige Rückstände werden im Cron übersehen.

**Fix:** Cron auf 6 Monate erweitern (Kompromiss aus Performance und Abdeckung).

---

## Engine-Befunde (Berechnung / Logik)

### E1: TLC Engine — Mieterhöhung Kappungsgrenzen-Berechnung unvollständig

**Problem:** `calculateRentIncreaseProposals` (engine.ts:317) berechnet `capLimit` als `baseRent * (capPercent / 100)`, wobei `baseRent = rentThreeYearsAgo ?? currentRent`. Wenn `rentThreeYearsAgo` null ist, ist `alreadyIncreased = 0` und die volle Kappungsgrenze wird als verfügbar ausgewiesen — das ist juristisch falsch, weil in dem Fall gar keine Berechnung möglich ist.

**Fix:** Wenn `rentThreeYearsAgo` null, soll `proposals` leer bleiben mit Hinweis "Miete vor 3 Jahren nicht bekannt — bitte nachpflegen".

### E2: SLC Engine — `notary_completed` hat keinen Stuck-Threshold

**Problem:** `SLC_STUCK_THRESHOLDS` definiert keinen Wert für `notary_completed` und `handover`, obwohl beides kritische Phasen sind.

**Fix:** `notary_completed: 60` (Übergabe nach max 60 Tagen) und `handover: 14` (Settlement nach max 14 Tagen) ergänzen.

### E3: SLC Engine — `isValidTransition` erlaubt keine Rückwärts-Transition für Reopening

**Problem:** Ein Case der `closed_lost` ist, kann laut `isValidTransition` nie wieder aktiviert werden. Aber `case.reopened` existiert als Event-Type.

**Fix:** Transition von `closed_lost` → `mandate_active` explizit erlauben (nur via Admin/Z1).

---

## Golden Path Befunde

### G1: GP-VERMIETUNG — Lease-Existenz nutzt `unit_id` statt `property_id`

**Problem:** Der `gpVermietungResolver` (contextResolvers.ts:384-390) prüft Leases über `unit_id`, verwendet aber `as never` TypeScript-Casts. Das funktioniert, ist aber fragil und verhindert Typ-Sicherheit.

**Fix:** Die `leases` Tabelle typsicher machen (aus `types.ts` prüfen ob `unit_id` korrekt gemappt ist) und Casts entfernen.

### G2: GP-VERKAUF — fehlende `on_timeout` / `on_error` für Phasen 4-7

**Problem:** Nur Phasen 2, 3, 9 und 11 haben Fail-States. Phasen 4 (Reserved), 5 (Contract Draft), 6 (Notary Scheduled), 7 (Notary Completed) haben keine — obwohl sie Stuck-Thresholds in der Engine haben (14-30 Tage).

**Fix:** `on_timeout` für Phasen 4-8 ergänzen, analog zu den SLC_STUCK_THRESHOLDS.

---

## UI/UX Befunde

### U1: Property Desk — keine KPIs im Desk-Header

**Problem:** `PropertyDesk.tsx:501-502` liest `events`, `tasks`, `criticalEvents`, `openTasks`, aber die KPIs werden aus diesen Werten berechnet. Die Leases-Gesamtzahl fehlt als KPI — das ist die wichtigste Kennzahl für einen Property Manager.

**Fix:** Zusätzliche Query `SELECT count(*) FROM leases WHERE status = 'active'` für "Aktive Leases" KPI. Außerdem "Leerstand" als KPI ergänzen (Units ohne aktiven Lease).

### U2: Property Desk — Leases-Tab zeigt `tenant_name || renter_name`

**Problem:** `PropertyDesk.tsx:304` zeigt `l.tenant_name || l.renter_name` — diese Felder existieren wahrscheinlich nicht auf der `leases` Tabelle. Die Lease hat nur `contact_id`. Der Tab zeigt daher '–' für alle Mieter.

**Fix:** JOIN auf `contacts` Tabelle: `leases.select('*, contact:contacts(first_name, last_name)')` und dann `contact.first_name contact.last_name` anzeigen.

### U3: SLC Monitor — `isStuck` Visualisierung fehlt in der Cases-Tabelle

**Problem:** `SLCMonitorTab.tsx` importiert `isStuck` aus der Engine, aber es ist nicht ersichtlich ob der Stuck-Status prominent in der Case-Tabelle angezeigt wird. Stuck-Cases sollten rot markiert sein mit Tage-Anzeige.

**Empfehlung:** Badge "STUCK seit X Tagen" in der Cases-Tabelle ergänzen, rot bei > 2x Threshold.

---

## Stabilisierungs-Empfehlungen (Zukunft)

| # | Maßnahme | Priorität | Aufwand |
|---|----------|-----------|---------|
| S1 | DB-Trigger auf `sales_cases.current_phase` UPDATE → automatisches `sales_lifecycle_events` INSERT | Hoch | Mittel |
| S2 | Idempotenz-Guard im SLC-Cron (Event-Dedup wie TLC es bereits macht) | Hoch | Gering |
| S3 | Watchdog-Cron der prüft ob TLC/SLC Cron gelaufen sind (Cron-Health-Check) | Mittel | Gering |
| S4 | TLC Engine Unit Tests (src/engines/tenancyLifecycle/__tests__/) erweitern — aktuell unklar wie viel Coverage | Mittel | Mittel |
| S5 | SLC Engine Tests fehlen komplett (kein __tests__/ Ordner) | Hoch | Mittel |

---

## Vorgeschlagene Implementierungsreihenfolge

1. **K1 + K2 + K3** (Phasen-Mismatch + falsche Event-Types) — kritisch, verfälscht Daten
2. **K4 + E2** (Cron-Abdeckung + Stuck-Thresholds) — Lücken schließen
3. **U2** (Leases-Tab Mieter-Anzeige) — sofort sichtbarer UX-Bug
4. **G2** (Fail-States für GP-VERKAUF Phasen 4-8) — Prozess-Governance
5. **E1** (Kappungsgrenzen-Fix) — juristisch relevant
6. **S2 + S5** (Idempotenz + Tests) — Stabilität
7. **U1 + U3** (KPIs + Stuck-Visualisierung) — UX-Verbesserung

---

## Dateien betroffen

| Datei | Befund | Aktion |
|-------|--------|--------|
| `src/engines/slc/spec.ts` | K1, E2, E3 | Phasen + Thresholds + Transition erweitern |
| `src/engines/slc/engine.ts` | E3 | `isValidTransition` für Reopening |
| `src/goldenpath/contextResolvers.ts` | K1, G1 | Resolver PHASE_ORDER synchronisieren |
| `supabase/functions/sot-slc-lifecycle/index.ts` | K2, K3, S2 | Event-Types + Dedup |
| `supabase/functions/sot-tenancy-lifecycle/index.ts` | K4 | Payment-Analyse 3→6 Monate |
| `src/engines/tenancyLifecycle/engine.ts` | E1 | Kappungsgrenzen-Guard |
| `src/manifests/goldenPaths/GP_VERKAUF.ts` | G2 | Fail-States für Phasen 4-8 |
| `src/pages/admin/desks/PropertyDesk.tsx` | U1, U2 | KPIs + Leases JOIN |
| `src/pages/admin/sales-desk/SLCMonitorTab.tsx` | U3 | Stuck-Badge |

