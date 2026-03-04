

## System-Audit: Akten, Verträge und Erstellungsflows — Vollständige Analyse

---

### A. Inventar aller Akten-Typen (recordCardManifest.ts)

Das System kennt aktuell **8 Akten-Typen** im `RECORD_CARD_TYPES`:

```text
┌─────────────────┬──────────┬───────────┬────────────────────────────┐
│ Akten-Typ       │ Modul    │ DMS-Ordner│ Erstellungsort             │
├─────────────────┼──────────┼───────────┼────────────────────────────┤
│ person          │ MOD_01   │ 8 Ordner  │ MOD-01 Stammdaten          │
│ insurance       │ MOD_18   │ 5 Ordner  │ MOD-18 Sachversicherungen  │
│ vehicle         │ MOD_17   │ 5 Ordner  │ MOD-17 Fahrzeuge           │
│ pv_plant        │ MOD_19   │ 8 Ordner  │ MOD-19 Photovoltaik        │
│ vorsorge        │ MOD_18   │ 4 Ordner  │ MOD-18 Vorsorge            │
│ subscription    │ MOD_18   │ 0 Ordner  │ MOD-18 Abonnements         │
│ bank_account    │ MOD_18   │ 0 Ordner  │ MOD-18 Konten              │
│ pet             │ MOD_05   │ 4 Ordner  │ MOD-05 Meine Tiere         │
└─────────────────┴──────────┴───────────┴────────────────────────────┘
```

**Fehlende Akten-Typen** (nicht im Manifest registriert):

| Fehlend | Wo es hingehört | DB-Tabelle | Status |
|---------|----------------|------------|--------|
| **Zuhause/Wohnung** | MOD_20 | `miety_homes` | Existiert, aber kein RecordCard-Typ |
| **Versorgungsvertrag** | MOD_20 | `miety_contracts` | Existiert, aber kein RecordCard-Typ |
| **Kamera/Smart Home** | MOD_20 | `cameras` | Existiert, aber kein RecordCard-Typ |
| **Privatkredit** | MOD_18 | `private_loans` | Existiert, aber kein RecordCard-Typ |
| **Krankenversicherung** | MOD_18 | `kv_contracts` | Existiert, aber kein RecordCard-Typ |

---

### B. Inventar aller Vertragsarten und ihre Kategorien

#### MOD-18 (Finanzanalyse) — Darlehen
`private_loans.loan_purpose` Optionen:
- `autokredit`, `konsumkredit`, `moebel`, `bildung`, `umschuldung`, `sonstiges`

**Fehlt:** `leasing` — Leasing-Verträge können aktuell NICHT als Privatkredit angelegt werden. In der Selbstauskunft (MOD-07) existiert `leasing` als Verbindlichkeitstyp, aber im DarlehenTab fehlt es.

#### MOD-20 (Zuhause) — Versorgungsverträge
`miety_contracts.category` Optionen:
- `strom`, `gas`, `wasser`, `internet`, `hausrat`, `haftpflicht`, `miete`, `sonstige`

**Fehlt:** `mobilfunk` / `telefon` — kein eigener Kategorietyp. Mobilfunkverträge müssten aktuell als `sonstige` angelegt werden.

**Fehlt:** `mietvertrag` existiert als Kategorie `miete` im CATEGORY_CONFIG, aber es gibt keinen dedizierten Erstellungsflow dafür (der ContractDrawer erlaubt zwar alle Kategorien, aber der Mietvertrag hat keine spezifischen Felder wie Kaltmiete, Nebenkosten, Vermieter, Kündigungsfrist).

---

### C. Erstellungs-Flow-Analyse (Pattern-Homogenität)

