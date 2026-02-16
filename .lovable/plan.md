

# Entwicklungsplan: PET-Vertical Gesamtkonzept

## Ueberblick

27 Backlog-Items in 6 Phasen, die das PET-Vertical von Platzhaltern zu einem vollstaendigen Franchise-System ausbauen. Betroffen sind MOD-05 (Client), MOD-22 (Manager) und Zone 1 (Pet Governance).

---

## Phase 1: Datenmodell und Tier-Akten (7 Items)

Fundament: Datenbank-Tabellen und die erste sichtbare UI — die Tier-Akte.

| ID | Modul | Titel | Aufwand |
|----|-------|-------|---------|
| PET-001 | DB | Tabelle `pets` erstellen (Stammdaten, Chip-Nr, Allergien, Versicherung, Foto) | mittel |
| PET-002 | DB | Tabelle `pet_vaccinations` (Impfhistorie, naechste Faelligkeit, Dokument-Link) | mittel |
| PET-003 | DB | Tabelle `pet_providers` (Dienstleister-Stamm, Typ, Verifizierung, Bewertung) | mittel |
| PET-004 | DB | Tabelle `pet_services` (Service-Katalog pro Provider: Preis, Dauer, Tierarten) | mittel |
| PET-005 | MOD-05 | Demo-Daten: Luna (Golden Retriever) + Bello (Dackel) fuer Mustermann-Tenant | niedrig |
| PET-006 | MOD-05 | RecordCard-Akte: Grid in "Meine Tiere" + Detail-Seite mit Impfhistorie und Foto-Upload | hoch |
| PET-007 | MOD-05 | DMS-Ordnerstruktur pro Tier automatisch anlegen (Impfpass, Tierarzt, Fotos...) | mittel |

---

## Phase 2: Service-Katalog und Buchungssystem (7 Items)

Kernflow: Kunde bucht Service im Shop, Provider bestaetigt im Kalender.

| ID | Modul | Titel | Aufwand |
|----|-------|-------|---------|
| PET-010 | DB | Tabelle `pet_bookings` (Status-Maschine: requested -> confirmed -> completed/cancelled) | hoch |
| PET-011 | DB | Tabelle `pet_provider_availability` (Wochentag-Slots, max Buchungen pro Slot) | mittel |
| PET-012 | DB | Tabelle `pet_provider_blocked_dates` (Urlaub/Sperrzeiten) | niedrig |
| PET-013 | MOD-22 | Leistungen-Tab: Provider verwaltet eigene Services (CRUD) | hoch |
| PET-014 | MOD-22 | Kalender-Tab: Verfuegbarkeits-Editor + Buchungsanfragen annehmen/ablehnen | hoch |
| PET-015 | MOD-05 | Shop-Tab: Services browsen, Tier waehlen, Termin buchen | hoch |
| PET-016 | MOD-05 | Mein Bereich: Aktive Buchungen und Buchungshistorie anzeigen | mittel |

**Buchungsflow:**

```text
Kunde (MOD-05 Shop)          Zone 1 (Governance)         Provider (MOD-22 Kalender)
       |                            |                            |
   Service waehlen                  |                            |
   Tier auswaehlen                  |                            |
   Datum/Zeit waehlen               |                            |
   Buchung absenden ──────────> Intake pruefen ──────────> Anfrage erscheint
       |                      (automatisch/manuell)              |
       |                            |                    Annehmen/Ablehnen
       |                            |                            |
   Status: bestaetigt <──────────────────────────── confirmed/rejected
       |                            |                            |
   Termin wahrnehmen                |                    Service durchfuehren
       |                            |                            |
   Bewertung abgeben                |                    Als erledigt markieren
```

---

## Phase 3: Rechnungs- und Zahlungsflow (4 Items)

Provider erstellt Rechnung aus abgeschlossener Buchung, Kunde sieht sie in "Mein Bereich".

