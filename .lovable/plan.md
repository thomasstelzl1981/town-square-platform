

# Storage Cleanup: Entity-Analyse + Risikofreie Migration

## Komplette Entity-Inventur

### Bestehende Entities mit IDs

| Entity | Tabelle | ID | Code/Name | Storage-Verknuepfung |
|--------|---------|-----|-----------|---------------------|
| **Immobilie Leipzig** | `properties` | `00000000-...-000001` | DEMO-001, Blochmannstr. 31, Leipzig | Korrekt: Dossier unter MOD_04 Root mit `property_id` gesetzt, 18 Unterordner, 10 Dokumente via `document_links` verknuepft |
| **Porsche 911** | `cars_vehicles` | `00000000-...-000301` | B-P911 | Korrekt: Dossier unter MOD_17 > Fahrzeuge mit 7 Unterordnern + 3 Dokumente |
| **BMW M5** | `cars_vehicles` | `00000000-...-000302` | M-M5005 | Korrekt: Dossier unter MOD_17 > Fahrzeuge mit 7 Unterordnern + 3 Dokumente |
| **Akquise-Mandat Rendsburg** | `acq_mandates` | `e0000000-...-000001` | ACQ-2026-00001, Schleswig-Holstein | Kein Storage-Node, kein `data_room_folder_id` gesetzt |
| **Akquise-Angebot Rendsburg** | `acq_offers` | `f0000000-...-000001` | Rotklinkeranlage 40 Einheiten, Rendsburg | `data_room_folder_id = NULL`, Expose-Daten nur in `extracted_data` JSON, kein File im Storage |
| **Projekt Menden** | `dev_projects` | `3babfce6-...` | BT-2026-001, Menden | Dateien im `project-documents` Bucket vorhanden (Expose + Preisliste), Storage-Node existiert mit `dev_project_id` korrekt gesetzt |

### Risikobewertung: Was ist gefaehrdet?

| Entity | Risiko | Detail |
|--------|--------|--------|
| **Immobilie Leipzig** | **KEIN Risiko** | Dossier ist korrekt unter MOD_04 Root `4e1c6b44` eingehaengt, `property_id` gesetzt, alle `document_links` zeigen auf die richtigen `storage_nodes`. Wird nicht angefasst. |
| **Porsche + BMW** | **KEIN Risiko** | Dossiers sind korrekt unter MOD_17 Root `e49690ca` > Fahrzeuge `ee83a5a4` eingehaengt. Alle 7 Unterordner + Dokumente intakt. Wird nicht angefasst. |
| **Projekt BT-2026-001** | **MITTEL** | 3 Kopien des Dossiers (02:22, 02:44, 15:13). Nur die juengste (15:13, ID `a33c4587`) hat `dev_project_id` korrekt gesetzt und ist mit dem echten Projekt verknuepft. Die zwei aelteren sind Waisen. Plus: Die 2 Dateien liegen im `project-documents` Bucket statt `tenant-documents`. |
| **Projekt BT-2026-002** | **GERING** | 2 Kopien, aber es gibt kein echtes `dev_projects` Entity mit Code BT-2026-002. Das sind verwaiste Test-Dossiers ohne echte Daten. |
| **Akquise Rendsburg** | **KEIN Risiko beim Cleanup** | Hat aktuell keinen Storage-Node. Die Daten sind in `acq_offers.extracted_data` sicher. Das Expose kam per E-Mail (MailParser), nicht per Upload. Es existiert kein File im Storage. |

### Expose Rendsburg: Wo ist es?

Das Rendsburg-Expose wurde via **E-Mail-Forwarding** (MailParser) erfasst, nicht als Datei-Upload:
- `source_type: 'inbound_email'`
- `extracted_data` enthaelt: Faktor 14.7, Dr. Hofeditz, 40 Einheiten, Provision 6.25%
- Es gibt **keine Datei** in `acq-documents` oder `tenant-documents` Bucket
- Es gibt **keinen** `acq_offer_documents` Record
- Die extrahierten Daten sind sicher in der DB, aber das Original-PDF fehlt im Storage

---

## Cleanup-Migration: Praeziser Plan

### Was wird GELOESCHT (nur leere Duplikate)

**9 Backfill-Duplikate** (alle vom 16:48, alle haben `older_count > 0`, alle haben 0 Kinder):

