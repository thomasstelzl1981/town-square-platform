
# Armstrong Co-Pilot — Überarbeiteter Architekturplan

## Scope-Änderung

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARMSTRONG ZONE-VERTEILUNG (REVIDIERT)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ZONE 1 (Admin)           ZONE 2 (Portal)         ZONE 3 (Websites)        │
│  ─────────────────        ─────────────────       ─────────────────        │
│  ✗ KEIN Armstrong-Chat    ✓ Armstrong FULL       ✓ Armstrong LITE          │
│                                                                             │
│  ✓ Armstrong Console      • Alle Actions         • FAQ/Erklärungs-         │
│    (Konfiguration)        • RAG + Knowledge        Modus                   │
│                           • Write-Actions        • Lead-Capture            │
│  • Actions-Katalog        • Web-Research         • Objekt-Erklärung        │
│  • Billing-Mapping        • Dokument-Ops         • Kein Login nötig        │
│  • Policies/Prompts                                                        │
│  • Logs/Monitoring                               ✗ Keine Write-Actions     │
│                                                  ✗ Keine Tenant-Daten      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## A) Revidierte Architektur

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARMSTRONG ARCHITECTURE v2                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         USER-FACING LAYER                           │   │
│  │                                                                     │   │
│  │   ┌─────────────────────┐         ┌─────────────────────┐          │   │
│  │   │   ZONE 2 PORTAL     │         │   ZONE 3 WEBSITES   │          │   │
│  │   │   ArmstrongContainer│         │   ArmstrongWidget   │          │   │
│  │   │   + ChatPanel       │         │   (Embedded Chat)   │          │   │
│  │   │   + ArmstrongSheet  │         │                     │          │   │
│  │   │                     │         │   • KAUFY.app       │          │   │
│  │   │   Features:         │         │   • MIETY.app       │          │   │
│  │   │   • Full Actions    │         │   • SoT.app         │          │   │
│  │   │   • Internal RAG    │         │   • FutureRoom      │          │   │
│  │   │   • Web Research    │         │                     │          │   │
│  │   │   • Confirmations   │         │   Features:         │          │   │
│  │   └─────────────────────┘         │   • FAQ Only        │          │   │
│  │                                   │   • Public Knowledge│          │   │
│  │                                   │   • Lead Capture    │          │   │
│  │                                   └─────────────────────┘          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ARMSTRONG EDGE FUNCTION                          │   │
│  │                    sot-armstrong-advisor                            │   │
│  │                                                                     │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │   │ MODE     │  │ ACTION   │  │ KNOWLEDGE│  │ BILLING  │          │   │
│  │   │ ROUTER   │  │ EXECUTOR │  │ RETRIEVER│  │ TRACKER  │          │   │
│  │   │          │  │          │  │          │  │          │          │   │
│  │   │ zone2    │  │ Registry │  │ Internal │  │ Usage    │          │   │
│  │   │ zone3    │  │ Policies │  │ External │  │ Limits   │          │   │
│  │   └──────────┘  └──────────┘  └──────────┘  └──────────┘          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      ADMIN LAYER (Zone 1)                           │   │
│  │                      Armstrong Console                               │   │
│  │                      (Konfiguration, KEIN Chat)                     │   │
│  │                                                                     │   │
│  │   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │   │
│  │   │ Actions      │ │ Billing      │ │ Logs &       │               │   │
│  │   │ Katalog      │ │ Mapping      │ │ Monitoring   │               │   │
│  │   └──────────────┘ └──────────────┘ └──────────────┘               │   │
│  │   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │   │
│  │   │ Knowledge    │ │ Policies &   │ │ Test         │               │   │
│  │   │ Base Admin   │ │ Prompts      │ │ Harness      │               │   │
│  │   └──────────────┘ └──────────────┘ └──────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## B) Zone 2 — Armstrong Full (Portal)

### B1) Funktionsumfang

| Feature | Beschreibung | Auth erforderlich |
|---------|--------------|-------------------|
| How-It-Works | Modul-Erklärungen, Onboarding | ✓ |
| Actions (Read) | Daten abfragen, KPIs berechnen | ✓ |
| Actions (Write) | Anlegen, Bearbeiten (mit Confirm) | ✓ |
| Internal RAG | Tenant-Dokumente durchsuchen | ✓ |
| Web Research | Externe Quellen (Opt-In) | ✓ |
| Simulations | Investment-Berechnungen | ✓ |
| Document Ops | Extraktion, Verknüpfung | ✓ |

### B2) Context-Injection

Armstrong erhält automatisch den aktuellen Kontext:

