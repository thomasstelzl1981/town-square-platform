
## Ziel (was du angefragt hast)

1) **Admin-Dashboard (Zone 1):** Die Website-Buttons sollen **nicht** auf „öffentliche URLs“ zielen, sondern auf **interne App-Pfade** (SPA-Routen), damit ihr die Seiten im Projekt-Kontext bearbeiten könnt.  
2) **Future Room fehlt:** Im Admin-Dashboard bei den Website-Action-Buttons muss **Future Room** ergänzt werden.  
3) **Kaufy-Website Bilder:** Trotz Freigabe werden auf der Website weiterhin **keine Bilder** angezeigt (Screenshots zeigen Placeholder).  
4) **Design-Fix:** Beim Feld „Zu versteuerndes Einkommen“ steht „(zvE)“ in Klammern und erzeugt einen unsauberen Umbruch/Versatz → **Klammer-Zusatz entfernen**.

---

## Was ich aus Screenshot + Code ableite (Root Cause)

### A) „Keine Bilder“ ist aktuell ein Doppelproblem
1) **KaufyHome zeigt generell keine Bilder, weil `image_url` nie befüllt wird.**  
   - `KaufyHome.tsx` lädt Listings, übergibt sie an `KaufyPropertyCard`, aber setzt **kein** `property.image_url`.  
   - `KaufyPropertyCard.tsx` fällt dann auf `'/placeholder.svg'` zurück → exakt das, was man in deinen Screenshots sieht.

2) **Zusätzlich gibt es einen Backend/RLS-Fehler (500) bei `document_links`/`documents`-Abfragen**  
   - Die Logs zeigen: **„infinite recursion detected in policy for relation "documents"“** und im Browser: **REST 500** auf `document_links?...documents!inner(...)`.  
   - Ursache: Die aktuellen RLS-Policies referenzieren sich gegenseitig:
     - `documents` Policy prüft via `EXISTS (...) FROM document_links ...`
     - `document_links` Policy prüft via `EXISTS (...) FROM documents ...`
     - Das kann Postgres als **Policy-Rekursion** erkennen → 500.

Ergebnis: Selbst wenn wir `KaufyHome` korrekt auf Bilder umbauen, schlägt die Bildabfrage derzeit potenziell mit 500 fehl, solange die RLS-Rekursion nicht sauber gelöst ist.

### B) Admin-Dashboard Routes
- In `src/pages/admin/Dashboard.tsx` werden die Website-Buttons aktuell mit `window.open('/kaufy', '_blank')` etc. geöffnet.  
- Das ist zwar ein interner Pfad, aber:
  - In der Praxis führt `_blank` oft dazu, dass ihr „aus dem Bearbeitungs-/Preview-Kontext“ raus navigiert.
  - Außerdem fehlt **/futureroom** komplett.

### C) „(zvE)“ im UI
- In `src/components/zone3/kaufy/InvestmentSearchCard.tsx` steht das Label als: **„Zu versteuerndes Einkommen (zvE)“**.
- Durch die verfügbare Breite in der Search-Card bricht es bei euch unschön um (wie im Screenshot).

---

## Umsetzungsvorschlag (konkret, mit minimalem Risiko)

### 1) Admin-Dashboard: Website-Buttons auf interne SPA-Routen umstellen + Future Room hinzufügen
**Änderung in:** `src/pages/admin/Dashboard.tsx`

- Statt `window.open(..., '_blank')`:
  - Nutzung von `useNavigate()` und `navigate('/kaufy')`, `navigate('/miety')`, `navigate('/sot')`, `navigate('/futureroom')`.
- Optional (nice-to-have): Zusatz-Icon „extern öffnen“ als Secondary-Action, aber Standard bleibt **internes Navigieren**.

**Ergebnis:** Klick im Admin-Dashboard bringt euch direkt in die internen Routen (bearbeitbarer Kontext), plus Future Room ist dabei.

---

### 2) Bilder auf Kaufy: „Golden Path“ sauber schließen (Home + Immobilien-Übersicht + Exposé)
#### 2.1 KaufyHome: Listings um `image_url` (Hero Bild) erweitern
**Änderung in:** `src/pages/zone3/kaufy/KaufyHome.tsx`

- Im bestehenden `dbListings` Query nach dem Laden der Listings:
  - Property-IDs sammeln
  - `document_links` für diese Properties laden (nur `object_type='property'`)
  - bevorzugt `is_title_image=true`, sonst erstes nach `display_order`
  - pro Bild eine URL erzeugen (siehe 2.3)
  - `PropertyData` um `image_url` ergänzen und an `KaufyPropertyCard` weiterreichen

Damit sind die Karten in deinen Screenshots (Passende Kapitalanlage-Objekte) nicht mehr Platzhalter.

#### 2.2 KaufyImmobilien: bleibt, aber Bildlogik stabilisieren
**Änderung in:** `src/pages/zone3/kaufy/KaufyImmobilien.tsx`