| ID | Modul | Titel | Aufwand |
|----|-------|-------|---------|
| PET-020 | DB | Bestehende `pet_invoices` pruefen: tenant_id, FKs, RLS-Policies | mittel |
| PET-021 | MOD-22 | Finanzen-Tab: Rechnung aus Buchung generieren, PDF-Export (jsPDF) | hoch |
| PET-022 | MOD-05 | Mein Bereich: Rechnungseingang mit PDF-Download und Zahlungsstatus | mittel |
| PET-023 | MOD-22 | Finanzen-Tab: Umsatz-Dashboard (Monatsumsatz, offene Forderungen) | mittel |

---

## Phase 4: Caring und Pflege-Kalender (4 Items)

Pflege-Tracking fuer Fuetterung, Medikamente, Tierarzt-Termine.

| ID | Modul | Titel | Aufwand |
|----|-------|-------|---------|
| PET-030 | DB | Tabelle `pet_caring_events` (Event-Typ, Faelligkeit, Wiederholung) | mittel |
| PET-031 | MOD-05 | Caring-Tab: Kalenderansicht mit Pflege-Events aller Tiere | hoch |
| PET-032 | MOD-05 | Tier-Akte: Pflege-Sektion mit Timeline und naechsten Aktionen | mittel |
| PET-033 | MOD-05 | Erinnerungen: Toast-Hinweise bei faelligen Pflege-Events | niedrig |

---

## Phase 5: Zone 1 Governance und Monitoring (5 Items)

Admin-Desk mit echten Daten statt Platzhalter-KPIs.

| ID | Modul | Titel | Aufwand |
|----|-------|-------|---------|
| PET-040 | Z1 Dashboard | KPI-Kacheln mit Live-Daten (Provider-Count, Umsatz, Buchungen) | mittel |
| PET-041 | Z1 Provider | Provider-Verzeichnis mit Verifizierungs-Workflow (pending -> verified) | hoch |
| PET-042 | Z1 Finanzen | Aggregierte Umsatzzahlen nach Provider, offene Forderungen | mittel |
| PET-043 | Z1 Services | Service-Katalog-Moderation: Freigabe/Ablehnung neuer Services | mittel |
| PET-044 | Z1 Monitor | Audit-Trail, Stornoquote, Buchungen/Tag, Anomalie-Alerts | mittel |

---

## Phase 6: Golden Path und Integration (5 Items)

Cross-Modul-Verknuepfungen und Spec-Dokumentation.

| ID | Modul | Titel | Aufwand |
|----|-------|-------|---------|
| PET-050 | MOD-05 | Golden Path GP-PETS: Sections fuer alle 4 Tabs mit DB-Daten | mittel |
| PET-051 | MOD-05 | DMS-Integration: Tier-Dokumente im zentralen DMS (MOD-03) sichtbar | mittel |
| PET-052 | MOD-05 | Versicherungs-Referenz: Tierhaftpflicht in insurance_contracts | niedrig |
| PET-053 | SPEC | mod-05_pets.md an reale 4-Tab-Struktur anpassen | niedrig |
| PET-054 | SPEC | mod-22_petmanager.md neu erstellen | niedrig |

---

## Zusammenfassung

| Kennzahl | Wert |
|----------|------|
| Gesamt-Items | 27 |
| Neue DB-Tabellen | 8 (pets, pet_vaccinations, pet_providers, pet_services, pet_bookings, pet_provider_availability, pet_provider_blocked_dates, pet_caring_events) |
| Bestehende DB-Tabellen | 2 (pet_invoices, pet_invoice_items — werden erweitert) |
| Kritisch (P1) | 14 Items |
| Wichtig (P2) | 9 Items |
| Nice-to-have (P3) | 4 Items |
| Demo-Daten | Luna (Golden Retriever) + Bello (Dackel) fuer DEV_TENANT |

Die Backlog-JSON liegt bereits unter `spec/audit/pet_vertical_backlog.json`. Dieser Plan dient als Grundlage zur Verfeinerung vor der Implementierung.

