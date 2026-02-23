
# Analyse: Magic Intake — Vertragserkennungs-Mapping und Zuordnungskarte

## 1. Aktuelles Problem: Energievertraege landen am falschen Ort

### Ist-Zustand

Die Tabelle `miety_contracts` hat ein **NOT NULL** Feld `home_id` — jeder Energievertrag MUSS einem Zuhause zugeordnet sein. Der aktuelle `useContractCreation`-Hook umgeht das, indem er Energievertraege als `user_subscriptions` mit Kategorie `utilities_energy` ablegt. Das ist **architektonisch falsch**, weil:

- Energievertraege (Strom, Gas, Wasser, Internet) gehoeren zum Modul **MOD-20 (Zuhause)** und werden in `miety_contracts` verwaltet
- `user_subscriptions` ist fuer persoenliche Abos gedacht (Netflix, Spotify, etc.)
- Die Finanzuebersicht-Engine (`ENG-FINUEB`) liest Energievertraege aus `miety_contracts`, NICHT aus `user_subscriptions` — wenn sie dort landen, fehlen sie in der Finanzuebersicht
- Die Demo-Daten in `demo_user_subscriptions.csv` enthalten faelschlicherweise "Telekom Magenta L" und "Vodafone Kabel 1000", die eigentlich `miety_contracts` sein sollten

### Soll-Zustand

| Vertragsart | Ziel-Tabelle | Modul | Pflichtfeld |
|---|---|---|---|
| Streaming (Netflix, Spotify, ...) | `user_subscriptions` | MOD-18 Finanzanalyse | `tenant_id`, `user_id` |
| Software/SaaS (Microsoft 365, ...) | `user_subscriptions` | MOD-18 Finanzanalyse | `tenant_id`, `user_id` |
| Fitness (FitX, McFit, ...) | `user_subscriptions` | MOD-18 Finanzanalyse | `tenant_id`, `user_id` |
| News/Medien (ZEIT, Spiegel, ...) | `user_subscriptions` | MOD-18 Finanzanalyse | `tenant_id`, `user_id` |
| Versicherung (Allianz, HUK, ...) | `insurance_contracts` | MOD-18 Finanzanalyse | `tenant_id`, `user_id` |
| Strom | `miety_contracts` | MOD-20 Zuhause | `tenant_id`, **`home_id`** |
| Gas | `miety_contracts` | MOD-20 Zuhause | `tenant_id`, **`home_id`** |
| Wasser | `miety_contracts` | MOD-20 Zuhause | `tenant_id`, **`home_id`** |
| Internet/Telefon | `miety_contracts` | MOD-20 Zuhause | `tenant_id`, **`home_id`** |
| Mobilfunk | `user_subscriptions` | MOD-18 Finanzanalyse | `tenant_id`, `user_id` |

**Kernproblem:** `miety_contracts` braucht eine `home_id`. Bei der automatischen Vertragserkennung aus Kontobewegungen wissen wir aber nicht, zu welchem Zuhause der Energievertrag gehoert. **Loesung:** Der Dialog muss einen Home-Picker anbieten, wenn der User einen Vertrag als "Energievertrag" zuordnet.

---

## 2. Magic Intake — Kompletter Prozessablauf (Steps)

### Step 1: Schrittleiste (IntakeHowItWorks)
Erklaert den 3-Schritte-Prozess: Hochladen → KI analysiert → Felder werden befuellt

### Step 2: Entity-Picker + Upload (IntakeEntityPicker + IntakeUploadZone)
- User waehlt Entity-Typ (Immobilie, PV-Anlage, Kontakt, etc.)
- User waehlt spezifische Entity (z.B. "Leopoldstr. 12")
- Datei-Upload per Drag-and-Drop (bis 10 Dateien)
- Analyse ueber `sot-document-parser` Edge Function

### Step 2b: Cloud-Import (CloudSourcePicker)
- Google Drive Integration
- Modi: "Sync-first" oder "Direct Analysis"
- Dateien landen im Entity-spezifischen DMS-Ordner

### Step 3: Konto-Intake (NEU — Vertragserkennung)
- Nur sichtbar, wenn FinAPI-Bankverbindungen existieren
- Button: "Kontobewegungen analysieren"
- Laedt kategorisierte Transaktionen aus `bank_transactions`
- Ruft `detectRecurringContracts()` auf (Engine-Funktion)
- Oeffnet `ContractDetectionDialog`

### Step 4: Dokument-Checkliste (IntakeChecklistGrid)
- Live-Fortschritt: welche Dokumenttypen bereits hochgeladen
- Matching via `doc_type`

### Step 5: Letzte Aktivitaet (IntakeRecentActivity)
- Chronologische Liste der letzten Uploads/Analysen

