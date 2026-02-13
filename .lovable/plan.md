

# Aenderungen an der Immobilienakte: Street View im Expose + Auto-Sortierkachel

## Uebersicht

Drei zusammenhaengende Aenderungen:

1. **Street View im Expose-Tab** einbauen (oberhalb von Grundbuch und Energie)
2. **Layout-Anpassung**: Grundbuch und Energie nach unten verschieben
3. **Auto-Sortierkachel** im DMS bei Anlage einer neuen Immobilie erstellen

---

## Aenderung 1: Street View im Expose-Tab

**Datei**: `src/components/portfolio/ExposeTab.tsx`

Zwischen dem 2-Spalten-Block "Beschreibung + Karte" (Zeile 121-130) und dem naechsten Grid (Zeile 132) wird eine neue **Street-View-Kachel** eingefuegt.

- Nutzt die gleiche Technik wie in `UebersichtTile.tsx`: Google Street View Static API via `sot-google-maps-key` Edge Function
- Volle Breite, Hoehe passend zur daneben stehenden Kachel (ca. 280px)
- Error-Fallback: Platzhalter-Icon wenn Street View nicht verfuegbar
- Der API-Key wird per `useQuery` + `supabase.functions.invoke('sot-google-maps-key')` geladen (gleicher Pattern wie Miety)

**Neues Layout des Expose-Tab (von oben nach unten):**

```text
1. Headline (editierbar)
2. Header-Card (Adresse, Code)
3. Bildergalerie
4. Beschreibung | Google Maps Embed   (2 Spalten)
5. Street View | Lage & Mikrolage     (2 Spalten, NEU)
6. Baujahr & Zustand | Miete          (2 Spalten)
7. Finanzierung | Grundbuch           (2 Spalten, nach unten gerutscht)
8. Energie & Heizung                  (1 Spalte, nach unten gerutscht)
```

Die Kacheln "Grundbuch" und "Energie & Heizung" werden also einfach weiter unten im Grid platziert. Die Hoehe der Street-View-Kachel orientiert sich an der benachbarten Kachel (gleiche Card-Hoehe).

## Aenderung 2: Auto-Sortierkachel bei Immobilien-Erstellung

**Datei**: `src/pages/portal/immobilien/CreatePropertyRedirect.tsx`

Beim Erstellen einer neuen Immobilie wird automatisch ein `inbox_sort_container` in der DB angelegt:

- **Name**: Adresse der Immobilie (z.B. "Musterstr. 12, Berlin")
- **Regeln**: Automatisch eine Regel mit `field: 'subject'`, `operator: 'contains'`, `keywords_json` gefuellt mit Adressbestandteilen (Strasse, PLZ, Stadt)
- **Aktivierung**: `is_enabled: true` (wird aber nur wirksam, wenn `ai_extraction_enabled` auf der Organisation aktiv ist)

**DB-Migration**: Neue optionale Spalte `property_id` (UUID, nullable, FK auf `properties`) auf `inbox_sort_containers`, um die Kachel mit der Immobilie zu verknuepfen. Das ermoeglicht:
- Eindeutige Zuordnung Kachel ↔ Immobilie
- Beim Loeschen einer Immobilie kann die Sortierkachel identifiziert werden
- In der Sortieren-Ansicht wird die verknuepfte Immobilie als Badge angezeigt

```text
ALTER TABLE inbox_sort_containers
  ADD COLUMN property_id uuid REFERENCES properties(id) ON DELETE SET NULL;
```

## Aenderung 3: Sortier-Workflow (Posteingang → Sortieren → Storage)

Das bestehende System funktioniert bereits so, dass bei aktivierter Datenauslesung (`ai_extraction_enabled`) die eingehende Post analysiert und mit den Sortierregeln abgeglichen wird. Die Zuordnung erscheint als Vorschlag im Posteingang.

**Keine Code-Aenderung noetig** fuer den manuellen Bestaetigungsschritt — der Posteingang zeigt bereits Vorschlaege, die manuell bestaetigt werden muessen, bevor Dokumente in den Storage der Immobilie verschoben werden. Das ist das bestehende Verhalten.

## Betroffene Dateien

1. **DB-Migration**: `ALTER TABLE inbox_sort_containers ADD COLUMN property_id`
2. **`src/components/portfolio/ExposeTab.tsx`**: Street View einfuegen, Grundbuch/Energie nach unten
3. **`src/pages/portal/immobilien/CreatePropertyRedirect.tsx`**: Auto-Erstellung der Sortierkachel nach Property-Insert

