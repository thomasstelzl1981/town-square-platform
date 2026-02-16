

# Vorsorge-Lueckenrechner: Transparente Datenanzeige mit Inline-Bearbeitung

## Ziel

Den Lueckenrechner so umbauen, dass alle Berechnungsdaten offen sichtbar und direkt editierbar sind. Statt "Daten fehlen" mit Link zur Personenakte zeigt der Rechner die konkreten Felder — leer oder befuellt — und erlaubt das direkte Speichern.

## Neues Layout

```text
┌─────────────────────────────────────────────────────┐
│ [Shield] Vorsorge-Lueckenrechner                    │
│ Transparenz ueber Ihre Altersvorsorge- und BU-...   │
│                                                     │
│ [Max Mustermann] [Lisa Mustermann]   <- Chips       │
│                                                     │
│ ┌─── DATENBASIS (Collapsible, default offen) ─────┐ │
│ │                                                  │ │
│ │  Persoenliche Daten                              │ │
│ │  ┌──────────────┬──────────────┬────────────┐    │ │
│ │  │ Netto mtl.   │ Brutto mtl.  │ Status     │    │ │
│ │  │ [3.200 EUR]  │ [5.200 EUR]  │ [angest.]  │    │ │
│ │  ├──────────────┴──────────────┴────────────┤    │ │
│ │  │ Geplanter Renteneintritt: [01.07.2040]   │    │ │
│ │  └──────────────────────────────────────────┘    │ │
│ │                                                  │ │
│ │  Gesetzliche Renteninformation (DRV/Pension)     │ │
│ │  ┌──────────────┬──────────────┬────────────┐    │ │
│ │  │ Altersrente  │ EM-Rente     │ Typ        │    │ │
│ │  │ [1.200 EUR]  │ [800 EUR]    │ [DRV]      │    │ │
│ │  └──────────────┴──────────────┴────────────┘    │ │
│ │                                                  │ │
│ │  Vorsorge-Vertraege (Altersvorsorge)             │ │
│ │  ┌────────────────────────────────────────────┐  │ │
│ │  │ Alte Leipziger Ruerup                      │  │ │
│ │  │ Guthaben: 21.000  Rente: -  Sparrate: 250 │  │ │
│ │  ├────────────────────────────────────────────┤  │ │
│ │  │ Allianz bAV                                │  │ │
│ │  │ Guthaben: 14.400  Rente: -  Sparrate: 200 │  │ │
│ │  └────────────────────────────────────────────┘  │ │
│ │                                                  │ │
│ │  BU-Absicherung                                  │ │
│ │  ┌────────────────────────────────────────────┐  │ │
│ │  │ Alte Leipziger BU  -> BU-Rente: 3.000/mtl. │  │ │
│ │  │ Ruerup BU-Zusatz   -> BU-Rente: 2.000/mtl. │  │ │
│ │  └────────────────────────────────────────────┘  │ │
│ │                                                  │ │
│ │  [Aenderungen speichern]                         │ │
│ └──────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─── ALTERSVORSORGE-LUECKE ───────────────────────┐ │
│ │  (Berechnung wie bisher: Slider, Progress, Gap) │ │
│ └──────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─── BU/EU-LUECKE ───────────────────────────────┐  │
│ │  (Berechnung wie bisher: Slider, Progress, Gap) │ │
│ └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Aenderungen

### Datei: `src/components/portal/finanzanalyse/VorsorgeLueckenrechner.tsx`

**Props erweitern:**

```text
VORHER:
  persons: any[]
  pensionRecords: any[]
  contracts: any[]

NACHHER:
  persons: any[]
  pensionRecords: any[]
  contracts: any[]
  onUpdatePerson?: (person: Record<string, any>) => Promise<void>
  onUpsertPension?: (data: { personId, projected_pension, disability_pension, pension_type }) => Promise<void>
  onUpdateContract?: (contract: Record<string, any>) => Promise<void>
