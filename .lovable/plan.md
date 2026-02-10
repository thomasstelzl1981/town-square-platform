
# DMS Storage — Fehleranalyse und Fixes fuer alle 5 Ansichten

## Gefundene Probleme

### Problem 1: Dokumente erscheinen an falscher Stelle (KRITISCH)
In `StorageTab.tsx` (Zeile 138-165) gibt es einen schweren Logikfehler: Wenn `selectedNodeId` null ist (Root-Ebene), werden ALLE Dokumente des Tenants geladen und angezeigt — obwohl Root-Ordner keine Dokumente direkt enthalten. Das fuehrt dazu, dass z.B. Fahrzeugscheine, Mietvertraege und Fotos alle auf Root-Ebene erscheinen, obwohl sie in Unterordnern liegen.

**Fix:** Wenn `selectedNodeId === null`, sollen KEINE Dokumente geladen werden (Root zeigt nur Ordner). Nur wenn man in einen Ordner navigiert, werden die dort verlinkten Dokumente angezeigt.

### Problem 2: Alte Namen in der Datenbank (stale data)
Die `storageManifest.ts` wurde korrigiert (DMS→Dokumente, MSV→Mietverwaltung, etc.), aber die bereits geseedeten DB-Records haben noch die alten Namen:
- `DMS` statt `Dokumente`
- `MSV` statt `Mietverwaltung`  
- `Investments` statt `Investment-Suche`
- `Communication Pro` statt `Kommunikation Pro`

Die Anzeige nutzt zwar `getModuleDisplayName()` fuer Modul-Root-Nodes, aber die Column View und andere Stellen greifen teilweise direkt auf `n.name` zu. Zudem stimmt die DB nicht mit dem SSOT ueberein.

**Fix:** SQL-Update der 4 falschen Namen in `storage_nodes`. Zusaetzlich sicherstellen, dass ueberall `getModuleDisplayName()` genutzt wird.

### Problem 3: Column View zeigt falsche Zuordnungen
Die `ColumnView` bekommt ALLE `documents` und `documentLinks` als Props und zeigt Dateien basierend auf `documentLinks.filter(l => l.node_id === nodeId)`. Da `StorageTab` aber die `documents` Query bereits nach `selectedNodeId` filtert, bekommt die Column View nur die Dokumente des aktuell ausgewaehlten Ordners — NICHT die des in der Spalte angeklickten Ordners. Die Column View braucht aber Zugriff auf ALLE Dokumente, da sie mehrere Ordner-Ebenen gleichzeitig anzeigt.

**Fix:** Eine separate, ungefilterte Dokumente+Links Query fuer die Column View, oder besser: Die Column View soll die Dokumente selbst per `documentLinks` filtern (funktioniert bereits, aber die `documents` Liste aus StorageTab ist gefiltert und unvollstaendig).

### Problem 4: Multi Select View weicht vom Supabase-Design ab
Unsere Multi Select View zeigt ein Grid mit Icon-Kacheln. Das Supabase-Original zeigt eine spaltenbasierte Ansicht (wie Column View) MIT Checkboxen und einer gruenen Action-Bar. Oben steht "Select all X files" pro Spalte, und die ausgewaehlten Items haben gruene Checkboxen.

**Fix:** MultiSelectView komplett umbauen zu einer spaltenbasierten Ansicht mit Checkboxen (wie Supabase Screenshot 4).

### Problem 5: Preview View zeigt nur Dateien, keine Ordner
Die linke Spalte der Preview View filtert auf `items.filter(i => i.type === 'file')`. Wenn man auf Root-Ebene ist und es keine Dateien gibt, ist die linke Liste leer. Es fehlt die Navigation in Ordner.

**Fix:** Ordner in der linken Liste der Preview View ebenfalls anzeigen, mit Klick-Navigation.

### Problem 6: Nummerierung nicht ueberall sichtbar
Die `getModuleDisplayName()` Funktion wird zwar in ListView und StorageFileManager genutzt, aber die Nummerierung (z.B. "04 — Immobilien") muss konsistent in ALLEN Views und in der Breadcrumb erscheinen.

## Technische Fixes

### 1. `StorageTab.tsx` — Dokumente-Query Fix
Zeile 138-165: Wenn `selectedNodeId === null`, leere Liste zurueckgeben (keine Dokumente auf Root-Ebene). Zusaetzlich eine SEPARATE ungefilterte Dokumente+Links Query fuer Column View und Multi Select View hinzufuegen.

```typescript
// Gefilterte Docs fuer aktuelle Ansicht
const { data: documents = [] } = useQuery({
  queryKey: ['documents', activeTenantId, selectedNodeId],
  queryFn: async () => {
    if (!activeTenantId || !selectedNodeId) return []; // <-- FIX: kein selectedNodeId = keine Docs
    // ... Rest wie bisher
  },
});

// ALLE Docs + Links fuer Column View / Multi Select
const { data: allDocuments = [] } = useQuery({
  queryKey: ['all-documents', activeTenantId],
  queryFn: async () => {
    if (!activeTenantId) return [];
    const { data } = await supabase.from('documents')
      .select('*').eq('tenant_id', activeTenantId);
    return data || [];
  },
});
```

### 2. SQL-Migration — Stale Namen korrigieren
```sql
UPDATE storage_nodes SET name = 'Dokumente' WHERE template_id = 'MOD_03_ROOT';
UPDATE storage_nodes SET name = 'Mietverwaltung' WHERE template_id = 'MOD_05_ROOT';
UPDATE storage_nodes SET name = 'Investment-Suche' WHERE template_id = 'MOD_08_ROOT';
UPDATE storage_nodes SET name = 'Kommunikation Pro' WHERE template_id = 'MOD_14_ROOT';
```

### 3. `ColumnView.tsx` — Eigene Dokument-Filterung
Die Column View muss `allDocuments` und `documentLinks` bekommen (ungefiltert) und selbst pro Spalte filtern. Der Import von `getModuleDisplayName` ist bereits vorhanden und wird korrekt genutzt.

### 4. `MultiSelectView.tsx` — Spaltenbasiertes Layout (Supabase-Stil)
Komplett umbauen: Statt Grid-Kacheln eine spaltenbasierte Ansicht wie Column View, aber mit Checkboxen pro Item und "Select all X files" Header pro Spalte. Gruene Checkboxen bei Auswahl.

### 5. `PreviewView.tsx` — Ordner in linker Liste
Ordner ebenfalls in der linken Liste anzeigen (mit Folder-Icon), Klick navigiert in den Ordner. Nur Dateien sind fuer Preview auswaehlbar.

### 6. `StorageFileManager.tsx` — allDocuments Prop
Neue Prop `allDocuments` und `allDocumentLinks` fuer Column View und Multi Select View durchreichen.

## Zusammenfassung der zu aendernden Dateien

1. **`StorageTab.tsx`** — Docs-Query Fix (kein Docs bei Root), separate All-Docs Query, neue Props
2. **`StorageFileManager.tsx`** — Neue Props `allDocuments`/`allDocumentLinks` entgegennehmen und an Column/MultiSelect weiterleiten
3. **`ColumnView.tsx`** — Nutzt `allDocuments` statt `documents`
4. **`MultiSelectView.tsx`** — Komplett umbauen zu spaltenbasiert mit Checkboxen
5. **`PreviewView.tsx`** — Ordner in linke Liste aufnehmen, Navigation ermoeglichen
6. **SQL-Migration** — 4 falsche Namen korrigieren
