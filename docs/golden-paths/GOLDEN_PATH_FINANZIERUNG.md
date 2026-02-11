# Golden Path: Finanzierung (MOD-07 + MOD-11)

**Version:** 1.0  
**Status:** ACTIVE  
**Date:** 2026-02-06  
**Konsolidiert aus:** `docs/workflows/GOLDEN_PATH_FINANZIERUNG.md` (ZBC Schritt 7)

---

## Übersicht

Der Finanzierungs-Golden-Path beschreibt den vollständigen Workflow von der Selbstauskunft des Kunden bis zur Bank-Einreichung durch den Finanzierungsmanager.

**Kritische Trennung:**
- **MOD-07 (Kunde):** Nur Datenerfassung — KEINE Bank-API!
- **Zone 1 (FutureRoom):** Nur Triage + Zuweisung
- **MOD-11 (Manager):** Bank-Übergabe via E-Mail oder Europace API

---

## Modul-Verantwortlichkeiten

| Modul | Zone | Funktion | Bank-Übergabe |
|-------|------|----------|---------------|
| **MOD-07** | Zone 2 | Datenerfassung durch Kunden | ❌ NEIN |
| **FutureRoom** | Zone 1 | Triage + Delegation | ❌ NEIN |
| **MOD-11** | Zone 2 | Operatives Processing | ✅ JA |

## Status-Flow

```
draft → complete → submitted (Z2→Z1) → assigned (Z1→Z2) → in_review → bank_submitted → approved/rejected
```

Siehe auch: [CONTRACT_FINANCE_SUBMIT.md](../../spec/current/06_api_contracts/CONTRACT_FINANCE_SUBMIT.md)

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-02-06 | Initial version |
| 1.1 | 2026-02-11 | Konsolidiert nach docs/golden-paths/ (ZBC Schritt 7) |
