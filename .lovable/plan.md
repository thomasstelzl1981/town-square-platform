
## Ziel (P0)
Das Immobilien-Modul (MOD-04) muss im Portal zuverlässig:
1) die Golden-Path Seed-Immobilie im Portfolio anzeigen,  
2) Finanzierungsdaten (Restschuld/Rate/Zins/Tilgung) im Portfolio anzeigen,  
3) die Immobilienakte (/portal/immobilien/:id) per Klick sicher öffnen (expliziter Link/Button, nicht “versteckt”).

Ich setze dabei den Fokus auf “es funktioniert immer” statt “es sollte funktionieren”.

---

## Was ich bereits sicher weiß (aus Code + Datenbank-Snapshot)
### Seed-Daten sind in der Datenbank vorhanden
- `properties` enthält die Seed-Immobilie (DEMO-001, Leipzig, status=active) im Demo-Tenant `a000...0001`.
- `leases` enthält einen aktiven Mietvertrag für Unit `MAIN`.
- **Finanzierung ist im Seed als `loans` gespeichert** (z.B. outstanding_balance_eur / annuity_monthly_eur / interest_rate_percent sind vorhanden).
- **`property_financing` ist leer** (mindestens für den Demo-Tenant/Seed).

### Warum du “keine Finanzierungsdaten” siehst (Root Cause #1: falsche Datenquelle)
In `src/pages/portal/immobilien/PortfolioTab.tsx` wird Finanzierung aktuell aus **`property_financing`** geladen:
- Query: `from('property_financing') ...`
- Seed schreibt die Finanzierung aber in **`loans`**.
=> Ergebnis: Portfolio kann Miet-/Objektdaten anzeigen, aber **Finanzierungs-Spalten bleiben leer**.

Das erklärt exakt den Teil “keine Finanzierungsdaten drin”, selbst wenn die Seed-Immobilie sichtbar ist.

### Warum “Immobilienakte nicht erreichbar” plausibel ist (Root Cause #2: UX/Click-Pfad kaputt)
In der Portfolio-Tabelle ist rechts ein Eye-Icon gerendert, aber:
- `rowActions={(row) => (<Button ...><Eye/></Button>)}`
- **Kein onClick / keine Navigation**.
- Außerdem stoppt die Action-Zelle Propagation (`onClick={(e) => e.stopPropagation()}`) – d.h. wer auf das Eye klickt, löst NICHT den Row-Click aus.
=> Für Nutzer wirkt es so, als gäbe es “keinen Link” zur Akte, obwohl Row-Click existiert.

Das ist ein klassischer Usability-P0: UI signalisiert “öffnen”, macht aber nichts.

### Zusätzliches Stabilitätsrisiko (Root Cause #3: Render-Side-Effect Bug)
In `PortfolioTab.tsx` wird SearchParam-Cleanup mit `useState(() => { ... setSearchParams(...) })` gemacht.
Das ist ein Side-Effect im Render-Initialisierer (sollte `useEffect` sein) und kann:
- zu “Update during render”-Problemen führen,
- zu instabilem/leerem Render (je nach Timing / StrictMode / Router State).

Das ist ein wahrscheinlichster Kandidat für “manchmal leer / manchmal nicht”.

### Tenant-Scoping-Risiko (Root Cause #4: activeOrganization vs activeTenantId)
Im Auth-Kontext wird im Dev-Mode **activeTenantId erzwungen**, aber PortfolioTab filtert Daten über `activeOrganization.id`.
Wenn diese beiden je nach Session/Timing auseinanderlaufen, bekommst du:
- Portfolio leer,
- Akte “nicht gefunden/kein Zugriff”.
=> Stabiler ist: **für Datenabfragen überall activeTenantId verwenden** (SSOT fürs Tenant-Scoping).

---

## Fix-Strategie (minimal-invasiv, aber “funktioniert immer”)
### A) Portfolio: Finanzierung auf `loans` umstellen (SSOT)
**Änderungen:**
- In `PortfolioTab.tsx`:
  - Finanzierung nicht mehr aus `property_financing` holen.
  - Stattdessen `loans` lesen, tenant-gescoped über `activeTenantId`.
  - `loanMap` bauen: `property_id -> latest loan` (oder aktivster Loan).
  - Spaltenwerte mappen:
    - Restschuld = `outstanding_balance_eur`
    - Annuität p.a. = `annuity_monthly_eur * 12`
    - Zins p.a. = `outstanding_balance_eur * (interest_rate_percent/100)`
    - Tilgung p.a. = `Annuität p.a. - Zins p.a.`
- Optional/Fallback:
  - Wenn keine Loans existieren, kann `property_financing` weiterhin als Fallback dienen (für Excel-Import-Fälle), aber **Seed und SSOT laufen über loans**.

**Outcome:**
- Seed-Finanzierung wird sofort sichtbar.
- MOD-04 entspricht dem internen “Financing metrics are sourced from loans”-Prinzip.

---

### B) Portfolio: Eye-Action wirklich zu “Akte öffnen” machen (Usability-P0)
**Änderungen:**
- In `PortfolioTab.tsx` `rowActions`:
  - Button bekommt `onClick={() => navigate(\`/portal/immobilien/${row.property_id}\`)}`.
  - Tooltip/aria-label “Immobilienakte öffnen”.
- Zusätzlich (optional, aber sinnvoll):
  - In der “Objekt”-Zelle (Address) eine explizite Link-Optik “Akte öffnen” oder klickbaren Titel (Unterstreichung/hover), damit es nicht nur “Row click hidden” ist.

**Outcome:**
- Ein “einfacher Link zur Immobilienakte” existiert sichtbar und funktioniert immer.

---

