

# Redundanz-Bereinigung: Doppelter Objekteingang

## Problem

Es gibt zwei Inbox-UIs für eingehende Objekte:

1. **Objekteingang** (`/portal/akquise-manager/objekteingang`) — zeigt `acq_offers` mit Status-Pipeline (Eingegangen → Analyse → Analysiert → Angenommen/Abgelehnt)
2. **Portal-Inbox** (auf der Tools-Seite als `PortalSearchInbox`) — zeigt `portal_listings` mit eigenem Status-System (Neu/Gesehen/Gemerkt/Abgelehnt) und "In Objekteingang übernehmen"-Aktion

Das ist redundant: Der User muss erst in der Portal-Inbox sichten, dann "übernehmen" klicken, dann im Objekteingang nochmal sichten. Zwei Eingänge für dasselbe Ziel.

## Lösungskonzept

**Die Portal-Inbox aus Tools entfernen.** Stattdessen: Portal-Suchergebnisse fließen direkt in den bestehenden Objekteingang (`acq_offers`).

### Änderungen

**1. `PortalSearchTool.tsx`** — Nach erfolgreicher Suche werden Treffer direkt als `acq_offers` mit Status `new` und `source: 'portal_search'` gespeichert (statt in `portal_listings`). Dedupe über `source_url` gegen bestehende `acq_offers`.

**2. `AkquiseTools.tsx`** — `PortalSearchInbox` Komponente entfernen. Der Flow wird: KI-Suchprofil → Portal-Suche → Ergebnisse erscheinen automatisch im Objekteingang.

**3. `ObjekteingangList.tsx`** — Filter-Chip "Portal-Treffer" hinzufügen, damit User nach Quelle filtern kann (Upload vs. Portal-Suche vs. Manuell).

**4. `portal_listings` Tabelle** — Bleibt als technisches Zwischen-Log bestehen (Run-Diagnostik), wird aber nicht mehr als User-facing Inbox genutzt.

### Ergebnis

- **Ein Eingang**: Alle Objekte — egal ob per Upload, Portal-Suche oder manuell — landen im Objekteingang
- **Ein Status-System**: Das bestehende `acq_offers`-Pipeline (new → analyzing → analyzed → accepted/rejected)
- **Keine Doppelarbeit**: User sichtet alles an einem Ort

### Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| `src/pages/portal/akquise-manager/AkquiseTools.tsx` | `PortalSearchInbox` Import + Rendering entfernen |
| `src/pages/portal/akquise-manager/components/PortalSearchTool.tsx` | Nach Suche: Treffer direkt als `acq_offers` speichern statt `portal_listings` |
| `src/pages/portal/akquise-manager/ObjekteingangList.tsx` | Filter-Chip für Quelle hinzufügen (Portal/Upload/Manuell) |
| `src/hooks/usePortalListings.ts` | `usePersistSearchResults` anpassen: schreibt in `acq_offers` statt `portal_listings` |

