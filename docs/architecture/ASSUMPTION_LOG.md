# ASSUMPTION LOG

**Projekt:** System of a Town (SoT) + Kaufy  
**Version:** v1.0  
**Datum:** 2026-01-26

---

## Zweck

Dieses Dokument protokolliert alle Annahmen, die während der Implementierung getroffen wurden, wenn keine explizite Vorgabe vorlag.

---

## Annahmen

| ID | Bereich | Annahme | Begründung | Impact | Revisionspunkt |
|----|---------|---------|------------|--------|----------------|
| A-001 | Future Room | Handoff erfolgt via Download (ZIP+Manifest), nicht API | Kein API-Spec verfügbar | Gering | Wenn FR API-Docs vorliegen |
| A-002 | Scout24 API | Stub-Implementation ohne echte API-Calls | Keine API-Credentials | Mittel | Bei Scout24 Onboarding |
| A-003 | Meta Ads | Managed Ads Modell (Plattform bucht im Auftrag) | Einfachere Implementation als Self-Service | Mittel | Bei Meta API Integration |
| A-004 | FinAPI (MOD-05) | Nur Konzept/Stub, keine echte Integration | Premium Feature, Phase 2 | Gering | Bei FinAPI Vertrag |
| A-005 | Apify/Firecrawl | Provider Registry + Jobs-Tabelle als Stub | Scraping = Phase 2 | Gering | Bei Scraper-Aktivierung |
| A-006 | Miety | Nur Einladungs-Token + Docking-Contract | Explizit nicht implementieren | Keiner | Niemals in diesem Scope |
| A-007 | Partner Verification | Manueller Review-Prozess in Zone 1 | Keine automatische Prüfung möglich | Gering | Bei Compliance-Automatisierung |
| A-008 | Commission Payout | Manuell in Phase 1 | Kein Stripe Connect | Mittel | Bei Stripe Connect Setup |
| A-009 | Lead-Timeout | 48h bei Nicht-Akzeptanz, dann Re-Assign | Standard-Praxis | Gering | Konfigurierbar machen |
| A-010 | Export-Formate | PDF + ZIP in Phase 1 | Pragmatisch | Gering | CSV/Excel auf Anfrage |

---

## Changelog

| Datum | Änderung |
|-------|----------|
| 2026-01-26 | Initial erstellt mit 10 Annahmen |
