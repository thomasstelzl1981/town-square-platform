

# PSLC (Pet Service Lifecycle) — Gesamtstatus

## Was existiert

### Engine (ENG-PLC) -- DONE
- `src/engines/plc/spec.ts` -- 11 Phasen, 22 Event-Types, SLA-Thresholds, Valid Transitions
- `src/engines/plc/engine.ts` -- Pure Functions (Computed State, Transition Validation)

### Datenbank-Tabellen -- DONE
| Tabelle | Status | Zweck |
|---|---|---|
| `pets` | DONE (42 Spalten inkl. Dossier-Erweiterung) | Tier-SSOT |
| `pet_customers` | DONE | Kunden-CRM |
| `pet_services` | DONE | Leistungskatalog |
| `pet_service_cases` | DONE (27 Spalten inkl. PSLC-Phasen) | Case/Buchung-Lifecycle |
| `pet_lifecycle_events` | DONE (12 Spalten, Audit-Trail) | Event-Ledger |
| `pet_bookings` | DONE | Kalender-Buchungen |
| `pet_rooms` | DONE | Raumverwaltung |
| `pet_room_assignments` | DONE | Raumbelegung |
| `pet_staff` | DONE | Personalverwaltung |
| `pet_invoices` / `pet_invoice_items` | DONE | Abrechnung |
| `pet_vaccinations` | DONE | Impfhistorie |
| `pet_medical_records` | DONE | Behandlungen |
| `pet_caring_events` | DONE | Betreuungs-Events |
| `pet_provider_availability` | DONE | Verfuegbarkeit |
| `pet_provider_blocked_dates` | DONE | Blockierte Tage |
| `pet_providers` | DONE | Provider-Profile |
| `pet_shop_products` | DONE | Shop-Artikel |
| `pet_z1_customers` / `pet_z1_pets` / `pet_z1_booking_requests` | DONE | Z1 Legacy-Brücke |
| `pet_z3_sessions` | DONE | Z3 Kunden-Auth |
| `pet-photos` Storage Bucket | DONE | Foto-Upload |

### Edge Functions -- DONE
| Function | Status | Zweck |
|---|---|---|
| `sot-pslc-lifecycle-patrol` | DONE | CRON: Stuck-Detection mit SLA-Thresholds |
| `sot-pslc-z3-create-case` | DONE | Z3: Buchung erstellen |
| `sot-pslc-z3-list-cases` | DONE | Z3: Meine Buchungen |
| `sot-pslc-z3-list-events` | DONE | Z3: Event-Historie |
| `sot-pslc-z3-list-pets` | DONE | Z3: Meine Tiere |
| `sot-pslc-z3-upsert-pet` | DONE | Z3: Tier anlegen/bearbeiten |
| `sot-pet-deposit-checkout` | DONE | Stripe Checkout (7.5% Anzahlung) |
| `sot-pet-deposit-webhook` | DONE | Stripe Webhook (Zahlung bestaetigt) |
| `sot-pet-profile-init` | DONE | Tier-Profil initialisieren |

### Shared Component: PetDossier -- DONE
| Datei | Status |
|---|---|
| `PetDossier.tsx` (Orchestrator) | DONE |
| `PetOwnerSection.tsx` | DONE |
| `PetProfileSection.tsx` | DONE |
| `PetGallerySection.tsx` | DONE |
| `PetHealthSection.tsx` | DONE |
| `PetNutritionSection.tsx` | DONE |
| `PetInsuranceSection.tsx` | DONE |
| `PetBehaviorSection.tsx` | DONE |
| `PetDocumentsSection.tsx` | DONE |
| `PetNotesSection.tsx` | DONE |
| `usePetDossier.ts` | DONE |

### Zonen-Integration -- TEILWEISE
| Zone | Seite | PetDossier integriert? |
|---|---|---|
| Z2 MOD-05 (Client) | `PetsMeineTiere.tsx` | DONE |
| Z2 MOD-22 (Provider) | `PMKunden.tsx` | DONE |
| Z1 (Admin Pet Desk) | `PetDeskKunden.tsx` | DONE |
| Z3 (Lennox Website) | MeinBereich | OFFEN -- nutzt noch Legacy `pet_z1_*` Tabellen |

### MOD-22 Seiten (Provider Portal) -- DONE
| Seite | Status |
|---|---|
| PMDashboard | DONE |
| PMKunden | DONE (mit PetDossier) |
| PMBuchungen | DONE |
| PMKalender | DONE |
| PMLeistungen | DONE |
| PMFinanzen | DONE |
| PMPension | DONE |
| PMRaeume | DONE |
| PMPersonal | DONE |
| PMProfil | DONE |
| PMServices | DONE |

---

## Was OFFEN ist

| Prio | Bereich | Beschreibung |
|---|---|---|
| P0 | **Z3 MeinBereich: PetDossier-Integration** | Z3 nutzt noch Legacy-Komponenten statt der Shared PetDossier. Migration auf Edge-Proxy-gestütztes PetDossier. |
| P0 | **Foto-Upload funktioniert nicht (Z3 + MOD-05)** | Storage-Bucket existiert, aber Upload-Logik in `usePetDossier.ts` muss getestet/repariert werden. |
| P1 | **Demo-Daten CSVs fuer PSLC** | Keine Demo-Daten fuer TLC-artige PSLC-Entitaeten (Backlog B-090..B-092 Aequivalent). |
| P1 | **Engine Unit-Tests (ENG-PLC)** | `engine.ts` existiert, aber keine Tests (`__tests__/plc.*`). |
| P1 | **Golden Path GP-PET** | Kein Golden Path Context Resolver fuer MOD-22 registriert. |
| P2 | **Z3 Buchungs-Flow E2E** | Stripe Checkout (Deposit) → Provider Confirm → Check-in → Check-out → Settlement Flow nicht E2E getestet. |
| P2 | **PSLC-Widget (Dashboard)** | Kein Aggregations-Widget fuer MOD-22 Dashboard (wie TLCWidget fuer MOD-04). |
| P2 | **Kommunikation (Templates)** | Kein Template-basiertes Messaging zwischen Kunde und Provider (wie TenancyCommunication). |
| P3 | **Review-System** | `case.review_submitted` Event definiert, aber keine UI. |
| P3 | **spec/current/06_engines/ENGINE_REGISTRY.md** | Datei fehlt komplett -- ENG-PLC nicht registriert. |

---

## Fortschritt zusammengefasst

```
Engine + Spec:         ████████████████████ 100%
Datenbank-Schema:      ████████████████████ 100%
Edge Functions:        ████████████████████ 100%
PetDossier Shared:     ████████████████████ 100%
Z2 MOD-22 UI:         ████████████████████ 100%
Z2 MOD-05 Integration: ████████████████████ 100%
Z1 Admin Integration:  ████████████████████ 100%
Z3 Integration:        ██████░░░░░░░░░░░░░░  30%
Foto-Upload:           ████░░░░░░░░░░░░░░░░  20%
Tests & Demo-Daten:    ░░░░░░░░░░░░░░░░░░░░   0%
Golden Path:           ░░░░░░░░░░░░░░░░░░░░   0%
──────────────────────────────────────────────────
GESAMT:                ██████████████░░░░░░  ~70%
```

Die Kernsysteme (Engine, DB, Edge Functions, UI-Komponenten) sind fertig. Die groessten Luecken sind: Z3-Integration auf die neue SSOT-Komponente migrieren, Foto-Upload reparieren, und Tests/Demo-Daten nachholen.