| ID | Modul | Name | Begruendung |
|----|-------|------|-------------|
| `c8ca13c4` | MOD_02 | KI Office | Duplikat von `73ad44a9` (14:34) |
| `5daa71d5` | MOD_03 | DMS | Duplikat von `6669dd2d` (14:34) |
| `49db5aa8` | MOD_04 | Immobilien | Duplikat von `4e1c6b44` (19:58, hat Kinder!) |
| `6b956c32` | MOD_05 | MSV | Duplikat von `38906652` (14:34) |
| `6404b6ad` | MOD_06 | Verkauf | Duplikat von `2f1c235d` (19:58, hat Kinder!) |
| `aac99988` | MOD_07 | Finanzierung | Duplikat von `839b6a03` (19:58, hat Kinder!) |
| `17693dc0` | MOD_08 | Investments | Duplikat von `d5f61d84` (14:34) |
| `683413ac` | MOD_17 | Car-Management | Duplikat von `e49690ca` (19:58, hat Kinder!) |
| `0cba7668` | SYSTEM | Papierkorb | Duplikat von `0e6a526d` (14:34) |

**1 MOD_16 Duplikat** ("Services" `a2c923a2` loeschen, "Sanierung" `284d458b` behalten und in "Services" umbenennen)

**1 MOD_13 Duplikat** (Projekte `064c2c35` loeschen, Original `4e5900e9` behalten)

**2 verwaiste BT-2026-001 Dossiers** (IDs `45e4d0d1` und `96c0f37e`, je 7 Kinder = 16 Nodes):
- Beide haben `dev_project_id = NULL` und keine `document_links`
- Das echte Dossier `a33c4587` (15:13) hat `dev_project_id` korrekt gesetzt → wird behalten

**2 verwaiste BT-2026-002 Dossiers** (IDs `9efb52bf` und `c681b089`, je 7 Kinder = 16 Nodes):
- Es gibt kein `dev_projects` Entity mit Code BT-2026-002 → beide sind Testdaten

### Was wird BEHALTEN und REPARIERT

| Aktion | Node | Detail |
|--------|------|--------|
| **BEHALTEN** | `a33c4587` BT-2026-001 | Echtes Projekt-Dossier mit `dev_project_id = 3babfce6` → wird unter Projekte-Root `4e5900e9` eingehaengt |
| **UPDATE** | `a33c4587` → `parent_id = 4e5900e9` | Projekt-Dossier unter "Projekte" Root einordnen |
| **UPDATE** | `284d458b` MOD_16 → name = 'Services' | Namenskorrektur laut storageManifest |

### Was wird NEU angelegt (Module ohne aelteres Original)

Diese 11 Roots vom Backfill (16:48) haben `older_count = 0` → sind die **einzigen** Instanzen und werden **behalten**:
- MOD_01 Stammdaten, MOD_09 Vertriebspartner, MOD_10 Leads, MOD_11 Finanzierungsmanager
- MOD_12 Akquise-Manager, MOD_14 Communication Pro, MOD_15 Fortbildung
- MOD_18 Finanzanalyse, MOD_19 Photovoltaik, MOD_20 Miety

### UNIQUE Constraints

```sql
-- Verhindert kuenftige Root-Duplikate
CREATE UNIQUE INDEX idx_storage_nodes_unique_root
  ON storage_nodes (tenant_id, module_code, template_id)
  WHERE parent_id IS NULL AND template_id IS NOT NULL;

-- Verhindert kuenftige Kind-Duplikate
CREATE UNIQUE INDEX idx_storage_nodes_unique_child
  ON storage_nodes (tenant_id, parent_id, name)
  WHERE parent_id IS NOT NULL;
```

---

## Zusammenfassung: Vorher → Nachher

| Metrik | Vorher | Nachher |
|--------|--------|---------|
| Gesamte Nodes | 140 | ~97 |
| MOD_13 Root-Nodes (Projekte) | 2x Projekte + 3x BT-001 + 2x BT-002 = 7 | 1x Projekte mit 1x BT-001 darunter = 2 |
| MOD_16 Root-Nodes | 2 (Sanierung + Services) | 1 (Services) |
| MOD_17 Root-Nodes | 2 (beide "Car-Management") | 1 (mit Fahrzeuge + Porsche + BMW) |
| Duplikat-Root-Nodes gesamt | 11 | 0 |
| UNIQUE Constraints | 0 | 2 |
| Immobilie DEMO-001 | Intakt | Intakt (nicht angefasst) |
| Porsche + BMW | Intakt | Intakt (nicht angefasst) |
| Projekt BT-2026-001 | Intakt, aber Root-Node | Intakt, unter "Projekte" eingeordnet |
| Akquise Rendsburg | Keine Aenderung | Keine Aenderung (Daten in DB sicher) |

### Bezueglich Posteingang / E-Mail-Inbox

Die System-Nodes "Posteingang" (`2a74f4c0`) und "Eigene Dateien" (`ab6f325c`) existieren bereits korrekt. Fuer die E-Mail-zu-Posteingang-Funktion (Resend Inbound Webhook → Storage Node) ist ein separater Implementierungsschritt noetig, der ueber den Cleanup hinausgeht. Das wird als eigenes Feature nach dem Cleanup geplant.

