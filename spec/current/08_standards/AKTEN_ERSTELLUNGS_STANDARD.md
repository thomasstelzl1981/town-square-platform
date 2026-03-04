# Akten-Erstellungs-Standard (AES)

> Version 1.0 — Stand: 2026-03-04

## Zweck

Dieser Standard definiert den einheitlichen Flow für die Erstellung und Bearbeitung aller Akten (Dossiers), Verträge und Records im System. Ziel ist eine homogene UX über alle Module.

---

## Regel R1 — Immer Inline, nie Dialog/Drawer

Jede Akte/Vertrag wird über einen **Plus-Button** im `ModulePageHeader` eröffnet. Das setzt `showNew = true`, wodurch ein **Inline-Formular unterhalb** des WidgetGrid erscheint.

**VERBOTEN:**
- `<Dialog>` für CRUD-Flows
- `<DetailDrawer>` für CRUD-Flows
- Pop-up-Fenster jeder Art für Dateneingabe

**ERLAUBT:**
- `<Dialog>` für Bestätigungen (Löschen, Consent)
- `<DetailDrawer>` für reine Lese-Ansichten (z.B. DMS-Browser)

## Regel R2 — Plus-Button im ModulePageHeader

Der Einstiegspunkt ist immer der `actions`-Slot des `ModulePageHeader`:

```tsx
<ModulePageHeader
  title="..."
  description="..."
  actions={<Button onClick={() => setShowNew(true)}><Plus />Neu</Button>}
/>
```

## Regel R3 — Formular unter dem WidgetGrid

```text
[ModulePageHeader]
[WidgetGrid mit bestehenden Einträgen]
[InlineCreateCard / InlineEditCard]  ← showNew || selectedId
```

## Regel R4 — Buttons bei Neuanlage

- **Speichern** (primär, rechts)
- **Abbrechen** (ghost, links)

## Regel R5 — Buttons bei Bearbeitung

- **Speichern** (primär, rechts)
- **Löschen** (destructive, links) — nur wenn `!isDemoId(id)`

## Regel R6 — Query-Invalidierung

Nach Speichern immer **Prefix-basierte Invalidierung**:
```ts
queryClient.invalidateQueries({ queryKey: ['miety-contracts'] }); // prefix match
```

## Regel R7 — Demo-Löschschutz

Demo-Einträge (`isDemoId(id)` → `d0000000-*` oder `e0000000-*`) sind löschgeschützt.

---

## Datenraum-Entstehung (DMS-Flow)

Beim Speichern einer neuen Akte:

1. **DB-Insert** → UUID via `crypto.randomUUID()` oder DB-Default `gen_random_uuid()`
2. **DMS-Tree-Creation** → `useRecordCardDMS.createDMS()`:
   - Liest `dmsFolders` aus `RECORD_CARD_TYPES[entityType]`
   - Erstellt Unterordner in `dms_folders`
3. **Storage-Pfad**: `{tenantId}/{moduleCode}/{entityId}/{ordner}/{dateiname}`

## ID-Vergabe

- Alle IDs: UUID v4
- Demo-Ranges: `d0000000-*`, `e0000000-*` (reserviert)
- Client-seitig vergeben bei Insert (nicht von DB generiert)

---

## Akten-Typen-Registry

Jeder Aktentyp MUSS in `src/config/recordCardManifest.ts` als `RecordCardTypeConfig` registriert sein:

| Typ | Module | Icon | DMS-Ordner |
|-----|--------|------|-----------|
| person | MOD_01 | User | 8 |
| insurance | MOD_18 | Shield | 5 |
| vehicle | MOD_17 | Car | 5 |
| pv_plant | MOD_19 | Sun | 8 |
| vorsorge | MOD_18 | Heart | 4 |
| subscription | MOD_18 | CreditCard | 0 |
| bank_account | MOD_18 | Landmark | 0 |
| pet | MOD_05 | PawPrint | 4 |
| utility_contract | MOD_20 | Zap | 4 |
| rental_contract | MOD_20 | Home | 5 |
| kv_contract | MOD_18 | Heart | 3 |
| private_loan | MOD_18 | CreditCard | 3 |
| camera | MOD_20 | Camera | 0 |

---

## Vertragskategorien

### Versorgungsverträge (miety_contracts.category)

`strom`, `gas`, `wasser`, `internet`, `mobilfunk`, `hausrat`, `haftpflicht`, `miete`, `sonstige`

### Privatkredite (private_loans.loan_purpose)

`autokredit`, `konsumkredit`, `moebel`, `bildung`, `umschuldung`, `leasing` (pending MOD-18 unfreeze), `sonstiges`

---

## Compliance-Status

| Modul | Aktentyp | AES-konform | Status |
|-------|----------|-------------|--------|
| MOD-18 | Sachversicherung | ✅ Inline | OK |
| MOD-18 | Krankenversicherung | ✅ Inline | OK |
| MOD-18 | Vorsorge | ✅ Inline | OK |
| MOD-18 | Abonnement | ✅ Inline | OK |
| MOD-18 | Privatkredit | ✅ Inline | OK |
| MOD-18 | Bankkonto | ❌ Dialog | **BLOCKED** (MOD-18 frozen) |
| MOD-17 | Fahrzeug | ✅ Inline | OK |
| MOD-19 | PV-Anlage | ✅ Inline | OK |
| MOD-20 | Zuhause | ✅ Inline | OK |
| MOD-20 | Versorgungsvertrag | ✅ Inline | **FIXED** (v1.0) |
| MOD-20 | Kamera | ✅ Inline | **FIXED** (v1.0) |
| MOD-05 | Haustier | ❌ Dialog | **BLOCKED** (MOD-05 frozen) |
| MOD-01 | Person | ✅ Inline | OK |

### Offene Punkte (Freeze-bedingt)

- `leasing` in DarlehenTab (MOD-18 frozen)
- AddBankAccountDialog → Inline (MOD-18 frozen)
- PetsMeineTiere Dialog → Inline (MOD-05 frozen)
- architectureValidator Erweiterung (infra frozen)
