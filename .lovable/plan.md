
# Analyse: Storage-Ordnerstruktur Drift

## 🔴 DRIFT GEFUNDEN: Zwei verschiedene Ordner-Definitionen

### Quelle 1: Datenbank (storage_nodes) - KORREKT ✅

Die Demo-Immobilie DEMO-001 hat bereits **18 korrekte Ordner** (00-17):

| Nr. | Ordnername | Status |
|-----|------------|--------|
| 00 | Projektdokumentation | ✅ vorhanden |
| 01 | Exposé Ankauf | ✅ vorhanden |
| 02 | Exposé Sonstiges | ✅ vorhanden |
| 03 | Grundbuchauszug | ✅ vorhanden |
| 04 | Teilungserklärung | ✅ vorhanden |
| 05 | Grundriss | ✅ vorhanden |
| 06 | Kurzgutachten | ✅ vorhanden |
| 07 | Kaufvertrag | ✅ vorhanden |
| 08 | Mietvertrag | ✅ vorhanden |
| 09 | Rechnungen | ✅ vorhanden |
| 10 | Wirtschaftsplan Abrechnungen Protokolle | ✅ vorhanden |
| 11 | Fotos | ✅ vorhanden |
| 12 | Energieausweis | ✅ vorhanden |
| 13 | Wohngebäudeversicherung | ✅ vorhanden |
| 14 | Sonstiges | ✅ vorhanden |
| 15 | Darlehen und Finanzierung | ✅ vorhanden |
| 16 | Sanierung | ✅ vorhanden |
| 17 | Grundsteuer | ✅ vorhanden |

→ **Template**: `PROPERTY_DOSSIER_V1` (korrekt gemäß Memory)

---

### Quelle 2: StorageTab.tsx (Zeile 56-64) - VERALTET ❌

```typescript
const SYSTEM_FOLDERS = [
  { key: 'inbox', name: 'Posteingang', icon: Inbox },
  { key: 'immobilien', name: 'Immobilien', icon: Building2 },
  { key: 'finanzierung', name: 'Finanzierung', icon: Landmark },
  { key: 'bonitaetsunterlagen', name: 'Bonitätsunterlagen', icon: FileQuestion },
  { key: 'needs_review', name: 'Zur Prüfung', icon: AlertCircle },
  { key: 'archive', name: 'Archiv', icon: Archive },
  { key: 'sonstiges', name: 'Sonstiges', icon: MoreHorizontal },
];
```

→ Nur **7 generische System-Ordner** - keine Immobilien-spezifischen Ordner!

---

### Quelle 3: DatenraumTab.tsx - NEUTRAL (liest nur aus DB)

Der `DatenraumTab.tsx` (in der Immobilienakte) liest korrekt aus `storage_nodes` und zeigt alle 18 Ordner, **WENN** sie in der DB existieren.

---

## 🔍 Warum sehen Sie nur 9 Punkte?

### Mögliche Ursachen:

1. **Sie sind auf `/portal/dms/storage`** (globales DMS):
   - Zeigt nur die 7 `SYSTEM_FOLDERS` + evtl. 2 automatisch erstellte Ordner
   - **Keine Immobilien-Unterordner sichtbar**, da die Query nur `tenant_id` filtert, nicht `property_id`

2. **Sie sind auf der Immobilie** (Tab "Datenraum"):
   - Sollte alle 18 Ordner zeigen (00-17)
   - Query filtert auf `property_id`

---

## 📊 Architektur-Unterschied

