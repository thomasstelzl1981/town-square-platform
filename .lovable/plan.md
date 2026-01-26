# MOD-05 MSV — Korrekturplan (ABGESCHLOSSEN)

## Zusammenfassung

Alle Phasen wurden implementiert:

| Phase | Beschreibung | Status |
|-------|--------------|--------|
| Phase A | Navigations-Vereinheitlichung (Tabs entfernt) | ✅ ERLEDIGT |
| Phase 1 | Routing-Fix (App.tsx) | ✅ ERLEDIGT |
| Phase 2 | Premium-Aktivierung (ReadinessChecklist) | ✅ ERLEDIGT |
| Phase 3 | Mieteingang (PaymentBookingDialog) | ✅ ERLEDIGT |
| Phase 4 | Briefgenerator-Integration | ✅ ERLEDIGT |
| Phase 5 | Vermietung (RentalListingWizard) | ✅ ERLEDIGT |

---

## UI-Konsistenz & KI-Features (2026-01-27)

### Leerzeilen-Pattern (wie MOD-04)

Alle MOD-05 Tabellen zeigen nun bei leerem Zustand:
- Eine **Leerzeile mit Platzhaltern (–)** und Action-Button
- Einen Hinweistext mit Link zur Erstellung

| Tab | Empty State |
|-----|-------------|
| ObjekteTab | Leerzeile + "Objekte anlegen (MOD-04)" Button |
| MieteingangTab | Leerzeile + "Zu Objekte wechseln" Button |
| VermietungTab | Leerzeile + Eye-Button in Zeilen für Exposé-Zugriff |

### KI-Beschreibungsgenerierung

**Edge Function:** `sot-expose-description`
- AI-basierte Immobilienbeschreibung
- Nutzt Lovable AI (google/gemini-3-flash-preview)
- Prompt-Struktur: Einleitung, Lage, Ausstattung, Besonderheiten

**Integrationen:**
- `RentalListingWizard.tsx`: "Mit KI generieren" Button
- `PropertyDetail.tsx`: "Beschreibung generieren" Button im Header

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
- Eye-Button in Zeilen für direkten Exposé-Zugriff

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
