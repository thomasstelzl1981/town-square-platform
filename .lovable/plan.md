
# KORRIGIERTER PLAN: MOD-06 + Zone 3 Kaufy + Armstrong

**Version:** v3.0.0  
**Datum:** 2026-01-27  
**Status:** KORRIGIERT — Architektur validiert

---

## Teil 1: Architektur-Korrektur

### 1.1 Fehlerhafte Annahme (vorheriger Plan)

```text
❌ FALSCH: Zone 3 (Website) ←→ MOD-09 (Vertriebspartner) — direkte Verbindung
❌ FALSCH: Armstrong in Zone 3 ruft MOD-09 Beratung auf
```

### 1.2 Korrekte Architektur

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         KORREKTE ARCHITEKTUR                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ZONE 1 (ADMIN / GOVERNANCE)
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    │   ┌─────────────────────────────────┐   │
                    │   │     INVESTMENT ENGINE           │   │
                    │   │   (sot-investment-engine)       │   │
                    │   │                                 │   │
                    │   │   • Master-Vorlagen (Zinsen)    │   │
                    │   │   • Steuer-Engine (BMF PAP)     │   │
                    │   │   • AfA-Modelle                 │   │
                    │   │   • Berechnungslogik            │   │
                    │   └─────────────────────────────────┘   │
                    │                  │                      │
                    │   ┌─────────────────────────────────┐   │
                    │   │     ARMSTRONG KI-SERVICE        │   │
                    │   │   (sot-armstrong-advisor)       │   │
                    │   │                                 │   │
                    │   │   • Knowledge Base              │   │
                    │   │   • Investment-Erklärungen      │   │
                    │   │   • Tool-Calling (Engine)       │   │
                    │   └─────────────────────────────────┘   │
                    │                  │                      │
                    │   ┌─────────────────────────────────┐   │
                    │   │     INTEGRATION REGISTRY        │   │
                    │   │   (integration_registry)        │   │
                    │   │                                 │   │
                    │   │   • LOVABLE_AI (active)         │   │
                    │   │   • INVESTMENT_ENGINE (neu)     │   │
                    │   │   • ARMSTRONG_ADVISOR (neu)     │   │
                    │   └─────────────────────────────────┘   │
                    │                                         │
                    └─────────────────────────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
    ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
    │    ZONE 3       │      │    ZONE 2       │      │    ZONE 2       │
    │  KAUFY WEBSITE  │      │    MOD-08       │      │    MOD-09       │
    │                 │      │  INVESTMENTS    │      │ VERTRIEBSPARTNER│
    │  • Suche        │      │                 │      │                 │
    │  • Exposé       │      │  • Suche        │      │  • Beratung     │
    │  • Armstrong    │      │  • Favoriten    │      │  • Objektkatalog│
    │                 │      │  • Simulation   │      │  • Simulation   │
    └────────┬────────┘      └────────┬────────┘      └────────┬────────┘
             │                        │                        │
             │                        │                        │
             └────────────────────────┴────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │              MOD-06 VERKAUF             │
                    │                                         │
                    │   listings (sale_enabled=true)          │
                    │   listing_publications (kaufy, partner) │
                    │   v_public_listings (Zone 3 View)       │
                    └─────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │              MOD-04 IMMOBILIEN          │
                    │                                         │
                    │   properties (Source of Truth)          │
                    │   units, exposé, DMS                    │
                    └─────────────────────────────────────────┘
