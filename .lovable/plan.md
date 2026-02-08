

# Verkaufsauftrag-Modul: Vollständiger Refactoring-Plan

## Executive Summary

Das "Features"-Tab in MOD-04 wird vollständig umgebaut und in **"Verkaufsauftrag"** umbenannt. Es wird zur zentralen Stelle für die Aktivierung der Immobilienvermarktung mit integriertem Agreement-Flow. Der bisherige Agreement-Dialog in MOD-06 (`SalesMandateDialog`) wird entfernt, um Doppelschleifen zu vermeiden. Zusätzlich wird die ImmobilienScout24-API-Integration vorbereitet.

---

## Teil 1: Aktuelle Situation (Ist-Zustand)

### Problemanalyse

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AKTUELLER FLOW (GEBROCHEN)                        │
└─────────────────────────────────────────────────────────────────────────────┘

MOD-04 FeaturesTab               MOD-06 ExposeDetail              Zone 1
┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
│ Toggle "Kaufy"   │──────X────▶│ Objekt sichtbar  │──────────▶│ Sales Desk       │
│ (ohne Wirkung)   │            │ ohne Aktivierung │            │                  │
│                  │            │                  │            │                  │
│ Toggle "MSV"     │──────X────▶│ SalesMandateDialog│           │ Kaufy-Toggle     │
│ (ohne Wirkung)   │            │ (DOPPELTE        │            │ Partner-Toggle   │
│                  │            │  Aktivierung!)   │            │                  │
└──────────────────┘            └──────────────────┘            └──────────────────┘
       ▲                                ▲                              ▲
       │                                │                              │
       └── Toggles schreiben in         └── Hat eigenen                └── Kontrolliert
           property_features                Agreement-Dialog               Distribution
           ABER: MOD-06 filtert             ABER: Redundant!
           NICHT danach!
```

### Identifizierte Probleme

| Problem | Ort | Auswirkung |
|---------|-----|------------|
| Toggles ohne Wirkung | `FeaturesTab.tsx` | Objekte erscheinen in MOD-06 unabhängig vom Toggle-Status |
| Doppelte Aktivierung | MOD-06 `ExposeDetail.tsx` | `SalesMandateDialog` fragt nochmals Agreement ab |
| Falsches Naming | `FeaturesTab.tsx` | "MSV (Miety)", "Kaufy" statt klare deutsche Bezeichnungen |
| Keine Agreement-Integration | `FeaturesTab.tsx` | Toggles aktivieren ohne Vertragsbestätigung |
| Zone 1 Distribution nicht verbunden | Gesamtsystem | User kann Kaufy in Zone 2 aktivieren, Zone 1 sollte aber Gatekeeper sein |

---

## Teil 2: Ziel-Architektur (Soll-Zustand)

### Neuer Governance-Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEUER FLOW (ZIEL)                                  │
└─────────────────────────────────────────────────────────────────────────────┘

MOD-04 "Verkaufsauftrag"         MOD-06 "Exposé"                Zone 1 Sales Desk
┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
│                  │            │                  │            │                  │
│ 1. VERMARKTUNG   │            │ Nur sichtbar     │            │ Neue Listings    │
│    AKTIVIEREN    │──────────▶│ wenn Auftrag     │──────────▶│ erscheinen       │
│                  │            │ erteilt          │            │                  │
│ ┌──────────────┐ │            │                  │            │ Admin kann:      │
│ │ Vereinbarung │ │            │ Exposé           │            │ • Blockieren     │
│ │ + Provision  │ │            │ bearbeiten       │            │ • Partner ✓/✗    │
│ │ + Systemgeb. │ │            │                  │            │ • Kaufy ✓/✗      │
│ │ [Bestätigen] │ │            │ KEIN Dialog      │            │ • Scout24 ✓/✗    │
│ └──────────────┘ │            │ mehr nötig!      │            │                  │
│                  │            │                  │            │                  │
│ 2. KAUFY         │            └──────────────────┘            └──────────────────┘
│    SICHTBARKEIT  │                                                   ▲
│    (kostenlos)   │───────────────────────────────────────────────────┘
│    [Toggle]      │
│                  │
│ 3. SCOUT24       │
│    (vorbereitet) │
│    [Coming Soon] │
│                  │
└──────────────────┘
```

### Datenfluss nach Refactoring

