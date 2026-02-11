 # Golden Path E2E Specification
 
 **Version:** 1.0  
 **Status:** FROZEN  
 **Date:** 2026-02-05
 **Konsolidiert aus:** `docs/workflows/GOLDEN_PATH_E2E.md` (ZBC Schritt 7)

 ---
 
 ## Übersicht
 
 Der "Golden Path" definiert den vollständigen End-to-End-Workflow für das Musterportal. 
 Eine Musterimmobilie durchläuft alle Module und Zonen – von der Erfassung bis zum Verkaufsabschluss.
 
 ---
 
 ## Architektur (3-Zonen-Modell)
 
 ```
 ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 │                              ZONE 1 — ADMIN PORTAL (/admin)                             │
 │                                                                                         │
 │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────────────┐ │
 │  │ Tile Catalog        │  │ FutureRoom          │  │ Sales Desk (Verkaufslistings)   │ │
 │  │ → Testdaten-Tab     │  │ → Finanz-Inbox      │  │ → SSOT für alle Verkaufsobjekte │ │
 │  │ → Golden Path       │  │ → Zuweisung         │  │ → Verteilung an Zone 2 + 3      │ │
 │  │    Button           │  │ → Manager-Pool      │  │ → Blocking-Möglichkeit          │ │
 │  └─────────────────────┘  └─────────────────────┘  └─────────────────────────────────┘ │
 │                                      │                           │                      │
 │                                      ▼                           ▼                      │
 │                        ┌─────────────────────────────────────────────────────────────┐ │
 │                        │              LEAD POOL (Zone 3 Eingänge)                    │ │
 │                        │              → Verteilung an Partner mit MOD-09             │ │
 │                        └─────────────────────────────────────────────────────────────┘ │
 └─────────────────────────────────────────────────────────────────────────────────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                              ▼
 ┌───────────────────────────────────────────┐  ┌───────────────────────────────────────────┐
 │        ZONE 2 — USER PORTAL (/portal)     │  │        ZONE 3 — PUBLIC WEBSITES           │
 │                                           │  │        (/website/**)                       │
 │  MOD-04: Immobilien (SSOT Kapitalanlagen) │  │  KAUFY Marktplatz                         │
 │  MOD-06: Verkauf → Zone 1 Sales Desk      │  │  → Nur Objekte mit Kaufy-Freigabe         │
 │  MOD-07: Finanzierung → Zone 1 FutureRoom │  │  → Leads → Zone 1 Pool                    │
 │  MOD-09: Vertriebspartner (empfängt von   │  │                                           │
 │          Zone 1 Sales Desk)               │  │  MIETY, SoT-Website, FutureRoom-Website   │
 │  MOD-11: Finanzierungsmanager (empfängt   │  │                                           │
 │          von Zone 1 FutureRoom)           │  │                                           │
 └───────────────────────────────────────────┘  └───────────────────────────────────────────┘
 ```
 
 ---
 
 ## Datendomänen
 
 | Domäne | SSOT | Beschreibung |
 |--------|------|--------------|
 | Kapitalanlage-Immobilien | MOD-04 | Vermietete Objekte, Units, Mietverträge, Darlehen |
 | Persönliche Bonität | MOD-07 | Selbstauskunft (Einkommen, Vermögen, Ausgaben) |
 | Selbstgenutzte Immobilie | MOD-07 | Eigenheim des Antragstellers (optional) |
 | Verkaufslistings | Zone 1 Sales Desk | Alle freigegebenen Verkaufsobjekte |
 | Finanzierungsanfragen | Zone 1 FutureRoom | Alle eingereichten Finanzierungen |
 
 ---
 
 ## Die 10 Phasen des Golden Path
 
 ### Phase 1: STAMMDATEN (Fundament)
 
 **Trigger:** Zone 1: `/admin/tiles` → Tab "Testdaten" → [Golden Path einspielen]
 
 **Erzeugt:**
 - 5 Kontakte (Max, Lisa, Mieter, Hausverwaltung, Bankberater)
 - 1 Property (Leipzig, 62m²)
 - 1 Unit mit Mietvertrag
 - 1 Darlehen (80% LTV)
 - 1 Vermieter-Kontext (Ehepaar)
 - 12 Demo-Dokumente
 - 1 Selbstauskunft (~85% befüllt)
 
 ### Phase 2–10
 
 Siehe vollständige Spezifikation in `spec/current/` für Details zu:
 - Phase 2: IMMOBILIEN-SSOT (MOD-04)
 - Phase 3: DMS/STORAGE (MOD-03)
 - Phase 4: BONITÄT (MOD-07)
 - Phase 5: FINANZIERUNGSANFRAGE (MOD-07 → Zone 1)
 - Phase 6: GOVERNANCE (Zone 1 FutureRoom)
 - Phase 7: VERKAUF (MOD-06 → Zone 1 Sales Desk)
 - Phase 8: DISTRIBUTION (Zone 1 → Zone 2 + 3)
 - Phase 9: LEAD-EINGANG (Zone 3 → Zone 1 → Zone 2)
 - Phase 10: INVESTMENT (MOD-08) + ABSCHLUSS
 
 ---
 
 ## Changelog
 
 | Version | Datum | Änderung |
 |---------|-------|----------|
 | 1.0 | 2026-02-05 | Initial frozen version |
 | 1.1 | 2026-02-11 | Konsolidiert nach docs/golden-paths/ (ZBC Schritt 7) |
