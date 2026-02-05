 # Golden Path E2E Specification
 
 **Version:** 1.0  
 **Status:** FROZEN  
 **Date:** 2026-02-05
 
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
 │                                           │  │                                           │
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
 
 **Akzeptanzkriterien:**
 - [ ] Golden Path Button in `/admin/tiles` → Tab "Testdaten" sichtbar
 - [ ] Nach Klick: Toast mit Erfolgsmeldung + Counts
 - [ ] 5 Kontakte in `/portal/office/kontakte` sichtbar
 
 ---
 
 ### Phase 2: IMMOBILIEN-SSOT (MOD-04)
 
 **Route:** `/portal/immobilien`
 
 **Struktur:**
 ```
 /portal/immobilien
 ├── [How It Works] ← Landing Page
 ├── Kontexte → Ehepaar Mustermann (50%/50%)
 ├── Portfolio → Musterimmobilie Leipzig
 └── Dossier (/portal/immobilien/:id)
     └── 9 Blöcke (A-J): Identität, Adresse, Gebäude, Recht, Investment, Miet, WEG, Finanzierung, Dokumente
 ```
 
 **Akzeptanzkriterien:**
 - [ ] `/portal/immobilien` zeigt "How It Works" (nicht Portfolio-Redirect)
 - [ ] Ehepaar in Kontexte-Tab tabellarisch sichtbar
 - [ ] 1 Immobilie im Portfolio mit Kennzahlen
 - [ ] Klick auf "Auge" öffnet Dossier mit allen Blöcken
 
 ---
 
 ### Phase 3: DMS/STORAGE (MOD-03)
 
 **Route:** `/portal/dms/storage`
 
 **Struktur:**
 - 18-Ordner-Taxonomie (Grundbuch, Kaufvertrag, Exposé, etc.)
 - 12 Demo-Dokumente verknüpft via `document_links`
 
 **Akzeptanzkriterien:**
 - [ ] 18-Ordner-Struktur sichtbar (keine Duplikate)
 - [ ] 12 Dokumente korrekt verlinkt
 - [ ] Dokumente aus Dossier-Blöcken referenzierbar
 
 ---
 
 ### Phase 4: BONITÄT (MOD-07 Selbstauskunft)
 
 **Route:** `/portal/finanzierung`
 
 **Struktur:**
 ```
 /portal/finanzierung
 ├── [How It Works] ← Landing Page
 ├── Selbstauskunft (8 Tabs)
 │   └── Persönliche Daten, Haushalt, Einkommen, Firma, Ausgaben, Vermögen, Erklärungen, Finanzierung
 └── Kumulierte MOD-04-Daten (read-only)
 ```
 
 **WICHTIG: Datentrennung**
 - Selbstgenutzte Immobilie → Felder in MOD-07 (editierbar)
 - Kapitalanlage-Immobilien → Aus MOD-04 (read-only)
 
 **Akzeptanzkriterien:**
 - [ ] Alle 8 Tabs sichtbar
 - [ ] MOD-04 Kapitalanlagen als read-only Vermögenswerte
 - [ ] Completion Score ~85%
 
 ---
 
 ### Phase 5: FINANZIERUNGSANFRAGE (MOD-07 → Zone 1)
 
 **Route:** `/portal/finanzierung/anfrage`
 
 **Objektwahl aus 3 Quellen:**
 - [A] MOD-04 Portfolio (Kapitalanlage) → read-only
 - [B] Selbstauskunft (Eigennutzung) → editierbar
 - [C] MOD-08 Favoriten (Neuankauf)
 
 **Akzeptanzkriterien:**
 - [ ] Objektwahl aus 3 Quellen möglich
 - [ ] Bei MOD-04-Objekt: Felder read-only
 - [ ] Einreichung ändert Status → `submitted_to_zone1`
 - [ ] Anfrage erscheint in Zone 1 FutureRoom
 
 ---
 
 ### Phase 6: GOVERNANCE (Zone 1 FutureRoom)
 
 **Route:** `/admin/futureroom`
 
 **Workflow:**
 1. Inbox → Neue Anfrage erscheint
 2. Zuweisung → Admin wählt Finanzierungsmanager
 3. Status → `finance_mandates.status = 'assigned'`
 4. Notification → Edge Function benachrichtigt Manager
 
 **Akzeptanzkriterien:**
 - [ ] Anfrage in `/admin/futureroom/inbox` sichtbar
 - [ ] Zuweisung an Manager möglich
 - [ ] Status-Update auf 'assigned'
 
 ---
 
 ### Phase 6b: BEARBEITUNG (MOD-11)
 
 **Route:** `/portal/finanzierungsmanager`
 
 **Workflow:**
 1. Dashboard → Fall erscheint
 2. Fälle → Dossier mit Selbstauskunft (read-only) + Dokumente
 3. Akzeptieren → `future_room_cases` INSERT
 4. Status-Updates → Sync zu MOD-07 und Zone 1
 
 ---
 
 ### Phase 7: VERKAUF (MOD-06 → Zone 1 Sales Desk)
 
 **Route:** `/portal/verkauf`
 
 **WICHTIG: Reihenfolge**
 1. **Partner-Netzwerk ZUERST (Pflicht)**
    - Consent: SALES_MANDATE
    - Consent: PARTNER_RELEASE
    - Consent: SYSTEM_SUCCESS_FEE_2000
    - Provision: 3-15% netto
 2. **Kaufy-Freigabe (Optional, nur nach Schritt 1)**
 
 **Grund:** Ohne Partner gibt es niemanden, der den Kunden betreut.
 
 **Akzeptanzkriterien:**
 - [ ] MOD-04 Objekte in Objektliste sichtbar
 - [ ] Partner-Freigabe vor Kaufy-Freigabe erzwungen
 - [ ] 3 Consents bei Partner-Freigabe abgefragt
 - [ ] Listing erscheint in Zone 1 Sales Desk
 
 ---
 
 ### Phase 8: DISTRIBUTION (Zone 1 Sales Desk → Zone 2 + Zone 3)
 
 **Route:** `/admin/sales-desk`
 
 **Zone 1 als Gatekeeper:**
 - SSOT für alle Verkaufslistings
 - Admin kann Objekte blocken
 - Distribution an:
   - [A] Zone 2 (MOD-09) → `/portal/vertriebspartner/pipeline`
   - [B] Zone 3 (Kaufy) → `/kaufy/immobilien`
 
 **Akzeptanzkriterien:**
 - [ ] Alle MOD-06 Listings in Zone 1 Sales Desk sichtbar
 - [ ] Admin kann Freigabe für MOD-09 und Kaufy steuern
 - [ ] Blocking-Funktion vorhanden
 
 ---
 
 ### Phase 9: LEAD-EINGANG (Zone 3 → Zone 1 → Zone 2)
 
 **Workflow:**
 ```
 Zone 3: /kaufy/immobilien/:id
 └── Interessent → Anfrage → Lead
 
 Zone 1: /admin/lead-pool
 └── Admin → Zuweisung an Partner mit MOD-09
 
 Zone 2: /portal/vertriebspartner/pipeline
 └── Partner bearbeitet Lead
 ```
 
 **Lead-Monetarisierung:**
 - Leads aus Zone 3 werden an Partner "verkauft"
 - Nur Partner mit aktivem MOD-09 können Leads empfangen
 - Pool-Lead-Split: 1/3 Platform : 2/3 Partner
 
 ---
 
 ### Phase 10: INVESTMENT (MOD-08) + ABSCHLUSS
 
 **Route:** `/portal/investments`
 
 **Multi-Source-Suche:**
 - Tab "SoT-Verkauf": Eigene MOD-06 Listings
 - Tab "Kaufy": Zone 3 Marktplatz
 - Tab "Extern": Imports (Phase 2)
 
 **Abschluss-Workflow:**
 1. Reservierung
 2. Notarauftrag → 100€ Systemgebühr
 3. Notartermin → BNL → 1.900€ Systemgebühr
 4. Abschluss → Commission Trigger
 
 ---
 
 ## Golden Path Seed-Daten
 
 **UUID-Präfix:** `00000000-0000-4000-a000-`
 
 | Entity | UUID | Beschreibung |
 |--------|------|--------------|
 | Contact Max | `...000000000101` | Max Mustermann (Eigentümer 50%) |
 | Contact Lisa | `...000000000102` | Lisa Mustermann (Eigentümerin 50%) |
 | Contact Mieter | `...000000000103` | Thomas Bergmann (Mieter) |
 | Contact HV | `...000000000104` | Sandra Hoffmann (Hausverwaltung) |
 | Contact Bank | `...000000000105` | Michael Weber (Bankberater) |
 | Landlord Context | `...000000000110` | Familie Mustermann |
 | Property | `...000000000001` | Leipzig, Leipziger Str. 42 |
 | Unit | `...000000000002` | MAIN Unit, 62m² |
 | Lease | `...000000000120` | Aktiver Mietvertrag |
 | Loan | `...000000000003` | Sparkasse, 80% LTV |
 | Finance Request | `...000000000004` | Draft-Anfrage |
 | Applicant Profile | `...000000000005` | Selbstauskunft ~85% |
 
 ---
 
 ## Verifizierungsprotokoll
 
 | # | Route | Erwartung | ✓ |
 |---|-------|-----------|---|
 | 1 | `/admin/tiles` → "Testdaten" | Golden Path Card sichtbar | |
 | 2 | Klick "Einspielen" | Toast + Counts | |
 | 3 | `/portal/office/kontakte` | 5 Kontakte | |
 | 4 | `/portal/immobilien` | "How It Works" erscheint | |
 | 5 | Klick "Kontexte" | Ehepaar tabellarisch | |
 | 6 | Klick "Portfolio" | 1 Immobilie mit Kennzahlen | |
 | 7 | Klick "Auge" → Dossier | 9 Blöcke A-J | |
 | 8 | `/portal/dms/storage` | 18-Ordner, 12 Dokumente | |
 | 9 | `/portal/finanzierung` | "How It Works" erscheint | |
 | 10 | Klick "Selbstauskunft" | Formular ~85% befüllt | |
 | 11 | MOD-04 in Selbstauskunft | Kapitalanlagen read-only | |
 | 12 | `/portal/verkauf/objekte` | Musterimmobilie sichtbar | |
 | 13 | Exposé + Partner-Freigabe | Listing in Zone 1 | |
 | 14 | Zone 1 → MOD-09 | Objekt im Partnerkatalog | |
 | 15 | Kaufy-Freigabe | Objekt auf Zone 3 | |
 | 16 | Klick "Zurücksetzen" | Alle Daten gelöscht | |
 
 ---
 
 ## Changelog
 
 | Version | Datum | Änderung |
 |---------|-------|----------|
 | 1.0 | 2026-02-05 | Initial frozen version |