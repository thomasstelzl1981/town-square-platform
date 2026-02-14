

# Akten-Verfeinerung: Storage-Tree + Editierbarkeit (ohne Immobilienakte)

## Drei Kategorien — klar definiert

### Kategorie 1: Immobilienakte (MOD-04) — WIRD NICHT BERUEHRT

Die Immobilienakte wird aus einer Objektliste heraus geoeffnet und fuehrt auf eine eigene Seite (`EditableUnitDossierView`). Sie hat ein voellig anderes Navigationskonzept (Listen-Klick → Seitenwechsel) und ist bereits voll editierbar mit Speichern-Button. **Kein Handlungsbedarf. Keinerlei Aenderungen.**

### Kategorie 2: Stammdaten (RecordCard) — NUR STORAGE-TREE ERGAENZEN

Die Personenakte in Stammdaten nutzt die grosse quadratische `RecordCard` (aspect-square, halbe Seitenbreite). Beim Klick oeffnet sie sich auf volle Breite mit allen Feldern sichtbar und editierbar. **Das bleibt exakt so.** 

Einzige Aenderung: Der Datenraum-Bereich zeigt aktuell nur eine flache Dateiliste. Stattdessen soll hier der **echte Storage-Tree in Spaltenansicht** (wie im DMS) eingebettet werden, mit Drag-and-Drop Upload.

### Kategorie 3: Modul-Akten (Fahrzeuge, PV-Anlagen etc.) — STORAGE-TREE + EDITIERBARKEIT

Diese Akten nutzen kleine WidgetCell-Kacheln im WidgetGrid. Ein Klick auf eine Kachel oeffnet die Akte inline unter dem Grid. **Dieses Layout-Pattern bleibt bestehen.** 

Aenderungen betreffen NUR den Inhalt der geoeffneten Akte:
- Alle Felder muessen direkt editierbar sein (kein Read-Only)
- Ein Storage-Tree (Spaltenansicht) muss integriert werden
- Popup-Dialoge muessen durch Inline-Erfassung ersetzt werden

---

## Detaillierte Aenderungen

### Aenderung 1: Wiederverwendbare Storage-Tree-Komponente

**Neue Datei:** `src/components/shared/EntityStorageTree.tsx`

Eine schlanke Wrapper-Komponente um die bestehende `ColumnView` (aus `src/components/dms/views/ColumnView.tsx`), die fuer jede Akte den passenden DMS-Ordner findet und anzeigt.

**Props:**
```typescript
interface EntityStorageTreeProps {
  tenantId: string;
  entityType: string;      // z.B. 'person', 'vehicle', 'pv_plant'
  entityId: string;         // UUID der Akte
  moduleCode: string;       // z.B. 'MOD_01', 'MOD_17', 'MOD_19'
}
```

**Logik:**
1. Query: `storage_nodes` WHERE `entity_type = X` AND `entity_id = Y` → findet den Root-Ordner der Akte
2. Query: Alle Kind-Nodes unter diesem Root-Ordner + zugehoerige Dokumente
3. Rendering: Die bestehende `ColumnView` mit denselben Props wie im DMS (MOD-03)
4. Drag-and-Drop Upload: `FileDropZone` umschliesst den Tree, Uploads landen unter dem Akte-Root-Ordner

**Fallback:** Wenn noch kein Storage-Ordner existiert (Altdaten vor der Migration), wird ein leerer Datenraum mit Upload-Moeglichkeit angezeigt und bei erstem Upload automatisch der Ordner + Sortierkachel angelegt (via `useRecordCardDMS`).

### Aenderung 2: RecordCard Datenraum upgraden (Stammdaten)

**Datei:** `src/components/shared/RecordCard.tsx`

Die flache Dateiliste (Zeilen 184-212) wird durch `EntityStorageTree` ersetzt:

**Vorher (flache Liste):**
```
Datenraum (3 Dateien)
  📄 Personalausweis.pdf
  📄 Steuerbescheid.pdf
  📄 Meldebescheinigung.pdf
```

**Nachher (Spaltenansicht mit Ordner-Baum):**
```
Datenraum
┌──────────────┬──────────────────────────────┐
│ Max Muster…  │ 📄 Personalausweis.pdf       │
│  📁 Steuer   │ 📄 Steuerbescheid_2025.pdf   │
│  📁 Vertraege│ 📄 Meldebescheinigung.pdf    │
│  📁 Sonstiges│                              │
│              │  [Dateien hierher ziehen]     │
└──────────────┴──────────────────────────────┘
```

Die `RecordCardProps` werden angepasst:
- `files` und `onFileDrop` Props bleiben fuer den **Closed-State** (FileDropZone auf der Kachel)
- Im **Open-State** wird stattdessen `EntityStorageTree` gerendert, sofern `tenantId` und `entityId` vorhanden sind

### Aenderung 3: Fahrzeugakte — Editierbarkeit + Storage-Tree + Popup-Entfernung

**Datei:** `src/components/portal/cars/CarsFahrzeuge.tsx`

Die WidgetCell-Kacheln im Grid und das Inline-Oeffnen bleiben **exakt so wie jetzt**. Nur der Inhalt der geoeffneten Akte aendert sich:

**3a) Versicherungs-Sektion editierbar machen**