```
User aktiviert         property_features      listings.status       listing_publications
"Vermarktung"          .verkaufsauftrag       = 'active'            channel: partner_network
in MOD-04              = 'active'                                   status: 'pending_z1'
     │                      │                      │                      │
     ▼                      ▼                      ▼                      ▼
┌─────────┐           ┌─────────┐           ┌─────────┐           ┌─────────┐
│ MOD-04  │──────────▶│ DB      │──────────▶│ MOD-06  │──────────▶│ Zone 1  │
│ Features│           │ Update  │           │ Sichtbar│           │ Inbox   │
└─────────┘           └─────────┘           └─────────┘           └─────────┘
                                                                       │
                           ┌───────────────────────────────────────────┘
                           ▼
                    Admin aktiviert:
                    • Partner-Netzwerk → MOD-09
                    • Kaufy-Marktplatz → Zone 3
                    • Scout24 → IS24 API (Zukunft)
```

---

## Teil 3: Feature-Konfiguration (Neu)

### Umbenennung und Struktur

| Alt | Neu | Beschreibung |
|-----|-----|--------------|
| Tab-Name: "Features" | **"Verkaufsauftrag"** | Klare Bezeichnung |
| `msv` | **Entfernt** | MSV ist immer aktiv (Freemium-Modell) |
| `kaufy` | **`verkaufsauftrag`** | Hauptaktivierung für Vermarktung |
| `website_visibility` | **`kaufy_sichtbarkeit`** | Kostenlose Website-Sichtbarkeit |
| — (neu) | **`immoscout24`** | API-Integration (vorbereitet) |

### Neue Feature-Konfiguration

```typescript
const FEATURE_CONFIG = {
  verkaufsauftrag: {
    label: 'Vermarktung aktivieren',
    description: 'Erteilt den Auftrag zur Vermarktung dieser Immobilie über unser Kapitalanlage-Vertriebsnetzwerk.',
    icon: ShoppingCart,
    requiresAgreement: true,
    agreementConfig: {
      title: 'Verkaufsauftrag erteilen',
      provisions: [
        'Käufer-Provision: {commissionRate}% netto',
        'Systemgebühr: 2.000 € netto bei Abschluss',
      ],
      consents: [
        { code: 'SALES_MANDATE', label: 'Verkaufsauftrag gemäß AGB' },
        { code: 'SYSTEM_SUCCESS_FEE', label: 'Erfolgsgebühr bei Vermittlung' },
      ]
    }
  },
  kaufy_sichtbarkeit: {
    label: 'Kaufy-Marktplatz',
    description: 'Macht diese Immobilie zusätzlich auf dem öffentlichen Kaufy-Marktplatz sichtbar (kostenfrei).',
    icon: Globe,
    requiresAgreement: false,
    dependsOn: 'verkaufsauftrag', // Erst möglich wenn Vermarktung aktiv
  },
  immoscout24: {
    label: 'ImmobilienScout24',
    description: 'Veröffentlicht das Exposé automatisch auf ImmobilienScout24 (API-Integration).',
    icon: ExternalLink,
    comingSoon: true,
    requiresAgreement: true, // Wird später Kosten haben
  },
} as const;
```

---

## Teil 4: UI-Design für Verkaufsauftrag-Tab

### Expandierende Kachel mit Agreement

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Verkaufsauftrag                                                            │
│  Verwalten Sie die Vermarktung dieser Immobilie                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🛒  Vermarktung aktivieren                              [Toggle]   │   │
│  │      Erteilt den Auftrag zur Vermarktung über unser                 │   │
│  │      Kapitalanlage-Vertriebsnetzwerk.                               │   │
│  │                                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  VEREINBARUNG ZUR VERMARKTUNG                                 │ │   │
│  │  │                                                               │ │   │
│  │  │  Mit der Aktivierung erteilen Sie uns den Auftrag,            │ │   │
│  │  │  Ihre Immobilie zu vermarkten.                                │ │   │
│  │  │                                                               │ │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐ │ │   │
│  │  │  │  Objektdaten                                            │ │ │   │
│  │  │  │  Leipzig, Leipziger Str. 42        Kaufpreis: 220.000 € │ │ │   │
│  │  │  │  Käufer-Provision: 7,0% netto (8,33% brutto)            │ │ │   │
│  │  │  └─────────────────────────────────────────────────────────┘ │ │   │
│  │  │                                                               │ │   │
│  │  │  ☐ Ich bestätige die Richtigkeit der Exposé-Angaben.         │ │   │
│  │  │  ☐ Ich erteile den Verkaufsauftrag gemäß AGB.                 │ │   │
│  │  │  ☐ Ich akzeptiere die Systemgebühr von 2.000 € bei Abschluss. │ │   │
│  │  │                                                               │ │   │
│  │  │  Provision anpassen: [────●────────────] 7,0%                 │ │   │
│  │  │                                                               │ │   │
│  │  │  [Abbrechen]                     [Vermarktung aktivieren] ✓   │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🌐  Kaufy-Marktplatz                              [Toggle ○───]    │   │
│  │      Macht diese Immobilie auf dem öffentlichen Marktplatz sichtbar │   │
│  │      (kostenfrei, nur verfügbar nach Vermarktungsaktivierung)       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🔗  ImmobilienScout24                             [Coming Soon]    │   │
│  │      Automatische Veröffentlichung auf IS24 (in Entwicklung)        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Verlauf                                                                    │
│  verkaufsauftrag  [Aktiv]  seit 08.02.2026                                 │
│  kaufy_sichtbarkeit  [Ausstehend]  Zone 1 Freigabe erforderlich            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Teil 5: MOD-06 Anpassungen

