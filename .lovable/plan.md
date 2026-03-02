

# KI-gestützte Prozessüberwachung für TLC und SLC

## Ist-Zustand

| System | Cron-Job | KI-Analyse | Stuck-Detection | Auto-Actions |
|--------|----------|------------|-----------------|--------------|
| TLC | ✅ Wöchentlich So 03:00 | ✅ AI-Summary via Gemini | ✅ Payment, Deadlines, SLA | ✅ Auto-Mail Mahnstufe 0 |
| SLC | ❌ Kein Cron-Job | ❌ Keine KI | ⚠️ Nur UI-seitig (isStuck) | ❌ Keine |

**TLC ist bereits gut automatisiert.** Der SLC hat dagegen keinerlei serverseitige Überwachung — Stuck-Detection läuft nur client-seitig beim Öffnen des Monitors.

---

## Plan: 3 Bausteine

### Baustein 1: `sot-slc-lifecycle` Edge Function (Cron — täglich 04:00 UTC)

Neue Edge Function nach dem bewährten TLC-Muster. Prüft täglich:

1. **Stuck-Cases**: Alle `sales_cases` gegen `SLC_STUCK_THRESHOLDS` (14d mandate, 60d published, 21d inquiry, 30d reserved, etc.)
2. **Abgelaufene Reservierungen**: `sales_reservations` mit `expiry_date < now()` → Auto-Event `deal.reservation_expired`
3. **Channel-Drift**: `listing_publications` wo `expected_hash ≠ last_synced_hash` → Drift-Alert-Event
4. **Offene Settlements**: Cases in Phase `notary_completed` seit >14 Tagen ohne Settlement → Erinnerung
5. **KI-Zusammenfassung**: Gemini-Flash analysiert alle Findings und generiert "Next Best Actions" pro Case

Ergebnis-Events werden in `sales_lifecycle_events` geschrieben (triggered_by: 'cron').

### Baustein 2: Unified Process Health Monitor (Zone 1)

Neuer Tab im Armstrong Admin oder eigener Desk-Subtab: **"Process Health"**

- Zeigt TLC + SLC Cron-Run-Ergebnisse nebeneinander
- KI-Summaries beider Systeme auf einen Blick
- Stuck-Cases + überfällige Leases in einer kombinierten Risiko-Ansicht
- Letzte Cron-Runs mit Status (success/error/skipped)

### Baustein 3: Cron-Job Registration + Alert-System

- pg_cron Job für `sot-slc-lifecycle` (täglich 04:00 UTC)
- Optional: `process_health_log` Tabelle für persistente Run-Ergebnisse beider Systeme
- Armstrong-Briefing-Integration: Die KI-Summaries fließen in die tägliche `ArmstrongGreetingCard`

---

## Technische Details

### Edge Function Architektur (`sot-slc-lifecycle`)

```text
┌─────────────────────────────────────┐
│  pg_cron (04:00 UTC daily)          │
│  → net.http_post(sot-slc-lifecycle) │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  1. Fetch active sales_cases        │
│  2. For each case:                  │
│     ├─ isStuck(phase, updated_at)?  │
│     ├─ Check reservations expired?  │
│     ├─ Check channel drift?         │
│     └─ Check settlement pending?    │
│  3. Write events to SLC events      │
│  4. AI summary via Gemini Flash     │
│  5. Write to process_health_log     │
└─────────────────────────────────────┘
```

### Neue DB-Tabelle: `process_health_log`

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid | PK |
| system | text | 'tlc' oder 'slc' |
| run_date | date | Laufdatum |
| cases_checked | int | Geprüfte Fälle |
| issues_found | int | Gefundene Probleme |
| events_created | int | Erstellte Events |
| ai_summary | text | KI-Zusammenfassung |
| details | jsonb | Vollständige Ergebnisse |
| created_at | timestamptz | Zeitstempel |

### Dateien

| Datei | Aktion |
|-------|--------|
| `supabase/functions/sot-slc-lifecycle/index.ts` | NEU — SLC Cron Function |
| `supabase/functions/sot-tenancy-lifecycle/index.ts` | EDIT — process_health_log schreiben |
| `src/pages/admin/sales-desk/ProcessHealthTab.tsx` | NEU — Unified Health Monitor |
| `src/hooks/useProcessHealth.ts` | NEU — Hook für process_health_log |
| `src/pages/admin/desks/SalesDesk.tsx` | EDIT — ProcessHealth Tab hinzufügen |
| Migration | NEU — process_health_log Tabelle + RLS |
| pg_cron | NEU — Cron-Job für sot-slc-lifecycle |

### Weitere Stabilisierungs-Optionen (Zukunft)

- **DB-Trigger auf sales_cases**: Automatische Event-Generierung bei Phase-Änderungen (statt nur Hook-basiert)
- **Watchdog für Cron-Jobs**: Prüft ob Cron-Jobs gelaufen sind, Alert bei Ausfall
- **Retry-Queue**: Fehlgeschlagene Events in einer Queue für erneuten Versuch
- **SLA-Monitoring**: Messbare Zielzeiten pro SLC-Phase mit Eskalation

