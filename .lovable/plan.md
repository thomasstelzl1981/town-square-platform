
# Überarbeitetes Konzept: Bildergalerie im Exposé-Tab

## Analyse des aktuellen Problems

Die aktuelle `ExposeImageGallery`-Komponente hat folgende Probleme:

1. **Zu große Darstellung**: Das Hauptbild nimmt 2/3 der Breite ein (2 Spalten von 3) - für die Bearbeitungsansicht überdimensioniert
2. **Keine Titelbild-Funktion**: Es gibt keine Möglichkeit, ein Bild als Titelbild zu markieren
3. **Keine Begrenzung**: Unbegrenzte Anzahl von Bildern möglich
4. **Keine Sortierung**: Fehlende `display_order` für benutzerdefinierte Reihenfolge

## Geplante Lösung

### 1. Datenbank-Erweiterung

Neue Spalten in der `document_links`-Tabelle:

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `display_order` | INTEGER | Sortierreihenfolge (0-9, max. 10 Bilder) |
| `is_title_image` | BOOLEAN | Markiert das Titelbild (nur 1 pro Objekt) |

### 2. Kompaktere Galerie-Darstellung

Neues Layout-Konzept für die Bearbeitungsansicht:

```text
+------------------------------------------+
| Bildergalerie (3 von max. 10)     [Edit] |
+------------------------------------------+
| [T] [2] [3] [4] [5] [+]                  |
+------------------------------------------+
```

- **Thumbnail-Grid**: Alle Bilder als gleich große Thumbnails (max. 10)
- **Titelbild-Markierung**: Stern-Icon auf dem Titelbild
- **Kompakte Höhe**: ca. 80-100px Thumbnails statt riesigem Hauptbild
- **"+"-Button**: Upload-Link zum Datenraum (falls < 10 Bilder)
- **Lightbox**: Klick auf Thumbnail öffnet vergrößerte Ansicht

### 3. Titelbild-Logik

- Ein Bild kann per Klick als Titelbild markiert werden
- Nur 1 Titelbild pro Property/Unit erlaubt
- Titelbild wird immer als erstes angezeigt
- Visuell durch goldenes Stern-Icon markiert

### 4. 10-Bilder-Limit

- Maximal 10 Bilder pro Exposé zulässig
- Bei Erreichen des Limits verschwindet der "+"-Button
- Klares Feedback: "3 von 10 Bildern"

---

## Technische Umsetzung

### Phase 1: Datenbank-Migration

SQL-Migration für neue Spalten:

```sql
ALTER TABLE document_links 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

ALTER TABLE document_links 
ADD COLUMN IF NOT EXISTS is_title_image BOOLEAN DEFAULT false;

-- Index für Sortierung
CREATE INDEX IF NOT EXISTS idx_document_links_display_order 
ON document_links(object_id, display_order);

-- Constraint: Nur ein Titelbild pro Objekt
CREATE UNIQUE INDEX IF NOT EXISTS idx_document_links_title_image 
ON document_links(object_id, object_type) 
WHERE is_title_image = true;
```

### Phase 2: Komponenten-Refactoring

**ExposeImageGallery.tsx** (komplett überarbeitet):

1. Query mit `display_order` Sortierung und `is_title_image` Priorität
2. Kompaktes Grid-Layout (6 Spalten)
3. Titelbild-Toggle per Klick auf Stern-Icon
4. Drag-and-Drop für Reihenfolge (optional, spätere Phase)
5. 10-Bilder-Limit mit visuellem Feedback

### Phase 3: Erweiterte Funktionen

- **Titelbild setzen**: Klick auf Stern-Icon → Mutation → Refresh
- **Bild entfernen**: Klick auf X-Icon → Bestätigungsdialog → Unlink
- **Sortierung**: Per Drag-and-Drop oder Pfeile (optional)

---

## UI-Vorschau

### Kompakte Galerie (Standard)

```text
+------------------------------------------------------------+
| Bildergalerie                          3/10  [Im Datenraum] |
+------------------------------------------------------------+
|  +--------+  +--------+  +--------+  +--------+             |
|  | [Star] |  |   2    |  |   3    |  |   +    |             |
|  | Außen  |  | Wohn-  |  | Küche  |  | Hinzu- |             |
|  |        |  | zimmer |  |        |  | fügen  |             |
|  +--------+  +--------+  +--------+  +--------+             |
+------------------------------------------------------------+
```

### Titelbild-Markierung

- Goldener Stern-Icon oben links auf dem Titelbild
- Hover-Tooltip: "Als Titelbild markiert"
- Klick auf anderen Stern → neues Titelbild wählen

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `supabase/migrations/XXXXXX.sql` | Neue Spalten für document_links |
| `src/components/verkauf/ExposeImageGallery.tsx` | Komplettes Refactoring |
| `src/integrations/supabase/types.ts` | Auto-generiert nach Migration |

## Risikobewertung

- **Gering**: Keine Breaking Changes für bestehende Daten
- **Migration rückwärtskompatibel**: Neue Spalten haben sinnvolle Defaults
- **Bestehende Bilder**: Behalten `display_order = 0` und `is_title_image = false`
