

# Objekteingang — Redesign: Konzept, Skizze & Umsetzungsplan

## Verstandenes Konzept

Der Objekteingang wird zum **zentralen Hub** fur alle eingehenden Immobilien-Objekte, unabhangig von der Quelle (E-Mail, Upload, Portal-Scraping, manuell). Die Seite hat eine klare vertikale Struktur:

### Layout-Skizze

```text
+========================================================================+
|  OBJEKTEINGANG                                                          |
|  Alle eingehenden Objekte, Exposes und Angebote                         |
+========================================================================+

+------------------------------------------------------+  +--------------+
|  AKTIVE ANKAUFSMANDATE                    (75%)      |  | UPLOAD (25%) |
|                                                      |  |              |
|  [Alle]  [AKQ-001 MFH Berlin]  [AKQ-002 ETW Mun..]  |  |   +------+   |
|                                                      |  |   | Drop |   |
|  Listenform: Code | Client | Asset-Fokus | Objekte   |  |   | Zone |   |
|  AKQ-001  Hr. Meyer   MFH        12 Objekte          |  |   | PDF  |   |
|  AKQ-002  Fr. Schulz  ETW         5 Objekte          |  |   +------+   |
|  AKQ-003  —           Gewerbe     0 Objekte          |  |              |
|  + "Kein Mandat" (Portal/freie Objekte)              |  | oder Klick   |
+------------------------------------------------------+  +--------------+

+========================================================================+
|  Filter: [Alle] [Eingegangen] [Analysiert] [Akzeptiert]  | Suche...    |
+========================================================================+

+========================================================================+
|  OBJEKTLISTE (Tabelle)                                                  |
|------------------------------------------------------------------------|
| Titel          | Adresse   | Preis    | Expose | Kalkulation | Mandate |
|                |           |          |  Link  |    Link     | Zuordng |
|------------------------------------------------------------------------|
| MFH Neukolln   | Berlin    | 2.4M EUR | [PDF]  | [Kalk.]     | [v AKQ] |
|   8 WE, 640m2, Bj. 1912, 4.8% Rendite                       | Dropdown|
|                                                               | bis 4   |
|------------------------------------------------------------------------|
| ETW Schwabing  | Munchen   | 580k EUR | [PDF]  | [Kalk.]     | [v AKQ] |
|   3 Zi., 85m2, Bj. 2004                                      |         |
+========================================================================+
```

### Interaktionslogik

**Mandats-Kachel (links oben):**
- Listet alle aktiven Ankaufsmandate als kompakte Zeilen
- Klick auf ein Mandat = filtert die Objektliste darunter auf zugeordnete Objekte
- "Alle" Chip zeigt alles (inkl. nicht-zugeordnete Portal-Treffer)

**Upload-Kachel (rechts oben):**
- Drag-and-Drop Zone fur PDFs
- Upload landet direkt als `acq_offers` Eintrag (wie bisher via `useExposeUpload`)
- Optional: Mandat-Zuordnung beim Upload

**Objektliste (Tabelle darunter):**
- Jede Zeile zeigt: Titel, Adresse, Preis, Kennzahlen (WE, Flache, Rendite)
- **Expose-Link**: Klickbar, offnet das gespeicherte Expose-PDF (aus Storage)
- **Kalkulations-Link**: Klickbar, navigiert zu `/portal/akquise-manager/objekteingang/{offerId}` wo Bestand/Aufteiler-Kalkulation bereits existiert
- **Mandats-Zuordnung**: Bis zu 4 Dropdowns pro Zeile, um das Objekt einem oder mehreren Mandaten zuzuweisen
- Zeile selbst ist klickbar → offnet die Detail-/Kalkulationsseite

**Konsequenz fur Tools:**
- **Standalone-Kalkulator entfallen lassen** — jedes Objekt hat seine eigene Kalkulation auf der Detailseite
- Portal-Suche und KI-Intake bleiben unter Tools (dort werden Objekte gefunden, die dann im Objekteingang landen)

---

## Umsetzungsplan

### Datei-Anderungen

| Datei | Aktion |
|-------|--------|
| `ObjekteingangList.tsx` | Kompletter Rebuild: WidgetGrid durch 2-Kachel-Layout ersetzen (75/25), Mandats-Liste links, Upload rechts, Tabelle erweitern mit Expose-Link + Kalkulations-Link + Mandats-Dropdowns |
| `AkquiseTools.tsx` | Standalone-Kalkulator Collapsible + Import entfernen |
| `components/index.ts` | `StandaloneCalculatorPanel` Export entfernen |
| `useAcqOffers.ts` | Neue Mutation `useAssignOfferToMandate` (update mandate_id auf acq_offers) |

### Detaillierte Anderungen pro Datei

**1. `ObjekteingangList.tsx`** (Hauptarbeit)

Oberer Bereich:
- `grid grid-cols-[3fr_1fr]` Layout
- Linke Kachel: Card mit kompakter Mandats-Tabelle (Code, Client, Asset-Fokus, Objektanzahl), klickbare Zeilen als Filter
- Rechte Kachel: Card mit Upload-Dropzone (bestehende `useExposeUpload` Hook wiederverwenden)

Tabelle:
- Neue Spalte "Expose": Prufung ob `acq_offer_documents` mit Typ `expose` existiert → Link zum Signed-URL Download
- Neue Spalte "Kalkulation": Button/Link navigiert zu ObjekteingangDetail
- Neue Spalte "Mandats-Zuordnung": Select-Dropdown mit verfugbaren Mandaten, onChange speichert `mandate_id` auf dem Offer
- Zweite Zeile pro Eintrag (optional): Kurzinfo (WE, m2, Baujahr, Rendite) als Badges

**2. `AkquiseTools.tsx`**
- Entferne `StandaloneCalculatorPanel` Import und den gesamten Collapsible-Block (Zeilen 67-89)

**3. `useAcqOffers.ts`**
- Neue Mutation: `useAssignOfferToMandate(offerId, mandateId)` → `supabase.from('acq_offers').update({ mandate_id }).eq('id', offerId)`

### Nicht geandert
- `ObjekteingangDetail.tsx` bleibt unberuhrt — dort existieren bereits Bestand/Aufteiler-Kalkulationen, Schnellanalyse-Banner, Dokumente, Aktivitaten
- Portal-Suche + KI-Intake bleiben unter Tools (sie speisen den Objekteingang)
- `portal_listings` / `portal_search_runs` Tabellen bleiben (diagnostics backend)

