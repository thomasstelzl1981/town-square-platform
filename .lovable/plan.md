

# Tiefenanalyse AkquiseManager (MOD-12) — Vollständiger Befund

## Zusammenfassung

Das AkquiseManager-Modul hat **6 Sub-Pages** die grundsätzlich laden, aber **mehrere Edge Functions sind funktional kaputt**. Der User klickt sich durch Buttons, die Spinner zeigen, aber nie zu Ergebnissen kommen. Hier die vollständige Analyse:

---

## 1. PORTAL-RECHERCHE (Webscraping) — KAPUTT

**Symptom:** Suche startet, Spinner dreht 55 Sekunden, dann Fehler-Toast oder 0 Ergebnisse.

**Root Cause:** Die `sot-research-engine` Edge Function nutzt `apify~web-scraper` Actor für Portal-Scraping (ImmoScout24, Immowelt, eBay). Dieser Actor wird mit einer inline `pageFunction` aufgerufen — ein **synchroner Apify-Run** mit 55s-Timeout. Der Actor braucht länger als 55s → AbortError **bei jedem Aufruf**.

**Beweis aus Edge Function Logs (5 aufeinanderfolgende Aufrufe):**
```
Apify portal timeout or error: AbortError: The signal has been aborted
Phase 1 complete: 0 results from apify_portal
Research complete: 0 results in 55004ms
```

**Fix-Ansatz:**
- Option A: Von `run-sync-get-dataset-items` auf **asynchronen Apify-Run** umstellen (`run` → `waitForFinish` Polling)
- Option B: Apify-Portal-Scraper ersetzen durch **Firecrawl** (bereits als Connector konfiguriert mit API Key) → schneller, kein 55s-Timeout
- Option C: Für ImmoScout24 den vorhandenen `IS24_CONSUMER_KEY/SECRET` nutzen (echte API statt Scraping)

---

## 2. GEOMAP-ANALYSE (Standalone) — KAPUTT

**Symptom:** Adresse eingeben → Button klicken → Fehler oder leere Antwort.

**Root Cause:** `sot-geomap-snapshot` hat **keinen Standalone-Modus**. Die Hook `useStandaloneGeoMap` sendet `{ address, standalone: true }`, aber die Edge Function ignoriert `standalone` und versucht sofort:
1. `acq_offers` per `offerId` zu laden (offerId ist `undefined` → query findet nichts)
2. `acq_analysis_runs` INSERT mit `offer_id: undefined` → schlägt fehl oder erzeugt Müll-Record

Die GeoMap-Analyse funktioniert **nur** mit einem bestehenden Offer (Objekteingang-Detail), nicht standalone.

**Fix:** Standalone-Modus in `sot-geomap-snapshot` hinzufügen — wenn `standalone: true`, DB-Lookups und DB-Writes überspringen, direkt AI-Analyse auf Basis der `address` ausführen.

---

## 3. KI-RECHERCHE (Immobilienbewertung) — FUNKTIONIERT ✓

**Status:** `sot-acq-standalone-research` nutzt Lovable AI (Gemini 2.5 Pro) direkt. LOVABLE_API_KEY ist konfiguriert. Sollte funktionieren.

---

## 4. SPRENGNETTER-BEWERTUNG — FALLBACK-MODUS

**Status:** `SPRENGNETTER_API_KEY` und `SPRENGNETTER_CUSTOMER_ID` sind **nicht konfiguriert**. Die Edge Function fällt auf einen AI-Fallback zurück und generiert geschätzte Werte. Das ist kein Bug — aber der User sollte wissen, dass keine echte Sprengnetter-Bewertung stattfindet.

---

## 5. EXPOSÉ-UPLOAD (Standalone Kalkulator) — FIX DEPLOYED, TESTEN

**Status:** Der letzte Fix (Storage-Policy + Edge Function standalone mode + Parameter-Fix) wurde gerade deployed. Folgende Punkte wurden behoben:
- `StandaloneCalculatorPanel` sendet jetzt korrekt `{ standaloneMode: true, storagePath, bucketName: 'tenant-documents' }`
- `sot-acq-offer-extract` hat Standalone-Modus
- Storage-Policy für `acq-documents` Bucket wurde hinzugefügt

