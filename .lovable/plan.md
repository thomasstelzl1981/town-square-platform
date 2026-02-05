

# Umfassender Reparaturplan v4: Golden Path + Workflow-Dokumentation + Zone 2 Stabilisierung

## Mein vollständiges Verständnis Ihrer Software

### Architektur-Übersicht (3-Zonen-Modell)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ZONE 1 — ADMIN PORTAL (/admin)                             │
│                                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────────────┐ │
│  │ Tile Catalog        │  │ FutureRoom          │  │ Sales Desk (Verkaufslistings)   │ │
│  │ → Testdaten-Tab     │  │ → Finanz-Inbox      │  │ → SSOT für alle Verkaufsobjekte │ │
│  │ → Golden Path       │  │ → Zuweisung         │  │ → Verteilung an Zone 2 + 3      │ │
│  │    Button (FEHLT!)  │  │ → Manager-Pool      │  │ → Blocking-Möglichkeit          │ │
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

### Die Datendomänen (klar getrennt)

| Domäne | SSOT | Beschreibung |
|--------|------|--------------|
| Kapitalanlage-Immobilien | MOD-04 | Vermietete Objekte, Units, Mietverträge, Darlehen |
| Persönliche Bonität | MOD-07 | Selbstauskunft (Einkommen, Vermögen, Ausgaben) |
| Selbstgenutzte Immobilie | MOD-07 | Eigenheim des Antragstellers (optional) |
| Verkaufslistings | Zone 1 Sales Desk | Alle freigegebenen Verkaufsobjekte |
| Finanzierungsanfragen | Zone 1 FutureRoom | Alle eingereichten Finanzierungen |

---

## Der vollständige Golden Path (10 Phasen)

### Phase 1: STAMMDATEN (Fundament)

```
Zone 1: /admin/tiles → Tab "Testdaten"
│
├── [Golden Path einspielen] Button
│   └── Erzeugt: 5 Kontakte, 1 Property, 12 Dokumente, 1 Selbstauskunft
│
└── Ergebnis sichtbar in:
    ├── MOD-01 Stammdaten: Kundenprofil
    └── MOD-02 Office/Kontakte: 5 Kontakte (Max, Lisa, Mieter, HV, Bankberater)
```

**Akzeptanzkriterien:**
- [ ] Golden Path Button in `/admin/tiles` → Tab "Testdaten" sichtbar
- [ ] Nach Klick: Toast mit Erfolgsmeldung + Counts
- [ ] 5 Kontakte in `/portal/office/kontakte` sichtbar

---

### Phase 2: IMMOBILIEN-SSOT (MOD-04)

```
/portal/immobilien
│
├── [How It Works] ← Landing Page (aktuell übersprungen → REPARATUR)
│
├── Kontexte
│   └── Vermieter-Kontext "Familie Mustermann"
│       ├── Max Mustermann (Eigentümer 50%)
│       └── Lisa Mustermann (Eigentümerin 50%)
│
├── Portfolio
│   └── Musterimmobilie Leipzig
│       ├── Kennzahlen: 62m², Miete 650€, Restschuld 120.000€
│       ├── Einnahmen-/Ausgabenrechnung (Buchhaltungsansicht)
│       └── Dreifach-Grafik (Zins, Tilgung, Wertzuwachs)
│
└── Dossier (/portal/immobilien/:id)
    └── Vollständige Immobilienakte (9 Blöcke A-J)
        ├── A: Identität/Zuordnung
        ├── B: Adresse/Lage
        ├── C: Gebäude/Technik
        ├── D: Recht/Erwerb
        ├── E: Investment/KPIs (berechnet)
        ├── F: Mietverhältnisse
        ├── G: WEG/Nebenkosten
        ├── H: Finanzierung
        └── J: Dokumente (18 Kategorien)
```

