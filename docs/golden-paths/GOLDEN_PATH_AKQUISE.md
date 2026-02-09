# Golden Path: Akquise-Service

> **Pfad:** MOD-08 (Investor) → Zone 1 Acquiary → MOD-12 (Akquise-Manager)
> **Status:** FROZEN v1.0

---

## Übersicht

Der Akquise-Service verbindet Investoren (MOD-08) mit professionellen Akquise-Managern (MOD-12) über die Zone-1-Governance (Acquiary).

## Phasen

### Phase 1: Suchmandat erstellen (MOD-08)
- Investor definiert Suchprofil (Asset-Fokus, Preisspanne, Rendite-Ziel, Suchgebiet)
- ActionKey: `ACQ_MANDATE_CREATE`
- Ergebnis: `acq_mandates` Record mit Status `draft`

### Phase 2: Governance & Routing (Zone 1 — Acquiary)
- Acquiary-Inbox empfängt neue Mandate
- Platform Admin prüft und routet an verfügbaren Akquise-Manager
- Status: `draft` → `assigned`
- Audit-Event: `MANDATE_ASSIGNED`

### Phase 3: Akquise-Arbeit (MOD-12)
- Manager akzeptiert Mandat: `ACQ_MANDATE_ACCEPT`
- Manager recherchiert, kontaktiert Makler (Outbound via Resend)
- Objekte werden als `acq_offers` erfasst
- Status-Progression: `assigned` → `active` → `paused` / `completed`

### Phase 4: Objekt-Analyse
- KI-gestützte Analyse via `acq_analysis_runs`
- Ergebnisse in `analysis_summary` (JSON) auf Offer-Ebene
- Bestand- und Aufteiler-Kalkulationen: `calc_bestand`, `calc_aufteiler`

### Phase 5: Reporting & Übergabe
- Manager präsentiert Ergebnisse im Mandats-Dashboard
- Investor entscheidet über Weiterverfolgung
- Bei Interesse: Übergang zu MOD-07 (Finanzierung) oder MOD-06 (Verkauf)

## Datenfluss

```
acq_mandates (MOD-08 erstellt, MOD-12 bearbeitet)
  └── acq_offers (MOD-12 erstellt)
       ├── acq_offer_documents (DMS-Anbindung)
       └── acq_analysis_runs (KI-Analyse)
  └── acq_outbound_messages (E-Mail an Makler)
       └── acq_inbound_messages (Antworten)
  └── acq_mandate_events (Audit-Trail)
```

## Camunda ActionKeys
- `ACQ_MANDATE_CREATE` → Investor erstellt Mandat
- `ACQ_MANDATE_ACCEPT` → Manager akzeptiert Mandat

## DMS-Struktur
```
MOD_12/
  └── {mandate_code}/
       └── {offer_title}/
            ├── Exposé
            ├── Grundbuch
            └── Analyse
```
