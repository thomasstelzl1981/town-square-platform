# SYSTEM OF A TOWN — MASTER-AUDITPLAN v2.0 ABGESCHLOSSEN

## Status: ✅ ALLE 10 PHASEN IMPLEMENTIERT

| Phase | Beschreibung | Status |
|-------|--------------|--------|
| Phase 1 | Auth-Bypass (Entwicklungsmodus) | ✅ ERLEDIGT |
| Phase 2 | E-Mail Client UI (Popup-Fix) | ✅ ERLEDIGT |
| Phase 3 | Portfolio Charts (EÜR bereits vorhanden) | ✅ ERLEDIGT |
| Phase 4 | Responsivitäts-Grundstruktur | ✅ ERLEDIGT |
| Phase 5 | API Registry Ergänzung (SQL) | ✅ ERLEDIGT |
| Phase 6 | tile_catalog Schema (SQL) | ✅ ERLEDIGT |
| Phase 7 | MOD-01 Stammdaten (Schema + UI) | ✅ ERLEDIGT |
| Phase 8 | PortalDashboard leeren | ✅ ERLEDIGT |
| Phase 9 | PropertyTable Konsolidierung | ✅ VORHANDEN |
| Phase 10 | Google Maps (Vorbereitung) | ✅ API REGISTRIERT |

---

## Implementierte Änderungen

### Datenbank-Migration
- 7 neue APIs in `integration_registry` (Sprengnetter, Google Maps, Google Places, Microsoft OAuth, Gmail OAuth, SimpleFax, Briefdienst)
- `tile_catalog` erweitert: `internal_apis` und `external_api_refs` Spalten
- Alle 10 Module mit API-Referenzen aktualisiert
- `profiles` Tabelle erweitert: Vollständige Personendaten (Adresse, Telefon, Steuer-IDs, etc.)
- MOD-01 Sub-Tile "Firma" → "Personen" umbenannt

### Code-Änderungen

| Datei | Änderung |
|-------|----------|
| `AuthContext.tsx` | Entwicklungsmodus-Bypass für Lovable Preview |
| `PortalDashboard.tsx` | Tile-Grid entfernt, leerer Dashboard-Bereich |
| `EmailTab.tsx` | 3-Panel UI immer sichtbar, Dialog nur bei Button-Klick |
| `ProfilTab.tsx` | Erweitert: Adresse, Telefon, Steuer-IDs |
| `PersonenTab.tsx` | NEU: Ersetzt FirmaTab, 3 Modi (Identisch, Ehepartner, Gewerblich) |
| `StammdatenPage.tsx` | PersonenTab statt FirmaTab |
| `App.tsx` | Route /stammdaten/personen |

### API-Modul-Mapping (Vollständig)

| Modul | Internal APIs | External APIs |
|-------|--------------|---------------|
| MOD-01 | – | – |
| MOD-02 | sot-letter-generate | RESEND, GMAIL_OAUTH, MICROSOFT_OAUTH, SIMPLEFAX, BRIEFDIENST |
| MOD-03 | sot-dms-upload-url, sot-dms-download-url | CAYA |
| MOD-04 | sot-property-crud, sot-expose-description | SPRENGNETTER, GOOGLE_MAPS, GOOGLE_PLACES, RESEND |
| MOD-05 | sot-msv-reminder-check, sot-msv-rent-report, sot-listing-publish, sot-expose-description | RESEND, scout24 |
| MOD-06 | sot-listing-publish | scout24, RESEND |
| MOD-07 | – | FUTURE_ROOM |
| MOD-08 | sot-investment-engine | apify |
| MOD-09 | – | – |
| MOD-10 | sot-lead-inbox | meta_ads, RESEND |

---

## Governance-Regeln (BINDING)

1. **Entwicklungs-Account ist führend**: Alle Änderungen an `/portal/*` fließen EINSEITIG nach `/admin/tiles`
2. **API-Registrierung Pflicht**: Jede externe API muss in `integration_registry` eingetragen sein
3. **4-Untermenü-Regel**: Jedes Modul hat genau 4 Untermenüpunkte

---

## Nächste Schritte (Optional)

- [ ] Google Maps Komponente für Exposé implementieren
- [ ] Tilgungsverlauf/Wertzuwachs Charts in PortfolioTab hinzufügen
- [ ] Testdaten-Tab in /admin/tiles implementieren
- [ ] Rollen-Tab Blueprint definieren