**Akzeptanzkriterien:**
- [ ] `/portal/immobilien` zeigt "How It Works" (nicht Portfolio-Redirect)
- [ ] Ehepaar in Kontexte-Tab tabellarisch sichtbar
- [ ] 1 Immobilie im Portfolio mit Kennzahlen
- [ ] Klick auf "Auge" öffnet Dossier mit allen Blöcken

---

### Phase 3: DMS/STORAGE (MOD-03)

```
/portal/dms/storage
│
├── Property-Ordner (18-Ordner-Struktur)
│   ├── 01_Grundbuch
│   ├── 02_Kaufvertrag
│   ├── 03_Exposé
│   ├── ... (weitere 15 Ordner)
│   └── 12 Dokumente verknüpft (document_links)
│
└── Finanzierungs-Ordner (für MOD-07)
    ├── Selbstauskunft
    ├── Einkommensnachweise
    └── Vermögensnachweise
```

**Akzeptanzkriterien:**
- [ ] 18-Ordner-Struktur sichtbar (keine Duplikate)
- [ ] 12 Dokumente korrekt verlinkt
- [ ] Dokumente aus Dossier-Blöcken referenzierbar

---

### Phase 4: BONITÄT (MOD-07 Selbstauskunft)

```
/portal/finanzierung
│
├── [How It Works] ← Landing Page
│
├── Selbstauskunft (8 Tabs)
│   ├── Persönliche Daten (Max Mustermann, ~85% befüllt)
│   ├── Haushalt (2 Erwachsene, 1 Kind)
│   ├── Einkommen (Arbeitgeber, Gehalt, Bonus)
│   ├── Firma (optional, nur bei Unternehmern)
│   ├── Ausgaben (Leasing, Versicherungen)
│   ├── Vermögen (Bank, Wertpapiere, Bauspar)
│   ├── Erklärungen (SCHUFA, Insolvenz)
│   └── Finanzierung
│       ├── Verwendungszweck
│       ├── SELBSTGENUTZTE Immobilie (optional, Eigenheim)
│       └── Eigenkapital, Darlehenswunsch
│
├── Dokumente
│   └── Bonitätsunterlagen aus Storage
│
└── KUMULIERTE MOD-04-DATEN (read-only)
    └── Vermietete Immobilien als Vermögenswerte
        └── Aggregierte Mieteinnahmen, Restschulden, Verkehrswerte
```

**WICHTIG: Datentrennung**
- **Selbstgenutzte Immobilie** → Felder in MOD-07 Selbstauskunft (editierbar)
- **Kapitalanlage-Immobilien** → Aus MOD-04 (read-only in MOD-07)

**Akzeptanzkriterien:**
- [ ] Alle 8 Tabs der Selbstauskunft sichtbar
- [ ] Alle Felder sichtbar (auch wenn leer)
- [ ] MOD-04 Kapitalanlagen als read-only Vermögenswerte
- [ ] Completion Score ~85% nach Seed

---

### Phase 5: FINANZIERUNGSANFRAGE (MOD-07 → Zone 1)

```
/portal/finanzierung/anfrage
│
├── Objekt wählen aus:
│   ├── [A] MOD-04 Portfolio (Kapitalanlage)
│   │   └── Objektfelder werden read-only aus MOD-04 befüllt
│   ├── [B] Selbstauskunft (Eigennutzung)
│   │   └── Objektfelder editierbar
│   └── [C] MOD-08 Favoriten (Neuankauf, Zukunft)
│       └── Objektfelder aus Listing befüllt
│
├── Einreichung
│   └── useActionHandoff('FIN_SUBMIT')
│       └── Status: draft → submitted_to_zone1
│
└── Übergabe an Zone 1 FutureRoom
    └── finance_requests.status = 'submitted_to_zone1'
```

**Akzeptanzkriterien:**
- [ ] Objektwahl aus 3 Quellen möglich
- [ ] Bei MOD-04-Objekt: Felder read-only
- [ ] Einreichung ändert Status korrekt
- [ ] Anfrage erscheint in Zone 1 FutureRoom

