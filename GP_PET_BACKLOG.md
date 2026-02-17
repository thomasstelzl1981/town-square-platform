# GP-PET Backlog — Haustierbereich (Zone 1/2/3)

> Erstellt: 2026-02-17 | Status wird nach jeder Reparatur aktualisiert.

## Legende

- ⬜ Offen
- 🔧 In Arbeit
- ✅ Erledigt
- 🚫 Wont-Fix / Deferred

---

## KRITISCH — Daten-Isolation

| Nr | Problem | Schwere | Beschreibung | Status |
|---|---|---|---|---|
| D-01 | pets-Tabelle ist SHARED | KRITISCH | MOD-05 (usePets) und MOD-22 (Pet Manager) teilen dieselbe `pets`-Tabelle. Es gibt KEINE separate Demo-Datenbank. usePets() filtert nur nach tenant_id, nicht nach owner_user_id — daher erscheinen PM-Demo-Tiere (Rocky, Mia, Oskar) in Zone 2 "Meine Tiere". | ⬜ |
| D-02 | Fix: usePets() owner-Filter | KRITISCH | `usePets()` muss nach `owner_user_id = auth.uid()` filtern, damit MOD-05 nur die eigenen Tiere zeigt. PM-Tiere haben customer_id statt owner_user_id. | ⬜ |
| D-03 | PM Demo-Toggle fehlt | HOCH | Kein separater Toggle fuer Pet Manager Demo-Daten. Muss in Zone 1 PetDesk steuerbar sein (GP-Prozess 'GP-PET'). | ⬜ |

---

## Zone 3 — Lennox Website

| Nr | Problem | Schwere | Beschreibung | Status |
|---|---|---|---|---|
| Z3-01 | Booking-Anfrage kein DB-Write | KRITISCH | LennoxPartnerProfil.tsx: Buchungsanfrage-Formular hat TODO, speichert nicht in pet_bookings oder Z1-Intake. | ⬜ |
| Z3-02 | LennoxPartnerWerden DB-Write | ✅ | Wurde in letzter Migration repariert — Insert in pet_z1_customers funktional. | ✅ |
| Z3-03 | sot-pet-profile-init Tenant-Lookup | NIEDRIG | Sucht slug='internal', Fallback auf erste Org. Fragil bei Multi-Tenant. | ⬜ |
| Z3-04 | Legacy-Dateien aufraemen | NIEDRIG | LennoxHome.tsx, LennoxProfil.tsx, LennoxTracker.tsx etc. sind Duplikate/veraltet. | ⬜ |

---

## Zone 1 — Admin Pet Desk

| Nr | Problem | Schwere | Beschreibung | Status |
|---|---|---|---|---|
| Z1-01 | PetDeskBilling Platzhalter | HOCH | Nur statischer Text, keine Abrechnungslogik. | ⬜ |
| Z1-02 | PetDeskVorgaenge Workflow | ✅ | Lead-Qualifizierung und Z1→Z2 Zuweisung implementiert. | ✅ |
| Z1-03 | PetDeskKunden CREATE | ✅ | Dialog zum manuellen Anlegen von Z1-Kunden implementiert. | ✅ |
| Z1-04 | PM Demo-Toggle in PetDesk | HOCH | Toggle-Switch im PetDesk-Header oder Governance-Tab, der GP-PET Demo-Daten ein/ausschaltet. | ⬜ |
| Z1-05 | Governance KPIs leer | MITTEL | pet_invoices leer → Umsatz-KPIs zeigen 0. | ⬜ |

---

## Zone 2 — Portal Pet Manager (MOD-22)