```typescript
interface Zone2Context {
  zone: 'Z2';
  tenant_id: string;
  user_id: string;
  user_roles: string[];
  
  // Navigation Context
  current_module: string;       // z.B. 'MOD-04'
  current_area: string;         // z.B. 'missions'
  current_path: string;         // z.B. '/portal/immobilien/portfolio'
  
  // Entity Context (wenn auf Detail-Seite)
  entity_type?: string;         // z.B. 'property'
  entity_id?: string;           // UUID
  
  // Permissions
  allowed_actions: string[];    // Gefiltert nach Rolle + Plan
  web_research_enabled: boolean;
}
```

### B3) UI-Komponenten (Zone 2)

```text
DESKTOP:
┌──────────────────────────────────────────────────────────────────┐
│ ArmstrongContainer (Draggable Planet-Sphere)                     │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Minimiert: 64px Planet mit Armstrong-Logo                  │  │
│ │ Expandiert: ChatPanel (400x600px) mit:                     │  │
│ │   • Context Header (Modul, Entity)                         │  │
│ │   • Message History                                        │  │
│ │   • ActionCard (bei vorgeschlagenen Aktionen)              │  │
│ │   • Input Bar + File Drop                                  │  │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

MOBILE:
┌──────────────────────────────────────────────────────────────────┐
│ ArmstrongInputBar (Fixed Bottom)                                 │
│ → Öffnet ArmstrongSheet (80vh Bottom Sheet)                     │
│                                                                  │
│ Sheet enthält:                                                   │
│   • Kompaktes ChatPanel                                          │
│   • Swipe-to-dismiss                                            │
│   • Native Keyboard-Handling                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## C) Zone 3 — Armstrong Lite (Websites)

### C1) Einschränkungen

| Feature | Zone 2 | Zone 3 |
|---------|--------|--------|
| Auth erforderlich | ✓ | ✗ |
| Tenant-Daten lesen | ✓ | ✗ |
| Write-Actions | ✓ | ✗ |
| Internal RAG | ✓ | ✗ |
| Public Knowledge | ✓ | ✓ |
| FAQ/Erklärungen | ✓ | ✓ |
| Lead-Capture | ✗ | ✓ |
| Objekt-Erklärung | ✓ | ✓ (nur öffentliche Daten) |

### C2) Erlaubte Actions (Zone 3)

```typescript
const ZONE3_ALLOWED_ACTIONS = [
  // Erklärungen
  'ARM.GLOBAL.EXPLAIN_TERM',
  'ARM.GLOBAL.FAQ',
  
  // Öffentliche Berechnungen
  'ARM.PUBLIC.RENDITE_RECHNER',
  'ARM.PUBLIC.TILGUNG_RECHNER',
  
  // Lead-Capture (keine Daten speichern, nur weiterleiten)
  'ARM.PUBLIC.CONTACT_REQUEST',
  'ARM.PUBLIC.NEWSLETTER_SIGNUP',
  
  // Objekt-Infos (nur published listings)
  'ARM.PUBLIC.EXPLAIN_LISTING',
  'ARM.PUBLIC.COMPARE_LISTINGS',
];
```

### C3) Context (Zone 3)

```typescript
interface Zone3Context {
  zone: 'Z3';
  website: 'kaufy' | 'miety' | 'sot' | 'futureroom';
  
  // Kein User/Tenant
  user_id: null;
  tenant_id: null;
  
  // Page Context
  current_path: string;
  listing_id?: string;  // Wenn auf Objekt-Seite
  
  // Session (anonym)
  session_id: string;   // Für Conversation-Continuity
  
  // Limitierungen
  allowed_actions: typeof ZONE3_ALLOWED_ACTIONS;
  web_research_enabled: false;
}
```

### C4) UI-Komponente (Zone 3)

```text
ArmstrongWidget (Embedded Chat Bubble)
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│ Position: Fixed Bottom-Right (20px Offset)                       │
│                                                                  │
│ Minimiert:                                                       │
│ ┌────────────┐                                                  │
│ │ 💬 Fragen? │  ← Branded Bubble (Website-spezifisch)           │
│ └────────────┘                                                  │
│                                                                  │
│ Expandiert:                                                      │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ [KAUFY] Wie kann ich helfen?                    [−] [×]    │  │
│ ├────────────────────────────────────────────────────────────┤  │
│ │                                                            │  │
│ │ [Armstrong] Willkommen! Ich kann Ihnen bei Fragen          │  │
│ │ zu Kapitalanlageimmobilien helfen.                         │  │
│ │                                                            │  │
│ │ Quick Actions:                                             │  │
│ │ [Rendite berechnen] [Was ist AfA?] [Kontakt]              │  │
│ │                                                            │  │
│ ├────────────────────────────────────────────────────────────┤  │
│ │ Ihre Frage...                                    [Senden] │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ Größe: 350x450px (anpassbar pro Website)                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## D) Zone 1 — Armstrong Console (Nur Konfiguration)

### D1) Klarstellung