---

### Phase 6: GOVERNANCE (Zone 1 FutureRoom)

```
/admin/futureroom
│
├── Inbox
│   └── Neue Finanzierungsanfrage erscheint
│       └── Status: submitted_to_zone1
│
├── Zuweisung
│   └── Admin wählt Finanzierungsmanager
│       └── finance_mandates.status → 'assigned'
│
├── Finanzierungsmanager-Pool
│   └── Übersicht aller Manager mit Kapazität
│
└── Notification
    └── Edge Function: sot-finance-manager-notify
        └── Manager erhält Benachrichtigung
```

**Akzeptanzkriterien:**
- [ ] Anfrage in `/admin/futureroom/inbox` sichtbar
- [ ] Zuweisung an Manager möglich
- [ ] Status-Update auf 'assigned'

---

### Phase 6b: BEARBEITUNG (MOD-11 Finanzierungsmanager)

```
/portal/finanzierungsmanager
│
├── Dashboard
│   └── Neuer Fall erscheint
│
├── Fälle
│   └── Vollständiges Dossier
│       ├── Selbstauskunft (read-only)
│       ├── Dokumente
│       └── Objektdaten (aus MOD-04 oder custom)
│
├── Manager akzeptiert
│   └── useAcceptMandate()
│       └── future_room_cases INSERT
│
└── Status-Updates
    └── Spiegeln zurück zu MOD-07 und Zone 1
```

**Akzeptanzkriterien:**
- [ ] Manager sieht zugewiesenen Fall
- [ ] Vollständige Unterlagen einsehbar
- [ ] Status-Änderungen synchronisieren

---

### Phase 7: VERKAUF (MOD-06 → Zone 1 Sales Desk)

```
/portal/verkauf
│
├── [How It Works] ← Landing Page
│
├── Objekte
│   └── Musterimmobilie aus MOD-04 sichtbar
│
├── Exposé erstellen (/portal/verkauf/expose/:unitId)
│   └── Listing anlegen mit Verkaufsdaten
│
├── SCHRITT 1: Partner-Freigabe (PFLICHT!)
│   ├── Consent: SALES_MANDATE
│   ├── Consent: PARTNER_RELEASE
│   ├── Consent: SYSTEM_SUCCESS_FEE_2000
│   └── Provision festlegen (3-15% netto)
│
│   └── → Listing geht an Zone 1 Sales Desk
│
└── SCHRITT 2: Kaufy-Freigabe (OPTIONAL, nur nach Schritt 1)
    └── Toggle aktivierbar erst nach Partner-Freigabe
        └── listing_publications (channel='kaufy', status='published')
```

**WICHTIG: Reihenfolge**
1. Partner-Netzwerk ist IMMER ZUERST (Pflicht)
2. Kaufy/Marktplatz ist OPTIONAL und nur nach Partner-Freigabe möglich
3. Grund: Ohne Partner gibt es niemanden, der den Kunden betreut

**Akzeptanzkriterien:**
- [ ] MOD-04 Objekte in Objektliste sichtbar
- [ ] Partner-Freigabe vor Kaufy-Freigabe erzwungen
- [ ] 3 Consents bei Partner-Freigabe abgefragt
- [ ] Listing erscheint in Zone 1 Sales Desk

---

### Phase 8: DISTRIBUTION (Zone 1 Sales Desk → Zone 2 + Zone 3)

```
/admin/sales-desk (oder entsprechender Menüpunkt in Zone 1)
│
├── Verkaufslistings (SSOT)
│   └── Alle in MOD-06 freigegebenen Objekte
│
├── Admin-Kontrolle
│   ├── Objekt freigeben für:
│   │   ├── [A] Zone 2 Vertriebspartner-Modul (MOD-09)
│   │   └── [B] Zone 3 Kaufy Marktplatz
│   └── Objekt BLOCKEN (bei Bedarf)
│
├── [A] Distribution → Zone 2 (MOD-09)
│   └── /portal/vertriebspartner/pipeline
│       └── Objektkatalog zeigt freigegebene Listings
│
└── [B] Distribution → Zone 3 (Kaufy)
    └── /kaufy/immobilien
        └── Öffentlich sichtbar (nur wenn Kaufy-Freigabe aktiv)
```