Aktuell zeigt `InsuranceSection` (Zeile 395-408) nur statische Felder. Aenderung: Auf das gleiche `EditableAkteSection`-Pattern umstellen wie bei Basisdaten. Felder: Versicherer, Policen-Nr, Deckungsart, Jahresbeitrag, SF-Klasse etc. — alle inline editierbar.

**3b) Popup-Dialoge entfernen**

- `VehicleCreateDialog` entfernen → Stattdessen wird im WidgetGrid ein CTA-Widget ("+ Fahrzeug") eingebaut, das eine leere Akte direkt inline oeffnet (wie bei PV-Anlagen: Inline-Formular)
- `InsuranceCreateDialog` entfernen → Versicherungsdaten werden direkt in der Akte inline erfasst
- `ClaimCreateDialog` entfernen → Schaeden werden direkt in der Akte inline erfasst

**3c) Statischen Datenraum durch Storage-Tree ersetzen**

Die `VehicleDatenraum` Funktion (Zeilen 442-452) mit ihren 4 statischen Platzhalter-Kacheln wird durch `EntityStorageTree` ersetzt:

**Vorher:**
```
Datenraum
┌────────────┬────────────┬────────────┬────────────┐
│ Fahrzeug-  │ Fahrzeug-  │ TÜV-       │ Kauf-      │
│ schein     │ brief      │ Bericht    │ vertrag    │
└────────────┴────────────┴────────────┴────────────┘
```

**Nachher:**
```
Datenraum
┌──────────────┬──────────────────────────────┐
│ BMW M4 Co…   │ 📄 Fahrzeugschein.pdf        │
│  📁 Versich. │ 📄 Fahrzeugbrief_Kopie.pdf   │
│  📁 TÜV      │ 📄 Kaufvertrag_2023.pdf      │
│  📁 Service  │                              │
│              │  [Dateien hierher ziehen]     │
└──────────────┴──────────────────────────────┘
```

**3d) DMS-Ordner automatisch bei Neuanlage**

Wenn ein neues Fahrzeug inline angelegt wird, erstellt `useRecordCardDMS` automatisch:
- Storage-Node (Ordner) unter MOD_17
- Sortierkachel in inbox_sort_containers (Keywords: Kennzeichen, Marke, Modell)

### Aenderung 4: PV-Anlagen-Dossier — Editierbarkeit + Storage-Tree

**Datei:** `src/pages/portal/photovoltaik/PVPlantDossier.tsx`

Das WidgetGrid + Inline-Oeffnung bleibt **exakt so wie jetzt**. Nur der Inhalt des geoeffneten Dossiers aendert sich:

**4a) Alle InfoRow-Felder editierbar machen**

Aktuell wird `InfoRow` ueberall mit `editable` nicht gesetzt (also read-only). Aenderung:
- Alle `InfoRow`-Aufrufe erhalten `editable={true}` und einen `onChange`-Handler
- Ein zentraler State (`formData`) sammelt die Aenderungen
- Ein Speichern-Button am Ende der Akte persistiert die Aenderungen via `supabase.from('pv_plants').update(...)`
- Die Sektion-Cards (Standort, MaStR, Netzbetreiber, Zaehler, Technik) bekommen alle die gleiche Editierlogik

**4b) Statische Dokumenten-Kacheln durch Storage-Tree ersetzen**

Die Sektion "Dokumente" (Zeilen 193-217) mit 8 statischen Ordner-Kacheln und der Pflichtdokumente-Checklist wird durch `EntityStorageTree` ersetzt. Die Pflichtdokumente-Checklist bleibt als zusaetzliches Element unterhalb des Trees bestehen.

---

## Zusammenfassung der betroffenen Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/shared/EntityStorageTree.tsx` | NEU — Wiederverwendbare Storage-Tree-Komponente |
| `src/components/shared/RecordCard.tsx` | Datenraum-Sektion: Flache Liste → EntityStorageTree |
| `src/components/portal/cars/CarsFahrzeuge.tsx` | Versicherung editierbar, VehicleDatenraum → EntityStorageTree, Inline-Neuanlage statt Popup |
| `src/components/portal/cars/VehicleCreateDialog.tsx` | ENTFERNEN (wird durch Inline-Erfassung ersetzt) |
| `src/components/portal/cars/InsuranceCreateDialog.tsx` | ENTFERNEN (inline in Akte) |
| `src/components/portal/cars/ClaimCreateDialog.tsx` | ENTFERNEN (inline in Akte) |
| `src/components/portal/cars/index.ts` | Exports bereinigen |
| `src/pages/portal/photovoltaik/PVPlantDossier.tsx` | Alle InfoRow editable + Speichern-Button + EntityStorageTree |

### Was sich NICHT aendert

- Immobilienakte (MOD-04) — keinerlei Aenderung
- Stammdaten RecordCard Layout (grosses quadratisches Widget) — bleibt
- Fahrzeuge/PV Widget-Grid + kleine Kacheln + Inline-Oeffnung — Layout bleibt
- Routing — keine Aenderungen
- Datenbank-Schema — keine neuen Tabellen (entity_type/entity_id Spalten existieren bereits)
- Miety (MOD-20) — wird in diesem Schritt nicht angefasst

