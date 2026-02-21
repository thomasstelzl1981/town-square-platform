# MOD-22 — Pet Manager

## Übersicht
| Feld | Wert |
|---|---|
| Modul-Code | MOD-22 |
| Titel | Pet Manager |
| Zone | 2 (Portal) |
| Status | Active |
| Freeze | true |
| tile_code | MOD-22 |
| icon_key | PawPrint |

## Beschreibung
Das Pet Manager-Modul ist eine Tierpensions-Management-Lösung für Partner. Es ermöglicht die Verwaltung von Tierpensions-Kunden, Buchungen, Kalender und Abrechnungen — alles in einer zentralen Plattform.

## Kernfunktionen
- **Kundenübersicht**: Alle Tierpensions-Kunden mit Kontaktdaten und Tierakten
- **Buchungsmanagement**: Reservierungen, Check-in/Check-out, Zeiträume
- **Kalender**: Visuelle Belegungsplanung mit Drag & Drop
- **Abrechnung**: Automatische Rechnungserstellung und Zahlungstracking
- **Tier-Profile**: Detaillierte Akten pro Tier (Impfungen, Allergien, Futter)

## Sub-Tiles
| Route | Titel |
|---|---|
| /portal/pet-manager | Übersicht |
| /portal/pet-manager/kunden | Kunden |
| /portal/pet-manager/kalender | Kalender |

## Armstrong Actions
| Action Code | Mode | Cost |
|---|---|---|
| ARM.MOD22.EXPLAIN_MODULE | readonly | free |
| ARM.MOD22.VIEW_PIPELINE | readonly | free |
| ARM.MOD22.DRAFT_CUSTOMER_EMAIL | draft_only | free |

## Datenmodell
- `pet_customers` — Kundenstammdaten
- `pet_animals` — Tierakten (verknüpft mit Kunden)
- `pet_bookings` — Buchungen/Reservierungen
- `pet_invoices` — Rechnungen

## Governance
- RLS-Policies auf allen Tabellen (tenant_id-Scoping)
- Demo-Daten über useDemoSeedEngine (Phase: petmanager)
- Cleanup-Reihenfolge: invoices → bookings → animals → customers
