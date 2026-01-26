# MOD-05 MSV — Korrekturplan (ABGESCHLOSSEN)

## Zusammenfassung

Alle Phasen wurden implementiert:

| Phase | Beschreibung | Status |
|-------|--------------|--------|
| Phase A | Navigations-Vereinheitlichung (Tabs entfernt) | ✅ ERLEDIGT |
| Phase 1 | Routing-Fix (App.tsx) | ✅ ERLEDIGT |
| Phase 2 | Premium-Aktivierung (ReadinessChecklist) | ✅ ERLEDIGT |
| Phase 3 | Mieteingang (PaymentBookingDialog) | ✅ BEREITS FUNKTIONAL |
| Phase 4 | Briefgenerator-Integration | ✅ ERLEDIGT |
| Phase 5 | Vermietung (RentalListingWizard) | ✅ ERLEDIGT |

---

## Aenderungen im Detail

### Phase A: Navigations-Vereinheitlichung

**Datei:** `src/pages/portal/MSVPage.tsx`

- `<Tabs>`-Komponente ENTFERNT
- `renderSubPage()` Pattern implementiert (wie MOD-04)
- Navigation erfolgt NUR ueber Sidebar
- Keine Dopplung mehr

### Phase 2: Premium-Aktivierung

**Datei:** `src/pages/portal/msv/ObjekteTab.tsx`

- `ReadinessChecklist` importiert
- Premium-Dialog mit Checklist integriert
- Enrollment-Erstellung bei Klick auf "Premium aktivieren"

### Phase 4: Briefgenerator-Integration

**Datei:** `src/components/msv/TemplateWizard.tsx`

- "Im Briefgenerator oeffnen" Button aktiviert
- Navigiert zu MOD-02 `/portal/office/brief`
- "Versenden" Button funktional

### Phase 5: Vermietung

**Datei:** `src/components/msv/RentalListingWizard.tsx`

- Hinweistext zu Kanaelen hinzugefuegt
- Scout24 / Kleinanzeigen Dokumentation inline

---

## Source of Truth: MOD-04 → MOD-05

```
MOD-04 (Immobilien)
  └── properties, units (Stammdaten)
       │
       └── READ-ONLY
            │
            ▼
MOD-05 (MSV)
  └── leases, rent_payments, msv_enrollments, rental_listings
```

Alle Objektdaten werden aus MOD-04 gelesen. MOD-05 schreibt NUR in eigene Tabellen.

---

## Naechste Schritte (Optional)

- [ ] FinAPI-Integration fuer automatischen Mieteingang
- [ ] Scout24 API vollstaendig implementieren
- [ ] Mietbericht-PDF-Export