### Änderungen in ExposeDetail.tsx

1. **Entfernen:** `SalesMandateDialog` und zugehörige Logik
2. **Entfernen:** "Verkaufsauftrag erteilen" Button
3. **Hinzufügen:** Prüfung ob `property_features.verkaufsauftrag = 'active'`
4. **Hinzufügen:** Info-Banner wenn nicht aktiviert

### Neuer Flow in MOD-06

```typescript
// ExposeDetail.tsx - Vereinfacht

// Prüfen ob Verkaufsauftrag aktiv
const { data: salesFeature } = useQuery({
  queryKey: ['property-feature-verkaufsauftrag', property?.id],
  queryFn: async () => {
    const { data } = await supabase
      .from('property_features')
      .select('status')
      .eq('property_id', property!.id)
      .eq('feature_code', 'verkaufsauftrag')
      .maybeSingle();
    return data?.status === 'active';
  },
  enabled: !!property?.id
});

// Wenn nicht aktiviert: Banner anzeigen
{!salesFeature && (
  <Alert>
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription>
      Vermarktung nicht aktiviert. Bitte aktivieren Sie den Verkaufsauftrag im 
      <Link to={`/portal/immobilien/${property?.id}?tab=verkaufsauftrag`}>
        Immobilien-Dossier
      </Link>.
    </AlertDescription>
  </Alert>
)}
```

### Entfernte Komponenten

| Komponente | Datei | Grund |
|------------|-------|-------|
| `SalesMandateDialog` | `src/components/verkauf/SalesMandateDialog.tsx` | In MOD-04 integriert |
| `salesMandateOpen` State | `ExposeDetail.tsx` | Nicht mehr benötigt |
| `activateMutation` | `ExposeDetail.tsx` | Aktivierung erfolgt in MOD-04 |

---

## Teil 6: Zone 1 Sales Desk Anpassungen

### Erweiterter Gatekeeper-Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ZONE 1 SALES DESK (ERWEITERT)                        │
└─────────────────────────────────────────────────────────────────────────────┘

                         Neue Spalte: Scout24
┌─────────────────────────────────────────────────────────────────────────────┐
│ Objekt          │ Titel      │ Preis     │ Partner │ Kaufy │ Scout24 │ Block │
├─────────────────────────────────────────────────────────────────────────────┤
│ [LEI-001]       │ Leipzig... │ 220.000 € │ [✓ ───] │ [──○] │ [Soon]  │ [✓]  │
│ Leipzig         │            │           │         │       │         │       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Neue Features für Zone 1

1. **Scout24-Spalte** (vorbereitet, deaktiviert)
2. **Inbox für neue Listings** (Objekte erscheinen nach MOD-04 Aktivierung)
3. **Audit-Trail** für alle Freigaben

---

## Teil 7: ImmobilienScout24 API-Integration (Vorbereitung)

### API-Übersicht

| Aspekt | Details |
|--------|---------|
| API-Typ | RESTful API mit OAuth 1.0a |
| Base-URL | `https://rest.immobilienscout24.de` |
| Dokumentation | https://api.immobilienscout24.de |
| Publish-Endpoint | `POST /offer/v1.0/publish` |
| Channels | `10000` (IS24.de), `10001` (Kunden-Homepage) |

### Geplante Implementierung

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SCOUT24 INTEGRATION (ZUKUNFT)                           │
└─────────────────────────────────────────────────────────────────────────────┘

