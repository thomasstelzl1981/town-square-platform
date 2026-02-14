

# RecordCard — Erweiterter Plan mit Storage-Detail

## Was HEUTE existiert (IST)

### Storage-Nodes (`storage_nodes` Tabelle)

Jeder DMS-Ordner/Datei ist ein `storage_node`. Die Tabelle hat **spezifische FK-Spalten** fuer verschiedene Entitaeten:

| Spalte | Verknuepfung |
|--------|-------------|
| `property_id` | Immobilie |
| `pv_plant_id` | PV-Anlage |
| `dev_project_id` | Entwicklungsprojekt |
| `unit_id` | Einheit |

Es gibt KEINE generische `entity_id` Spalte.

### Sortierkacheln (`inbox_sort_containers` Tabelle)

| Spalte | Typ |
|--------|-----|
| `id` | UUID (PK) |
| `tenant_id` | FK organizations |
| `name` | Text |
| `is_enabled` | Boolean |
| `property_id` | FK properties (NUR Immobilien!) |

Es gibt KEINE generische Entitaets-Verknuepfung — nur `property_id`.

### Bestehendes Pattern (CreatePropertyDialog)

```
1. Property INSERT → property.id entsteht
2. inbox_sort_containers INSERT (property_id = property.id, name = Adresse)
3. inbox_sort_rules INSERT (keywords aus Adresse)
```

---

## Was NEU kommen muss

### Problem

Die RecordCard soll fuer ALLE Entitaetstypen (Personen, Versicherungen, Fahrzeuge, Vorsorge, Abos) einen eigenen Datenraum + Sortierkachel anlegen. Aber `storage_nodes` und `inbox_sort_containers` kennen nur spezifische FK-Spalten — keine generische Verknuepfung.

### Loesung: Generische Spalten hinzufuegen

**Migration 1: `storage_nodes` erweitern**

```sql
ALTER TABLE storage_nodes
  ADD COLUMN entity_type TEXT,     -- z.B. 'person', 'insurance', 'vehicle', 'vorsorge', 'subscription'
  ADD COLUMN entity_id   UUID;     -- ID der verknuepften Akte

CREATE INDEX idx_storage_nodes_entity
  ON storage_nodes (tenant_id, entity_type, entity_id);
```

Die bestehenden FK-Spalten (`property_id`, `pv_plant_id` etc.) bleiben erhalten — kein Breaking Change. Die neuen Spalten werden fuer ALLE kuenftigen Akten-Typen verwendet.

**Migration 2: `inbox_sort_containers` erweitern**

```sql
ALTER TABLE inbox_sort_containers
  ADD COLUMN entity_type TEXT,     -- z.B. 'person', 'insurance', 'vehicle'
  ADD COLUMN entity_id   UUID;     -- ID der verknuepften Akte

CREATE INDEX idx_sort_containers_entity
  ON inbox_sort_containers (tenant_id, entity_type, entity_id);
```

`property_id` bleibt erhalten (Abwaertskompatibilitaet). Neue Akten nutzen `entity_type` + `entity_id`.

---

## Exakter Ablauf bei Neuanlage einer Akte

Am Beispiel: **Neue Person anlegen** in Stammdaten

### Schritt 1: Akte anlegen

```
INSERT INTO household_persons (tenant_id, first_name, last_name, role, ...)
→ person.id = "abc-123" (neue UUID)
```

### Schritt 2: DMS-Ordner (storage_node) anlegen

```
INSERT INTO storage_nodes (
  tenant_id:     org.id,
  name:          "Max Mustermann",
  node_type:     "folder",
  module_code:   "MOD_01",        -- Stammdaten
  entity_type:   "person",
  entity_id:     "abc-123",       -- person.id
  parent_id:     MOD_01_ROOT_ID,  -- Root-Ordner des Moduls
  auto_created:  true
)
→ folder.id = "def-456" (neue UUID fuer den Ordner)
```

**Ergebnis im DMS-Baum:**
```
MOD_01 (Stammdaten)
  └── Max Mustermann/          ← neu, automatisch
       ├── (leer, bereit fuer Uploads)
```

