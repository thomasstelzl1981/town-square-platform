
# Armstrong Zone 3: Lead-Capture -- Vollstaendige Implementierung (Phase 1-7)

## Kontext

Der Plan wurde bereits genehmigt. Dieser Durchlauf setzt alle 7 Phasen um, basierend auf dem hochgeladenen Dokument und der bestehenden Codebasis.

## Phase 1: Datenbank -- lead_source Enum erweitern

Die bestehende `lead_source` Enum hat: `zone1_pool`, `meta_self`, `meta_property`, `referral`, `manual`, `kaufy_website`.

Migration: 4 neue Werte hinzufuegen:
```text
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'kaufy_armstrong';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'kaufy_expose_request';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'futureroom_armstrong';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'sot_demo_booking';
```

Die `leads`-Tabelle existiert bereits mit passender Struktur (tenant_id, contact_id, source enum, status enum, criteria jsonb etc.). Kein neues Schema noetig.

## Phase 2: MOD-02 Unfreeze

`spec/current/00_frozen/modules_freeze.json`: MOD-02 temporaer auf `frozen: false` setzen.

## Phase 3: Armstrong Manifest (armstrongManifest.ts)

### 3a: ZONE3_ALLOWED_ACTION_CODES erweitern (Zeile ~121-175)

6 neue Codes hinzufuegen:
- `ARM.Z3.KAUFY.CAPTURE_LEAD`
- `ARM.Z3.KAUFY.REQUEST_EXPOSE`
- `ARM.Z3.FR.CAPTURE_LEAD`
- `ARM.Z3.FR.QUICK_CHECK`
- `ARM.Z3.SOT.BOOK_DEMO`
- `ARM.Z3.SOT.RECOMMEND_MODULES`

### 3b: Pack-Arrays erweitern (Zeile ~191-215)

- KAUFY_PACK: + `ARM.Z3.KAUFY.CAPTURE_LEAD`, `ARM.Z3.KAUFY.REQUEST_EXPOSE`
- FUTUREROOM_PACK: + `ARM.Z3.FR.CAPTURE_LEAD`, `ARM.Z3.FR.QUICK_CHECK`
- SOT_PACK: + `ARM.Z3.SOT.BOOK_DEMO`, `ARM.Z3.SOT.RECOMMEND_MODULES`

### 3c: 6 neue Action-Definitionen im armstrongActions Array (nach Zeile ~2075)

Folgt dem bestehenden Pattern der Z3-Actions (zones: ['Z3'], module: null, etc.):

| Action Code | title_de | execution_mode | side_effects |
|---|---|---|---|
| ARM.Z3.KAUFY.CAPTURE_LEAD | Kontakt und Lead erfassen | execute | creates_lead_record |
| ARM.Z3.KAUFY.REQUEST_EXPOSE | Expose anfordern | execute | creates_lead_record |
| ARM.Z3.FR.CAPTURE_LEAD | Finanzierungs-Lead erfassen | execute_with_confirmation | creates_lead_record |
| ARM.Z3.FR.QUICK_CHECK | Schnell-Einschaetzung Finanzierung | readonly | (keine) |
| ARM.Z3.SOT.BOOK_DEMO | Demo-Termin buchen | execute_with_confirmation | creates_lead_record |
| ARM.Z3.SOT.RECOMMEND_MODULES | Modul-Empfehlung | readonly | (keine) |

## Phase 4: ArmstrongChipBar -- Website-Awareness (ArmstrongChipBar.tsx)

- Neuer Prop: `website?: string | null`
- Interface `ArmstrongChipBarProps` erweitern
- Logik in der Komponente: Wenn `website` gesetzt, Website-Chips zurueckgeben BEVOR moduleCode geprueft wird
- 3 Website-Chip-Sets:

```text
kaufy: Immobilie finden, Expose anfordern, Kontakt aufnehmen
futureroom: Finanzierbarkeit pruefen, Finanzierungsablauf, Selbstauskunft starten, Checkliste Unterlagen
sot: Welche Module passen?, Demo buchen, Wie funktioniert SoT?, Jetzt registrieren
```

## Phase 5: ChatPanel -- website-Prop durchreichen (ChatPanel.tsx)