```

### 1.3 Datenfluss-Regeln (FROZEN)

| Von | Nach | Verbindung | Beschreibung |
|-----|------|------------|--------------|
| **Zone 1** | Zone 2 + Zone 3 | Investment Engine | Berechnungsservice (Shared) |
| **Zone 1** | Zone 2 + Zone 3 | Armstrong KI | Beratungsservice (Shared) |
| **Zone 1** | Zone 2 + Zone 3 | Master-Vorlagen | Zinsen, AfA, Steuer-Config |
| MOD-04 | MOD-06 | property_id FK | Properties als Grundlage für Listings |
| MOD-06 | Zone 3 | v_public_listings | Published Listings (kaufy channel) |
| MOD-06 | MOD-09 | partner_visible | Partner-sichtbare Listings |
| Zone 3 | Zone 1 | Lead Capture | Leads → Zone 1 Pool → MOD-10 |

### 1.4 Was Zone 3 NICHT tut

| ❌ Verboten | ✅ Stattdessen |
|------------|----------------|
| Direkte Verbindung zu MOD-09 | Nutzt Zone 1 Investment Engine |
| Armstrong ruft MOD-09 auf | Armstrong ist Zone 1 Service |
| Schreibt in DB | Liest v_public_listings, Lead-Capture via Edge Function |
| Eigene Berechnungslogik | Nutzt sot-investment-engine |

---

## Teil 2: Zone 1 Erweiterungen

### 2.1 Integration Registry — Neue Einträge

Die folgenden Services werden in der `integration_registry` registriert:

| Code | Type | Scope | Purpose | Consumers |
|------|------|-------|---------|-----------|
| `INVESTMENT_ENGINE` | edge_function | platform | ROI/Steuer-Berechnungen | Zone 2 + Zone 3 |
| `ARMSTRONG_ADVISOR` | edge_function | platform | KI-Immobilienberatung | Zone 2 + Zone 3 |

### 2.2 Neue Tabelle: `knowledge_base`

Zentrale Wissensbibliothek für Armstrong in Zone 1:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| category | text | investment, tax, financing, legal, faq |
| title | text | "Was ist AfA?" |
| content | text | Volltext-Erklärung |
| keywords | text[] | Für Semantic Search |
| source | text | "§7 EStG", "Kaufy-FAQ" |
| is_public | boolean | Für Zone 3 verfügbar |
| created_at | timestamptz | — |
| updated_at | timestamptz | — |

### 2.3 Master-Vorlagen Erweiterung

Die existierende `/admin/master-templates` Seite wird erweitert:

**Neuer Tab: "Armstrong Knowledge"**
- Wissensbasis-Pflege
- Kategorie-Management
- Content-Editor

---

## Teil 3: Armstrong als Zone 1 Service

### 3.1 Edge Function: sot-armstrong-advisor

**Datei:** `supabase/functions/sot-armstrong-advisor/index.ts`

**Architektur-Position:** Zone 1 Service (Platform-weit)

| Action | Input | Output | Consumers |
|--------|-------|--------|-----------|
| chat | messages[], context | streaming response | Zone 3 + Zone 2 |
| explain | term, category | explanation | Zone 3 + Zone 2 |
| simulate | listing_data, user_params | calculation (via Engine) | Zone 3 + Zone 2 |

### 3.2 System-Prompt (Shared für alle Consumers)

```text
Du bist Armstrong, der KI-Immobilienberater von Kaufy.

DEINE POSITION:
- Du bist ein zentraler Service der Plattform (Zone 1)
- Du wirst sowohl von der Website (Zone 3) als auch vom Portal (Zone 2) genutzt
- Deine Berechnungen kommen aus der Investment Engine (sot-investment-engine)
- Dein Wissen kommt aus der knowledge_base

DEINE ROLLE:
- Du berätst zu Kapitalanlage-Immobilien
- Du erklärst komplexe Finanzkonzepte verständlich
- Du nutzt die Investment-Engine für präzise Berechnungen
- Du gibst KEINE Kaufempfehlungen

