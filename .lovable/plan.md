

# MOD-05 MSV — Routing-Fix Plan

## Problem-Zusammenfassung

Die Route `/portal/msv/objekte` existiert nicht in `App.tsx`. Die aktuellen Routen (dashboard, listen) entsprechen nicht mehr der neuen 4-Tab-Struktur (objekte, mieteingang, vermietung, einstellungen).

## Loesung: App.tsx Routen aktualisieren

### Aktuelle Routen (falsch)

```
/msv              → MSVPage
/msv/dashboard    → MSVPage
/msv/listen       → MSVPage
/msv/mieteingang  → MSVPage
/msv/vermietung   → MSVPage
```

### Neue Routen (korrekt)

```
/msv              → MSVPage (default: objekte)
/msv/objekte      → MSVPage
/msv/mieteingang  → MSVPage
/msv/vermietung   → MSVPage
/msv/einstellungen → MSVPage
```

## Aenderung

**Datei:** `src/App.tsx`

**Zeilen 167-172 ersetzen:**

```typescript
{/* MOD-05: MSV (Objekte, Mieteingang, Vermietung, Einstellungen) */}
<Route path="msv" element={<MSVPage />} />
<Route path="msv/objekte" element={<MSVPage />} />
<Route path="msv/mieteingang" element={<MSVPage />} />
<Route path="msv/vermietung" element={<MSVPage />} />
<Route path="msv/einstellungen" element={<MSVPage />} />
```

## Nach dem Fix: Verbleibende Phasen

| Phase | Status | Naechste Schritte |
|-------|--------|-------------------|
| Phase 1: Routing | Wird behoben | App.tsx aktualisieren |
| Phase 2: Premium-Aktivierung | Offen | ReadinessChecklist implementieren |
| Phase 3: Mieteingang | Offen | PaymentBookingDialog anbinden |
| Phase 4: Briefgenerator | Offen | TemplateWizard → MOD-02 verlinken |
| Phase 5: Vermietung | Offen | RentalListingWizard erweitern |

## Aufwand

Diese Aenderung ist minimal (5 Zeilen in einer Datei) und behebt das 404-Problem sofort.