### C) Portfolio: SearchParam-Cleanup korrekt via `useEffect` (Stabilität)
**Änderungen:**
- Ersetze den aktuellen Block:
  - `useState(() => { if (create) { ... setSearchParams(...) } })`
- durch:
  - `useEffect(() => { ... }, [searchParams, setSearchParams])` (oder sauberer: nur einmalig bei Mount, mit stabilem Pattern).
- Ziel: keine Router-State-Updates während Render.

**Outcome:**
- Wegfall von instabilem Rendering/Blank Screens durch Render-Side-Effects.

---

### D) Alle MOD-04 Queries tenant-stabil machen (activeTenantId als SSOT)
**Änderungen:**
- `PortfolioTab.tsx`: `.eq('tenant_id', activeTenantId)` statt `activeOrganization.id`.
- `PropertyDetailPage.tsx`: ebenfalls `activeTenantId` verwenden.
- Guards: wenn `!activeTenantId`, dann sichtbarer Fallback (kein stilles “null”).

**Outcome:**
- Kein “Tenant mismatch” mehr zwischen Dev-Mode-Fallbacks und echten Sessions.
- Akte/Portfolio verhalten sich konsistent.

---

### E) Immobilienakte: Finanzierung konsistent anzeigen (PropertyDetailPage)
Aktuell:
- `PropertyDetailPage.tsx` lädt Finanzierung aus `property_financing`, während `useUnitDossier.ts` bereits `loans` nutzt.

**Änderungen:**
- `PropertyDetailPage.tsx`:
  - Finanzierung für Exposé/Finanzierungsansicht über `loans` laden (oder `useUnitDossier`-Finanzierungsblock als Quelle nutzen).
  - `properties` / `units` fetch `.single()` ggf. auf `.maybeSingle()` umstellen + bessere Fehlermeldung (nicht “Drama”, sondern klar: “Kein Zugriff” vs “nicht existent”).

**Outcome:**
- Akte zeigt dieselbe Finanzierung wie Portfolio (und wie Seed).

---

## Validierungs-Checkliste (Acceptance / “Beweis, dass es wirklich geht”)
Nach Implementierung teste ich (Preview):
1) `/admin/tiles` → Golden Path “Counts” prüfen (sollten stimmen).
2) `/portal/immobilien/portfolio`:
   - 1 Zeile sichtbar (DEMO-001 / Leipziger Straße 42).
   - Restschuld/Annuität/Zins/Tilgung sind **nicht leer**.
3) Klick auf Eye-Icon → navigiert zu `/portal/immobilien/0000...0001`.
4) Akte lädt:
   - Tab “Akte” zeigt `EditableUnitDossierView` (keine “nicht gefunden” Meldung).
   - Finanzierung im Akten-Block H ist befüllt (Restschuld/Rate/Zins).
5) Hard refresh auf `/portal/immobilien/0000...0001` (Incognito/Reload) funktioniert weiterhin.

Optionaler “Anti-Lüge”-Beweis:
- Ein kleines “Dev Diagnostic” im Portfolio (nur dev-mode): zeigt `activeTenantId` + `properties/units/loans` Counts live, damit wir nie wieder “Audit sagt ok, UI sagt leer” haben, ohne sofort den Grund zu sehen.

---

## Konkrete betroffene Dateien (voraussichtlich)
- `src/pages/portal/immobilien/PortfolioTab.tsx`
  - financing source: `loans`
  - Eye button navigation
  - useEffect statt useState side-effect
  - tenant scoping via `activeTenantId`
- `src/pages/portal/immobilien/PropertyDetailPage.tsx`
  - tenant scoping via `activeTenantId`
  - financing source konsistent (loans)
  - robustere fetch patterns
- (falls nötig) `src/components/shared/PropertyTable.tsx`
  - nur wenn wir explizite Link-Elemente/Row-Action UX verbessern wollen (optional)
- (falls RLS blockiert) Datenbank-Migration:
  - SELECT-Policy für `loans` für authentifizierte Nutzer (tenant-basiert), ohne öffentliche Öffnung.

---

## Risiken / Trade-offs
- Umstellung auf `loans` kann Auswirkungen auf importierte Daten haben, falls diese nur `property_financing` füllen. Darum:
  - entweder Fallback belassen,
  - oder Import künftig parallel einen `loans`-Datensatz erzeugen.
- RLS kann `loans` ggf. für authentifizierte Nutzer blockieren. Dann wäre UI trotz korrekter Queries leer. In dem Fall ergänzen wir gezielt eine sichere Policy (tenant-basiert).

---

## Warum das bisher in Audits “funktioniert” wirkte, aber du es nicht siehst
- Datenbankseitig ist Seed korrekt (Property/Lease/Loan existieren).
- UI-seitig zeigt Portfolio Finanzierung aus der falschen Tabelle (`property_financing` statt `loans`).
- Zusätzlich war der “Akte öffnen”-Klickpfad UX-seitig kaputt (Eye ohne Navigation).
- Das erklärt, warum man in einem Audit leicht “Daten existieren” bestätigt, aber der Nutzer trotzdem “es ist leer und nicht erreichbar” erlebt.

---

## Was ich von dir (kurz) zur Absicherung brauche (ohne Technik-Deepdive)
1) Wenn du im Portfolio auf das Auge klickst: erwartest du, dass es die Akte öffnet? (Ich gehe: ja.)
2) Wenn du auf die Tabellenzeile klickst: passiert bei dir etwas oder bleibt es auch dann “tot”?

Wenn du den Plan freigibst, setze ich diese Fixes in einem einzigen, kleinen Commit-Umfang um und wir haben danach einen stabilen “Rebirth Point” speziell für MOD-04.