Zone 1 Sales Desk                    Edge Function                    IS24 API
┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
│                  │            │                  │            │                  │
│ Admin aktiviert  │──────────▶│ sot-is24-publish │──────────▶│ POST /publish    │
│ Scout24-Toggle   │            │                  │            │                  │
│                  │            │ • OAuth 1.0a     │            │ Response:        │
│                  │◀───────────│ • XML/JSON Body  │◀───────────│ • scoutObjectId  │
│ Status: Aktiv    │            │ • Error Handling │            │ • publishDate    │
│ Scout-ID: 12345  │            │                  │            │                  │
└──────────────────┘            └──────────────────┘            └──────────────────┘
```

### Integration Registry Eintrag

```sql
INSERT INTO integration_registry (
  code, 
  name, 
  type, 
  status, 
  description,
  config
) VALUES (
  'immoscout24',
  'ImmobilienScout24',
  'marketplace',
  'pending_setup',
  'Automatische Exposé-Veröffentlichung auf ImmobilienScout24',
  '{
    "api_url": "https://rest.immobilienscout24.de",
    "auth_type": "oauth1",
    "required_secrets": ["IS24_CONSUMER_KEY", "IS24_CONSUMER_SECRET", "IS24_ACCESS_TOKEN", "IS24_ACCESS_SECRET"],
    "publish_channel": "10000"
  }'::jsonb
);
```

### Benötigte Secrets

| Secret | Beschreibung |
|--------|--------------|
| `IS24_CONSUMER_KEY` | OAuth Consumer Key |
| `IS24_CONSUMER_SECRET` | OAuth Consumer Secret |
| `IS24_ACCESS_TOKEN` | OAuth Access Token |
| `IS24_ACCESS_SECRET` | OAuth Access Token Secret |

---

## Teil 8: Neuer Golden Path (Version 2.0)

### Änderungen gegenüber Version 1.0

| Phase | Alt (v1.0) | Neu (v2.0) |
|-------|------------|------------|
| Phase 7 | MOD-06 aktiviert Listing mit Agreement | **MOD-04 aktiviert Verkaufsauftrag mit Agreement** |
| Phase 7 | SalesMandateDialog in ExposeDetail | **Integrierte Vereinbarung im Verkaufsauftrag-Tab** |
| Phase 8 | Distribution nur Partner + Kaufy | **+ Scout24 vorbereitet** |
| — | — | **MSV/Mietverwaltung: Immer aktiv (Freemium)** |

### Aktualisierte Phase 7: VERKAUFSAUFTRAG

```
PHASE 7: VERKAUFSAUFTRAG (MOD-04 → Zone 1)

Route: /portal/immobilien/:id → Tab "Verkaufsauftrag"

SCHRITT 1: Vermarktung aktivieren
├── User öffnet Tab "Verkaufsauftrag" in Immobilien-Dossier
├── Klickt auf Toggle "Vermarktung aktivieren"
├── Kachel expandiert mit Vereinbarung:
│   ├── Objektdaten (read-only aus MOD-04)
│   ├── Provision konfigurieren (Slider 3-15%)
│   ├── 3 Checkboxen:
│   │   ├── ☐ Richtigkeit der Angaben
│   │   ├── ☐ Verkaufsauftrag gemäß AGB
│   │   └── ☐ Systemgebühr 2.000 € bei Abschluss
│   └── [Vermarktung aktivieren] Button
└── Nach Bestätigung:
    ├── property_features.verkaufsauftrag = 'active'
    ├── listings.status = 'active' (oder INSERT wenn nicht existiert)
    ├── user_consents: 3 Einträge (SALES_MANDATE, DATA_ACCURACY, SYSTEM_FEE)
    └── Listing erscheint in Zone 1 Sales Desk

SCHRITT 2: Kaufy-Sichtbarkeit (optional, kostenlos)
├── Toggle "Kaufy-Marktplatz" wird verfügbar
├── User aktiviert → property_features.kaufy_sichtbarkeit = 'active'
└── Hinweis: "Freigabe durch Zone 1 erforderlich"

SCHRITT 3: ImmobilienScout24 (Zukunft)
├── Toggle zeigt "Coming Soon"
└── Wird in Phase 2 implementiert

