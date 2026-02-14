

# MOD-11 Finanzierungsmanager — Komplett-Redesign

## Soll-Ist-Analyse

### IST-Zustand

| Aspekt | Aktuell | Problem |
|--------|---------|---------|
| Menuepunkte | Dashboard, Finanzierungsakte, Einreichung, Provisionen, Archiv (5 Tiles) | Falsche Struktur, keine Versicherungen/Abos/Investment/Vorsorge |
| Personen-Block | Nicht vorhanden im Dashboard | Fehlt komplett |
| Konten-Block | Nicht vorhanden | Fehlt komplett |
| Versicherungen | Nur in MOD-20 (miety_contracts) | Kein zentraler SSOT in MOD-11 |
| Abonnements | subscriptions-Tabelle existiert (Stripe) | Keine Abo-Erkennung/SSOT fuer Nutzer-Abos |
| Investment | Nicht in MOD-11 | Upvest-Integration fehlt |
| Vorsorge | pension_records existiert | Kein eigener Menuepunkt |
| Scan/Erkennung | Nicht vorhanden | Kein 12M-Scan |

### Vorhandene DB-Tabellen (wiederverwendbar)

- `household_persons` — vorhanden, SSOT fuer Personen
- `pension_records` — vorhanden, SSOT fuer DRV
- `msv_bank_accounts` — vorhanden (IBAN, Bankname, Status, FinAPI-Ref)
- `bank_transactions` — vorhanden (12M Umsaetze, Buchungsdatum, Betrag, Gegenpartei)
- `miety_contracts` — vorhanden (Vertraege mit JSONB details, aber an home_id gebunden)
- `subscriptions` — vorhanden (Stripe-Subscriptions, NICHT Nutzer-Abos)

### Fehlende DB-Tabellen (neu anzulegen)

- `insurance_contracts` — Zentrale Versicherungs-SSOT
- `insurance_contract_links` — Referenzen zu Fahrzeugen/Immobilien/PV
- `vorsorge_contracts` — Vorsorgevertraege SSOT
- `user_subscriptions` — Nutzer-Abonnements SSOT (getrennt von Stripe)
- `scan_runs` — Scan-Durchlaeufe
- `contract_candidates` — Erkannte Vertragskandidaten aus Scan
- `bank_account_meta` — Editierbare Meta-Daten pro Konto (Custom Name, Kategorie, Zuordnung)

---

## SOLL-Zustand: 5-Punkt-Menustruktur

### Routes-Manifest Aenderung

```
tiles: [
  { path: "dashboard",        title: "Uebersicht",          default: true },
  { path: "investment",       title: "Investment"            },
  { path: "sachversicherungen", title: "Sachversicherungen"  },
  { path: "vorsorge",         title: "Vorsorgevertraege"     },
  { path: "abonnements",      title: "Abonnements"           },
]
```

Bisherige Tiles (Finanzierungsakte, Einreichung, Provisionen, Archiv) werden als `dynamic_routes` beibehalten, aber aus den sichtbaren Tiles entfernt.

---

## Umsetzung pro Menuepunkt

### MENU (1) UEBERSICHT — `FMUebersichtTab.tsx`

Ersetzt das bisherige `FMDashboard.tsx`. Strikte Block-Reihenfolge:

**Block A — Personen im Haushalt (GANZ OBEN)**
- Wiederverwendung der `household_persons` + `pension_records` Tabellen
- Gleiche Accordion-UI wie in MOD-18 UebersichtTab (Personen-Kacheln, editierbar, DRV-Subsektion)
- Auto-Seed Person #1 aus Profil-Stammdaten
- Button: "+ Person hinzufuegen"

**Block B — Konten (nach Personen)**
- Query: `msv_bank_accounts` + `bank_account_meta` (neu)
- Pro Konto ein Widget (collapsed/expanded)
- Collapsed: Custom Name, Bankname, Kontotyp, Kategorie, IBAN maskiert, Status, letzte Sync
- Expanded: Meta editierbar (Custom Name, Kategorie, Org-Zuordnung) + Kontodaten read-only + Umsaetze (12M aus bank_transactions)

**Block C — 12M Scan Button**
- Button: "Umsaetze (12 Monate) auslesen & Vertraege erkennen"
- Erstellt `scan_runs` Eintrag, erzeugt `contract_candidates`
- Kandidaten-Liste mit Actions: Als Abonnement/Versicherung/Vorsorge uebernehmen, Ignorieren, Zusammenfuehren

### MENU (2) INVESTMENT — `FMInvestmentTab.tsx`

Komplett neu. Upvest-Integration (read-only):
- Zustandsanzeige: nicht verbunden / verbunden / Fehler / Onboarding noetig
- Widgets: Depot-Uebersicht, Positionen (ISIN/Name/Stuecke/Wert), Transaktionen, Reports/Statements
- Empty State bei fehlender Verbindung

### MENU (3) SACHVERSICHERUNGEN — `FMSachversicherungenTab.tsx`

