

# DMS "Intelligenz" — Erster Menuepunkt mit Marketing-Fokus

## Ueberblick

Der bisherige Tab "Einstellungen" wird zu **"Intelligenz"** umbenannt und an die **erste Position** im DMS-Menue verschoben — noch vor Storage und Posteingang. Die Seite wird zum Einstiegspunkt fuer DMS und erklaert, was die KI-Dokumentenverarbeitung leistet und wie der Datenraum aktiviert werden kann.

---

## Aenderungen

### 1. Route-Manifest: Position + Umbenennung

In `src/manifests/routesManifest.ts` wird der MOD-03 Tiles-Array umgeordnet:

```
tiles: [
  { path: "intelligenz", component: "EinstellungenTab", title: "Intelligenz", default: true },
  { path: "storage",      component: "StorageTab",       title: "Dateien" },
  { path: "posteingang",  component: "PosteingangTab",   title: "Posteingang" },
  { path: "sortieren",    component: "SortierenTab",     title: "Sortieren" },
]
```

- "Intelligenz" kommt an Position 0 mit `default: true`
- `einstellungen` → `intelligenz` (neue Route)
- Component bleibt `EinstellungenTab` (Dateiname aendern wir nicht, nur den Titel)

### 2. DMSPage.tsx: Route + Default anpassen

- Neue Route `/intelligenz` hinzufuegen
- Default-Redirect auf `intelligenz` statt `storage`
- Legacy-Redirect: `/einstellungen` → `/intelligenz`

### 3. EinstellungenTab.tsx: Header + Struktur

**Header:**
- Titel: "Intelligenz"
- Beschreibung: "KI-gesteuerte Dokumentenverarbeitung — Posteingang automatisieren und Ihren Datenraum fuer Armstrong aktivieren"

**Neue Seitenstruktur (5 Kacheln):**

| Pos | Kachel | Inhalt |
|-----|--------|--------|
| 1 | **Datenraum fuer Armstrong aktivieren** | Value-Proposition + Scan/Angebot/Freigabe-Flow (StorageExtractionCard) |
| 2 | **Posteingangs-Auslesung** | Toggle + Pipeline + NK-Beleg-Parsing + Armstrong-Beispiele |
| 3 | **Speicherplatz** | Planauswahl (unveraendert) |
| 4 | **Digitaler Postservice** | Mandate (unveraendert) |
| 5 | **Document Intelligence Engine** | DataEngineInfoCard (unveraendert) |

Die Datenraum-Extraktion rueckt an Position 1 — das Hauptfeature.

### 4. StorageExtractionCard.tsx: Marketing-Upgrade

**Vor dem Scan-Button — Value-Proposition:**
- Headline: "Machen Sie Ihren gesamten Datenbestand fuer Armstrong lesbar"
- Drei Highlight-Punkte:
  - "Kein manuelles Hochladen" — Keine Copy-Paste-Schleifen wie bei ChatGPT oder Copilot
  - "Einmal aktivieren, dauerhaft nutzen" — Einmalige Extraktion, danach sofortiger KI-Zugriff
  - "Volle Kostenkontrolle" — Kostenvoranschlag vor der Freigabe, Sie entscheiden

**Scan/Angebot/Freigabe-Flow bleibt wie gebaut** (scan → Kostenvoranschlag → start → Fortschritt → done)

**NK-Beleg-Parsing wird ENTFERNT** (wandert in Kachel C Posteingangs-Auslesung)

**Nach dem Flow — "Was danach moeglich ist":**
- Konkrete Armstrong-Beispiele:
  - "Fasse alle Mietvertraege zusammen und zeige die Kuendigungsfristen"
  - "Erstelle eine Uebersicht aller Versicherungspolicen mit Praemien"
  - "Vergleiche die Nebenkostenabrechnungen 2024 und 2025"
  - "Welche Dokumente betreffen die Immobilie Musterstr. 5?"
  - "Finde alle offenen Rechnungen der letzten 12 Monate"

### 5. Posteingangs-Auslesung (Kachel C): NK-Beleg-Parsing integrieren

NK-Beleg-Parsing als Unterpunkt hinzufuegen:
- "Nebenkostenbelege werden automatisch analysiert: Versorger, Betrag, Zeitraum und Kostenkategorie werden extrahiert"
- Inklusive im 1 Credit/Dokument Preis

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/routesManifest.ts` | MOD-03 tiles umordnen: intelligenz an Pos 0, default: true |
| `src/pages/portal/DMSPage.tsx` | Route intelligenz + Default-Redirect + Legacy-Redirect einstellungen |
| `src/pages/portal/dms/EinstellungenTab.tsx` | Header "Intelligenz", Kachel-Reihenfolge: Datenraum zuerst, NK-Beleg in Kachel C |
| `src/components/dms/StorageExtractionCard.tsx` | Value-Proposition-Sektion, NK-Beleg entfernen, "Was danach moeglich ist"-Sektion |
| `src/pages/portal/dms/index.ts` | Export bleibt (Dateiname unveraendert) |