### Schritt 3: Sortierkachel anlegen

```
INSERT INTO inbox_sort_containers (
  tenant_id:    org.id,
  name:         "Max Mustermann",
  is_enabled:   true,
  entity_type:  "person",
  entity_id:    "abc-123"       -- person.id
)
→ container.id = "ghi-789"
```

### Schritt 4: Sortierregeln anlegen

```
INSERT INTO inbox_sort_rules (
  container_id:  "ghi-789",
  field:         "subject",
  operator:      "contains",
  keywords_json: ["Max", "Mustermann"]
)
```

**Ergebnis unter Dokumente > Sortieren:**
```
[✓] Max Mustermann          ← neue Kachel
     Regel: Betreff enthält "Max", "Mustermann"
```

### Schritt 5: Drag-and-Drop Upload auf die Card

Wenn eine Datei auf die geschlossene RecordCard gezogen wird:

```
1. Upload nach: tenant-documents/{tenantId}/MOD_01/abc-123/Dateiname.pdf
2. INSERT INTO storage_nodes (
     tenant_id, name, node_type: "file",
     module_code: "MOD_01",
     entity_type: "person",
     entity_id: "abc-123",
     parent_id: "def-456",       -- der Personen-Ordner
     file_path: "{tenantId}/MOD_01/abc-123/Dateiname.pdf",
     mime_type: "application/pdf"
   )
```

---

## Ablauf-Diagramm fuer alle Entitaetstypen

| Entitaetstyp | Tabelle | module_code | entity_type | Storage-Pfad |
|-------------|---------|-------------|-------------|-------------|
| Person | `household_persons` | MOD_01 | `person` | `{t}/MOD_01/{person_id}/` |
| Versicherung | `insurance_contracts` | MOD_11 | `insurance` | `{t}/MOD_11/{contract_id}/` |
| Vorsorge | `vorsorge_contracts` | MOD_11 | `vorsorge` | `{t}/MOD_11/{contract_id}/` |
| Abonnement | `user_subscriptions` | MOD_11 | `subscription` | `{t}/MOD_11/{sub_id}/` |
| Fahrzeug | `vehicles` | MOD_17 | `vehicle` | `{t}/MOD_17/{vehicle_id}/` |
| PV-Anlage | `pv_plants` | MOD_19 | `pv_plant` | `{t}/MOD_19/{plant_id}/` |

---

## Umsetzungsschritte (Phase 1: Stammdaten)

| Schritt | Beschreibung |
|---------|-------------|
| 1 | **DB-Migration**: `storage_nodes` + `inbox_sort_containers` um `entity_type` / `entity_id` erweitern (2 ALTER TABLE + 2 Indexes) |
| 2 | **`designManifest.ts`** um `RECORD_CARD` Tokens erweitern (quadratisch, aspect-square) |
| 3 | **`recordCardManifest.ts`** erstellen (Entitaets-Definitionen mit module_code Mapping) |
| 4 | **`useRecordCardDMS.ts`** Hook erstellen: Logik fuer automatische Ordner-Erstellung + Sortierkachel-Erstellung + Drag-and-Drop Upload |
| 5 | **`RecordCardGallery.tsx`** erstellen (4-Foto Grid) |
| 6 | **`RecordCard.tsx`** erstellen (Closed=quadratisch + FileDropZone, Open=volle Breite + alle Felder + Datenraum-Liste) |
| 7 | **`ProfilTab.tsx`** refaktorieren: 6 ProfileWidgets durch 1 RecordCard type=person ersetzen |
| 8 | Testen auf `/portal/stammdaten/profil` |

### Was sich NICHT aendert

- Bestehende `property_id` / `pv_plant_id` FK-Spalten bleiben erhalten
- Bestehende Immobilien-Sortierkacheln funktionieren weiter (property_id bleibt)
- Kein Routing-Change
- CRUD-Logik fuer Profildaten bleibt im bestehenden Query/Mutation

