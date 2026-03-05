

# Komplettanalyse AkquiseManager (MOD-12) — UI, UX & Funktionalität

## Status-Übersicht aller 6 Sub-Pages

| Seite | UI/UX | Funktional | Details |
|-------|-------|-----------|---------|
| Dashboard | OK | OK | Visitenkarte, KPI-Karten, Mandate-Cards laden korrekt |
| Mandate | OK | Teilweise | 4-Kachel-Workflow lädt, KI-Erfassung nutzt `sot-acq-profile-extract` (funktioniert), Kontaktrecherche nutzt `sot-research-engine` (Firecrawl-Pfad jetzt implementiert) |
| Objekteingang | OK | OK (leer) | Liste + Detail laden, keine Daten vorhanden |
| Tools | OK | **3 von 5 kaputt** | Siehe Detailanalyse unten |
| Datenbank | OK | OK (leer) | Excel-artige Tabelle, leer |
| Provisionen | OK | OK (leer) | Provisions-Übersicht, keine Daten |

---

## Tools-Seite — Detailanalyse

### 1. Portal-Recherche — FUNKTIONSFÄHIG (nach letztem Fix)
- **Implementierung:** `sot-research-engine` mit `intent: search_portals` → ruft jetzt `searchPortalsFirecrawl()` auf
- **Voraussetzung:** `FIRECRAWL_API_KEY` ist konfiguriert (Connector aktiv)
- **Status:** Sollte funktionieren. Firecrawl scrapt Portal-URL, AI extrahiert Listings.
- **UI:** Sauber — Portal-Dropdown, Suchbegriff, Region, Preisspanne, Ergebnis-Cards mit Links

### 2. Immobilienbewertung (KI-Recherche) — FUNKTIONSFÄHIG
- **Implementierung:** `sot-acq-standalone-research` → Gemini 2.5 Flash
- **Voraussetzung:** `LOVABLE_API_KEY` (vorhanden)
- **Status:** Funktioniert — KI generiert strukturierte Standort/Markt/Risiko/Empfehlungsdaten
- **UI:** Tabs (Standort, Markt, Risiken, Empfehlung) — gut strukturiert

### 3. GeoMap-Analyse — FUNKTIONSFÄHIG (nach letztem Fix)
- **Implementierung:** `sot-geomap-snapshot` mit `standalone: true` → AI-basiert
- **Voraussetzung:** `LOVABLE_API_KEY` (vorhanden) — **KEINE externe GeoMap-API nötig**
- **Frage des Users "ob das schon funktioniert ohne API":** **JA.** Die GeoMap nutzt **keine externe GeoMap-API**. Sie verwendet Gemini AI um Standortdaten zu schätzen (Mietniveau, Kaufpreis, Infrastruktur, Hochwasser, Lärm etc.). Das ist ein AI-Schätzwert, keine echte Geodaten-API. Die Datenqualität ist "plausibel aber nicht verifiziert".
- **UI:** Score-Cards, Detail-Grid, POI-Badges — gut

### 4. Sprengnetter-Bewertung — FALLBACK-MODUS
- **Status:** `SPRENGNETTER_API_KEY` und `SPRENGNETTER_CUSTOMER_ID` sind **NICHT konfiguriert**
- **Was passiert:** Die Edge Function `sot-sprengnetter-valuation` fällt auf einen simplen Heuristik-Fallback zurück: `2.500 €/m² × Fläche × Baujahr-Faktor`. Das ist kein AI-Schätzwert, sondern eine primitive Formel.
- **Empfehlung:** Entweder (a) Sprengnetter-API-Keys beschaffen, oder (b) den Fallback durch eine AI-basierte Bewertung ersetzen (wie bei GeoMap), oder (c) den Button deaktivieren mit Hinweis "Sprengnetter nicht konfiguriert".