| Nr | Problem | Schwere | Beschreibung | Status |
|---|---|---|---|---|
| Z2-01 | PMKunden isDemoId-Check | NIEDRIG | Legacy-Code: isDemoId-Pruefung in PMKunden.tsx unnoetig, da Daten jetzt in DB. | ⬜ |
| Z2-02 | PMPension Business-Logik | MITTEL | Raumbelegung zeigt keine echten Buchungsdaten. | ⬜ |
| Z2-03 | PMServices Business-Logik | MITTEL | Service-Kalender ohne echte Buchungszuordnung. | ⬜ |
| Z2-04 | PMKalender Integration | MITTEL | Kalender zeigt keine pet_bookings. | ⬜ |
| Z2-05 | PMFinanzen Platzhalter | HOCH | Keine Rechnungs- oder Umsatzlogik. | ⬜ |
| Z2-06 | pet_invoices/pet_invoice_items leer | HOCH | Keine Demo-Rechnungen geseedet. | ⬜ |

---

## Demo-Daten Konsistenz

| Nr | Problem | Schwere | Beschreibung | Status |
|---|---|---|---|---|
| DD-01 | Staff-IDs synchronisiert | ✅ | petManagerDemo.ts Staff-IDs auf echte DB-Werte angepasst. | ✅ |
| DD-02 | pet_z1_customers geseedet | ✅ | 2 Lead-Kunden (Richter, Stein) in DB. | ✅ |
| DD-03 | pet_z1_pets geseedet | ✅ | 2 Z1-Tiere (Mia, Oskar) in DB. | ✅ |
| DD-04 | pet_customers geseedet | ✅ | 3 Z2-Kunden (Berger, Richter, Stein) in DB. | ✅ |
| DD-05 | pets geseedet (PM) | ✅ | 3 PM-Tiere (Rocky, Mia, Oskar) in DB — ABER: leaken in MOD-05 (→ D-01). | ✅ |
| DD-06 | pet_bookings geseedet | ✅ | 5 Buchungen in DB. | ✅ |
| DD-07 | pet_invoices fehlen | MITTEL | Keine Demo-Rechnungen fuer Finanz-Widgets. | ⬜ |

---

## GP-PET Engine

| Nr | Problem | Schwere | Beschreibung | Status |
|---|---|---|---|---|
| GP-01 | customer_exists | ✅ | Resolver findet 3 pet_customers. | ✅ |
| GP-02 | pet_exists | ✅ | Resolver findet 5 pets. | ✅ |
| GP-03 | first_booking_completed | ✅ | Resolver findet 1 completed Booking. | ✅ |
| GP-04 | success_state erreichbar | ✅ | Alle Flags true. | ✅ |

---

## Naechste Schritte (Prio-Reihenfolge)

1. **D-02**: usePets() um owner_user_id-Filter erweitern (MOD-05 zeigt nur eigene Tiere)
2. **D-03 + Z1-04**: PM Demo-Toggle implementieren (in goldenPathProcesses.ts registrieren, PetDesk-UI)
3. **Z3-01**: Booking-Persistenz in LennoxPartnerProfil
4. **Z2-02/03/04**: PMPension/Services/Kalender mit echten Buchungsdaten verbinden
5. **Z1-01 + Z2-05/06**: Billing + Invoices

---

## Reparatur-Log

| Datum | Bug | Datei | Aenderung | Status |
|---|---|---|---|---|
| 2026-02-17 | Staff-ID Mismatch | petManagerDemo.ts | IDs auf echte DB-Werte (935e, c198, 847b) | ✅ |
| 2026-02-17 | Z1-Daten leer | SQL-Migration | Seed: pet_z1_customers, pet_z1_pets, pet_customers, pets, pet_bookings | ✅ |
| 2026-02-17 | PetDeskVorgaenge Platzhalter | PetDeskVorgaenge.tsx | Komplett-Rewrite mit Lead-Workflow | ✅ |
| 2026-02-17 | PetDeskKunden kein CREATE | PetDeskKunden.tsx | Create-Dialog hinzugefuegt | ✅ |
| 2026-02-17 | LennoxPartnerWerden kein DB-Write | LennoxPartnerWerden.tsx | supabase.insert implementiert | ✅ |
