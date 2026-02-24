

# Plan: Lead Desk vereinfachen — 6 Tabs auf 2 klare Bereiche

## Analyse: Woher kommen Leads tatsaechlich?

### Aktive Lead-Quellen (Edge Functions die heute existieren)

| Edge Function | Setzt `source` auf | Setzt `interest_type` auf | Website |
|---|---|---|---|
| `sot-futureroom-public-submit` | `kaufy_website` | `finanzierung` | FutureRoom |
| `sot-public-project-intake` | `kaufy_website` | `project_submission` | Kaufy |
| `sot-lead-inbox` | variabel | aus Payload | Kaufy/Miety/SoT |
| Manuell (Admin-Dialog) | `manual` | frei waehlbar | — |

### Lead-Source Enum (DB)

```text
zone1_pool, meta_self, meta_property, referral, manual,
kaufy_website, kaufy_armstrong, kaufy_expose_request,
futureroom_armstrong, sot_demo_booking
```

### Wo kommt "rental" her?

**Nirgendwo.** Es ist eine hardcoded Select-Option im manuellen Lead-Erstellungsdialog (`LeadPoolPage.tsx`, Zeile 132). Keine Edge Function, keine Website, kein Armstrong-Flow setzt jemals `interest_type = "rental"`. Es gibt aktuell auch **keine Miety-Lead-Capture Edge Function**. Miety ist noch nicht angebunden.

Die DB enthaelt derzeit **0 Leads** — der interest_type wurde produktiv noch nie befuellt.

### Fazit: "rental" wird entfernt

Da Miety noch nicht angebunden ist und keine Lead-Quelle "rental" liefert, wird diese Option aus dem Dropdown entfernt. Wenn Miety spaeter Live geht, wird ein neuer interest_type eingefuehrt (z.B. `mietinteressent`) — gesteuert durch die Miety-Edge-Function, nicht durch einen manuellen Dropdown.

---

## IST-Zustand: 6 Tabs, viele Probleme

```text
/admin/lead-desk/                  ← Dashboard (KPIs + Provisionen)
/admin/lead-desk/kontakte          ← FEHLER: zeigt Insurance-Kontakte
/admin/lead-desk/pool              ← Website-Leads (zone1_pool=true)
/admin/lead-desk/assignments       ← Lead-Zuweisungen (rohe Tabelle)
/admin/lead-desk/commissions       ← Provisionen (globale Tabelle)
/admin/lead-desk/monitor           ← Duplikat des Dashboards
```

**Probleme im Detail:**
1. **Kontakte**: Copy-Paste-Fehler — nutzt `DeskContactBook` mit `desk="insurance"`
2. **Monitor**: Identische DB-Queries wie Dashboard (leads + commissions)
3. **Commissions**: Liest globale `commissions`-Tabelle — nicht Lead-spezifisch
4. **Assignments**: Rohe Tabelle, Funktionalitaet bereits im Pool-Dialog vorhanden
5. **Dashboard**: Zeigt Provisions-KPIs die nicht zum Lead-Thema gehoeren

---

## SOLL-Zustand: 2 Tabs

```text
┌──────────────────────────────────────────────────────┐
│  Lead Desk                                           │
│  "Website-Leads (Zone 3) · Kampagnen (Zone 2)"      │
├──────────────────────┬───────────────────────────────┤
│  Website Leads       │  Kampagnen Leads              │
│  (Default-Tab)       │                               │
└──────────────────────┴───────────────────────────────┘
```

### Tab 1: Website Leads (Zone 3) — Default

Alle Leads die ueber Website-Kontaktformulare und Armstrong eingehen.

**Inhalt:**
- KPI-Leiste oben: Neue Leads | Zugewiesen | Offen | Konvertiert
  (OHNE Provisionen — die gehoeren nicht hierher)
- Lead-Pool-Tabelle (bestehende `LeadPool`-Komponente wird wiederverwendet)
- "Lead anlegen"-Dialog (bestehend, aber bereinigt)
- "Lead zuweisen"-Dialog (bestehend)

**Lead-Verteilung beim Zuweisen:**

```text
Website-Formular (Kaufy / FutureRoom / SoT)
  │
  ▼
Edge Function (sot-lead-inbox / sot-futureroom-public-submit)
  │
  ▼
leads-Tabelle (zone1_pool = true)
  │
  ▼
Zone 1: Lead Desk → Tab "Website Leads"
  │
  ├── interest_type = "finanzierung"        → Finanzierungsmanager (MOD-11)
  ├── interest_type = "project_submission"  → Akquise-Manager (MOD-12)
  ├── interest_type = "purchase" / "sale"   → Akquise-Manager (MOD-12)
  └── interest_type = "other" / null        → Manuell zuweisen
```

