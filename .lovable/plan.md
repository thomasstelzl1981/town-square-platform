
# Reparaturplan: MOD-04 Portfolio-Funktionalität

## Ziel
Drei kritische Fehler beheben, damit: (a) Eye-Icon zur Immobilienakte navigiert, (b) Finanzierungsdaten korrekt angezeigt werden, (c) Auth-Initialisierung zuverlässig funktioniert.

---

## Phase 1: Auth-Initialisierung stabilisieren (P0 — Blocker)

**Problem:** Race Condition durch StrictMode-Reset blockiert `activeTenantId`, sodass keine Daten-Queries starten.

**Datei:** `src/contexts/AuthContext.tsx`

**Maßnahmen:**
1. **initRef-Reset nur bei echtem Unmount**, nicht bei StrictMode-Remount
   - Prüfen ob Session bereits existiert bevor Reset
   - Alternativ: Debounce auf Reset-Logik (50ms)

2. **Guard gegen parallele SIGNED_IN Events**
   - Wenn `isInitializing = true` UND gleiches Event kommt, ignorieren
   - Timeout für `isInitializing` (max 5s), dann Force-Reset

3. **Fallback-Timeout erhöhen** (400ms → 600ms)
   - Gibt onAuthStateChange mehr Zeit vor getSession-Fallback

**Akzeptanzkriterium:** 
- Console zeigt nur 1x `[Auth] onAuthStateChange:SIGNED_IN triggered`
- `activeTenantId` wird korrekt gesetzt
- Portfolio-Queries starten (sichtbar im Network-Tab)

---

## Phase 2: Eye-Icon Navigation reparieren (P0)

**Problem:** Button ohne onClick + stopPropagation verhindert Navigation.

**Datei:** `src/pages/portal/immobilien/PortfolioTab.tsx` (Zeilen 717-721)

**Aktueller Code:**
```typescript
rowActions={(row) => (
  <Button variant="ghost" size="sm">
    <Eye className="h-4 w-4" />
  </Button>
)}
```

**Maßnahmen:**
1. **onClick-Handler hinzufügen** mit expliziter Navigation:
```typescript
rowActions={(row) => (
  <Button 
    variant="ghost" 
    size="sm"
    onClick={() => navigate(`/portal/immobilien/${row.property_id}`)}
  >
    <Eye className="h-4 w-4" />
  </Button>
)}
```

2. **PropertyTable.tsx:** `stopPropagation` beibehalten (korrekt, verhindert Doppel-Navigation)

**Akzeptanzkriterium:**
- Klick auf Eye-Icon navigiert zu `/portal/immobilien/{property_id}`
- Klick auf Tabellenzeile navigiert ebenfalls (Row-Click)

---

## Phase 3: Finanzierungs-Query korrigieren (P0)

**Problem:** Query nutzt `property_financing`-Tabelle, Demo-Daten sind in `loans`-Tabelle mit anderen Spaltennamen.

**Datei:** `src/pages/portal/immobilien/PortfolioTab.tsx` (Zeilen 183-230)

**Ist-Zustand:**
```typescript
const { data: financing } = await supabase
  .from('property_financing')
  .select('property_id, current_balance, monthly_rate, interest_rate')
```

**Soll-Zustand:**
```typescript
const { data: financing } = await supabase
  .from('loans')
  .select('property_id, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent')
```

**Spalten-Mapping korrigieren:**

| Alt (property_financing) | Neu (loans) |
|--------------------------|-------------|
| `current_balance` | `outstanding_balance_eur` |
| `monthly_rate` | `annuity_monthly_eur` |
| `interest_rate` | `interest_rate_percent` |

**Maßnahmen:**
1. Query auf `loans`-Tabelle umstellen
2. Spaltennamen in Select anpassen
3. Interface `PropertyFinancing` aktualisieren (Zeilen 60-66)
4. `financingMap`-Zugriff anpassen (Zeilen 224-230)

**Akzeptanzkriterium:**
- Portfolio-Tabelle zeigt für Demo-Property:
  - Restschuld: 152.000,00 €
  - Annuität p.a.: 7.440,00 € (620 × 12)
  - Zins p.a.: 4.940,00 € (152000 × 0.0325)
  - Tilgung p.a.: 2.500,00 € (Annuität - Zins)

---

## Phase 4: forwardRef-Warnungen beseitigen (P1)

**Problem:** Console zeigt Warnungen für `PortalDashboard` und `CartesianGrid`.

**Dateien:**
- `src/pages/portal/PortalDashboard.tsx`
- Recharts-Komponenten in `PortfolioTab.tsx`

**Maßnahmen:**
1. `PortalDashboard` mit `forwardRef` wrappen
2. Für Recharts: Wrapper-Komponente ohne ref-Weiterleitung

**Akzeptanzkriterium:**
- Keine forwardRef-Warnungen in Console

---

## Phase 5: Validierung

**Manuelle Tests:**
1. Seite neu laden → Portfolio zeigt Daten sofort (kein Endlos-Spinner)
2. Eye-Icon klicken → Navigation zur Immobilienakte
3. Finanzierungs-Spalten zeigen echte Werte (nicht "–")
4. Network-Tab: max. 3 Auth-Requests, dann Daten-Requests

**Optional: Playwright-Test:**
```typescript
test('Portfolio lädt mit Finanzierungsdaten', async ({ page }) => {
  await page.goto('/portal/immobilien/portfolio');
  await expect(page.locator('text=Leipziger Str. 42')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('text=152.000')).toBeVisible();
});
```

---

## Reihenfolge

| Phase | Priorität | Geschätzte Zeit |
|-------|-----------|-----------------|
| Phase 1 (Auth) | P0 — Blocker | 20 min |
| Phase 2 (Eye-Icon) | P0 | 5 min |
| Phase 3 (Financing-Query) | P0 | 15 min |
| Phase 4 (forwardRef) | P1 | 10 min |
| Phase 5 (Validierung) | — | 10 min |

**Gesamt:** ~60 Minuten

---

## Erwartetes Ergebnis

Nach Abschluss:
- ✅ Portfolio lädt beim ersten Seitenaufruf
- ✅ Eye-Icon navigiert zur Immobilienakte
- ✅ Finanzierungsdaten werden korrekt angezeigt (via `loans`-Tabelle)
- ✅ Keine Console-Warnungen (PortalDashboard forwardRef)
- ✅ Max. 3-4 initiale Backend-Requests (statt 12+)

---

## Implementierungsstatus

| Phase | Status | Änderungen |
|-------|--------|------------|
| Phase 1 (Auth) | ✅ Fertig | `AuthContext.tsx`: Reset-Guard gegen StrictMode, Fallback 600ms |
| Phase 2 (Eye-Icon) | ✅ Fertig | `PortfolioTab.tsx`: onClick mit Navigation + stopPropagation |
| Phase 3 (Financing-Query) | ✅ Fertig | Query umgestellt auf `loans`-Tabelle mit korrekten Spaltennamen |
| Phase 4 (forwardRef) | ✅ Fertig | `PortalDashboard.tsx` mit forwardRef gewrappt |
| Phase 5 (Validierung) | ⏳ Pending | Manueller Test erforderlich |