**WICHTIG: Zone 1 als Gatekeeper**
- Zone 1 Sales Desk ist SSOT für alle Verkaufslistings
- Admin kann Objekte blocken bevor sie in Zone 2/3 erscheinen
- Vertriebspartner erhalten Objekte aus Zone 1, nicht direkt aus MOD-06

**Akzeptanzkriterien:**
- [ ] Alle MOD-06 Listings in Zone 1 Sales Desk sichtbar
- [ ] Admin kann Freigabe für MOD-09 und Kaufy steuern
- [ ] Blocking-Funktion vorhanden
- [ ] Freigegebene Objekte erscheinen in MOD-09 und/oder Kaufy

---

### Phase 9: LEAD-EINGANG (Zone 3 → Zone 1 → Zone 2)

```
Zone 3: /kaufy/immobilien/:id
│
├── Interessent findet Musterimmobilie
│
├── Aktion: Anfrage/Reservierung
│   └── POST /api/public/leads
│       └── inquiry erstellt
│
└── Lead → Zone 1 Lead Pool

Zone 1: /admin/lead-pool (oder Acquiary)
│
├── Neuer Lead erscheint
│   └── Quelle: kaufy, Objekt: Musterimmobilie
│
├── Admin-Verteilung
│   └── Lead zuweisen an Vertriebspartner
│       └── Nur Partner MIT aktivem MOD-09
│
└── Lead → Zone 2 (MOD-09)

Zone 2: /portal/vertriebspartner
│
├── Pipeline
│   └── Zugewiesener Lead erscheint
│
└── Partner bearbeitet Lead
    └── Beratung, Reservierung, Abschluss
```

**WICHTIG: Lead-Monetarisierung**
- Leads aus Zone 3 werden an Partner "verkauft"
- Nur Partner mit aktivem MOD-09 können Leads empfangen
- Pool-Lead-Split: 1/3 Platform (SoaT) : 2/3 Partner

**Akzeptanzkriterien:**
- [ ] Kaufy-Anfragen erscheinen in Zone 1 Lead Pool
- [ ] Admin kann Leads an Partner zuweisen
- [ ] Nur Partner mit MOD-09 sind auswählbar
- [ ] Zugewiesene Leads erscheinen in MOD-09 Pipeline

---

### Phase 10: INVESTMENT (MOD-08) + ABSCHLUSS

```
/portal/investments
│
├── Suche (Multi-Source)
│   ├── Tab "SoT-Verkauf": Eigene MOD-06 Listings
│   ├── Tab "Kaufy": Zone 3 Marktplatz
│   └── Tab "Extern": Imports (Phase 2)
│
├── Favoriten
│   └── Sync mit Kaufy-Website (LocalStorage → Login → Import)
│
├── Simulation
│   └── Portfolio-Impact-Analyse
│
└── Finanzierung anfragen
    └── → MOD-07 (mit Objekt aus Favoriten)

/portal/verkauf/vorgaenge
│
├── Reservierung
│   └── Interessent reserviert
│
├── Notarauftrag
│   └── Trigger: 100€ Systemgebühr
│
├── Notartermin
│   └── BNL-Eingang
│       └── Trigger: 1.900€ Systemgebühr
│
└── Abschluss
    ├── MOD-06: Transaction erstellt
    ├── MOD-09: Commission Trigger bei 'won'
    └── MOD-04: Property-Status aktualisieren (optional: 'sold')
```

