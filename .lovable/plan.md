

# Session-Verlaengerung + Golden Path & Engine Tests (Runde 7)

## Teil 1: Session-Timeout verlaengern

### Problem
Die Standard-JWT-Expiry von Lovable Cloud ist auf 3600 Sekunden (1 Stunde) eingestellt, aber der Refresh-Token-Mechanismus scheint nicht korrekt zu greifen, sodass du dich alle 5 Minuten neu einloggen musst.

### Loesung
Die Supabase Auth-Konfiguration unterstuetzt keine direkte JWT-Expiry-Aenderung ueber config.toml in Lovable Cloud. Stattdessen werden wir den Supabase-Client so konfigurieren, dass der **Auto-Refresh aggressiver** arbeitet:

1. **Datei: `src/integrations/supabase/client.ts`** — Diese Datei wird automatisch generiert und darf NICHT editiert werden.
2. **Alternative:** Wir stellen sicher, dass der `onAuthStateChange`-Listener korrekt implementiert ist und Token-Refreshes nicht blockiert werden. Ausserdem pruefen wir, ob irgendwo im Code ein expliziter Logout oder Session-Kill passiert.

**Konkrete Aenderung:** Im AuthContext pruefen wir, ob `autoRefreshToken` und `persistSession` aktiv sind und ob der `onAuthStateChange`-Listener vor `getSession()` registriert wird (Best Practice).

---

## Teil 2: Golden Path Tests (D-01 bis D-17) + Engine Workflows (E-01 bis E-10)

### Strategie

Da die Golden Path Tests UI-Navigation erfordern, werde ich den **Browser-Tool** nutzen, um systematisch durch die Module zu navigieren und die Compliance-Kriterien zu pruefen.

### D-Tests: Portal-Prozesse (17 Tests)

Fuer jeden Test pruefen wir die 6 Compliance-Kriterien:

| Kriterium | Pruefmethode |
|-----------|-------------|
| ModulePageHeader | Visuell — CI-konformer Titel mit Icon |
| WidgetGrid | Visuell — Karten-Grid vorhanden |
| DemoWidget | Klick — Position 0, Badge sichtbar |
| InlineFlow | Scroll — Detail oeffnet vertikal |
| NoSubNavigation | Navigation — Keine Tabs/Sub-Routing |
| WidgetCell | Visuell — Standard-Dimensionen |

### Reihenfolge (Demo-Daten muessen aktiv sein):

```text
D-01  GP-PORTFOLIO     → /portal/immobilien
D-02  GP-VERWALTUNG    → /portal/immobilien (BWA-Tab)
D-04  GP-FINANZIERUNG  → /portal/finanzierung
D-05  GP-SUCHMANDAT    → /portal/investments
D-06  GP-SIMULATION    → /portal/investments
D-09  GP-PROJEKT       → /portal/projekte
D-12  GP-FAHRZEUG      → /portal/cars
D-13  GP-KONTEN        → /portal/finanzanalyse
D-14  GP-PV-ANLAGE     → /portal/photovoltaik
D-15  GP-ZUHAUSE       → /portal/miety
D-16  GP-PETS          → /portal/msv
D-17  GP-PET           → /portal/petmanager
```

### E-Tests: Engine-Workflows (10 Tests)

Diese Tests validieren die Golden Path Engine + Context Resolver Kombination:

| Test | Validierung |
|------|------------|
| E-01 MOD-04 | mod04Resolver: property_exists, main_unit_exists, listing_active |
| E-02 MOD-07 | mod07Resolver: finance_request_exists, applicant_profile_complete |
| E-03 MOD-08 | mod08Resolver: mandate_draft_exists, mandate_submitted |
| E-04 MOD-13 | mod13Resolver: project_exists, units_created |
| E-05 GP-VERMIETUNG | gpVermietungResolver: units_exist, lease_active |
| E-06 GP-LEAD | gpLeadResolver: lead_exists, lead_qualified, lead_assigned |
| E-07 GP-FINANCE-Z3 | gpFinanceZ3Resolver: request_exists, profile_exists |
| E-08 GP-PET | gpPetResolver: customer_exists, pet_exists, first_booking_completed |
| E-09 GP-MANAGER-LIFECYCLE | gpManagerLifecycleResolver: application_submitted, org_type_upgraded |
| E-10 GP-CLIENT-ASSIGNMENT | gpClientAssignmentResolver: org_link_created, delegation_scoped |

Fuer die Engine-Workflows kann ich die **Context Resolver direkt via DB-Queries** validieren, ohne manuellen Login.

### C-22: Golden Path Guard

Zusaetzlich teste ich den Guard (`GoldenPathGuard.tsx`) gegen die Engine — ob nicht-konforme Routen korrekt blockiert werden.

---

## Technische Details

### Session-Fix: AuthContext pruefen

Dateien die geprueft/angepasst werden:
- `src/contexts/AuthContext.tsx` — onAuthStateChange Listener-Reihenfolge
- Evtl. `src/App.tsx` — Session-Handling bei Route-Changes

### GP-Tests: Automatisierbar via Browser-Tool

- Navigation zu jeder Modul-Route
- Screenshot + Observe fuer Compliance-Check
- DB-Queries fuer Context-Resolver-Validierung

### Betroffene Dateien (maximal)

| Datei | Aenderung |
|-------|-----------|
| `src/contexts/AuthContext.tsx` | Session-Refresh-Logik haerten |
| `spec/current/08_testing/E2E_TEST_BACKLOG.md` | Testergebnisse D-01 bis D-17, E-01 bis E-10, C-22 |