- Route-Detection via `window.location.pathname`:
  - `/website/kaufy` oder `/kaufy` -> `website = 'kaufy'`
  - `/website/futureroom` oder `/futureroom` -> `website = 'futureroom'`
  - `/website/sot` oder `/sot` -> `website = 'sot'`
- `website`-Wert an `ArmstrongChipBar` als Prop weitergeben (Zeile ~451)

## Phase 6: Edge Function -- System Prompts und Action Cases (sot-armstrong-advisor/index.ts)

### 6a: Drei neue System-Prompt-Builder

- `buildKaufySystemPrompt(listingId, sessionId)` -- Ersetzt den bestehenden `KAUFY_IMMO_ADVISOR_PROMPT` (Zeile ~2920) mit aktiver Lead-Capture-Logik (Suchkriterien erfragen, Expose anbieten, Name+Email holen)
- `buildFutureRoomSystemPrompt(sessionId)` -- 5-Fragen-Qualifizierungsflow (Einkommen, EK, Objekttyp, Region, Zeitraum) mit Faustformel-Berechnung
- `buildSotSystemPrompt(sessionId)` -- 22-Module nach Zielgruppe, 3-Fragen-Flow (Beruf, Groesse, Schmerzpunkt), Demo-Angebot

### 6b: Zone 3 Routing anpassen (Zeile ~2982-2994)

Die bestehende `zone3PersonaPrompt`-Logik wird erweitert: Route/Persona-basierter Dispatch an die neuen Prompt-Builder. FutureRoom und SoT Pfade hinzufuegen.

### 6c: 5 neue Action Cases im executeAction-Block

| Action Code | Logik |
|---|---|
| ARM.Z3.KAUFY.CAPTURE_LEAD | Name+Email -> leads Insert (source: kaufy_armstrong) |
| ARM.Z3.KAUFY.REQUEST_EXPOSE | Name+Email+ListingID -> leads Insert (source: kaufy_expose_request) |
| ARM.Z3.FR.CAPTURE_LEAD | Qualifizierte Daten -> leads Insert (source: futureroom_armstrong, status: qualified) |
| ARM.Z3.FR.QUICK_CHECK | Readonly: maxLoan = Netto x 100, minEK = 20% Kaufpreis |
| ARM.Z3.SOT.BOOK_DEMO | Name+Email+Company -> leads Insert (source: sot_demo_booking, status: demo_requested) |
| ARM.Z3.SOT.RECOMMEND_MODULES | Readonly: Modul-Empfehlung nach org_type (makler/finanzberater/investor/bautraeger/verwalter) |

### 6d: MVP_EXECUTABLE_ACTIONS erweitern (Zeile ~212-261)

Alle 6 neuen Action Codes zur Liste hinzufuegen.

## Phase 7: Re-Freeze MOD-02

`spec/current/00_frozen/modules_freeze.json`: MOD-02 zurueck auf `frozen: true`.

## Betroffene Dateien

| Datei | Typ | Aenderung |
|---|---|---|
| Datenbank-Migration | SQL | lead_source Enum + 4 Werte |
| spec/current/00_frozen/modules_freeze.json | Config | MOD-02 unfreeze dann refreeze |
| src/manifests/armstrongManifest.ts | Shared | 6 Action Codes + Packs + 6 Definitionen |
| src/components/chat/ArmstrongChipBar.tsx | MOD-02 | website-Prop + 3 Chip-Sets |
| src/components/chat/ChatPanel.tsx | MOD-02 | website-Detection + Prop-Weiterleitung |
| supabase/functions/sot-armstrong-advisor/index.ts | Edge Fn | 3 Prompts + 6 Action Cases + Z3-Routing + MVP_EXECUTABLE |

## Reihenfolge

1. DB-Migration ausfuehren
2. modules_freeze.json: MOD-02 unfreeze
3. armstrongManifest.ts: Codes + Packs + Definitionen
4. ArmstrongChipBar.tsx: website-Prop + Chip-Sets
5. ChatPanel.tsx: Route-Detection + Prop-Weiterleitung
6. sot-armstrong-advisor/index.ts: Prompts + Actions + Routing
7. Edge Function deployen
8. modules_freeze.json: MOD-02 refreeze