- Die Seite hat schon eine Bildlogik, aber sie ist abhängig von der aktuell fehlerhaften RLS-Situation.
- Nach dem RLS-Fix wird sie wieder funktionieren.
- Zusätzlich:
  - sicherstellen, dass Links sortiert (`display_order`) verarbeitet werden
  - klare Priorisierung: `is_title_image` > erstes Bild

#### 2.3 URL-Strategie: Signed URLs vs. direkter Download
Da der Bucket nicht zwingend „public“ sein soll (und ihr wollt ja „öffentlich nur Bilder“ sehr gezielt), bleiben **Signed URLs** sinnvoll.  
Wichtig: Das klappt nur zuverlässig, wenn die Storage-Policy + RLS auf den zugehörigen Tabellen korrekt ist (siehe Punkt 3).

---

### 3) Kritisch: RLS-Rekursion in `documents` / `document_links` beheben (damit keine 500 mehr)
**Änderung via Migration (Backend):**
- Aktuelle Policies `public_read_kaufy_images` und `public_read_kaufy_image_links` verursachen Rekursion.
- Lösung: **Policy-Logik entkoppeln**, z.B. über eine `SECURITY DEFINER`-Funktion, die RLS nicht rekursiv triggert.

**Plan für Migration:**
1) Neue Funktion, z.B. `public.is_kaufy_public_image_document(doc_id uuid) returns boolean`  
   - Prüft:
     - Dokument ist `mime_type like 'image/%'`
     - Dokument ist via `document_links` an `property` gebunden
     - Property hängt an Listing mit `listing_publications(channel='kaufy', status='active')`
2) Neue Policies:
   - `documents`: SELECT erlaubt, wenn `is_kaufy_public_image_document(id)` true ist
   - `document_links`: SELECT erlaubt, wenn `object_type='property'` und `is_kaufy_public_image_document(document_id)` true ist
3) Alte rekursive Policies entfernen/ersetzen.
4) Zusätzlich prüfen/entschärfen: **`documents_select_dev_mode` / `document_links_select_dev_mode`**  
   - Diese klingen nach „Dev“, können aber inhaltlich zu breit sein.
   - Ziel: öffentlich wirklich nur Bilder (Kaufy-aktive Listings), keine PDFs.

**Ergebnis:** Die REST 500 verschwindet, und die Bildqueries funktionieren konsistent.

---

### 4) UI-Fix: „(zvE)“ entfernen, Versatz beheben
**Änderung in:** `src/components/zone3/kaufy/InvestmentSearchCard.tsx`

- Label ändern von:
  - „Zu versteuerndes Einkommen (zvE)“
  zu:
  - „Zu versteuerndes Einkommen“
- Optional: Abkürzung „zvE“ als dezentes Help/Hint:
  - placeholder z.B. „z. B. 60000“
  - oder ein kleines Info-Tooltip (ohne Klammertext im Label)

Zusätzlich (falls nötig):
- `whitespace-nowrap` für Labels oder feinere Grid-Breakpoints, damit nichts mehr springt.

---

## Betroffene Dateien (geplant)

1) `src/pages/admin/Dashboard.tsx`
   - interne Navigation statt externe Öffnung
   - Future Room Button hinzufügen

2) `src/pages/zone3/kaufy/KaufyHome.tsx`
   - `image_url`/Hero-Bild laden und an Cards übergeben

3) `src/pages/zone3/kaufy/KaufyImmobilien.tsx`
   - Bildauswahl robust machen (nach RLS-Fix)

4) `src/components/zone3/kaufy/InvestmentSearchCard.tsx`
   - Label-Text ohne „(zvE)“ + Layout-Finish

5) Neue Backend-Migration (SQL)
   - RLS-Rekursion fixen via Function + neue Policies
   - dev_mode Policies prüfen/absichern

---

## Test-Checkliste (End-to-End)
1) Admin: `/admin` → Buttons „Kaufy / Miety / SoT / Future Room“ navigieren **im selben Tab** auf interne Routen.
2) Kaufy Startseite `/kaufy`:
   - „Passende Kapitalanlage-Objekte“ zeigt **echte Bilder** statt Placeholder.
3) Kaufy Liste `/kaufy/immobilien`:
   - Cards zeigen Hero-Bilder.
4) Kaufy Exposé `/kaufy/immobilien/:publicId`:
   - Galerie lädt Bilder (keine 500er im Netzwerk).
5) RLS-Sicherheit:
   - Öffentlich: **nur Bilder**, keine PDFs über `documents/document_links`.
6) UI:
   - Label „Zu versteuerndes Einkommen“ ohne Klammerzusatz, kein Umbruch/Versatz.

---

## Hinweis zu einem technischen Risiko (kurz, wichtig)
Die beobachtete Meldung „infinite recursion detected in policy“ ist ein **harter Backend-Fehler**, der Abfragen komplett killt. Den beheben wir zuerst, weil sonst jede weitere Bildintegration instabil bleibt.