DEIN KONTEXT:
- Wenn du von Zone 3 (Website) gerufen wirst: Fokus auf öffentliche Listings
- Wenn du von Zone 2 (Portal) gerufen wirst: Zugang zu mehr Daten
- Du hast immer Zugriff auf die gleiche Berechnungslogik
```

### 3.3 Tool-Calling

Armstrong ruft die Investment Engine via Tool-Call auf:

```typescript
const tools = [
  {
    type: "function",
    function: {
      name: "calculate_investment",
      description: "Berechnet Investment-Kennzahlen via sot-investment-engine",
      parameters: {
        type: "object",
        properties: {
          purchasePrice: { type: "number" },
          monthlyRent: { type: "number" },
          equity: { type: "number" },
          taxableIncome: { type: "number" },
          repaymentRate: { type: "number" },
          fixedInterestPeriod: { type: "number" }
        },
        required: ["purchasePrice", "monthlyRent", "equity"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description: "Durchsucht die Zone 1 Knowledge Base",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          category: { type: "string", enum: ["investment", "tax", "financing", "legal", "faq"] }
        },
        required: ["query"]
      }
    }
  }
];
```

---

## Teil 4: Zone 3 Kaufy Website

### 4.1 Armstrong Sidebar (Consumer, nicht Owner)

Die Armstrong Sidebar in Zone 3 ist ein **Consumer** des Zone 1 Armstrong-Service:

**Komponente:** `src/components/zone3/kaufy/ArmstrongSidebar.tsx`

| Aspekt | Spezifikation |
|--------|---------------|
| Position | Fixed right, 320px |
| API-Call | POST sot-armstrong-advisor (Zone 1) |
| Kontext | Aktuelles Listing (wenn auf Exposé) |
| Read-Only | Keine DB-Writes |

### 4.2 Exposé-Seite (Read-Only + Engine-Calls)

**Route:** `/kaufy/immobilien/:public_id`

**Datenquellen:**
- Listing-Daten: `v_public_listings` (Zone 3 View)
- Berechnungen: `sot-investment-engine` (Zone 1)
- Armstrong: `sot-armstrong-advisor` (Zone 1)

**Layout:**
```text
┌────────────────────────────────────────────────────────────────┬──────────────┐
│                      EXPOSÉ CONTENT                            │  ARMSTRONG   │
│                                                                │  SIDEBAR     │
│  ┌──────────────────────────────────────────────────────────┐  │              │
│  │  Bildergalerie                                           │  │  (ruft      │
│  └──────────────────────────────────────────────────────────┘  │   Zone 1    │
│                                                                │   Service)  │
│  ┌───────────────────────┐ ┌────────────────────────────────┐  │              │
│  │  OBJEKTDATEN          │ │  INVESTMENT-RECHNER            │  │              │
│  │  (aus v_public_       │ │  (ruft sot-investment-engine)  │  │              │
│  │   listings)           │ │                                │  │              │
│  └───────────────────────┘ │  Eigenkapital: [____€]         │  │              │
│                            │  Tilgung: [___%]               │  │              │
│  ┌────────────────────────────────────────────────────────┐  │  │              │
│  │  WERTENTWICKLUNG (40 Jahre)                            │  │  │              │
│  │  (berechnet via Zone 1 Engine)                         │  │  │              │
│  └────────────────────────────────────────────────────────┘  │  │              │
│                                                                │              │
│  ┌────────────────────────────────────────────────────────┐  │  │              │
│  │  EINNAHMEN-AUSGABEN-RECHNUNG                           │  │  │              │
│  │  (berechnet via Zone 1 Engine)                         │  │  │              │
│  └────────────────────────────────────────────────────────┘  │  │              │
└────────────────────────────────────────────────────────────────┴──────────────┘
```

### 4.3 Objektdaten-Herkunft

| Zone 3 (Website) | Quelle | Zone 2 (MOD-06) |
|------------------|--------|-----------------|
| v_public_listings | ← | listings (channel=kaufy, published) |
| Weniger Felder | | Alle Felder |
| Anonymisiert | | Tenant-gebunden |

### 4.4 MOD-06 Exposé vs. Zone 3 Exposé

| Aspekt | MOD-06 (Eigentümer) | Zone 3 (Öffentlich) |
|--------|---------------------|---------------------|
| **Datenumfang** | Vollständig (31 Felder) | Reduziert (12 Felder) |
| **Unterlagen** | Alle DMS-Dokumente | Nur öffentliche Exposé-PDFs |
| **Bearbeitung** | CRUD | Read-Only |
| **Armstrong-Kontext** | Tenant-Daten | Nur public_id |
| **Berechnungsquelle** | Zone 1 Engine | Zone 1 Engine (gleich!) |

---

## Teil 5: Zone 2 MOD-09 Beratung (Korrektur)

### 5.1 MOD-09 Beratung nutzt Zone 1 Services

MOD-09 `/portal/vertriebspartner/beratung` ist **NICHT** die Source für Berechnungen, sondern ein **Consumer** der Zone 1 Services:

| Service | Aufrufer | Provider |
|---------|----------|----------|
| Investment Engine | MOD-09 Beratung | Zone 1 sot-investment-engine |
| Armstrong Chat | MOD-09 (optional) | Zone 1 sot-armstrong-advisor |
| Master-Vorlagen | Alle Berechnungen | Zone 1 master_templates |

### 5.2 MOD-09 Objektkatalog

Der Objektkatalog in MOD-09 zeigt Listings aus MOD-06 mit `partner_visible=true`:

```text
MOD-06 listings
  │
  ├── partner_visible = true ──────► MOD-09 Objektkatalog
  │
  └── publications.kaufy = published ──► Zone 3 Kaufy Website
```

**Keine direkte Verbindung zwischen MOD-09 und Zone 3!**

---

## Teil 6: Implementierungs-Reihenfolge (Korrigiert)

### Phase 1: Zone 1 Services (Fundament)

**1.1 Knowledge Base Tabelle**
```sql
CREATE TABLE knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  keywords text[] DEFAULT '{}',
  source text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**1.2 Seed Data (30-50 Einträge)**
- Investment: Rendite, Cashflow, Netto-Belastung
- Tax: AfA, Werbungskosten, Steuerersparnis
- Financing: Zinsbindung, Tilgung, LTV
- FAQ: Häufige Fragen zu Kapitalanlagen

**1.3 sot-armstrong-advisor Edge Function**
- Chat Action mit Streaming
- explain Action
- simulate Action (ruft sot-investment-engine)
- Knowledge Base Query