DANN: MOD-06 Exposé bearbeiten
├── User navigiert zu /portal/verkauf/expose/:unitId
├── Objekt ist jetzt sichtbar (weil verkaufsauftrag = active)
├── KEIN Agreement-Dialog mehr → bereits in MOD-04 erledigt
└── User kann Exposé-Details anpassen (Bilder, Beschreibung, etc.)
```

### Aktualisiertes Architektur-Diagramm

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ZONE 1 — ADMIN PORTAL (/admin)                             │
│                                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────────────┐ │
│  │ Tile Catalog        │  │ FutureRoom          │  │ Sales Desk                      │ │
│  │ → Testdaten         │  │ → Finanz-Inbox      │  │ → Neue Listings (aus MOD-04)    │ │
│  │ → Golden Path       │  │ → Zuweisung         │  │ → Partner-Freigabe              │ │
│  │                     │  │ → Manager-Pool      │  │ → Kaufy-Freigabe                │ │
│  │                     │  │                     │  │ → Scout24-Freigabe (Zukunft)    │ │
│  │                     │  │                     │  │ → Blocking-Funktion             │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                              ▼
┌───────────────────────────────────────────┐  ┌───────────────────────────────────────────┐
│        ZONE 2 — USER PORTAL (/portal)     │  │        ZONE 3 — PUBLIC WEBSITES           │
│                                           │  │                                           │
│  MOD-04: Immobilien                       │  │  KAUFY Marktplatz                         │
│  └── Tab "Verkaufsauftrag" ← HIER!        │  │  → Objekte mit Zone 1 Kaufy-Freigabe      │
│      ├── Vermarktung aktivieren           │  │                                           │
│      ├── Kaufy-Sichtbarkeit               │  │  ImmobilienScout24 (Zukunft)              │
│      └── Scout24 (Coming Soon)            │  │  → Objekte mit Zone 1 Scout24-Freigabe    │
│                                           │  │                                           │
│  MOD-06: Verkauf (Exposé bearbeiten)      │  │                                           │
│  └── Nur sichtbar wenn Auftrag aktiv      │  │                                           │
│  └── KEIN Agreement-Dialog mehr           │  │                                           │
│                                           │  │                                           │
│  MOD-05: Mietverwaltung                   │  │                                           │
│  └── IMMER aktiv (Freemium)               │  │                                           │
│  └── Kein Toggle nötig                    │  │                                           │
└───────────────────────────────────────────┘  └───────────────────────────────────────────┘
```

---

## Teil 9: Datenbankänderungen

### Migration: Feature-Codes

```sql
-- Migration: Feature-Codes umbenennen und aufräumen
-- ================================================

-- 1. MSV-Einträge entfernen (Freemium, kein Toggle nötig)
DELETE FROM property_features WHERE feature_code = 'msv';

-- 2. Kaufy → Verkaufsauftrag umbenennen
UPDATE property_features 
SET feature_code = 'verkaufsauftrag' 
WHERE feature_code = 'kaufy';

-- 3. website_visibility → kaufy_sichtbarkeit umbenennen
UPDATE property_features 
SET feature_code = 'kaufy_sichtbarkeit' 
WHERE feature_code = 'website_visibility';

-- 4. Neues Agreement-Template für Verkaufsauftrag
INSERT INTO agreement_templates (
  code,
  version,
  title_de,
  content_de,
  requires_signature,
  status
) VALUES (
  'SALES_MANDATE_V2',
  '2.0',
  'Verkaufsauftrag zur Immobilienvermarktung',
  'Mit diesem Auftrag erteilen Sie der System of a Town GmbH den Auftrag, Ihre Immobilie über das Kapitalanlage-Vertriebsnetzwerk zu vermarkten. Bei erfolgreicher Vermittlung wird eine Systemgebühr von 2.000 € netto fällig.',
  false,
  'active'
);

-- 5. Integration Registry Eintrag für Scout24
INSERT INTO integration_registry (
  code, 
  name, 
  type, 
  status, 
  description
) VALUES (
  'immoscout24',
  'ImmobilienScout24',
  'marketplace',
  'pending_setup',
  'Automatische Exposé-Veröffentlichung auf ImmobilienScout24'
);
```

---

## Teil 10: Betroffene Dateien

### Zu ändernde Dateien