### Step 6: Link zur Intelligenz
- Navigation zu `/portal/dms/intelligenz`

---

## 3. Engine-Mapping: Konto-Kategorisierung → Vertragserkennung

### Stufe 1: Transaktions-Kategorisierung (bestehend in ENG-KONTOMATCH)

```text
Kontobewegung (bank_transactions)
       │
       ▼
Regel-basiertes Matching (DEFAULT_MATCH_RULES)
       │
       ├─ MIETE, HAUSGELD, GRUNDSTEUER → Immobilien (MOD-04) → SKIP
       ├─ DARLEHEN → Finanzierung (MOD-07) → SKIP
       ├─ EINSPEISEVERGUETUNG, WARTUNG, PACHT → PV (MOD-19) → SKIP
       ├─ GEHALT → Person → SKIP
       ├─ VERSICHERUNG → Versicherungen → WEITER
       ├─ SONSTIG_AUSGANG → Abos/Energie → WEITER
       └─ SONSTIG_EINGANG → SKIP
```

### Stufe 2: Recurring Detection (recurring.ts)

```text
Kategorisierte Transaktionen (match_category != null, amount < 0)
       │
       ▼
Gruppierung nach normalizeCounterparty()
       │
       ▼
Betrag-Cluster (Toleranz +/- 5%)
       │
       ▼
Frequenz-Erkennung (Buchungsintervalle):
  - 25–35 Tage  → monatlich
  - 80–100 Tage → quartalsweise
  - 350–380 Tage → jaehrlich
  Min. 2 Treffer erforderlich
       │
       ▼
Pattern-basiertes Routing:
  ┌─────────────────────────────────────────────────────────────┐
  │ Kategorie VERSICHERUNG     → insurance_contracts            │
  │ INSURANCE_PATTERNS matched → insurance_contracts            │
  │ ENERGY_PATTERNS matched    → miety_contracts (+ home_id!)  │
  │ SUBSCRIPTION_PATTERNS matched → user_subscriptions          │
  │ Default (kein Pattern)     → user_subscriptions             │
  └─────────────────────────────────────────────────────────────┘
       │
       ▼
DetectedContract[] mit Confidence-Score (0.5–0.95)
```

---

## 4. Zuordnungskarte — Vollstaendig

### ENERGY_PATTERNS → `miety_contracts` (braucht home_id)
| Pattern | Typische Vertraege |
|---|---|
| stadtwerke, swm, eon, e.on, vattenfall, rwe, enbw | Stromversorger |
| strom, gas, fernwaerme, grundversorgung, energie | Energieart-Keywords |
| telekom, vodafone, o2, telefonica, 1und1, 1&1 | Telko-Provider (Festnetz/Internet) |
| unitymedia, kabel deutschland, glasfaser, internet, mobilfunk | Internet-Provider |

**Problem:** Mobilfunk-Vertraege (Handy) gehoeren NICHT zu einem Zuhause, sondern zu `user_subscriptions`. Die aktuelle ENERGY_PATTERNS-Liste mischt Festnetz/Internet (Zuhause) mit Mobilfunk (persoenlich).

### INSURANCE_PATTERNS → `insurance_contracts`
| Pattern | Typische Vertraege |
|---|---|
| allianz, axa, ergo, huk, huk-coburg, devk, generali | Versicherer-Namen |
| zurich, nuernberger, debeka, signal iduna | Versicherer-Namen |
| versicherung, haftpflicht, hausrat, rechtsschutz | Versicherungsart-Keywords |
| berufsunfaehigkeit, krankenversicherung | Versicherungsart-Keywords |
| kfz-versicherung, lebensversicherung | Versicherungsart-Keywords |

### SUBSCRIPTION_PATTERNS → `user_subscriptions`
| Pattern | Kategorie |
|---|---|
| netflix, spotify, amazon prime, disney, apple, youtube, dazn, sky | streaming_video / streaming_music |
| microsoft, adobe, google one, dropbox, icloud | software_saas |
| playstation, xbox, nintendo | gaming |
| fitx, mcfit, urban sports, gym, fitness | fitness |
| zeit, spiegel, faz, sueddeutsche, handelsblatt | news_media |

---

## 5. Identifizierte Fehler und Korrekturplan

### Fehler 1: Energievertraege werden in user_subscriptions abgelegt
**Ursache:** `miety_contracts.home_id` ist NOT NULL, aber bei Konto-Intake fehlt die Zuordnung.
**Fix:** Im `ContractDetectionDialog` einen Home-Picker einbauen. Wenn der User "Energievertrag" waehlt, erscheint ein Dropdown mit den verfuegbaren Homes aus `miety_homes`. Nur wenn ein Home ausgewaehlt ist, wird in `miety_contracts` geschrieben.

