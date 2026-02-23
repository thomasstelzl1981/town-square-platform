

# Plattform-Bereinigung und AI Operations Setup

## Zusammenfassung der Entscheidungen

Basierend auf deinem Feedback wurde der Plan angepasst:

**Beibehalten (alle Partner-APIs):** NASA_APOD, ZENQUOTES, EVENTBRITE_API, AMAZON_PAAPI, YOUTUBE_DATA_API, UDEMY_AFFILIATE -- alle fur kunftige Partnervertrage benotigt.

**IMPACT_AFFILIATE:** Das ist ein Affiliate-Netzwerk (impact.com), das Coursera und edX Kurs-Links fur MOD-15 Fortbildungen trackt. Vergleichbar mit AWIN/ADCELL -- wird beibehalten.

**Zu entfernen/konsolidieren:**
- `OPENAI` und `PERPLEXITY` --> durch `LOVABLE_AI` ersetzen (Status auf `disabled` setzen, Beschreibung aktualisieren)
- `CAYA` --> Umbenennen zu "Posteingang (offen)" -- die Plattform ist offen fur jeden Post-Service, nicht an Caya gebunden. Der Code-Referenzname `caya` bleibt als Enum-Wert (technisch stabil), aber Name und Beschreibung in der Registry werden neutralisiert.
- `SIMPLEFAX` und `BRIEFDIENST` --> Status-Beschreibung prazisieren: "Versand uber Resend-Weiterleitung, keine eigene API"

**Google Places vs. Maps:** Beide behalten -- Places fur Makler-/Handwerkersuche, Maps fur Kartenansicht. Sind unterschiedliche APIs mit unterschiedlichem Zweck.

---

## Phase 1: Integration Registry bereinigen

### 1.1 Datenbank-Anderungen (SQL Migration)

```text
Anderungen an integration_registry:

1. OPENAI: status -> 'disabled', description -> 'Ersetzt durch Lovable AI'
2. PERPLEXITY: status -> 'disabled', description -> 'Ersetzt durch Lovable AI'  
3. CAYA: name -> 'Posteingang (offen)', description -> 'Inbound-Post -- offen fuer jeden Post-Service'
4. SIMPLEFAX: description aktualisieren mit Hinweis auf Resend-Routing
5. BRIEFDIENST: description aktualisieren mit Hinweis auf Resend-Routing
```

Keine Loschungen -- alle Eintraege bleiben erhalten fur zukunftige Partnervertrage.

### 1.2 Integrations.tsx -- Hardcoded Secrets entfernen

Die `configuredSecrets`-Liste (Zeile 106-112) wird durch einen dynamischen Abruf uber die `fetch_secrets`-API oder den tatsachlichen Status aus der `integration_registry` ersetzt.

---

## Phase 2: Acquiary Desk -- SOAT Search Engine einbinden (1.2)

**Datei:** `src/pages/admin/acquiary/AcquiaryKontakte.tsx`

Der `useSoatSearchEngine` Hook existiert bereits in `src/hooks/useSoatSearchEngine.ts` und wird aktuell nur in `AdminRecherche.tsx` genutzt. In AcquiaryKontakte wird die Firmensuche an den SOAT-Workflow angebunden:

- Import von `useSoatSearchEngine`
- "Neue Recherche"-Button, der eine Search Order erstellt
- Ergebnisse werden in der Kontaktliste angezeigt

---

## Phase 3: Operative Desks homogenisieren (1.3)

Drei Desks werden in die modulare Architektur gebracht (wie Acquiary/PetDesk):

### 3.1 LeadDesk (325 Zeilen --> Shell + 4 Sub-Pages)

```text
src/pages/admin/desks/LeadDesk.tsx          -- Shell mit Link-Navigation
src/pages/admin/lead-desk/
  +-- LeadPool.tsx             (existiert bereits)
  +-- LeadAssignments.tsx      (existiert bereits)
  +-- LeadCommissions.tsx      (existiert bereits)
  +-- LeadMonitor.tsx          (existiert bereits)
  +-- LeadDeskDashboard.tsx    (NEU -- KPI-Ubersicht extrahieren)
```