| Datei | Änderungen |
|-------|------------|
| `src/components/portfolio/FeaturesTab.tsx` | Vollständiges Refactoring → "VerkaufsauftragTab" |
| `src/pages/portal/verkauf/ExposeDetail.tsx` | SalesMandateDialog entfernen, Feature-Check hinzufügen |
| `src/pages/portal/verkauf/ObjekteTab.tsx` | Filter für verkaufsauftrag = active |
| `src/pages/admin/desks/SalesDesk.tsx` | Scout24-Spalte (disabled) hinzufügen |
| `src/components/verkauf/SalesMandateDialog.tsx` | Kann entfernt oder archiviert werden |
| `src/components/verkauf/index.ts` | Export entfernen |
| `docs/workflows/GOLDEN_PATH_E2E.md` | Version 2.0 mit neuem Phase 7 Flow |

### Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/components/portfolio/VerkaufsauftragTab.tsx` | Neue Komponente (ersetzt FeaturesTab) |
| `src/components/portfolio/SalesAgreementPanel.tsx` | Expandierende Agreement-UI |
| `supabase/functions/sot-is24-publish/index.ts` | Edge Function (Stub für Zukunft) |

---

## Teil 11: Dokumentations-Updates

### Zu aktualisierende Dokumentation

| Datei | Änderungen |
|-------|------------|
| `docs/workflows/GOLDEN_PATH_E2E.md` | Phase 7 neu schreiben, Version auf 2.0 |
| `src/data/kb-seeds/v1/KB.SYSTEM.001.md` | Phase 8 "Verkaufsauftrag" Beschreibung |
| Memory: `sales/listing-distribution-governance` | Aktualisieren |
| Memory: `modules/mod-06-marketing-expose-spec` | SalesMandateDialog entfernt |

---

## Teil 12: Implementierungsreihenfolge

### Phase 1: Grundlagen (Tag 1)

1. DB-Migration ausführen (Feature-Codes, Agreement-Template, Integration Registry)
2. `FeaturesTab.tsx` → `VerkaufsauftragTab.tsx` refactoren
3. Expandierende Agreement-UI implementieren
4. Consent-Persistierung in `user_consents`

### Phase 2: MOD-06 Anpassung (Tag 1)

5. `SalesMandateDialog` aus ExposeDetail entfernen
6. Feature-Check für Sichtbarkeit hinzufügen
7. Info-Banner für nicht-aktivierte Objekte

### Phase 3: Zone 1 (Tag 2)

8. Sales Desk: Scout24-Spalte hinzufügen (disabled)
9. Inbox-Logik für neue Listings aus MOD-04

### Phase 4: Dokumentation (Tag 2)

10. `GOLDEN_PATH_E2E.md` auf Version 2.0 aktualisieren
11. Memories aktualisieren
12. KB-Artikel anpassen

### Phase 5: Scout24 Vorbereitung (Optional, Zukunft)

13. Edge Function Stub erstellen
14. OAuth-Flow dokumentieren
15. Secrets in Secrets Manager hinzufügen (wenn Credentials vorhanden)

---

## Teil 13: Akzeptanzkriterien

### Funktionale Kriterien

| # | Kriterium | Route |
|---|-----------|-------|
| 1 | Tab heißt "Verkaufsauftrag" nicht "Features" | `/portal/immobilien/:id` |
| 2 | MSV/Mietverwaltung Toggle existiert nicht mehr | — |
| 3 | "Vermarktung aktivieren" expandiert bei Klick | Tab "Verkaufsauftrag" |
| 4 | 3 Checkboxen müssen bestätigt werden | Agreement-Panel |
| 5 | Provision kann per Slider eingestellt werden (3-15%) | Agreement-Panel |
| 6 | Nach Bestätigung: Objekt erscheint in MOD-06 | `/portal/verkauf/objekte` |
| 7 | Nach Bestätigung: Objekt erscheint in Zone 1 Sales Desk | `/admin/sales-desk` |
| 8 | MOD-06 hat KEINEN SalesMandateDialog mehr | `/portal/verkauf/expose/:id` |
| 9 | Kaufy-Toggle nur aktiv wenn Vermarktung aktiv | Tab "Verkaufsauftrag" |
| 10 | Scout24 zeigt "Coming Soon" Badge | Tab "Verkaufsauftrag" |
| 11 | Zone 1 kann Objekte blockieren | `/admin/sales-desk` |
| 12 | Consent wird in `user_consents` gespeichert | DB |

### Nicht-funktionale Kriterien

| # | Kriterium |
|---|-----------|
| 1 | Keine doppelte Aktivierungsschleife |
| 2 | Golden Path Dokumentation ist aktuell |
| 3 | Scout24 Integration ist vorbereitet aber nicht funktional |