### Fehler 2: Mobilfunk in ENERGY_PATTERNS
**Ursache:** `mobilfunk` steht in ENERGY_PATTERNS, gehoert aber zu `user_subscriptions` (persoenliches Abo).
**Fix:** `mobilfunk` aus ENERGY_PATTERNS entfernen, in SUBSCRIPTION_PATTERNS aufnehmen. Telekom/Vodafone/O2 muessen differenziert werden: Festnetz/Internet → Energie, Mobilfunk → Abo. Da dies schwer automatisch zu unterscheiden ist, sollte der Default `user_subscriptions` sein und der User kann manuell auf "Energievertrag" umstellen.

### Fehler 3: Demo-Daten enthalten Telko unter Abonnements
**Ursache:** `demo_user_subscriptions.csv` enthaelt "Telekom Magenta L" (Mobilfunk) und "Vodafone Kabel 1000" (Internet).
**Fix:** 
- "Vodafone Kabel 1000" → Verschieben nach `demo_miety_contracts.csv` (Internet-Vertrag am Zuhause)
- "Telekom Magenta L" → Bleibt in `user_subscriptions` (Mobilfunkvertrag, persoenlich)

### Fehler 4: useContractCreation schreibt nicht in miety_contracts
**Ursache:** Fehlende `home_id` → Workaround mit `utilities_energy` Kategorie.
**Fix:** Die `insertContract`-Funktion um einen `homeId`-Parameter erweitern. Der Dialog liefert bei Energievertraegen die `home_id` mit.

---

## 6. Technische Aenderungen

### Dateien die geaendert werden:

| Datei | Aenderung |
|---|---|
| `src/engines/kontoMatch/spec.ts` | `mobilfunk` aus ENERGY_PATTERNS entfernen; Telko-Provider differenzieren |
| `src/engines/kontoMatch/recurring.ts` | Keine Aenderung (reine Engine-Logik, routing passiert in spec) |
| `src/components/shared/ContractDetectionDialog.tsx` | Home-Picker Dropdown einbauen fuer Energievertraege |
| `src/hooks/useContractCreation.ts` | Echten `miety_contracts`-Insert mit `home_id` implementieren |
| `public/demo-data/demo_user_subscriptions.csv` | "Vodafone Kabel 1000" entfernen |
| `public/demo-data/demo_miety_contracts.csv` | "Vodafone Kabel 1000" als Internet-Vertrag hinzufuegen |
| `src/engines/demoData/data.ts` | Demo-Daten-Konstanten entsprechend anpassen |

### DetectedContract-Typ erweitern:

```typescript
export interface DetectedContract {
  // ... bestehende Felder ...
  homeId?: string;  // NEU: Zuordnung zu einem Zuhause (fuer miety_contracts)
}
```

### Dialog-Erweiterung:

Wenn `targetTable === 'miety_contracts'`:
- Zeige Dropdown mit verfuegbaren Homes (`miety_homes` Query)
- Pflichtfeld: Ohne Home-Auswahl kann der Vertrag nicht als Energievertrag angelegt werden
- Fallback: User kann auf "Abo" umstellen, wenn kein Home passt

### ENERGY_PATTERNS bereinigen:

```typescript
// Verbleiben in ENERGY_PATTERNS (Zuhause-gebunden):
'stadtwerke', 'swm', 'eon', 'e.on', 'vattenfall', 'rwe', 'enbw',
'strom', 'gas', 'fernwaerme', 'grundversorgung', 'energie',
'unitymedia', 'kabel deutschland', 'glasfaser'

// Verschieben nach SUBSCRIPTION_PATTERNS (persoenlich):
'telekom', 'vodafone', 'o2', 'telefonica', '1und1', '1&1',
'internet', 'mobilfunk'
```

**Begruendung:** Telekom/Vodafone/O2 koennen sowohl Festnetz (Zuhause) als auch Mobilfunk (persoenlich) sein. Da die Unterscheidung rein aus Kontobewegungen nicht moeglich ist, landen sie erst in `user_subscriptions`. Der User kann im Dialog manuell auf "Energievertrag" + Home-Zuweisung umstellen.

### Freeze-Status:
- `src/engines/kontoMatch/spec.ts` → Engine-Pfad, nicht gefroren
- `src/hooks/useContractCreation.ts` → Hook-Pfad, nicht gefroren
- `src/components/shared/ContractDetectionDialog.tsx` → Shared-Pfad, nicht gefroren
- `public/demo-data/` → Nicht gefroren
- `src/engines/demoData/data.ts` → Engine-Pfad, nicht gefroren
- Kein Modul-Unfreeze noetig
