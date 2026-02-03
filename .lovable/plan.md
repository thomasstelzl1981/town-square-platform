
Ziel: Eine belastbare Systemanalyse + ein konkreter Fix-/Validierungsfahrplan, damit (a) Navigation/Seiten beim ersten Klick zuverlässig laden, (b) Ladezeiten deutlich sinken, (c) MOD‑04 Musterdaten korrekt sichtbar sind (Portfolio, Kontexte, DMS/Exposé).

---

## 1) Aktueller Befund (aus Analyse)

### 1.1 Auth/Initialisierung erzeugt weiterhin Mehrfach-Requests
In der Browser-Konsole (Reproduktion im Preview) treten direkt nach Start mehrere Auth-Initialisierungen auf:
- `onAuthStateChange:SIGNED_IN`
- `onAuthStateChange:INITIAL`
- zusätzlich `Fallback: getSession()`

Das führt zu mehrfachen, redundanten Backend-Requests, sichtbar im Network:
- `profiles` wird mehrfach geladen
- `memberships` wird mehrfach geladen
- `organizations` wird mehrfach geladen

Symptomatisch passt das zu „funktioniert oft erst beim zweiten Klick“ (erste Navigation kollidiert mit parallel laufender (Re-)Initialisierung / State-Flicker).

### 1.2 MOD‑04 Musterdaten sind in der DB vorhanden – aber aktuell nicht „Exposé/DMS“-fähig
Für Tenant `a000...0001` sind vorhanden:
- `properties`: 1 Objekt (Leipziger Str. 42)
- `units`: 1 Einheit (MAIN)
- `leases`: 1 Mietvertrag (active)
- `landlord_contexts`: 1 Kontext (Familie Mustermann)
- `contacts`: 3 Kontakte (Mieter/HV/Bank)
- `storage_nodes`: 38 Ordner

ABER:
- `documents`: 0
- `document_links`: 0

Damit kann im DMS/Storage nichts als Dokument/Exposé angezeigt werden, weil die UI dort über `documents` + `document_links` arbeitet.

Zusätzlicher Daten-Konsistenz-Hinweis:
- Property hat `status = available`, während die Portfolio-Abfrage in `PortfolioTab` auf `properties.status = 'active'` filtert. Das kann dazu führen, dass im Portfolio keine Einheiten gefunden werden (je nach Query-Logik), obwohl Daten existieren.

### 1.3 UI/Robustheit: Portfolio zeigt Loader ohne sichtbare Fehlerdiagnose
`PortfolioTab` zeigt bei `unitsLoading` nur einen Spinner. Wenn Queries hängen/fehlschlagen oder nie aktiviert werden, gibt es derzeit keinen „Fehlerzustand“, der sagt *warum* es nicht lädt (RLS, Filter, Netzwerk, etc.).

### 1.4 Warnung im UI: ModuleHowItWorks bekommt ref (forwardRef-Warnung)
Im User-Console-Log ist weiterhin die Warnung:
- „Function components cannot be given refs… Check render method of StammdatenPage … at ModuleHowItWorks“
Das ist nicht der Haupt-Performance-Killer, aber es erzeugt Noise und kann zusätzliche Re-Renders begünstigen.

---

## 2) Wahrscheinlichste Root-Causes (Hypothesen, die wir gezielt verifizieren)

1) **AuthContext initialisiert mehrfach** (SIGNED_IN + INITIAL + getSession fallback) und triggert mehrere `fetchUserData()` parallel.
   - Das erzeugt redundante Requests, potenziellen State-Flicker und kann Routing/Queries beim ersten Klick stören.

2) **PortfolioTab filtert auf `properties.status = 'active'`**, Musterdaten haben `available`.
   - Ergebnis: Portfolio findet ggf. keine Daten oder zeigt leere/unerwartete Ansicht.

3) **„Kein Exposé“ ist aktuell erwartbar**, weil keine Dokumente/Links vorhanden sind (0/0).
   - DMS kann dann keine Exposé-/Grundbuch-/etc. Demo-Dateien listen.

4) **Fehlende Error-UI**: Wenn Backend-Abfragen scheitern/zu lange dauern, bleibt nur ein Loader. Für den Nutzer wirkt das wie „nichts funktioniert“.

---

## 3) Implementierungs-Phasenplan (Fix + Validierung)

### Phase A — Diagnose & Messbarkeit (kurz, aber entscheidend)
Ziel: In 10 Minuten eindeutig sehen, *welche* Abfragen hängen/fehlen und *warum*.

1. **In AuthContext temporäre, strukturierte Debug-Metriken** (nur in Preview/dev):
   - Log: „init-start“, „init-source“, „fetchUserData-start/end“, „activeTenantId“, „activeOrgId“
   - Log: Request-Counts (profiles/memberships/orgs) pro Page-Load

2. **In PortfolioTab / StorageTab ErrorState statt Silent-Loader**
   - Nutzung von `isError`, `error` aus React Query:
     - UI: „Daten konnten nicht geladen werden“ + konkrete Fehlermeldung + „Erneut versuchen“ (refetch)
   - Damit sieht man sofort, ob es ein Filter-/RLS-/Netzwerkproblem ist.