**Akzeptanzkriterien:**
- [ ] Multi-Source-Suche in MOD-08 funktioniert
- [ ] Favoriten-Sync mit Zone 3 möglich
- [ ] Vorgänge in MOD-06 verfolgbar
- [ ] Provision/Systemgebühr bei Abschluss getriggert

---

## Identifizierte Probleme (mit Beweisen)

### Problem 1: Golden Path Button fehlt im TestDataManager (P0-CRITICAL)

**Beleg:** `src/components/admin/TestDataManager.tsx` verwendet `useGoldenPathSeeds` NICHT.
Der Hook existiert vollständig funktionsfähig in `src/hooks/useGoldenPathSeeds.ts`.

### Problem 2: Legacy-Daten mit falschen UUIDs (P0)

**Beleg aus DB-Abfragen:**
- Vorhandene Kontakte: `d0000000-0000-4000-d000-...` (Legacy)
- Erwartete Kontakte: `00000000-0000-4000-a000-...` (Golden Path)

### Problem 3: MOD-04 überspringt "How It Works" (P1)

**Beleg:** `src/pages/portal/ImmobilienPage.tsx:89`:
```tsx
<Route index element={<Navigate to="portfolio" replace />} />
```

### Problem 4: Zone 1 Sales Desk Menüpunkt zu verifizieren

Die Distribution von MOD-06 → Zone 1 → Zone 2/3 muss im Routing und in der Navigation sichtbar sein.

---

## Detaillierter Reparaturplan

### Änderung 1: TestDataManager erweitern (Zone 1)

**Datei:** `src/components/admin/TestDataManager.tsx`

**Änderungen:**
1. Import `useGoldenPathSeeds` Hook
2. Golden Path UI-Card mit Status-Grid (Kontakte X/5, Dokumente X/12, etc.)
3. Button "Einspielen / Aktualisieren" → ruft `runSeeds()` auf
4. Button "Zurücksetzen" → löscht nur Golden-Path-UUIDs

**Geschätzte Zeilen:** ~100 neue Zeilen

---

### Änderung 2: Legacy-Daten bereinigen (Einmalige DB-Operation)

**SQL-Migration:**
```sql
-- Legacy-Kontakte mit d000-UUIDs löschen
DELETE FROM contacts WHERE id::text LIKE 'd0000000-0000-4000-d000-%';

-- Doppelte Storage-Root-Nodes bereinigen
WITH duplicates AS (
  SELECT id, 
    ROW_NUMBER() OVER (PARTITION BY tenant_id, name, parent_id ORDER BY created_at) AS rn
  FROM storage_nodes
  WHERE parent_id IS NULL
)
DELETE FROM storage_nodes WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
```

---

### Änderung 3: MOD-04 "How It Works" aktivieren

**Datei:** `src/pages/portal/ImmobilienPage.tsx`

**Änderung Zeile 89:**
```tsx
// VORHER:
<Route index element={<Navigate to="portfolio" replace />} />

// NACHHER:
<Route index element={<ModuleHowItWorks content={moduleContents['MOD-04']} />} />
```

---

### Änderung 4: Selbstauskunft-Objektfelder kontextabhängig (P2)

**Datei:** `src/components/finanzierung/SelbstauskunftForm.tsx`

**Logik:**
- Wenn `finance_request.property_id` vorhanden → Objektfelder read-only aus MOD-04
- Wenn null → Objektfelder editierbar (Eigennutzung/custom)
- Zusätzlich: Aggregierte MOD-04 Kapitalanlagen als Vermögenswerte

---

### Änderung 5: Golden Path Dokumentation im Repo

**Neue Datei:** `docs/workflows/GOLDEN_PATH_E2E.md`

**Inhalt:**
- Vollständiger 10-Phasen-Workflow (wie oben)
- Akzeptanzkriterien pro Phase
- Testprotokoll-Vorlage
- Diagramme für Datenflüsse

---

## Dateiänderungen im Überblick

