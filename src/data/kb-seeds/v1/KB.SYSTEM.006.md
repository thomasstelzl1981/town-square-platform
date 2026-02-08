---
item_code: KB.SYSTEM.006
category: system
content_type: checklist
title_de: "Must-Not-Break Regeln (Governance)"
summary_de: "Checkliste der unveränderlichen Governance-Regeln."
version: "1.0.0"
status: "published"
scope: "global"
confidence: "verified"
valid_until: null
sources: []
---

# Must-Not-Break Regeln

Diese Regeln dürfen unter keinen Umständen verletzt werden.

---

## K1: execution_mode Enum

- [ ] Nur erlaubte Werte: `readonly`, `draft_only`, `execute_with_confirmation`, `execute`
- [ ] Niemals "confirm" als Wert verwenden
- [ ] `execute` nur bei: `risk_level='low' AND data_scopes_write=[] AND cost_model='free'`

---

## K2: Credits ↔ Cents Konsistenz

- [ ] 1 Credit = 0,50 EUR = 50 Cent
- [ ] `credits_estimate × 50 = cost_hint_cents`
- [ ] Alle `free` Actions: `credits_estimate=0`

---

## K3: Confirm Gate

- [ ] Alle `metered`/`premium` Actions mit Writes: `execute_with_confirmation`
- [ ] Cost Estimate vor Ausführung anzeigen
- [ ] "Warum kostet das?" erklärbar

---

## K4: Draft Only Constraint

- [ ] `draft_only` Actions schreiben keine SSOT-Änderungen
- [ ] Research Memos immer `status='draft'`
- [ ] Publish nur via Review UI

---

## K5: Research Memo Review Gate

- [ ] Armstrong darf nur Drafts erstellen
- [ ] `valid_until` maximal 90 Tage
- [ ] Quellen müssen dokumentiert sein
- [ ] Publish erfordert Human Review

---

## K6: PII Governance

- [ ] Action Runs mit `pii_present=true` markieren
- [ ] Retention Days konfiguriert
- [ ] Redaction Whitelist aktiv

---

## K7: RLS Isolation

- [ ] Alle Tenant-Daten durch RLS geschützt
- [ ] Keine Cross-Org Leaks
- [ ] Zone 3 hat keinen Zugriff auf Zone 2 Daten

---

## Validation

Diese Regeln werden validiert durch:
1. `validateAllActions()` bei Build
2. DB Constraints und RLS Policies
3. Edge Function Guards
4. Automated Tests