### 5. Standalone-Kalkulator (Exposé-Upload) — TEILWEISE FUNKTIONSFÄHIG
- **Upload:** Geht über `useUniversalUpload` in Bucket `tenant-documents` — sollte nach RLS-Fix funktionieren
- **PDF-Extraktion:** `sot-acq-offer-extract` sendet PDF als Base64 an Gemini für Textextraktion, dann zweiter AI-Call für strukturierte Daten. **Funktioniert theoretisch**, aber:
  - Große PDFs (>5MB) können beim Base64-Encoding im Edge Function Memory-Limit scheitern
  - Gemini's `image_url` mit `data:application/pdf;base64,...` ist experimentell
- **Kalkulatoren (Bestand/Aufteiler):** Rein client-seitig, Engine-basiert — **funktionieren korrekt**
- **UI:** SmartDropZone, AIProcessingOverlay, Input-Felder, Tabs — gut

### 6. Datenraum — WAHRSCHEINLICH LEER
- Zeigt Dateien aus `acq-documents` Bucket — nach RLS-Fix sollten neue Uploads sichtbar werden

---

## UI/UX-Bewertung

### Positiv
- Konsistente Nutzung von `DESIGN` Manifest (Spacing, Typography, Cards)
- `PageShell` + `ModulePageHeader` Pattern überall korrekt
- Dashboard: `ManagerVisitenkarte` + KPI-Widget + Mandate-Cards — sauberes Layout
- Tools: Klare Trennung in 5 Sektionen, Collapsible für Kalkulator und Datenraum
- Responsive: `isMobile` Check im Kalkulator

### Verbesserungspotenzial
- **Kein Fehler-Feedback bei fehlender API:** Der Sprengnetter-Button zeigt keine Warnung, dass die API nicht konfiguriert ist. User klickt, wartet, bekommt einen Schätzwert ohne Kontext.
- **Doppelte GeoMap:** GeoMap existiert als eigenständige Card UND als Button in der Immobilienbewertung — beide rufen dieselbe Edge Function auf. Redundant.
- **Kalkulatoren:** Die Collapsible-Section "Standalone-Kalkulatoren" ist standardmäßig geschlossen — könnte prominent sein, da es der Hauptnutzen der Tools-Seite ist.

---

## Zusammenfassung: Was braucht APIs und was nicht?

| Feature | Benötigte API | Status | Funktioniert ohne API? |
|---------|--------------|--------|----------------------|
| Portal-Recherche | Firecrawl | **Konfiguriert** | Nein |
| KI-Recherche | Lovable AI (Gemini) | **Konfiguriert** | — (AI IST die API) |
| GeoMap-Analyse | Lovable AI (Gemini) | **Konfiguriert** | — (AI IST die API) |
| Sprengnetter | Sprengnetter API | **NICHT konfiguriert** | Ja, aber nur primitiver Fallback |
| PDF-Extraktion | Lovable AI (Gemini) | **Konfiguriert** | — (AI IST die API) |
| Kalkulatoren | Keine | — | Ja, rein client-seitig |

---

## Empfohlene Fixes (Priorisiert)

### P1: Sprengnetter Fallback verbessern
- Den primitiven `2500 €/m² × Fläche`-Fallback durch eine AI-Bewertung ersetzen (Gemini, analog zu GeoMap)
- Oder: Button mit Hinweis-Badge "Schätzwert" versehen, damit der User weiß, dass es kein echtes Gutachten ist

### P2: Doppelte GeoMap konsolidieren
- Die standalone `GeoMapTool` Card und den "GeoMap-Analyse" Button in `PropertyResearchTool` zeigen dasselbe
- Empfehlung: GeoMap-Card entfernen, da die Immobilienbewertung bereits GeoMap integriert hat

### P3: Sprengnetter-Button UX
- Wenn keine API-Keys konfiguriert sind: Button mit Tooltip/Badge "Schätzwert — Sprengnetter nicht verbunden" anzeigen statt still einen Fallback-Wert zu liefern

### Betroffene Dateien
1. `supabase/functions/sot-sprengnetter-valuation/index.ts` — AI-Fallback statt Heuristik
2. `src/pages/portal/akquise-manager/AkquiseTools.tsx` — GeoMap-Card entfernen (optional)
3. `src/pages/portal/akquise-manager/components/PropertyResearchTool.tsx` — Sprengnetter-Button UX

