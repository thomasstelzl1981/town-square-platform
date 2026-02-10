
# MOD-13: Verkäufergesellschaft Freitext + DMS-Seeding bei manueller Anlage

## Befund

### Was bereits funktioniert
- **Magic Intake** (Edge Function `sot-project-intake`): Erzeugt automatisch Projekt, Units, Storage-Tree (7 Projektordner + Unit-Ordner mit je 5 Unterordnern), kopiert Expose/Preisliste in die richtigen Ordner
- **Public IDs:** DB-Trigger erzeugt SOT-BT-* (Projekte) und SOT-BE-* (Units) automatisch
- **`useProjectDMS` Hook:** `initializeProjectDMS` existiert fuer manuellen DMS-Tree-Aufbau

### Was fehlt
1. **Manuelle Projektanlage (`CreateProjectDialog`):** Ruft KEIN `initializeProjectDMS` / `seedStorageTree` auf -- Projekt wird ohne DMS-Ordner erstellt
2. **Verkäufergesellschaft:** Nur Dropdown-Auswahl aus bestehenden `developer_contexts`. Keine Freitext-Eingabe moeglich. Nutzer muss vorher ueber `/portal/projekte/kontexte` eine Gesellschaft anlegen

---

## Aenderungen

### 1. Verkäufergesellschaft: Freitext-Eingabe statt nur Dropdown

**Datei:** `src/components/projekte/CreateProjectDialog.tsx`

Das Select-Feld "Verkäufer-Gesellschaft" wird zu einem Combobox-artigen Feld umgebaut:
- Bestehende Kontexte werden als Vorschlaege angezeigt (Dropdown bleibt)
- Zusaetzlich: Freitext-Input "Neue Gesellschaft eingeben"
- Wenn der Nutzer einen neuen Namen eintippt, wird beim Speichern automatisch ein neuer `developer_contexts` Eintrag erzeugt (via `createContext` aus `useDeveloperContexts`)
- Der neue Kontext bekommt `is_default: true` wenn es der erste ist, sonst `is_default: false`

Technisch: Das bestehende `<Select>` wird durch ein `<Input>` mit Datalist oder ein Combobox-Pattern (cmdk ist bereits installiert) ersetzt. Wenn die Eingabe keiner bestehenden ID entspricht, wird sie als neuer Name behandelt.

### 2. DMS-Seeding nach manueller Projektanlage

**Datei:** `src/components/projekte/CreateProjectDialog.tsx`

Nach erfolgreichem `createProject.mutateAsync()` wird `initializeProjectDMS.mutateAsync()` aufgerufen mit dem erzeugten Projekt-Code und einer leeren Units-Liste (da bei manueller Anlage noch keine Units existieren). Dadurch werden sofort die 7 Standard-Projektordner angelegt.

Alternativ: Der `onSuccess` Callback im `useDevProjects.createProject` Hook wird erweitert, um automatisch den DMS-Tree zu seeden.

### 3. DMS-Seeding bei nachtraeglicher Unit-Anlage

**Datei:** `src/hooks/useProjectUnits.ts`

Nach `createUnit` / `createUnits` wird fuer jede neue Unit automatisch ein Unit-Ordner mit 5 Unterordnern in `storage_nodes` erzeugt (unter dem bestehenden "Einheiten"-Ordner des Projekts).

---

## Betroffene Dateien

| Aktion | Datei | Aenderung |
|--------|-------|-----------|
| Aendern | `src/components/projekte/CreateProjectDialog.tsx` | Select durch Combobox/Input ersetzen, nach Erstellung DMS seeden |
| Aendern | `src/hooks/useProjectUnits.ts` | Nach Unit-Anlage automatisch Unit-DMS-Ordner erzeugen |
| Optional | `src/hooks/useDevProjects.ts` | onSuccess um DMS-Seed erweitern (Alternative zu Dialog-Loesung) |

## Risiko

- **Niedrig.** Keine destruktiven Aenderungen. Neue Gesellschaften werden additiv erzeugt. DMS-Seeding ist idempotent (doppelte Ordner werden durch DB-Constraints verhindert bzw. ignoriert).