| # | Datei | Typ | Beschreibung | Zeilen | Risiko |
|---|-------|-----|--------------|--------|--------|
| 1 | `src/components/admin/TestDataManager.tsx` | Erweitern | Golden Path UI + Reset | ~100 | Niedrig |
| 2 | `src/pages/portal/ImmobilienPage.tsx` | Ändern | Index → ModuleHowItWorks | 2 | Niedrig |
| 3 | DB-Migration | SQL | Legacy-Bereinigung | ~10 | Mittel |
| 4 | `src/components/finanzierung/SelbstauskunftForm.tsx` | Erweitern | Kontextabhängige Objektfelder | ~50 | Mittel |
| 5 | `docs/workflows/GOLDEN_PATH_E2E.md` | Neu | Workflow-Dokumentation | ~300 | Niedrig |

---

## Stabilitätsbewertung

### Warum diese Änderungen sicher sind

1. **Additive Änderungen:** TestDataManager erhält nur neue UI-Elemente
2. **Idempotente Seeds:** `ON CONFLICT DO UPDATE` verhindert Duplikate
3. **Bewährtes Pattern:** MOD-04 Routing folgt demselben Muster wie MOD-07
4. **Isolierte UUIDs:** Golden-Path-Daten haben festes Präfix `00000000-0000-4000-a000-`

### Kann das mit Lovable stabil werden?

**Ja, für den aktuellen Scope (Musterportal) ist Lovable + Repo ausreichend.**

Die Architektur ist bereits "workflow-ready" (`useActionHandoff`, `case_events`). Camunda ist für Phase 1.5 geplant (echte Produktions-Workflows mit SLAs und Eskalationen).

---

## Verifizierungsprotokoll (End-to-End-Test)

| Phase | Route | Erwartung |
|-------|-------|-----------|
| 1 | `/admin/tiles` → Tab "Testdaten" | Golden Path Card sichtbar |
| 2 | Klick "Einspielen" | Toast + Counts: 5 Kontakte, 12 Dokumente |
| 3 | `/portal/office/kontakte` | 5 Kontakte sichtbar |
| 4 | `/portal/immobilien` | "How It Works" erscheint |
| 5 | Klick "Kontexte" | Ehepaar Mustermann tabellarisch |
| 6 | Klick "Portfolio" | 1 Immobilie mit Kennzahlen |
| 7 | Klick "Auge" → Dossier | 9 Blöcke A-J sichtbar |
| 8 | `/portal/dms/storage` | 18-Ordner, 12 Dokumente |
| 9 | `/portal/finanzierung` | "How It Works" erscheint |
| 10 | Klick "Selbstauskunft" | Formular ~85% befüllt |
| 11 | MOD-04 in Selbstauskunft | Kapitalanlagen read-only sichtbar |
| 12 | `/portal/verkauf/objekte` | Musterimmobilie sichtbar |
| 13 | Exposé + Partner-Freigabe | Listing in Zone 1 Sales Desk |
| 14 | Zone 1 → MOD-09 | Objekt im Partnerkatalog |
| 15 | Kaufy-Freigabe | Objekt auf Zone 3 sichtbar |
| 16 | Klick "Zurücksetzen" | Alle Golden-Path-Daten gelöscht |

---

## Zusammenfassung

### Was wird repariert:
1. **Golden Path Button** → Testdaten per Klick einspielen/löschen
2. **MOD-04 How It Works** → Landing Page statt Redirect
3. **Legacy-Daten** → Bereinigung falscher UUIDs
4. **Selbstauskunft** → Kontextabhängige Objektfelder
5. **Dokumentation** → Golden Path E2E im Repo

### Workflow-Korrekturen bestätigt:
- **Phase 7:** Partner-Netzwerk ZUERST, Kaufy OPTIONAL
- **Phase 8:** Zone 1 Sales Desk als SSOT mit Blocking-Möglichkeit
- **Phase 9:** Leads von Zone 3 → Zone 1 Pool → Partner mit MOD-09