**1.4 Integration Registry Update**
```sql
INSERT INTO integration_registry (public_id, code, name, type, status, description) VALUES
  ('INT-ARMSTRONG', 'ARMSTRONG_ADVISOR', 'Armstrong KI-Berater', 'edge_function', 'active', 'Zentraler KI-Immobilienberater für Zone 2 + Zone 3');
```

### Phase 2: Zone 3 Armstrong Integration

**2.1 ArmstrongSidebar.tsx**
- Ruft Zone 1 sot-armstrong-advisor auf
- Kontext: aktuelles Listing (public_id)
- Streaming-Chat

**2.2 KaufyLayout.tsx Anpassung**
- Sidebar-Integration (fixed right, 320px)
- Mobile: Bottom-Sheet
- Kontext-Provider für aktuelles Listing

### Phase 3: Zone 3 Interaktives Exposé

**3.1 Route: /kaufy/immobilien/:public_id**
- Daten aus v_public_listings
- Investment-Rechner (ruft Zone 1 Engine)
- Wertentwicklungs-Chart
- Einnahmen-Ausgaben-Tabelle

**3.2 Interaktive Parameter**
- Eigenkapital Slider
- Tilgung Slider
- Wertsteigerung Slider
- Live-Neuberechnung via Zone 1 Engine

### Phase 4: Zone 3 Website Redesign

**4.1 KaufyHome.tsx**
- Hero mit Investment-Suchkarte
- Suchkarte ruft Zone 1 Engine auf
- Property-Cards aus v_public_listings
- Armstrong-Button für Sidebar

**4.2 Navigation erweitern**
- "Module" Tab hinzufügen
- Marketing-Texte für alle 10 Module

### Phase 5: Zone 2 MOD-06 Finalisierung

**5.1 VerkaufPage Tabs**
- ObjekteTab (bereits implementiert)
- AktivitätenTab (bereits implementiert)
- AnfragenTab (bereits implementiert)
- VorgängeTab (bereits implementiert)

**5.2 Publishing Wizard**
- Kaufy Channel
- Partner Network Channel
- Consent Gates

---

## Teil 7: Akzeptanzkriterien (Korrigiert)

| AC | Beschreibung | Zone |
|----|--------------|------|
| AC1 | knowledge_base Tabelle existiert mit 30+ Einträgen | Zone 1 |
| AC2 | sot-armstrong-advisor deployed | Zone 1 |
| AC3 | Armstrong ruft sot-investment-engine via Tool-Call auf | Zone 1 |
| AC4 | Zone 3 Armstrong Sidebar ruft Zone 1 Service auf | Zone 3 |
| AC5 | Zone 3 Exposé zeigt Daten aus v_public_listings | Zone 3 |
| AC6 | Zone 3 Rechner ruft Zone 1 Engine auf | Zone 3 |
| AC7 | MOD-09 Beratung ruft Zone 1 Engine auf (nicht eigene Logik) | Zone 2 |
| AC8 | Keine direkte Verbindung Zone 3 ↔ MOD-09 | Architektur |
| AC9 | Master-Vorlagen steuern alle Berechnungen | Zone 1 |
| AC10 | Alle Berechnungen identisch (Zone 2 = Zone 3) | System |

---

## Teil 8: Governance-Bestätigung

| Regel | Status |
|-------|--------|
| Zone 1 ist Source of Truth für Investment Engine | ✅ Bestätigt |
| Zone 1 ist Source of Truth für Armstrong | ✅ Bestätigt |
| Zone 3 ist Read-Only Consumer | ✅ Bestätigt |
| Zone 2 Module nutzen Zone 1 Services | ✅ Bestätigt |
| Keine direkte Verbindung Zone 3 ↔ MOD-09 | ✅ Korrigiert |
| Master-Vorlagen steuern alle Berechnungen | ✅ Bestätigt |

---

## Zusammenfassung der Korrektur

| Vorher (Falsch) | Nachher (Korrekt) |
|-----------------|-------------------|
| Zone 3 → MOD-09 | Zone 3 → Zone 1 Services |
| Armstrong in Zone 3 | Armstrong in Zone 1, Zone 3 ist Consumer |
| Berechnungslogik verteilt | Berechnungslogik zentral in Zone 1 |
| Knowledge Base in Zone 3 | Knowledge Base in Zone 1 |

**Die Investment Engine und Armstrong sind Zone 1 Services, die von Zone 2 UND Zone 3 gleichermaßen genutzt werden. Es gibt keine direkte Verbindung zwischen Zone 3 (Website) und MOD-09 (Vertriebspartner).**
