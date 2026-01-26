# Zone 2 — Open Questions

**Status:** Living Document  
**Last Updated:** 2026-01-26  
**Version:** v2.1 (Korrektur Kaufy)

---

## GLOSSAR-KORREKTUR (FROZEN)

| Falsch | Richtig |
|--------|---------|
| Kaufi | **Kaufy** (mit y) |
| MOD-08 Vertriebspartner | **MOD-09** Vertriebspartner |
| MOD-09 Leadgenerierung | **MOD-10** Leadgenerierung |
| Partner-Tenants | **Kaufy-Registrierte** |

---

## RESOLVED QUESTIONS (2026-01-26)

| ID | Modul | Question | Resolution | Date |
|----|-------|----------|------------|------|
| Q6.1 | MOD-06 | Publishing-Channels Anzahl? | 4: Kaufy, Scout24, Kleinanzeigen, Partner-Netzwerk | 2026-01-26 |
| Q6.2 | MOD-06 | Partner-Provision Range? | 5–15% pro Listing | 2026-01-26 |
| Q6.3 | MOD-06 | Systemgebühr Trigger? | 2.000€ success-based bei Closing/BNL | 2026-01-26 |
| Q8.5 | MOD-09/10 | Lead-Pool Zugang? | Push (Admin assigned) via Zone 1 Pool | 2026-01-26 |
| NEW | Architektur | Kaufy als Modulname? | NEIN — Kaufy ist Source/Channel, kein Modul | 2026-01-26 |
| NEW | MOD-09 | MOD-09 nur Objektkatalog? | NEIN — vollständiges Partner-Modul | 2026-01-26 |
| NEW | MOD-10 | Lead/Deal-Pipeline Modul? | Ja, in MOD-10 separiert | 2026-01-26 |
| NEW | Sichtbarkeit | Modulzugang je Registrierung? | SoT=1-8, Kaufy=1-10 | 2026-01-26 |

---

## MOD-01: Stammdaten

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| Q1.1 | Stripe Customer Portal Integration: Phase 1 oder Phase 2? | Phase 2 | PENDING |
| Q1.2 | 2FA Implementation: Native (Supabase) oder Third-Party? | Native Supabase | PENDING |
| Q1.3 | Team-Invite Flow: Magic Link oder Password-Setup? | Magic Link | PENDING |
| Q1.4 | Profil-Avatar: Supabase Storage Bucket oder External URL? | Supabase Storage | PENDING |
| Q1.5 | Multi-Tenant Switcher: In Header oder in Profil-Screen? | Header (global) | PENDING |

---

## MOD-02: KI Office

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| Q2.1 | Email scope: Phase 1 = READ + SEND? | Ja | PENDING |
| Q2.2 | Calendar: Phase 1 = internal only? | Ja | PENDING |
| Q2.3 | Fax/Briefdienst in Phase 1 oder Phase 2? | Phase 2 | PENDING |
| Q2.6 | Mail-Sync: Full-Sync vs On-Demand? | On-Demand + Metadata-Cache | PENDING |
| Q2.7 | Whisperflow: OpenAI Whisper direkt oder via Armstrong? | Via Armstrong | PENDING |
| Q2.8 | Briefgenerator PDF: Server-side (Edge Function) oder Client-side? | Edge Function | PENDING |

---

## MOD-03: DMS

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| Q3.1 | Armstrong-Rolle in MOD-03: Minimal oder Aktiv? | Minimal | PENDING |
| Q3.2 | `documents`-Tabelle Migration-Strategie? | Erweitern statt ersetzen | PENDING |
| Q3.4 | Worker-Deployment: Container vs. Edge Functions? | Container | PENDING |
| Q3.7 | Caya-Webhook-Format Details? | Noch zu spezifizieren | PENDING |

---

## MOD-04: Immobilien

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| Q4.1 | Sub-Route Naming: `/objekte` vs `/portfolio`? | `/objekte` | PENDING |
| Q4.2 | Investment-Engine Edge Function Scope Phase 1? | Kaufpreis, Rendite, Steuer | PENDING |
| Q4.5 | Sanierung Sub-Tile Scope Phase 1? | Full E2E-Prozess | PENDING |
| Q4.9 | Sanierung Resend-Sender Adresse? | `sanierung@sot.app` | PENDING |
| Q4.11 | Tender-ID Format? | `T-{PROPERTY_PUBLIC_ID}-{YYMMDD}-{SEQ}` | PENDING |

---

