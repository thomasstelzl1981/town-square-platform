
## Ziel
Das Routing für **/admin/futureroom** so stabilisieren, dass:
- der Einstieg **/admin/futureroom** deterministisch auf **/admin/futureroom/inbox** führt
- **/admin/futureroom/inbox** nie mehr in einen 404 läuft
- Mixed-Case-URLs (**/Admin/FutureRoom/...**) keine Verwirrung/Fehlzustände erzeugen
- die Lösung manifest-konform bleibt (keine “Schattenrouten”, kein Drift)

---

## Was ich bisher sicher weiß (aus Code-Analyse)
### Aktuelle Architektur
- `ManifestRouter` generiert Zone‑1 Routes aus `routesManifest.ts`.
- FutureRoom ist als **“Desk mit internal routing”** implementiert:
  - Outer route: `/admin/futureroom/*` → rendert `src/pages/admin/FutureRoom.tsx`
  - Inner routing in `FutureRoom.tsx` via `<Routes>`:
    - index → `<Navigate to="inbox" replace />`
    - `inbox`, `zuweisung`, `finanzierungsmanager`, `bankkontakte`, `monitoring`

### Wichtiges Indiz (passt exakt zu deinem Symptom)
Dein Symptom ist typisch für “zweistufiges Routing” mit Mini-Router im Page-Component:
- Du gehst auf `/Admin/FutureRoom` → Seite erscheint kurz (FutureRoom wrapper rendert)
- dann Redirect → `/Admin/FutureRoom/inbox`
- dann 404 (Route-Match kippt irgendwo zwischen Outer/Inner Router oder es greift eine NotFound-Fallback-Route)

Ich konnte im Tool-Browser `/Admin/FutureRoom/inbox` erfolgreich laden. Das bedeutet: Der Bug ist sehr wahrscheinlich **ein spezieller Pfad-/Casing-/Navigation-Edgecase** oder ein **Konflikt zwischen Desk-Routing und Manifest-Routing**, der bei dir zuverlässig triggert.

---

## Hypothesen (priorisiert) + warum sie plausibel sind
### H1 — Mixed-Case URL + inkonsistente Normalisierung (hoch)
- React Router matcht zwar standardmäßig case-insensitive, aber:
  - Es gibt in Apps oft eigene String-Checks (`includes`, `startsWith`) oder NavLink-Wrapper, die case-sensitiv sind.
  - Außerdem können Redirects aus relativen Pfaden in Kombination mit Parent-Wildcards unerwartete Targets erzeugen.
- Ergebnis: `/Admin/FutureRoom` → Redirect erzeugt Pfad, der beim Outer Router nicht mehr in der gleichen Route landet → NotFound.

### H2 — Desk-Wildcard + inner `<Routes>` (“Mini-Router”) erzeugt fragile Route-Base (hoch)
- `FutureRoom.tsx` nutzt `<Routes>` innerhalb eines Route-Elements.
- Das ist möglich, aber anfälliger als das Standardpattern `<Outlet>` mit echten Nested Routes.
- Bei bestimmten Konstellationen (Parent `*`, Mixed-Case, Redirects) kann die Route-Base nicht so stabil sein, wie man erwartet.

### H3 — Es existiert irgendwo ein Full-Page navigation trigger (mittel)
- Wenn irgendein Link/Navigation (z.B. in Tabs oder Sidebar) nicht über react-router navigiert, sondern einen echten Page-Load auslöst, kann der Host bei bestimmten Pfaden 404 liefern oder die App in NotFound laufen.
- Das wäre konsistent mit “kurz sichtbar, dann 404”.

---

## Lösungsvorschlag (sicher & drift-präventiv)
Ich würde FutureRoom auf ein **robustes Nested-Routes-Pattern** umbauen und gleichzeitig eine **kanonische Pfad-Normalisierung (lowercase)** einziehen.

### Kernprinzip
- Kein “Mini-Router” in `FutureRoom.tsx` mehr.
- Stattdessen:
  - `ManifestRouter` definiert FutureRoom als Parent-Route mit Children (in einem Block, explizit).
  - `FutureRoom.tsx` wird zu einem **Layout** (Header + Tabs) und rendert die aktive Subpage via `<Outlet />`.
- Zusätzlich: eine kleine “NormalizePath”-Logik, die `/Admin/FutureRoom/...` sauber nach `/admin/futureroom/...` umschreibt (ohne Query/Hash zu verlieren).

Das senkt das Verwirrpotenzial massiv und macht das Routing deterministisch.

---

## Konkreter Implementierungsplan (Change Sets)

### Change Set 1 — Reproduktion & Diagnose absichern (ohne funktionale Änderung)
**Ziel:** Beweisen, ob der 404 ein Router-Match-Problem oder ein Hard-Reload/Host-404 ist.

**Änderungen (klein, dev-safe):**
- In `FutureRoom.tsx` temporär ein sehr leichtes Debug-Logging (nur in dev) hinzufügen:
  - `location.pathname`, `location.key`
  - “rendered FutureRoom wrapper”