Ergebnis dieser Phase: Kein „Blackbox“-Loading mehr.

---

### Phase B — Auth-Initialisierung wirklich „Single-Flight“ machen (P0)
Ziel: 1x Session-Ermittlung + 1x fetchUserData, kein Dreifach-Trigger.

Maßnahmen:
1. **`hasInitialized` von `useState` auf `useRef` umstellen** (kein Re-Render/keine Effect-Re-Subscribes).
2. **Debounce/Guard gegen doppelte Initial-Events**:
   - Wenn bereits ein init läuft, ignorieren.
   - Wenn SIGNED_IN schon verarbeitet wurde, INITIAL ignorieren (oder umgekehrt).
3. **Fallback `getSession()` abbrechen**, sobald `onAuthStateChange` einmal erfolgreich geliefert hat.
4. **`fetchUserData` parallelisieren** (Profil + Memberships per `Promise.all`) und nur 1x Organization-Fetch.

Akzeptanzkriterien:
- Beim App-Start nur 1x `profiles`, 1x `memberships`, 1x `organizations` (max. 3 Calls).
- Navigation „Stammdaten → Immobilien → DMS“ reagiert beim ersten Klick.

---

### Phase C — MOD‑04 Portfolio: Daten-Filters/Query-Enablement korrigieren (P0)
Ziel: Musterdaten erscheinen zuverlässig im Portfolio, keine Endlos-Loader.

Maßnahmen:
1. **Status-Filter korrigieren**:
   - Entweder Musterdaten auf `status='active'` migrieren ODER
   - PortfolioQuery auf `status in ('active','available')` erweitern (bis Statusmodell final ist).
2. **Query-Keys konsistent auf `activeTenantId` statt `activeOrganization?.id`** (einheitlicher Tenant-SSOT).
3. **`enabled`-Bedingungen härten**:
   - Nur starten, wenn `activeTenantId` wirklich gesetzt ist.
4. **Portfolio: wenn 0 Einheiten → klare EmptyState** (statt gefühltem „Laden“).

Akzeptanzkriterien:
- `/portal/immobilien/portfolio` zeigt DEMO-001 (Leipzig) beim ersten Laden.
- Kein Spinner > 1–2 Sekunden ohne sichtbaren Fortschritt/Fehler.

---

### Phase D — DMS/Exposé Musterdaten vervollständigen (P0 für Demo)
Ziel: „Ich sehe kein Exposé“ wird gelöst.

Maßnahmen:
1. **Minimaler Demo-Dokumentensatz**:
   - 1–3 Demo-Dokumente (z.B. Exposé Ankauf, Grundbuchauszug, Mietvertrag)
   - **inkl.** `documents` + `document_links` (damit DMS UI etwas listen kann)
2. **Optional (besser)**: Auch echte Dummy-Datei in File Storage ablegen, damit Download/Preview nicht ins Leere läuft.
3. **Dokumente deterministisch in passende storage_nodes verlinken** (z.B. Exposé-Ordner innerhalb der Objektstruktur).

Akzeptanzkriterien:
- `/portal/dms/storage` zeigt im passenden Ordner mind. 1 Demo-Dokument.
- Nutzer kann ein „Exposé“-Artefakt sehen (und idealerweise öffnen/downloaden).

---

### Phase E — ModuleHowItWorks forwardRef-Warnung beheben (P1)
Ziel: Konsole sauber, weniger Re-render Noise.

Maßnahmen:
- `ModuleHowItWorks` mit `forwardRef` kapseln oder ref-Weitergabe upstream verhindern (je nachdem, wo der ref entsteht).
- Danach: Keine ref-Warnung mehr beim Laden von `/portal/stammdaten`.

---

### Phase F — End-to-End Validierung (automatisiert + manuell)
1. **Playwright Smoke-Test**:
   - Login (falls notwendig)
   - Route-Kette: `/portal/stammdaten` → `/portal/immobilien/portfolio` → `/portal/dms/storage`
   - Assertion: jeweils „sichtbarer Content“ (kein dauerhafter Loader)
2. **Manuelle Checks**:
   - „Erster Klick“: Sidebar-Navigation reagiert sofort.
   - Musterdaten: MOD‑04 Portfolio + Kontexte korrekt, DMS zeigt Exposé-Demo.

---

## 4) Reihenfolge (damit es schnell wieder nutzbar ist)
1) Phase A (Fehler sichtbar machen) – 15–30 Minuten  
2) Phase B (Auth Single-Flight) – P0  
3) Phase C (MOD‑04 Portfolio Filter/Enablement) – P0  
4) Phase D (DMS/Exposé Demo-Dokumente) – P0 für Präsentation  
5) Phase E (forwardRef-Warnung) – P1  
6) Phase F (E2E Test) – direkt danach

---

## 5) Erwartetes Ergebnis
- Navigation lädt beim ersten Klick.
- Deutlich weniger redundante Requests (insb. Auth/Profil/Org).
- MOD‑04 Musterdaten sichtbar (Portfolio + Kontext).
- DMS/Exposé nicht mehr „leer“: zumindest Demo-Dokumente vorhanden.
- Keine „stillen“ Loader mehr: bei Problemen wird klar angezeigt, was fehlt (Filter, Rechte, Netzwerk).