Komplett neu. Zentrale Versicherungs-SSOT:
- Neue Tabelle `insurance_contracts` mit Universal-Feldern (Kategorie, Versicherer, Policen-Nr, VN, Beginn, Ablauf, Beitrag, Intervall, Status) + JSONB `details` fuer kategorie-spezifische Felder
- Neue Tabelle `insurance_contract_links` (Referenz zu Fahrzeug/Immobilie/PV)
- UI: Liste bestehender Vertraege als Accordion-Widgets + "+ Versicherung" Button
- Schritt 1 beim Anlegen: Kategorie waehlen (Dropdown)
- Danach: Universal + kategorie-spezifische Pflichtfelder
- Kategorien: Haftpflicht, Hausrat, Wohngebaeude, Rechtsschutz, KFZ, Unfall, Berufsunfaehigkeit

### MENU (4) VORSORGEVERTRAEGE — `FMVorsorgeTab.tsx`

Komplett neu:
- Neue Tabelle `vorsorge_contracts` (Anbieter, Vertragsnummer, Person-Zuordnung, Beginn, Beitrag, Intervall, Status, Dokumentlinks)
- UI: Liste + "+ Vorsorgevertrag" Button
- DRV-Werte werden aus Personen-Block referenziert (read-only Anzeige)

### MENU (5) ABONNEMENTS — `FMAbonnementsTab.tsx`

Komplett neu:
- Neue Tabelle `user_subscriptions` (Custom Name, Merchant, Kategorie-Enum, Frequenz, Betrag, Payment-Source, Status, Auto-Renew, Confidence)
- Kategorie-Enum: streaming_video, streaming_music, cloud_storage, software_saas, news_media, ecommerce_membership, telecom_mobile, internet, utilities_energy, mobility, fitness, other
- UI: Liste + "+ Abonnement" Button
- Seed-Merchants vorgeschlagen bei Neuanlage

---

## Datenbank-Migrationen

### Migration 1: Neue Tabellen

| Tabelle | Zweck |
|---------|-------|
| `insurance_contracts` | Zentrale Versicherungs-SSOT (tenant_id, user_id, category, insurer, policy_no, policyholder, start_date, end_date, premium, interval, status, details JSONB) |
| `insurance_contract_links` | Referenzen (contract_id FK, entity_type, entity_id) |
| `vorsorge_contracts` | Vorsorgevertraege (tenant_id, user_id, person_id FK, provider, contract_no, start_date, premium, interval, status) |
| `user_subscriptions` | Nutzer-Abos (tenant_id, user_id, custom_name, merchant, category_enum, frequency, amount, payment_source, status, auto_renew, confidence) |
| `bank_account_meta` | Editierbare Konto-Meta (account_id FK, custom_name, category, org_unit) |
| `scan_runs` | Scan-Durchlaeufe (tenant_id, user_id, started_at, status, account_ids) |
| `contract_candidates` | Erkannte Kandidaten (scan_run_id FK, tenant_id, merchant, amount_range, frequency, category_suggestion, confidence, status) |

RLS auf allen Tabellen via `tenant_id = get_user_tenant_id()`.

---

## Datei-Matrix

| Aktion | Datei |
|--------|-------|
| MIGRATION | 7 neue Tabellen + RLS + Indexes |
| EDIT | `src/manifests/routesManifest.ts` (MOD-11 Tiles umstrukturieren) |
| EDIT | `src/pages/portal/FinanzierungsmanagerPage.tsx` (neue Routes + Lazy-Imports) |
| NEU | `src/pages/portal/finanzierungsmanager/FMUebersichtTab.tsx` |
| NEU | `src/pages/portal/finanzierungsmanager/FMInvestmentTab.tsx` |
| NEU | `src/pages/portal/finanzierungsmanager/FMSachversicherungenTab.tsx` |
| NEU | `src/pages/portal/finanzierungsmanager/FMVorsorgeTab.tsx` |
| NEU | `src/pages/portal/finanzierungsmanager/FMAbonnementsTab.tsx` |
| NEU | `src/hooks/useFinanzmanagerData.ts` (Queries + Mutations fuer alle neuen Tabellen) |
| BEHALTEN | `FMDashboard.tsx` wird zu `FMUebersichtTab.tsx` umgebaut (Visitenkarte + Zins-Ticker bleiben als Widgets) |
| BEHALTEN | `FMFinanzierungsakte.tsx`, `FMFallDetail.tsx`, `FMEinreichung*.tsx`, `FMProvisionen.tsx`, `FMArchiv.tsx` bleiben als dynamic_routes erreichbar |

---

## Was sich NICHT aendert

- Finanzierungsakte-Workflow (Neuanlage, Magic Intake, Kaufy) bleibt als dynamic_route erhalten
- Provisionen bleiben erreichbar (dynamic_route)
- Archiv bleibt erreichbar (dynamic_route)
- `household_persons` + `pension_records` Tabellen bleiben unveraendert (SSOT geteilt mit MOD-18)
- CI/Widget-Design bleibt identisch (Cards, PageShell, ModulePageHeader, Accordion)

## Hinweis zur Komplexitaet

Dieser Umbau umfasst 7 neue DB-Tabellen, 5 neue Tab-Komponenten, 1 neuen zentralen Hook und Manifest-Aenderungen. Die Umsetzung sollte in mehreren Schritten erfolgen, um die Stabilitaet zu gewaehrleisten.