```

**Neuer Abschnitt "Datenbasis" (zwischen Personen-Chips und Altersvorsorge-Karte):**

Collapsible-Bereich (Radix `Collapsible`, bereits installiert) mit 4 Unter-Sektionen:

1. **Persoenliche Daten** — Editierbare Felder:
   - Nettoeinkommen mtl. (number)
   - Bruttoeinkommen mtl. (number)
   - Beschaeftigungsstatus (Select: Angestellt, Selbstaendig, Beamter)
   - Geplanter Renteneintritt (date)
   - Bei Beamten: Ruhegehaltfaehiges Grundgehalt + Dienstjahre

2. **Gesetzliche Renteninformation** — Editierbare Felder:
   - Prognostizierte Altersrente (number)
   - Erwerbsminderungsrente (number)
   - Rententyp (Select: DRV / Beamtenpension)
   - Wenn leer: Felder werden angezeigt mit Placeholder, nicht als "Daten fehlen"

3. **Altersvorsorge-Vertraege** — Readonly-Tabelle:
   - Zeigt alle Vertraege die in die Altersvorsorge-Berechnung fliessen
   - Spalten: Anbieter, Typ, Guthaben, Monatl. Rente, Sparrate, Hochgerechneter Wert
   - Nicht editierbar hier (Verwaltung bleibt oben in den Widget-Kacheln)

4. **BU-Absicherung** — Readonly-Tabelle:
   - Zeigt alle Vertraege mit BU-Leistung (bu_monthly_benefit oder reine BU-Vertraege)
   - Spalten: Anbieter, Typ, BU-Rente mtl.

**Speichern-Button:**
- Sichtbar nur wenn Aenderungen an Person oder Pension vorliegen
- Ruft `onUpdatePerson` und/oder `onUpsertPension` auf
- Toast-Feedback bei Erfolg
- Nach dem Speichern aktualisiert sich die Berechnung automatisch (React re-render)

**Bisherige "Daten fehlen"-Warnungen entfernen:**
- Kein separater "Nettoeinkommen nicht hinterlegt"-Banner mehr
- Kein "In Personenakte ergaenzen"-Link mehr
- Stattdessen: Leere Felder sind direkt sichtbar und editierbar
- Felder mit fehlendem Wert bekommen einen dezenten gelben Rand als visuellen Hinweis

### Datei: `src/pages/portal/finanzanalyse/VorsorgeTab.tsx`

Callbacks aus `useFinanzanalyseData()` an den Rechner durchreichen:

```text
<VorsorgeLueckenrechner
  persons={...}
  pensionRecords={pensionRecords}
  contracts={contracts}
  onUpdatePerson={async (p) => {
    await updatePerson.mutateAsync(p);
  }}
  onUpsertPension={async (data) => {
    await upsertPension.mutateAsync(data);
  }}
  onUpdateContract={async (c) => {
    await updateMutation.mutateAsync(c);
  }}
/>
```

Dazu wird `updatePerson` und `upsertPension` aus `useFinanzanalyseData()` geholt (sind bereits exportiert).

### Lokaler State im Rechner

```text
// Editierbare Kopie der Person-Daten fuer die ausgewaehlte Person
const [editPerson, setEditPerson] = useState<Partial<VLPersonInput>>({})

// Editierbare Kopie der Pension-Daten
const [editPension, setEditPension] = useState<Partial<VLPensionInput>>({})

// Dirty-Tracking: hat der User etwas geaendert?
const [isDirty, setIsDirty] = useState(false)
```

Bei Personenwechsel (Chip-Klick) werden die Edit-States zurueckgesetzt.

### Betroffene Dateien (Gesamt)

| Datei | Aenderung |
|---|---|
| `src/components/portal/finanzanalyse/VorsorgeLueckenrechner.tsx` | Kompletter Umbau: Datenbasis-Sektion mit editierbaren Feldern, Vertrags-Tabellen, Speichern-Button, "Daten fehlen"-Warnungen entfernt |
| `src/pages/portal/finanzanalyse/VorsorgeTab.tsx` | Callbacks `onUpdatePerson`, `onUpsertPension`, `onUpdateContract` an Rechner durchreichen |

Keine DB-Migration noetig. Keine neuen Abhaengigkeiten.