**Aber:** Die PDF-Extraktion in `sot-acq-offer-extract` ist **sehr limitiert**:
```typescript
if (isPDF) {
  return `[PDF-Dokument: ${fileName}]\nGröße: ${fileData.size} Bytes\n
          Hinweis: Vollständige PDF-Extraktion erfordert OCR-Integration.`;
}
```
PDFs werden **nicht wirklich gelesen** — die AI bekommt nur den Dateinamen und die Dateigröße. Das erklärt, warum extrahierte Werte immer leer/falsch sind. Hier fehlt eine echte PDF-Parsing-Integration (z.B. `sot-document-parser` existiert bereits als Edge Function).

---

## 6. EXPOSÉ-UPLOAD (Objekteingang ExposeDragDropUploader) — RLS-FIX DEPLOYED

**Status:** Die Storage-Policy wurde in der letzten Migration hinzugefügt. Upload in `acq-documents` Bucket unter `{tenant_id}/manual/` sollte jetzt funktionieren.

**Aber:** Der `ExposeDragDropUploader` ist unter "TOOLS" nicht direkt sichtbar — er wird nur als separates Feature im `ObjekteingangList` Button "Exposé hochladen" verwendet. Die Tools-Seite zeigt stattdessen den `StandaloneCalculatorPanel` mit eigenem Drop-Zone.

---

## 7. DATENRAUM — WAHRSCHEINLICH LEER

**Status:** Zeigt Dateien aus dem `acq-documents` Bucket an. Da bisher keine erfolgreichen Uploads stattfanden (wegen RLS-Block), ist der Datenraum leer. Nach dem RLS-Fix sollte er Dateien anzeigen.

---

## 8. MANDATE-SEITE — FUNKTIONIERT TEILWEISE

**Status:** Die 4-Kachel-Workflow-Seite lädt. KI-Erfassung (Profil-Extraktion via `sot-acq-profile-extract`) sollte funktionieren. Die Kontaktrecherche innerhalb der Mandate-Seite nutzt `useResearchEngine` → selbes Apify-Timeout-Problem wie Portal-Recherche.

---

## 9. OBJEKTEINGANG — FUNKTIONIERT (LEER)

**Status:** Seite lädt korrekt, zeigt 0 Objekte. "Alle Eingänge" Kachel und Filter-Chips funktionieren. Button "Exposé hochladen" navigiert/öffnet Dialog.

---

## 10. DATENBANK — FUNKTIONIERT (LEER)

**Status:** Tabellen-Ansicht lädt korrekt, Excel-Style. Leer da keine Objekte vorhanden.

---

## Fix-Plan (4 Prioritäten)

### P1: Portal-Recherche reparieren
- `sot-research-engine` für `intent: search_portals` umbauen
- Apify `web-scraper` Actor (synchron, 55s Timeout) ersetzen durch **Firecrawl** (bereits connected)
- Firecrawl scrapt die Portal-URLs direkt und extrahiert per AI die Listings
- Alternativ: IS24 API nutzen (Keys vorhanden)

### P2: GeoMap Standalone-Modus
- `sot-geomap-snapshot` um Standalone-Pfad erweitern
- Wenn `standalone: true` → keine DB-Operationen, direkt AI-Analyse
- Ergebnis als `GeoMapResult`-Shape zurückgeben (nicht als raw AI-JSON)

### P3: PDF-Extraktion verbessern
- `sot-acq-offer-extract` mit `sot-document-parser` integrieren
- Oder: Base64-encoded PDF an Gemini senden (unterstützt PDF nativ)
- Damit werden Exposé-Uploads tatsächlich nutzbar

### P4: GeoMap Response-Mapping
- Standalone GeoMap liefert ein anderes JSON-Shape als der Hook erwartet
- `useStandaloneGeoMap` erwartet `{ location_score, avg_rent_sqm, ... }`
- Die AI-Antwort hat `{ real_estate_market: { avg_rent_sqm }, investment_rating: { overall_score } }`
- Response-Mapping in der Edge Function oder im Hook hinzufügen

### Betroffene Dateien
1. `supabase/functions/sot-research-engine/index.ts` — Portal-Scraping durch Firecrawl ersetzen
2. `supabase/functions/sot-geomap-snapshot/index.ts` — Standalone-Modus hinzufügen
3. `supabase/functions/sot-acq-offer-extract/index.ts` — PDF-Parsing verbessern
4. `src/hooks/useAcqTools.ts` — GeoMap Response-Mapping (falls nötig)