Die Zone-1 "Armstrong Console" ist ein **reines Admin-Tool** für Platform-Admins:
- **KEIN eigener Armstrong-Chat** in Zone 1
- Dient zur Konfiguration, Monitoring und Governance
- Read-Only Viewer für das Code-Manifest (SSOT)
- Logs und Usage-Tracking über alle Tenants

### D2) Console-Struktur

```text
/admin/armstrong
├── /dashboard          → KPIs, Alerts, Top-Actions
├── /actions            → Actions-Katalog (Read-Only aus Manifest)
├── /billing            → Plan-Features, Limits, Usage
├── /knowledge          → Knowledge-Base CRUD (Platform-weite Inhalte)
├── /policies           → System Prompts, Guardrails
├── /logs               → armstrong_action_runs Viewer
└── /test               → Test Harness (Dry-Run als Admin)
```

---

## E) Edge Function Mode-Router

Die `sot-armstrong-advisor` Edge Function erhält ein Mode-Flag:

```typescript
interface ArmstrongRequest {
  mode: 'zone2' | 'zone3';
  context: Zone2Context | Zone3Context;
  message: string;
  conversation_id?: string;
}

// Mode Router Logic
function routeRequest(req: ArmstrongRequest) {
  if (req.mode === 'zone3') {
    // Strikte Limitierungen
    validateZone3Actions(req);
    enforceNoTenantData(req);
    return handlePublicQuery(req);
  }
  
  if (req.mode === 'zone2') {
    // Voller Funktionsumfang
    validateAuth(req);
    validateTenantAccess(req);
    return handleAuthenticatedQuery(req);
  }
}
```

---

## F) Revidiertes Actions-Schema

```typescript
export interface ArmstrongAction {
  action_code: string;
  title_de: string;
  description_de: string;

  // Zone-Verfügbarkeit (REVIDIERT)
  zones: ('Z2' | 'Z3')[];  // Z1 entfernt!
  
  module: string | null;

  // ... rest bleibt gleich
}
```

### F1) Beispiel-Actions mit Zone-Mapping

| Action Code | Zone 2 | Zone 3 | Beschreibung |
|-------------|--------|--------|--------------|
| ARM.GLOBAL.EXPLAIN_TERM | ✓ | ✓ | Begriff erklären |
| ARM.GLOBAL.HOW_IT_WORKS | ✓ | ✗ | Modul-Onboarding |
| ARM.PUBLIC.RENDITE_RECHNER | ✓ | ✓ | Rendite berechnen |
| ARM.MOD04.CREATE_PROPERTY | ✓ | ✗ | Immobilie anlegen |
| ARM.MOD03.EXTRACT_DOC | ✓ | ✗ | Dokument extrahieren |
| ARM.PUBLIC.CONTACT_REQUEST | ✗ | ✓ | Lead erfassen |

---

## G) Implementierungsplan (Revidiert)

### Phase 1: Zone 2 MVP (2 Wochen)

**Woche 1:**
- [ ] armstrongManifest.ts mit Zone-Flags (zones: ['Z2'] / ['Z2', 'Z3'])
- [ ] Mode-Router in sot-armstrong-advisor
- [ ] Zone2Context-Injection aus aktueller Route

**Woche 2:**
- [ ] ActionCard-Komponente für Confirm-Flows
- [ ] 15 Actions für MOD-03/04/07/08
- [ ] armstrong_action_runs Logging

### Phase 2: Zone 3 + Knowledge (2 Wochen)

**Woche 3:**
- [ ] ArmstrongWidget-Komponente für Zone 3
- [ ] Zone3-Limitierungen in Edge Function
- [ ] Public Knowledge Base (FAQ, Rechner)

**Woche 4:**
- [ ] Zone-1 Console: Dashboard + Logs (Read-Only)
- [ ] Billing-Usage Tracking
- [ ] Web-Research für Zone 2

### Phase 3: Hardening (1 Woche)

- [ ] Error Handling + Fallbacks
- [ ] Rate Limiting pro Session (Zone 3)
- [ ] Security Review

---

## H) Zusammenfassung der Änderungen

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| Zone 1 Chat | Geplant | **Entfernt** |
| Zone 1 Console | Konfiguration + Chat | Nur Konfiguration |
| Zone 2 | Full Features | Full Features (unverändert) |
| Zone 3 | Lite (geplant) | Lite (präzisiert) |
| Actions Schema | zone: 'Z1'/'Z2'/'Z3' | zones: ['Z2'] oder ['Z2','Z3'] |
| Context | Einheitlich | Zone2Context vs Zone3Context |

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/manifests/armstrongManifest.ts` | NEU: SSOT mit zones-Array |
| `src/components/zone3/ArmstrongWidget.tsx` | NEU: Chat-Bubble für Websites |
| `supabase/functions/sot-armstrong-advisor/` | Mode-Router hinzufügen |
| `src/pages/admin/armstrong/` | Console ohne Chat-Feature |
| `src/components/chat/ChatPanel.tsx` | Zone-Context erweitern |
