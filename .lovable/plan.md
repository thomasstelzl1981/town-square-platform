

## Plan: Projekt-Datenblatt — Datenverlust beheben + Collapsible Sektionen + KI-Button unten

### Problem-Analyse

**Warum sind die Daten verschwunden?**

Das ist ein React-Lifecycle-Problem, kein Datenverlust. Die Daten existieren vollstaendig in der Datenbank (verifiziert per Query). Das Problem:

1. `ProjectDataSheet` wird gerendert, BEVOR der `useDevProjects`-Query fertig geladen hat
2. Alle `useState`-Aufrufe (Zeilen 101-134) initialisieren sich mit `fullProject?.heating_type` etc. — aber `fullProject` ist zu diesem Zeitpunkt noch `undefined`
3. `useState` verwendet den Initialwert NUR beim ersten Render. Wenn die Daten spaeter eintreffen, aktualisieren sich die States NICHT

**Loesung:** Ein `useEffect` der alle Form-States synchronisiert, wenn sich `fullProject` aendert. Alternativ: Component erst rendern wenn Daten geladen sind.

### Aenderungen

#### 1. Daten-Sync via useEffect (ProjectDataSheet.tsx)

Einen zentralen `useEffect` einfuegen, der bei Aenderung von `fullProject` alle Form-States neu setzt:

```typescript
useEffect(() => {
  if (!fullProject) return;
  const intake = (fullProject.intake_data as Record<string, any>) ?? {};
  
  setDescription(fullProject.full_description ?? '');
  setLocationDesc(fullProject.location_description ?? '');
  setHeatingType(fullProject.heating_type ?? '');
  setEnergySource(fullProject.energy_source ?? '');
  setConditionText(fullProject.condition_text ?? '');
  setFloorsCount(fullProject.floors_count ?? 0);
  setSellerName(fullProject.seller_name ?? '');
  // ... alle weiteren Felder
  setDirty(false); // Reset dirty nach Sync
}, [fullProject?.id]); // Nur bei Projektwechsel
```

#### 2. Collapsible Sektionen fuer Beschreibungen

Statt schmaler Textareas werden Objektbeschreibung und Lagebeschreibung als **Collapsible-Sektionen** dargestellt:

- Wenn Text vorhanden: Zeigt Preview (erste 2 Zeilen) + Aufklapp-Chevron
- Aufgeklappt: Volle Textarea, editierbar, auto-height
- Wenn leer: Offen mit Placeholder

```text
┌──────────────────────────────────────────────────────────────────┐
│  Menden Living                               14.077.035 €       │
│  Wunne 6-28, 58706 Menden (Sauerland)                           │
├──────────────────────────────────────────────────────────────────┤
│  PROJEKTBILDER                                                   │
│  [Hero] [Aussen] [Innen] [Umgebung]                             │
├──────────────────────────────────────────────────────────────────┤
│  OBJEKTDATEN (6-Spalten-Grid)                                    │
│  WE:72 | m²:6120 | BJ:1980 | Etg:3 | Zustand | Heizung         │
│  Energie | E-Klasse | Parkpl. | Verkaeufer | Anlagetyp | Ausst. │
├──────────────────────────────────────────────────────────────────┤
│  ▼ OBJEKTBESCHREIBUNG                              148 Woerter   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Die Wohnanlage "Menden Living" befindet sich im Mendener    ││
│  │ Stadtteil Wunne und umfasst insgesamt 72 Wohneinheiten ...  ││
│  │ [voller Text, auto-height, editierbar]                      ││
│  └──────────────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────────────┤
│  ▼ LAGEBESCHREIBUNG                                 79 Woerter   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Einkaufsmoeglichkeiten, Schulen und Kindergaerten ...       ││
│  └──────────────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────────────┤
│  ERWERBSNEBENKOSTEN                                              │
│  Bundesland: [NRW]  GrESt: 6,5%  Notar: 2% (fix)  Ges: 8,5%   │
├──────────────────────────────────────────────────────────────────┤
│  STEUERLICHE PARAMETER                                           │
│  AfA: 2%  Modell: Linear  Grundanteil: 20%                      │
│  WEG: Coeles PM GmbH | 26 EUR/WE  | Einkunftsart: §21 EStG    │
├──────────────────────────────────────────────────────────────────┤
│  [✨ KI-Beschreibung generieren]   [💾 Projekt-Datenblatt speichern] │
└──────────────────────────────────────────────────────────────────┘
```

#### 3. KI-Button nach unten verschieben

Der "KI-Beschreibung generieren"-Button wird aus der Objektbeschreibungs-Sektion entfernt und neben den Speichern-Button im Footer platziert. Logik: Der Button befuellt das gesamte Datenblatt (Beschreibung + Lage), also gehoert er ans Ende — vor dem finalen Speichern.

### Dateien

| Datei | Aenderung |
|---|---|
| `src/components/projekte/ProjectDataSheet.tsx` | 1. useEffect fuer Daten-Sync hinzufuegen, 2. Collapsible fuer Beschreibungen (Radix Collapsible), 3. KI-Button in Footer-Zeile |

### Kein DB-Change, keine Edge-Function-Aenderung

Die Daten sind vollstaendig in der DB vorhanden. Es ist ein reines Frontend-Sync-Problem + UI-Verbesserung.

