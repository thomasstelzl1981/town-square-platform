# Golden Path: Sanierung (MOD-04)

**Version:** 1.0  
**Status:** ACTIVE  
**Date:** 2026-02-06  
**Konsolidiert aus:** `docs/workflows/GOLDEN_PATH_SANIERUNG.md` (ZBC Schritt 7)

---

## Übersicht

Der Sanierung-Workflow ist ein 8-stufiger "Golden Path" für die Innensanierung von Wohnungen und Häusern. Er ermöglicht die strukturierte Ausschreibung, Angebotseinholung und Vergabe von Handwerksleistungen.

## Die 8 Schritte

1. **Vorgang anlegen** (Draft) — Objekt + Kategorie wählen
2. **Leistungsumfang** — KI-Analyse oder manuelles LV
3. **Dienstleister suchen** — Google Places oder manuell
4. **Ausschreibung versenden** — E-Mail via Resend
5. **Angebote empfangen** — Inbound Webhook
6. **Angebote zuordnen** — Tender-ID Matching
7. **Angebote vergleichen** — Preisvergleich
8. **Auftrag vergeben** — Award

## Status-Flow

```
draft → scope_pending → scope_draft → scope_finalized → ready_to_send → sent → offers_received → under_review → awarded → in_progress → completed
```

Siehe auch: [CONTRACT_EMAIL_INBOUND.md](../../spec/current/06_api_contracts/CONTRACT_EMAIL_INBOUND.md)

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-02-06 | Initial version |
| 1.1 | 2026-02-11 | Konsolidiert nach docs/golden-paths/ (ZBC Schritt 7) |