## MOD-06: Verkauf

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| Q6.4 | Exposé-Generator: Edge Function oder Client-side? | Edge Function | PENDING |
| Q6.5 | Kleinanzeigen: Screenshot-Upload Pflicht? | Optional | PENDING |

---

## MOD-07: Finanzierung

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| Q7.1 | **MOD-07 Spec fehlt komplett** | Nächste Iteration erstellen | **P0** |
| Q7.2 | Future Room Handoff Format? | Noch zu spezifizieren | PENDING |
| Q7.3 | Selbstauskunft Formular-Schema? | Noch zu spezifizieren | PENDING |

---

## MOD-08: Investment-Suche / Ankauf

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| Q8.1 | Kaufy als Modulname erlaubt? | **NEIN** — Source/Channel only | RESOLVED |
| Q8.2 | Kaufy-Favoriten-Sync automatisch? | Ja, bei Login/Signup | RESOLVED |
| Q8.3 | Web-Scraper Phase 1? | Nein, Placeholder | PENDING |
| Q8.4 | Portfolio-Simulation Scope? | Basis-Impact-Analyse Phase 1 | PENDING |

---

## MOD-09: Vertriebspartner

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| Q9.1 | MOD-09 nur Objektkatalog? | **NEIN** — vollständiges Modul | RESOLVED |
| Q9.2 | Sub-Partner Management Phase 1? | Nein, Phase 2 | PENDING |
| Q9.3 | Verifikation Ablauf-Warnung? | Ja, 30 Tage vorher | PENDING |
| Q9.4 | Simulation AfA-Modelle Phase 1? | Nur linear_2 | PENDING |
| Q9.5 | Commission PDF-Generator? | Phase 2 | PENDING |

---

## MOD-10: Leadgenerierung

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| Q10.1 | Lead-Split Verhältnis? | 1/3 Platform : 2/3 Partner | RESOLVED |
| Q10.2 | Lead-Timeout bei Nicht-Akzeptanz? | 48h, dann re-assign | PENDING |
| Q10.3 | Automatische Lead-Rotation? | Manuell in Phase 1 | PENDING |
| Q10.4 | Lead-Qualifizierungs-Kriterien? | Phase 2 definieren | PENDING |

---

## Cross-Module Questions

| ID | Question | Vorschlag | Status |
|----|----------|-----------|--------|
| QX.4 | Armstrong Edge Function: Single vs Multi? | Single mit Dispatcher | PENDING |
| QX.6 | Route-Label-Aliase Dokumentation? | MODULE_BLUEPRINT.md | RESOLVED |

---

## FREEZE CANDIDATES (P0)

1. ✅ **Kaufy Schreibweise** — mit y, nicht i
2. ✅ **10-Modul-Architektur** — 1-8 Standard, 9-10 Addon
3. ✅ **Sichtbarkeitsmatrix** — SoT=1-8, Kaufy=1-10
4. ✅ **Publishing-Channels** — 4 Channels mit klaren Gates
5. ✅ **Partner-Provision** — 5-15% + 2.000€ Systemgebühr
6. ✅ **Lead-Split** — 1/3 Platform : 2/3 Partner
7. ⏳ **MOD-07 Finanzierung** — Spec pending

---

## Resolution Log

| ID | Question | Resolution | Date | Reference |
|----|----------|------------|------|-----------|
| Q2.4 | Contacts Ownership | Core/Backbone | 2026-01-25 | K3 |
| Q2.5 | communication_events Owner | Backbone | 2026-01-25 | K4 |
| Q3.5 | audit_log vs audit_events | audit_events beibehalten | 2026-01-25 | N1 |
| QX.1 | contacts Ownership | Core/Backbone | 2026-01-25 | K3 |
| QX.2 | communication_events Ownership | Backbone | 2026-01-25 | K4 |
| QX.3 | connectors Architektur | Zone 1=Definitionen, MOD-03=Instanzen | 2026-01-25 | N3 |
| QX.5 | Audit-Events Schema | Einheitlich mit entity_type | 2026-01-25 | N1 |
| Q8.1 | Kaufy als Modulname | NEIN — Source/Channel only | 2026-01-26 | Korrektur |
| Q9.1 | MOD-09 Scope | Vollständiges Partner-Modul | 2026-01-26 | Korrektur |
| Q10.1 | Lead-Split | 1/3 : 2/3 | 2026-01-26 | Spec |

---

*Dieses Dokument trackt alle offenen und gelösten Fragen für Zone 2 Module.*
