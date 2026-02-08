# Armstrong Zone 1 Repair & Global Assist Mode — Status Report
**Datum:** 2026-02-08
**Version:** 1.0

---

## TEIL 1: Zone 1 Routes Reparatur ✅

### Behobenes Problem
Die Armstrong Zone-1 Komponenten waren im `routesManifest.ts` deklariert, aber **nicht im `adminComponentMap`** des ManifestRouters gemappt. Dadurch wurden die Routes nicht gerendert → 404.

### Durchgeführte Änderungen

| Datei | Änderung |
|-------|----------|
| `src/router/ManifestRouter.tsx` | Armstrong-Komponenten importiert und zum `adminComponentMap` hinzugefügt |
| `src/pages/admin/armstrong/ArmstrongTestHarness.tsx` | Zurück-Navigation und Phase-2-Hinweis ergänzt |

### Verifizierte Routes

| Route | Komponente | Status |
|-------|------------|--------|
| `/admin/armstrong` | ArmstrongDashboard | ✅ Aktiv |
| `/admin/armstrong/actions` | ArmstrongActions | ✅ Aktiv |
| `/admin/armstrong/logs` | ArmstrongLogs | ✅ Aktiv |
| `/admin/armstrong/billing` | ArmstrongBilling | ✅ Aktiv |
| `/admin/armstrong/knowledge` | ArmstrongKnowledge | ✅ Aktiv |
| `/admin/armstrong/policies` | ArmstrongPolicies | ✅ Aktiv |
| `/admin/armstrong/test` | ArmstrongTestHarness | ✅ Aktiv |

### Zone 1 Inhalte

| Seite | Inhalt | Status |
|-------|--------|--------|
| Console | KPIs, Top Actions, Alerts, Quick Links | ✅ DB-Live |
| Actions-Katalog | Manifest-Viewer mit Filtering, Overrides | ✅ DB-Live |
| Action Logs | Tabelle mit Filter, Empty State | ✅ DB-Live |
| Billing | Credits/Usage Tracking, Tagesansicht | ✅ DB-Live |
| Knowledge Base | 7-Kategorien-Taxonomie, Editorial Workflow | ✅ DB-Live |
| Policies | Constitution Tab (Read-Only), Prompts, Guardrails | ✅ DB-Live |
| Test Harness | Phase-2-Hinweis, Konfiguration (Stub) | ⏳ Stub |

---

## TEIL 2: Global Assist Mode ✅

### Konzept
Armstrong funktioniert jetzt als **vollwertiger Assistent** (wie ChatGPT) in allen Modulen, nicht nur in den MVP-Modulen (MOD-00, MOD-04, MOD-07, MOD-08).

### Implementierte Logik

```
Anfrage kommt rein
    ↓
Intent klassifizieren (EXPLAIN / DRAFT / ACTION)
    ↓
┌─────────────────────────────────────┐
│ EXPLAIN oder DRAFT Intent?          │
│   → Global Assist Mode aktivieren   │
│   → AI antwortet in allen Modulen   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ ACTION Intent außerhalb MVP-Modul?  │
│   → Modul-spezifische Actions       │
│     blockiert, aber globale Actions │
│     (Web-Recherche, Draft) anbieten │
└─────────────────────────────────────┘
```

### Neue Globale Actions

| Action Code | Titel | Modus | Kosten |
|-------------|-------|-------|--------|
| `ARM.GLOBAL.WEB_RESEARCH` | Web-Recherche | execute_with_confirmation | 5 Credits |
| `ARM.GLOBAL.DRAFT_TEXT` | Text erstellen | draft_only | Free |

### Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `supabase/functions/sot-armstrong-advisor/index.ts` | Global Assist Mode, generateDraftResponse, erweiterte Intent-Logik |
| `src/hooks/useArmstrongAdvisor.ts` | Dokumentation aktualisiert |

---

## Governance-Konformität

| Regel | Eingehalten |
|-------|-------------|
| Zone 1: Kein Chat | ✅ Nur Governance-UI |
| Confirm Gate für Schreibaktionen | ✅ execute_with_confirmation |
| Audit by Default | ✅ armstrong_action_runs |
| Kosten vor Ausführung | ✅ credits_estimate + cost_hint |
| Draft Only für Texte | ✅ draft_only Modus |
| Disclaimer bei Steuern/Recht | ✅ Im System Prompt |

---

## Noch offen (Phase 2)

- [ ] Test Harness: Echte Dry-Run-Ausführung
- [ ] Web-Recherche Action: Perplexity-Integration
- [ ] KB Seeding: Import-CTA für platform_admin
- [ ] Constitution: Markdown aus docs/architecture laden

---

## Deployment

- Edge Function `sot-armstrong-advisor` erfolgreich deployed ✅
- Frontend-Änderungen im Build enthalten ✅