**Korrektur des interest_type Dropdowns (manuelles Anlegen):**

```text
VORHER:                    NACHHER:
- Kauf (purchase)          - Kauf (purchase)
- Verkauf (sale)           - Verkauf (sale)
- Finanzierung (financing) - Finanzierung (finanzierung)  ← an DB anpassen
- Investment (investment)  - Projekteinreichung (project_submission)
- Vermietung (rental)      - Sonstiges (other)
- Sonstiges (other)
                           ENTFERNT: rental, investment
                           NEU: project_submission
                           FIX: "financing" → "finanzierung" (DB-Konsistenz)
```

### Tab 2: Kampagnen Leads (Zone 2)

Admin-Sicht auf gebuchte Anzeigen-Kampagnen und deren Lead-Ergebnisse.

**Datenquellen (Tabellen existieren bereits):**
- `ad_campaigns` — Kampagnen aus MOD-10 Leadmanager
- `ad_campaign_leads` — Leads die ueber Kampagnen generiert wurden
- `social_mandates` — Gebuchte Social-Media-Auftraege
- `social_leads` — Leads aus Social-Media-Kampagnen

**Inhalt:**
- KPI-Leiste: Aktive Kampagnen | Generierte Leads | Buchungen gesamt
- Kampagnen-Uebersichtstabelle mit Status
- Hinweis-Badge "Meta API: In Vorbereitung"

---

## Datei-Aenderungen

### 1. LeadDesk.tsx — Shell: 6 Tabs → 2 Tabs

- Import nur noch 2 lazy-loaded Seiten statt 6
- TABS-Array reduzieren auf `Website Leads` (Pfad: `""`) und `Kampagnen` (Pfad: `kampagnen`)
- Subtitle aendern: `"Website-Leads (Zone 3) · Kampagnen (Zone 2)"`

### 2. Neue Datei: LeadWebsiteLeads.tsx

Zusammenfuehrung aus altem Dashboard (nur Lead-KPIs, keine Provisionen) und LeadPoolPage:
- KPI-Cards oben (Pool Gesamt, Offen, Zugewiesen, Konvertiert)
- Darunter: LeadPool-Komponente mit Create- und Assign-Dialogen
- interest_type Dropdown bereinigt (rental/investment entfernt, project_submission hinzu, financing → finanzierung)

### 3. Neue Datei: LeadKampagnenDesk.tsx

- Liest `ad_campaigns` + `social_mandates` aus der DB
- KPI-Cards: Aktive Kampagnen, Social Mandates, Generierte Leads
- Tabelle: Kampagnen-Uebersicht
- Info-Badge: "Meta API Anbindung in Vorbereitung"

### 4. Dateien loeschen (8 Dateien)

| Datei | Grund |
|---|---|
| `LeadDeskDashboard.tsx` | Ersetzt durch KPIs in LeadWebsiteLeads |
| `LeadDeskKontakte.tsx` | Zeigt falsche Daten (Insurance) |
| `LeadMonitorPage.tsx` | Duplikat des Dashboards |
| `LeadMonitor.tsx` | Zugehoerige Komponente |
| `LeadCommissionsPage.tsx` | Provisionen gehoeren nicht in Lead Desk |
| `LeadCommissions.tsx` | Zugehoerige Komponente |
| `LeadAssignmentsPage.tsx` | In Pool integriert |
| `LeadAssignments.tsx` | Zugehoerige Komponente |

### 5. LeadPool.tsx + LeadPoolPage.tsx — Behalten, aber Pool wird nur noch von LeadWebsiteLeads importiert

Die bestehende LeadPool-Komponente bleibt unveraendert. LeadPoolPage wird nicht mehr direkt geroutet, sondern LeadWebsiteLeads integriert dessen Logik.

---

## Ergebnis: Menue VORHER vs. NACHHER

```text
VORHER (6 Tabs):                    NACHHER (2 Tabs):
┌─────────────────────────────┐     ┌──────────────────────────────┐
│ Dashboard                   │     │ Website Leads                │
│ Kontakte                    │     │ (KPIs + Pool + Zuweisungen)  │
│ Lead Pool                   │     ├──────────────────────────────┤
│ Zuweisungen                 │     │ Kampagnen Leads              │
│ Provisionen                 │     │ (Ad Campaigns + Mandates)    │
│ Monitor                     │     └──────────────────────────────┘
└─────────────────────────────┘

Ergebnis: 8 Dateien geloescht, 2 neue erstellt, 1 angepasst
```

## Modul-Freeze-Check

Alle Dateien unter `src/pages/admin/` — kein Modul-Pfad, nicht frozen. Aenderungen erlaubt.