```
┌─────────────────────────────────────────────────────────────────┐
│ GLOBALES DMS (/portal/dms/storage)                              │
│ ─────────────────────────────────────────────────────────────── │
│ StorageTab.tsx                                                  │
│                                                                 │
│ ├── Posteingang (system)                                        │
│ ├── Immobilien (system)        ← Nur Container!                 │
│ │   └── [Immobilien-Ordner werden NICHT geladen]                │
│ ├── Finanzierung (system)                                       │
│ ├── Bonitätsunterlagen (system)                                 │
│ ├── Zur Prüfung (system)                                        │
│ ├── Archiv (system)                                             │
│ └── Sonstiges (system)                                          │
│                                                                 │
│ FEHLT: Rekursive Unterordner-Anzeige!                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ IMMOBILIEN-AKTE (/portal/immobilien/{id}) → Tab "Datenraum"     │
│ ─────────────────────────────────────────────────────────────── │
│ DatenraumTab.tsx                                                │
│                                                                 │
│ ├── DEMO-001 - Leipziger Straße 42 (root)                       │
│ │   ├── 00_Projektdokumentation                                 │
│ │   ├── 01_Exposé Ankauf                                        │
│ │   ├── 02_Exposé Sonstiges                                     │
│ │   ├── ... (alle 18 Ordner)                                    │
│ │   └── 17_Grundsteuer                                          │
│                                                                 │
│ ✅ Korrekt: Alle 18 Ordner werden angezeigt!                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Lösung: StorageTab.tsx erweitern

### Option A: Rekursive Unterordner-Anzeige (empfohlen)

Das globale DMS sollte auch Unterordner der Immobilien anzeigen:

```typescript
// Statt nur root-Nodes:
const rootNodes = nodes.filter(n => n.parent_id === null);

// Sollte werden:
// 1. System-Ordner als Root
// 2. Immobilien-Ordner unter "Immobilien"
// 3. Unterordner rekursiv laden
```

### Option B: Navigationshierarchie anpassen

Das globale DMS zeigt nur System-Ordner als Navigation, und bei Klick auf "Immobilien" werden die Properties mit ihren 18 Ordnern geladen.

---

## 📋 Umsetzungsplan

### Schritt 1: StorageTab.tsx - Hierarchische Anzeige

**Datei:** `src/pages/portal/dms/StorageTab.tsx`

Änderungen:
1. Query erweitern: Alle Nodes laden, nicht nur `parent_id === null`
2. Baum-Struktur rekursiv rendern (wie in DatenraumTab.tsx)
3. Property-Ordner unter "Immobilien" einordnen

```typescript
// Neue Query: Alle storage_nodes mit parent-child Beziehung
const { data: allNodes } = await supabase
  .from('storage_nodes')
  .select(`
    *,
    properties (code, address)
  `)
  .eq('tenant_id', activeTenantId)
  .order('name');

// Baum bauen: System-Ordner → Properties → Unterordner
function buildFullTree(nodes: StorageNode[]): TreeNode[] {
  // 1. System-Ordner als Root (node_type = 'system')
  // 2. Property-Ordner unter "Immobilien" einhängen
  // 3. Unterordner (00-17) unter Property einhängen
}
```

### Schritt 2: Memory-Abgleich sicherstellen

Die 18-Ordner-Struktur aus Memory (`architecture/dms-standard-folder-hierarchy-v3-refined`) muss als SSOT verwendet werden:

| Nr. | Memory-Name | DB-Name | Match? |
|-----|-------------|---------|--------|
| 00 | Projektdokumentation | 00_Projektdokumentation | ✅ |
| 01 | Exposee Ankauf | 01_Exposé Ankauf | ✅ |
| 02 | Exposee Verkauf | 02_Exposé Sonstiges | ⚠️ Abweichung! |
| ... | ... | ... | ... |
| 18 | Sonstiges | 14_Sonstiges | ⚠️ Nummern verschoben! |

### Schritt 3: Nummerierung korrigieren (falls gewünscht)

Memory sagt 18 Ordner (00-18), DB hat (00-17) mit leicht anderen Namen.

---

## Zusammenfassung

| Bereich | Status | Problem |
|---------|--------|---------|
| **Datenbank** | ✅ OK | 18 Ordner pro Immobilie vorhanden |
| **DatenraumTab** | ✅ OK | Zeigt alle 18 Ordner korrekt |
| **StorageTab** | ❌ Drift | Zeigt nur 7 System-Ordner, keine Property-Unterordner |
| **Memory vs. DB** | ⚠️ Prüfen | Kleine Namensabweichungen (z.B. "Verkauf" vs. "Sonstiges") |

### Empfohlene Maßnahme

1. **StorageTab.tsx erweitern**: Rekursive Hierarchie mit Property-Ordnern
2. **Ordnernamen abgleichen**: Memory als SSOT verwenden
3. **Einheitliches Seeding**: Template `PROPERTY_DOSSIER_V1` als einzige Quelle