```text
┌─────────────────────────┬──────────┬──────────────┬───────────┬──────────────┐
│ Aktentyp                │ Modul    │ UI-Pattern   │ +Button   │ Speichern/   │
│                         │          │              │           │ Löschen      │
├─────────────────────────┼──────────┼──────────────┼───────────┼──────────────┤
│ Sachversicherung        │ MOD-18   │ ✅ INLINE     │ ✅ Header  │ ✅ Inline     │
│ Krankenversicherung     │ MOD-18   │ ✅ INLINE     │ ✅ Header  │ ✅ Inline     │
│ Vorsorge                │ MOD-18   │ ✅ INLINE     │ ✅ Header  │ ✅ Inline     │
│ Abonnement              │ MOD-18   │ ✅ INLINE     │ ✅ Header  │ ✅ Inline     │
│ Privatkredit            │ MOD-18   │ ✅ INLINE     │ ✅ Dropdown│ ✅ Inline     │
│ Bankkonto               │ MOD-18   │ ❌ DIALOG     │ ❌ Dialog  │ ❌ Dialog     │
│ Fahrzeug                │ MOD-17   │ ✅ INLINE     │ ✅ Header  │ ✅ Inline     │
│ PV-Anlage               │ MOD-19   │ ✅ INLINE     │ ✅ Header  │ ✅ Inline     │
│ Zuhause (Wohnung)       │ MOD-20   │ ✅ INLINE     │ ✅ Header  │ ✅ Inline     │
│ Versorgungsvertrag      │ MOD-20   │ ❌ DRAWER     │ ❌ Drawer  │ ❌ Drawer     │
│ Kamera                  │ MOD-20   │ ❌ DIALOG     │ ❌ Dialog  │ ❌ Dialog     │
│ Haustier                │ MOD-05   │ ❌ DIALOG     │ ❌ Dialog  │ ❌ Dialog     │
│ Person (Haushalt)       │ MOD-01   │ ✅ INLINE     │ ✅ Header  │ ✅ Inline     │
└─────────────────────────┴──────────┴──────────────┴───────────┴──────────────┘
```

**4 Abweichler** vom Soll-Standard (Inline):
1. `AddBankAccountDialog` — MOD-18 Konten
2. `ContractDrawer` — MOD-20 Versorgungsverträge
3. `AddCameraDialog` — MOD-20 Smart Home
4. `PetsMeineTiere` Dialog — MOD-05 Haustiere

---

### D. Vollständiges Konzept: Akten-Erstellungs-Standard (AES)

#### D.1 — Der Standard-Flow (Soll-Zustand)

```text
SCHRITT 1: ANLAGE
┌──────────────────────────────────────────────┐
│ ModulePageHeader                             │
│   [Titel]  [Beschreibung]        [＋ Button] │
└──────────────────────────────┬───────────────┘
                               │ onClick
                               ▼
                    setShowNew(true)
                               │
                               ▼
┌──────────────────────────────────────────────┐
│ WidgetGrid (bestehende Akten als Tiles)      │
│  ┌─────┐ ┌─────┐ ┌─────┐                    │
│  │Akte1│ │Akte2│ │Akte3│                     │
│  └─────┘ └─────┘ └─────┘                    │
└──────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────┐
│ INLINE CREATE CARD (showNew = true)          │
│                                              │
│  ┌─ Formularfelder ───────────────────────┐  │
│  │ Feld 1: ___________                    │  │
│  │ Feld 2: ___________                    │  │
│  │ Feld 3: ___________                    │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [Abbrechen]              [💾 Speichern]     │
└──────────────────────────────────────────────┘

SCHRITT 2: WIDGET ENTSTEHT
Nach Speichern: Query-Invalidierung → neues Widget-Tile im Grid

SCHRITT 3: BEARBEITEN
Klick auf Widget-Tile → selectedId wird gesetzt →
Inline-Detail-Card erscheint unter dem Grid mit:
  [Speichern]  [🗑 Löschen]
```

#### D.2 — Regeln

| # | Regel | Begründung |
|---|-------|------------|
| R1 | Immer Inline, nie Dialog/Drawer | Konsistente UX über alle Module |
| R2 | Plus-Button immer im ModulePageHeader | Einheitlicher Einstiegspunkt |
| R3 | Formular erscheint unter dem WidgetGrid | Kein Kontextverlust, Grid bleibt sichtbar |
| R4 | Buttons: Speichern (primär) + Abbrechen (ghost) | Für neue Einträge |
| R5 | Buttons: Speichern (primär) + Löschen (destructive) | Für bestehende Einträge |
| R6 | Nach Speichern: Prefix-basierte Query-Invalidierung | Alle abhängigen Queries werden aktualisiert |
| R7 | Demo-Einträge (isDemoId) sind löschgeschützt | Konsistenz mit DemoData-Governance |

#### D.3 — Datenraum-Entstehung (DMS-Flow)

Beim Speichern einer neuen Akte:

