
# Konten-Zuordnung: Kategorie-Dropdown durch echte Zuordnung ersetzen

## Problem

In der KontoAkteInline gibt es aktuell zwei separate Bereiche:
1. **"Kategorie"** (Zeile 175) — ein einfacher Dropdown mit generischen Werten (Privat, Vermietung, PV, Tagesgeld, Sonstiges)
2. **"Zuordnung"** (Zeile 188) — nur fuer echte Konten sichtbar (`!isDemo`), zweistufig (Typ + Inhaber)

Diese Trennung ist verwirrend und die Demo zeigt die Zuordnung gar nicht. Der "Kategorie"-Dropdown muss durch einen einzigen **"Zuordnung"-Dropdown** ersetzt werden, der Personen, Vermietereinheiten und PV-Anlagen direkt anzeigt — auch fuer das Demo-Konto.

## Aenderungen

### 1. `DEMO_KONTO` erweitern (`src/constants/demoKontoData.ts`)

Dem Demo-Konto-Objekt `owner_type` und `owner_id` hinzufuegen:

```
owner_type: 'property' (Vermietereinheit)
owner_id: 'd0000000-0000-4000-a000-000000000010' (landlordContextId aus Demo-Daten)
```

Die `KONTO_CATEGORIES`-Konstante wird nicht mehr benoetigt und kann entfernt werden.

### 2. `KontoAkteInline` ueberarbeiten (`src/components/finanzanalyse/KontoAkteInline.tsx`)

**Kategorie-Dropdown entfernen** (Zeile 175-184): Das gesamte Kategorie-Feld wird entfernt.

**Zuordnung fuer alle sichtbar machen**: Der Block `{!isDemo && (...)}` (Zeile 188-224) wird zu einem einzigen **"Zuordnung"**-Feld direkt im Kontodaten-Grid (Sektion 1). Es wird:

- Fuer **Demo-Konten**: Einen **read-only** Zuordnungswert anzeigen (z.B. "Vermietereinheit: Mustermann Immobilien"), basierend auf den statischen Demo-Daten. Es wird ein kombinierter Select gezeigt, der disabled ist.
- Fuer **echte Konten**: Einen **editierbaren** kombinierten Select zeigen mit allen drei Gruppen als Optionen:
  - **Personen im Haushalt** — aus `household_persons`
  - **Vermietereinheiten** — aus `properties` (oder `property_contexts` je nach Verfuegbarkeit)
  - **PV-Anlagen** — aus `pv_plants`

Der Select wird als **einzelner Dropdown** gestaltet (kein zweistufiger Typ+Inhaber mehr), in dem die Optionen gruppiert sind:

```
[Zuordnung waehlen...]
--- Personen ---
  Max Mustermann
  Lisa Mustermann
--- Vermietereinheiten ---
  Berliner Str. 42
  Maximilianstr. 8
--- PV-Anlagen ---
  PV-Anlage 32.4 kWp
```

Bei Auswahl werden `owner_type` und `owner_id` automatisch gesetzt und gespeichert.

### 3. Demo-Daten fuer Zuordnung bereitstellen

Da im Demo-Modus keine DB-Abfragen laufen, werden die Demo-Optionen direkt aus den Demo-Daten geladen:

- **Personen**: Max Mustermann (`DEMO_PRIMARY_PERSON_ID`), Lisa Mustermann (`ID_LISA`) — aus `src/engines/demoData/data.ts`
- **Vermietereinheit**: landlordContextId — aus `DEMO_PORTFOLIO`
- **PV-Anlage**: pvPlantIds[0] — aus `DEMO_PORTFOLIO`

### 4. `AddBankAccountDialog` anpassen (`src/components/shared/AddBankAccountDialog.tsx`)

Den zweistufigen Select (Zuordnungstyp + Inhaber) ebenfalls durch einen **einzelnen gruppierten Dropdown** ersetzen, der alle verfuegbaren Personen, Immobilien und PV-Anlagen in einer Liste zeigt. Die Logik laedt alle drei Entitaetstypen gleichzeitig und gruppiert sie im Select.

### 5. `KontenTab.tsx` — Demo-Kachel Badge aktualisieren

Die hardcoded Badge "Vermietung" (Zeile 111) wird durch die tatsaechliche Zuordnungsbezeichnung ersetzt (z.B. "Vermietereinheit").

---

## Technische Uebersicht

| Datei | Aenderung |
|-------|-----------|
| `src/constants/demoKontoData.ts` | `owner_type` + `owner_id` zum DEMO_KONTO hinzufuegen, `KONTO_CATEGORIES` entfernen |
| `src/components/finanzanalyse/KontoAkteInline.tsx` | Kategorie-Dropdown entfernen, Zuordnung als gruppierten Select in Sektion 1, auch fuer Demo sichtbar (read-only) |
| `src/components/shared/AddBankAccountDialog.tsx` | Zweistufigen Select durch einzelnen gruppierten Dropdown ersetzen |
| `src/pages/portal/finanzanalyse/KontenTab.tsx` | Demo-Kachel Badge dynamisch aus owner_type |

## Reihenfolge

1. `demoKontoData.ts` — Demo-Konto mit owner_type/owner_id erweitern
2. `KontoAkteInline.tsx` — Kategorie entfernen, gruppierte Zuordnung einbauen (Demo + echte Konten)
3. `AddBankAccountDialog.tsx` — Gleicher gruppierter Zuordnungs-Select
4. `KontenTab.tsx` — Badge-Update