- In NotFound (falls vorhanden) optional: `location.pathname` anzeigen (dev only)

**Akzeptanzkriterium:**
- Wir sehen eindeutig, ob die 404-Seite aus unserem App-NotFound kommt (SPA) oder ob es ein serverseitiger 404 wäre.

**Smoke Test:**
1. `/Admin/FutureRoom` öffnen
2. Konsole prüfen: Pfadverlauf dokumentiert
3. Prüfen ob 404 in-App oder serverseitig

---

### Change Set 2 — FutureRoom Routing auf Nested Routes umstellen (Hauptfix)
**Ziel:** Keine fragile doppelte Routing-Logik mehr, kein “Flash → Redirect → 404”.

**Scope (Code):**
1. `src/router/ManifestRouter.tsx`
   - `futureroom` aus `adminDeskMap` entfernen (damit nicht mehr als Desk-Wildcard läuft)
   - Stattdessen einen expliziten Route-Block definieren:
     - `/admin/futureroom` als Parent-Route
     - Children:
       - index → redirect auf `inbox`
       - `inbox`, `zuweisung`, `finanzierungsmanager`, `bankkontakte`, `monitoring`
   - Wichtig: Die “standard routes”-Schleife muss futureroom-* weiterhin skippen, damit keine doppelten Routen entstehen.

2. `src/pages/admin/FutureRoom.tsx`
   - Inneres `<Routes>` entfernen
   - `<Outlet />` einsetzen
   - Tabs bleiben, aber `handleTabChange` navigiert auf relative Child-Pfade (oder absolut, aber konsistent lowercase)
   - `getActiveTab()` robust machen: `location.pathname.toLowerCase()`

**Akzeptanzkriterien:**
- `/admin/futureroom` lädt ohne “Flash” und landet zuverlässig auf `/admin/futureroom/inbox`
- `/admin/futureroom/inbox` ist immer erreichbar
- Alle 5 Tabs funktionieren (Inbox/Zuweisung/Manager/Bankkontakte/Monitoring)
- Keine 404 mehr bei Inbox

**Smoke Test Checkliste:**
1. Direktnavigation:
   - `/admin/futureroom` → Inbox
   - `/admin/futureroom/inbox` → OK
   - `/admin/futureroom/finanzierungsmanager` → OK
2. Tabs klicken: alle 5 Tabs wechseln korrekt
3. Back/Forward im Browser: Tabs bleiben korrekt aktiv

---

### Change Set 3 — Pfad-Normalisierung (Lowercase Canonical) (Stabilitäts-Addon)
**Ziel:** Mixed-Case URLs erzeugen keine Sonderzustände mehr (dein konkreter Einstieg /Admin/FutureRoom).

**Scope (Code):**
- An einer zentralen Stelle (am besten im Router-Level, z.B. in `ManifestRouter` oder einem kleinen Wrapper-Component) prüfen:
  - Wenn `location.pathname` nicht exakt lowercase ist:
    - redirect to `pathname.toLowerCase()` + preserve `search` + `hash`
- Dadurch wird aus `/Admin/FutureRoom/inbox` automatisch `/admin/futureroom/inbox`

**Akzeptanzkriterien:**
- `/Admin/FutureRoom` und `/Admin/FutureRoom/inbox` funktionieren (werden kanonisiert)
- Keine Endlosschleifen (nur redirect wenn path != lower)

**Smoke Test:**
1. `/Admin/FutureRoom` → landet auf `/admin/futureroom/inbox`
2. `/Admin/FutureRoom/finanzierungsmanager` → landet auf `/admin/futureroom/finanzierungsmanager`

---

## Risiken & Mitigation
- **Risiko:** Router-Änderungen können Zone‑1 Navigation beeinflussen.
  - **Mitigation:** FutureRoom ist klar isoliert unter `/admin/futureroom/*`. Keine Manifest-Änderungen nötig, nur Router-Implementierung.
- **Risiko:** Doppelte Routes (Wildcard + explizite) könnten konfligieren.
  - **Mitigation:** Nur ein Pattern aktiv lassen (Nested routes), desk route entfernen.

---

## Minimaler “Jetzt sofort” Workaround (bis Fix live ist)
- Bitte teste einmal explizit (alles lowercase):
  - `/admin/futureroom/inbox`
Wenn das funktioniert, ist sehr wahrscheinlich Mixed-Case/Normalisierung der Trigger.

---

## Offene Info, die ich von dir brauche (damit wir 100% zielgenau sind)
1) Passiert der 404 auch bei komplett lowercase `/admin/futureroom/inbox`?
2) Ist der 404 eine “App-404 Seite” (unser NotFound mit UI) oder ein nackter Browser-404?
3) Kannst du einmal die Browser-Konsole direkt beim Fehler kopieren (1–3 Zeilen reichen)?

Wenn du das bestätigst, setze ich Change Set 2 + 3 in einem Rutsch um, weil das die robusteste, drift-freie Lösung ist.