1. **DB-Insert** → Erzeugt den Datensatz mit UUID (`crypto.randomUUID()`)
2. **DMS-Tree-Creation** → `useRecordCardDMS.createDMS()` wird aufgerufen mit:
   - `entityType` → schlägt in `RECORD_CARD_TYPES` die `dmsFolders` nach
   - `entityId` → die neue UUID
   - `tenantId` → aus AuthContext
   - Erzeugt in `dms_folders` automatisch die definierten Unterordner
3. **Storage-Pfad** → `{tenantId}/{moduleCode}/{entityId}/{ordner}/{dateiname}`

**ID-Vergabe:**
- Alle IDs sind UUIDs (`crypto.randomUUID()` oder DB-Default `gen_random_uuid()`)
- Demo-IDs nutzen reservierte Ranges: `d0000000-*` und `e0000000-*`
- Die ID wird bei Client-Insert vergeben, nicht erst von der DB

#### D.4 — Fehlende Einträge zum Ergänzen

**Im recordCardManifest.ts:**

| Neuer Typ | label | moduleCode | icon | dmsFolders |
|-----------|-------|------------|------|------------|
| `utility_contract` | Versorgungsvertrag | MOD_20 | Zap | `01_Vertrag`, `02_Rechnung`, `03_Zaehlerstand`, `04_Sonstiges` |
| `rental_contract` | Mietvertrag | MOD_20 | Home | `01_Mietvertrag`, `02_Nebenkostenabrechnung`, `03_Uebergabeprotokoll`, `04_Korrespondenz`, `05_Sonstiges` |
| `kv_contract` | Krankenversicherung | MOD_18 | Heart | `01_Police`, `02_Abrechnungen`, `03_Korrespondenz` |
| `private_loan` | Privatkredit | MOD_18 | CreditCard | `01_Vertrag`, `02_Tilgungsplan`, `03_Korrespondenz` |
| `camera` | Smart Home Kamera | MOD_20 | Camera | — |

**In miety_contracts CATEGORY_CONFIG:**
- `mobilfunk` hinzufügen (Label: "Mobilfunk", Icon: Smartphone)

**In DarlehenTab PURPOSE_OPTIONS:**
- `leasing` hinzufügen (Label: "Leasing")

**Mietvertrag-Felder** (neue Felder in `miety_contracts` oder eigene Tabelle):
- `kaltmiete`, `nebenkosten_vorauszahlung`, `kaution`, `kuendigungsfrist`, `vermieter_name`, `vermieter_kontakt`

---

### E. Implementierungsplan (priorisiert)

| # | Aufgabe | Dateien |
|---|---------|---------|
| 1 | `recordCardManifest.ts` erweitern um 5 fehlende Typen | `src/config/recordCardManifest.ts` |
| 2 | `mobilfunk` als Kategorie in `miety_contracts` CATEGORY_CONFIG hinzufügen | `MietyContractsSection.tsx`, `ContractDrawer.tsx`, `VertraegeTab.tsx` |
| 3 | `leasing` in DarlehenTab PURPOSE_OPTIONS hinzufügen | `DarlehenTab.tsx` |
| 4 | Mietvertrag-Felder: DB-Migration für spezifische Felder | Migration |
| 5 | **Haustier** → Dialog zu Inline umbauen | `PetsMeineTiere.tsx` |
| 6 | **Bankkonto** → Dialog zu Inline umbauen | `KontenTab.tsx`, `AddBankAccountDialog.tsx` entfernen |
| 7 | **Versorgungsvertrag** → Drawer zu Inline umbauen | `ContractDrawer.tsx` → Inline, `VersorgungTile.tsx` |
| 8 | **Kamera** → Dialog zu Inline umbauen | `AddCameraDialog.tsx` → Inline, `SmartHomeTile.tsx` |
| 9 | Spec-Dokument erstellen | `spec/current/08_standards/AKTEN_ERSTELLUNGS_STANDARD.md` |

---

### F. Langfristige Sicherung: Architektur-Validator

Um zukünftige Abweichungen zu verhindern, wird der `architectureValidator.ts` um eine Prüfung erweitert:
- Warnung bei Import von `Dialog` oder `DetailDrawer` in Dateien, die ein CRUD-Pattern implementieren (erkennbar an `showNew`, `mutation`, `insert`)
- Warnung bei neuen Akten-Typen ohne Eintrag im `recordCardManifest.ts`