Sub-Pages existieren grossteils schon -- die Shell muss nur von Tabs auf Routes + lazy-loading umgestellt werden.

### 3.2 FinanceDesk (253 Zeilen --> Shell + 5 Sub-Pages)

```text
src/pages/admin/desks/FinanceDesk.tsx       -- Shell mit Link-Navigation
src/pages/admin/finance-desk/
  +-- FinanceDeskInbox.tsx     (existiert bereits)
  +-- FinanceDeskFaelle.tsx    (existiert bereits)
  +-- FinanceDeskMonitor.tsx   (existiert bereits)
  +-- FinanceDeskDashboard.tsx (NEU -- extrahieren)
  +-- FinanceDeskZuweisung.tsx (NEU -- extrahieren)
```

### 3.3 SalesDesk (169 Zeilen --> Shell + Routes)

SalesDesk ist bereits am weitesten modularisiert (nutzt Sub-Imports). Hier hauptsachlich:
- Inline-Dashboard-Funktion in eigene Datei extrahieren
- Tabs durch Routes ersetzen

---

## Phase 4: Platform Health Monitor (Saule 2)

### 4.1 Neue Admin-Seite

**Datei:** `src/pages/admin/armstrong/PlatformHealth.tsx`

7 automatisierte Health-Checks mit visueller Ampel-Darstellung:

| Check | Methode |
|-------|---------|
| Demo-Daten-Integritat | DB-Query: Soll vs. Ist fur alle 33 Entitaten |
| Integration Status | Registry-Eintraege ohne aktives Secret |
| Module Freeze Status | JSON-Datei lesen und anzeigen |
| Golden Path Compliance | Context Resolver vorhanden? |
| Engine Registry Sync | Registrierte vs. exportierte Engines |
| Orphaned Records | FK-Waisen-Suche |
| RLS-Coverage | Tabellen ohne RLS-Policies |

### 4.2 Routing

Registrierung in `routesManifest.ts` und Armstrong-Navigation unter `/admin/armstrong/health`.

### 4.3 Export in Armstrong-Index

`src/pages/admin/armstrong/index.ts` wird um `PlatformHealth` erweitert.

---

## Phase 5: Weekly Review Template (Saule 3)

### 5.1 Neue Admin-Seite

**Datei:** `src/pages/admin/armstrong/WeeklyReview.tsx`

Interaktive Checkliste mit 8 Prufpunkten, die beim Abhaken den Status in `localStorage` oder einer DB-Tabelle speichert:

```text
1. Security Scan -- Offene Findings?
2. Demo-Daten -- Seed + Cleanup funktional?
3. Module Status -- Alle Tiles erreichbar?
4. Armstrong -- KB aktuell? Logs gepruft?
5. Performance -- Langsame Queries?
6. UI/UX -- Konsistenz-Check
7. Code-Hygiene -- any-Types, leere Catches?
8. Neue Features -- Backlog priorisieren
```

### 5.2 Routing

Registrierung unter `/admin/armstrong/review`.

---

## Umsetzungsreihenfolge

| Schritt | Aufgabe | Risiko |
|---------|---------|--------|
| 1 | Integration Registry SQL-Update | Niedrig (nur Beschreibungen/Status) |
| 2 | Integrations.tsx dynamisch machen | Niedrig |
| 3 | SOAT Search in AcquiaryKontakte | Mittel |
| 4 | LeadDesk Refactoring | Mittel (viel Code-Verschiebung) |
| 5 | FinanceDesk Refactoring | Mittel |
| 6 | SalesDesk Refactoring | Niedrig |
| 7 | PlatformHealth Seite | Niedrig (neue Datei) |
| 8 | WeeklyReview Seite | Niedrig (neue Datei) |

---

## CAYA im Code

Der Enum-Wert `caya` bleibt in `DocumentSource`, `inbound_source`, und `extraction_settings` bestehen (technische Stabilitat). Nur die user-sichtbare Beschreibung in der Registry wird neutralisiert. Ein vollstandiges Umbenennen des Enum-Werts wurde eine DB-Migration auf 4+ Tabellen erfordern -- das ist fur spater sinnvoll, aber nicht jetzt.

