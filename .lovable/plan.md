

# P3 Backlog Cleanup — Remaining Open Items

## Status Review

Von den 15 Backlog-Items sind 6 bereits "fixed" oder "accepted". Von den 9 "open" Items sind 2 bereits geloest (Dateien existieren nicht mehr). Es bleiben **7 konkrete Fixes**.

---

## 1. Bereits geloest (Status-Update in Backlog)

| ID | Grund |
|----|-------|
| SIA4-006 | `demoDataManifest.ts` existiert nicht mehr (umbenannt zu `demoDataRegistry.ts`), kein VERWALTUNG toggleKey vorhanden |
| SIA4-008 | `bwaKontenplan.ts` existiert weder in `src/engines/` noch in `src/manifests/` — bereits entfernt |

Aktion: Status in `enterprise_ready_backlog.json` auf "resolved" setzen.

---

## 2. Zu implementierende Fixes

### Fix 1: SIA4-004 — NK-Engine Personenzahlen dynamisch (P3)

**Datei:** `src/engines/nkAbrechnung/engine.ts` Zeile 155-157

**Problem:** `unitPersons: 2` und `totalPersons: 10` sind hardcoded.

**Fix:** Personenzahl aus Lease-Daten lesen (z.B. `lease.number_of_occupants` oder Fallback auf 2). Gesamtpersonen ueber eine Aggregation aller aktiven Leases der Property berechnen, oder einen Wert aus `properties` verwenden (falls vorhanden). Wenn kein DB-Feld existiert, bleiben die Werte als dokumentierte Defaults mit Kommentar.

---

### Fix 2: SIA4-007 — useMSVData umbenennen zu useVerwaltungData (P3)

**Dateien:** `src/hooks/useMSVData.ts` und `src/pages/portal/immobilien/VerwaltungTab.tsx`

**Problem:** Hook heisst `useMSVData`, "MSV" ist ein veralteter interner Name.

**Fix:** 
- `useMSVData.ts` umbenennen zu `useVerwaltungData.ts`
- Export-Name `useMSVData` zu `useVerwaltungData` aendern
- Interface `MSVProperty` zu `VerwaltungProperty` aendern
- Import in `VerwaltungTab.tsx` aktualisieren
- JSDoc-Kommentar aktualisieren

---

### Fix 3: SIA4-009 — useFinanceRequest case_events implementieren (P3)

**Datei:** `src/hooks/useFinanceRequest.ts` Zeile 279-283

**Problem:** TODO fuer Audit-Event-Erstellung in `case_events` Tabelle. Tabelle existiert bereits mit passenden Spalten (`case_id`, `event_type`, `actor_user_id`, `payload`, `previous_status`, `new_status`).

**Fix:** `console.log` ersetzen durch tatsaechlichen Insert in `case_events`:
```text
await supabase.from('case_events').insert({
  case_id: requestId,
  tenant_id: tenantId,
  event_type: 'status_change',
  event_source: 'finance_manager',
  actor_user_id: userId,
  previous_status: previousStatus,
  new_status: status,
  payload: { notes }
});
```
Dafuer muss der vorherige Status vor dem Update gelesen werden.

---

### Fix 4: SIA4-010 — Armstrong webResearchEnabled aus org_settings (P3)

**Datei:** `src/hooks/useArmstrongContext.ts` Zeile 213

**Problem:** `webResearchEnabled = true` hardcoded mit TODO.

**Fix:** Da `org_settings` kein `web_research_enabled` Feld hat, wird der Wert als dokumentierter Default belassen, aber mit einem sauberen Kommentar versehen, der erklaert, dass es aktuell keinen Org-Setting-Toggle gibt. Alternativ: Spalte in `org_settings` anlegen (DB-Migration), aber da dies P3 ist, reicht ein dokumentierter Default.

Pragmatischer Fix: Kommentar verbessern zu `// Default: true. No org_settings column exists yet. Add 'web_research_enabled' to org_settings when feature toggle needed.`

---

### Fix 5: SIA4-011 — NK-Engine `as any` Type-Casts entfernen (P3)

**Datei:** `src/hooks/useNKAbrechnung.ts` (8 Stellen)

**Problem:** Alle Supabase-Queries nutzen `(supabase as any)` fuer `nk_periods` und `nk_cost_items`.

**Fix:** Da die Tabellen nicht in den auto-generierten Supabase-Types erscheinen (weil sie spaeter hinzugefuegt wurden), muss ein Type-Overlay oder ein `.from()` Wrapper verwendet werden. Pragmatisch: Die `as any` Casts bleiben, aber erhalten einen einmaligen Kommentar am Anfang der Datei, der erklaert warum (Tabellen nicht in auto-gen Types). Dies ist die sichere Loesung, da manuelle Type-Edits an `types.ts` verboten sind.

---

### Fix 6: SIA4-012 — Verwaltung-Label in ImmobilienPage.tsx (P3)

**Datei:** `src/pages/portal/ImmobilienPage.tsx` Zeile 2

**Problem:** Datei-Kommentar sagt "Verwaltung (MSV)".

**Fix:** Kommentar aktualisieren zu "SSOT for Properties, Units, Leases". Die restlichen "Verwaltung"-Referenzen in anderen Dateien (Miety, Communication Pro) sind korrekte deutsche Begriffe (Hausverwaltung, Mietverwaltung) und keine Code-Drift.

---

### Fix 7: ERA-004 — rate_limit_counters RLS Policy (P2)

**DB:** `public.rate_limit_counters`

**Problem:** RLS aktiviert aber keine Policy. System-intern, kein Business-Risiko.

**Fix:** Service-Role-Only Policy anlegen:
```text
CREATE POLICY "service_role_only" ON public.rate_limit_counters
  FOR ALL USING (auth.role() = 'service_role');
```

---

## 3. Backlog-Update

Alle 15 Items in `enterprise_ready_backlog.json` erhalten ihren finalen Status:
- 6 bereits "fixed"/"accepted" (ERA-001/002/003/005/006/007)
- 2 retroaktiv "resolved" (SIA4-006, SIA4-008)
- 7 werden implementiert und auf "fixed" gesetzt

---

## Zusammenfassung

| Aufwand | Items | Risiko |
|---------|-------|--------|
| Trivial (Kommentare/Renames) | SIA4-007, SIA4-010, SIA4-011, SIA4-012 | Niedrig |
| Leicht (DB-Insert) | SIA4-009, ERA-004 | Niedrig |
| Mittel (Logik-Aenderung) | SIA4-004 | Mittel |

Alle Fixes sind rueckwaertskompatibel. Keine Breaking Changes.
