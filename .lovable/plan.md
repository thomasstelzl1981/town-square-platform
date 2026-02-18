

# Konten-Tab in Finanzanalyse: Neuer Menuepunkt mit Zuordnungslogik

## Ausgangslage

Die Konten (`msv_bank_accounts`) werden aktuell am Ende der Uebersicht (`/portal/finanzanalyse/dashboard`) angezeigt, eingebettet als `KontenBlock`-Funktion. Das ist nach der Neustrukturierung der Finanzuebersicht nicht mehr sinnvoll.

**Aktuelles Problem**: Die Tabelle `msv_bank_accounts` hat nur eine `tenant_id`-Zuordnung — es gibt keine Felder fuer die fachliche Zuordnung eines Kontos zu einer Person, einer Vermietereinheit oder einer PV-Anlage. Damit kann die spaetere End-to-End-Kontenauslese nicht unterscheiden, welches Konto zu wem/wohin gehoert.

---

## Aenderungen

### 1. DB-Migration: `msv_bank_accounts` erweitern

Zwei neue Spalten fuer die polymorphe Zuordnung:

```text
ALTER TABLE msv_bank_accounts ADD COLUMN owner_type TEXT;
ALTER TABLE msv_bank_accounts ADD COLUMN owner_id UUID;
```

**`owner_type`** — einer von drei Werten:
- `person` — Zuordnung zu einer `household_persons`-ID (Privatkonten, Depots)
- `property_context` — Zuordnung zu einer Vermietereinheit (`property_contexts`-ID aus MOD-04)
- `pv_plant` — Zuordnung zu einer PV-Anlage (`pv_plants`-ID aus MOD-19)

**`owner_id`** — die UUID der jeweiligen Entitaet

Beide Spalten sind nullable (bestehende Konten behalten ihre Zuordnung vorerst ohne owner). Kein Foreign Key Constraint, da die Referenz polymorph ist (3 verschiedene Tabellen).

### 2. Neuer Tab: `KontenTab.tsx`

Erstellt als `src/pages/portal/finanzanalyse/KontenTab.tsx`.

**Aufbau:**
- ModulePageHeader "Konten" mit "+" Button (oeffnet AddBankAccountDialog — erweitert)
- WidgetGrid mit allen Konten als Kacheln (gleiche Darstellung wie bisher im UebersichtTab)
- Demo-Konto weiterhin ueber `GP-KONTEN` Toggle
- Klick auf Konto oeffnet `KontoAkteInline` darunter (bestehendes Pattern)
- 12-Monats-Scan Button bleibt hier

Die gesamte `KontenBlock`-Funktion (Zeilen 112-246) wird aus `UebersichtTab.tsx` entfernt und in den neuen Tab verschoben.

### 3. `AddBankAccountDialog` erweitern

Der bestehende Dialog (`src/components/shared/AddBankAccountDialog.tsx`) erhaelt ein neues Select-Feld **"Zuordnung"** mit drei Optionen:

1. **Person im Haushalt** — laedt `household_persons` und zeigt Dropdown mit Vorname + Nachname
2. **Vermietereinheit** — laedt `property_contexts` und zeigt Dropdown mit Context-Name
3. **Photovoltaik-Anlage** — laedt `pv_plants` und zeigt Dropdown mit Anlagenname

Bei Auswahl werden `owner_type` und `owner_id` in den INSERT geschrieben.

### 4. `KontoAkteInline` erweitern

Die bestehende Inline-Detailansicht erhaelt in Sektion 1 ("Kontodaten und Kategorisierung") ein zusaetzliches Anzeige-/Edit-Feld fuer die Zuordnung:

- Anzeige des aktuellen Owners (Name + Typ-Badge: "Person", "Vermietereinheit", "PV-Anlage")
- Aenderbar per Select (gleiche Logik wie im AddDialog)

### 5. Route und Navigation einfuegen

**`routesManifest.ts`** — Neuer Eintrag zwischen "Uebersicht" und "Investment":

```text
tiles: [
  { path: "dashboard", ..., title: "Uebersicht", default: true },
  { path: "konten", component: "FinanzenKonten", title: "Konten" },     // NEU
  { path: "investment", ..., title: "Investment" },
  ...
]
```

**`FinanzanalysePage.tsx`** — Neue Route:

```text
<Route path="konten" element={<KontenTab />} />
```

### 6. `UebersichtTab.tsx` bereinigen

- `KontenBlock`-Funktion komplett entfernen (Zeilen 112-246)
- Imports entfernen: `KontoAkteInline`, `DEMO_KONTO`, `DEMO_KONTO_IBAN_MASKED`, `Landmark`, `ScanSearch`, `CreditCard`, `useDemoToggles` (falls nur dort verwendet)
- Die Uebersicht zeigt dann nur noch: Personen im Haushalt + Finanzbericht

---

## Technische Uebersicht

| Datei | Aenderung |
|-------|-----------|
| DB Migration | `msv_bank_accounts` + `owner_type` (TEXT) + `owner_id` (UUID) |
| `src/pages/portal/finanzanalyse/KontenTab.tsx` | Neuer Tab — uebernimmt KontenBlock aus UebersichtTab |
| `src/pages/portal/FinanzanalysePage.tsx` | Neue Route `konten` einfuegen |
| `src/manifests/routesManifest.ts` | Neuer Tile-Eintrag "Konten" zwischen Uebersicht und Investment |
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | KontenBlock + Scan-Button entfernen |
| `src/components/shared/AddBankAccountDialog.tsx` | Zuordnungs-Select (owner_type + owner_id) hinzufuegen |
| `src/components/finanzanalyse/KontoAkteInline.tsx` | Zuordnungs-Anzeige und -Aenderung in Sektion 1 |

## Umsetzungsreihenfolge

1. DB-Migration: `owner_type` + `owner_id` auf `msv_bank_accounts`
2. `KontenTab.tsx` erstellen (KontenBlock-Logik verschieben)
3. `FinanzanalysePage.tsx` + `routesManifest.ts` — Route und Navigation
4. `UebersichtTab.tsx` — KontenBlock entfernen
5. `AddBankAccountDialog.tsx` — Zuordnungs-Select
6. `KontoAkteInline.tsx` — Owner-Anzeige/Edit
