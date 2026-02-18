

# Systemweite Analyse: Neuanlage vs. Loeschfunktion

## Ergebnis-Tabelle

| Nr | Modul | Entitaet | Neuanlage | Loeschfunktion | Status |
|----|-------|----------|-----------|----------------|--------|
| 1 | MOD-18 Finanzanalyse | Bankkonten (msv_bank_accounts) | Ja (KontenTab + FinAPI) | **NEIN** | FEHLT |
| 2 | MOD-18 Finanzanalyse | Personen (household_persons) | Ja (UebersichtTab) | Ja (UebersichtTab) | OK |
| 3 | MOD-18 Finanzanalyse | Vorsorge-Vertraege | Ja (VorsorgeTab) | Ja (deleteMutation) | OK |
| 4 | MOD-18 Finanzanalyse | Sachversicherungen | Ja (SachversicherungenTab) | Ja (deleteMutation) | OK |
| 5 | MOD-18 Finanzanalyse | Abonnements | Ja (AbonnementsTab) | Ja (deleteMutation) | OK |
| 6 | MOD-18 Finanzanalyse | Darlehen (private_loans) | Ja (DarlehenTab) | Ja (deleteMutation) | OK |
| 7 | MOD-04 Immobilien | Immobilien (properties) | Ja (CreatePropertyDialog) | **NEIN** | FEHLT |
| 8 | MOD-04 Immobilien | Einheiten (units) | Ja (in PropertyDetail) | **NEIN** | FEHLT |
| 9 | MOD-05 MSV/Mietvertrag | Mietvertraege (leases) | Ja (LeaseFormDialog) | **NEIN** | FEHLT |
| 10 | MOD-06 Verkauf | Listings | Ja (SalesApprovalSection) | **NEIN** | FEHLT |
| 11 | MOD-17 Fahrzeuge | Fahrzeuge (vehicles) | Ja (CarsFahrzeuge) | **NEIN** | FEHLT |
| 12 | MOD-17 Boote | Boote | Platzhalter-Tab | **NEIN** | FEHLT |
| 13 | MOD-17 Privatjet | Privatjet | Platzhalter-Tab | **NEIN** | FEHLT |
| 14 | MOD-14 Photovoltaik | PV-Anlagen (pv_plants) | Ja (AnlagenTab) | **NEIN** | FEHLT |
| 15 | MOD-20 Zuhause | Zuhause (miety_homes) | Ja (MietyCreateHomeForm) | **NEIN** | FEHLT |
| 16 | MOD-20 Zuhause | Vertraege (miety_contracts) | Ja (ContractDrawer) | **NEIN** | FEHLT |
| 17 | MOD-20 Zuhause | Darlehen (miety_loans) | Ja (LoanSection) | Ja (deleteMutation) | OK |
| 18 | MOD-15 Haustiere | Tiere (pets) | Ja (PetsMeineTiere) | Ja (useDeletePet) | OK |
| 19 | MOD-15 Haustiere | Impfungen | Ja | Ja (useDeleteVaccination) | OK |
| 20 | MOD-15 Haustiere | Pflege-Events | Ja | Ja (useDeleteCaringEvent) | OK |
| 21 | MOD-16 PetManager | Raeume | Ja | Ja (useDeleteRoom) | OK |
| 22 | MOD-16 PetManager | Personal | Ja | Ja (useDeleteStaff) | OK |
| 23 | MOD-08 Office | Kontakte (contacts) | Ja (KontakteTab) | Ja (deleteMutation) | OK |
| 24 | MOD-10 Akquise | Mandate | Ja | Ja (cancelMandate) | OK |
| 25 | MOD-04 Sanierung | Service Cases | Ja | Ja (cancelMutation) | OK |
| 26 | MOD-18 Finanzanalyse | Investments/Sparplaene | Ja (InvestmentTab) | Ja (deleteSparMutation) | OK |

## Zusammenfassung

**10 Entitaeten mit fehlender Loeschfunktion:**

1. **Bankkonten** (MOD-18 KontenTab) — soeben angesprochen
2. **Immobilien** (MOD-04 PortfolioTab)
3. **Einheiten** (MOD-04 PropertyDetail)
4. **Mietvertraege** (MOD-05 TenancyTab)
5. **Listings** (MOD-06 VerkaufTab)
6. **Fahrzeuge** (MOD-17 CarsFahrzeuge)
7. **Boote/Privatjet** (MOD-17 — Platzhalter, noch keine CRUD)
8. **PV-Anlagen** (MOD-14 AnlagenTab)
9. **Zuhause** (MOD-20 MietyHomeDossier)
10. **Zuhause-Vertraege** (MOD-20 miety_contracts)

## Implementierungsplan

### Homogenes Loesch-Pattern (Standard)

Jede Loeschfunktion wird einheitlich implementiert:

```text
1. Destructive Button (rot, Trash2-Icon) in der Detail-/Aktenansicht
2. Confirm-Dialog (AlertDialog) mit Warnung
3. Mutation: supabase.from(table).delete().eq('id', id)
4. Toast-Feedback: "XY geloescht"
5. Navigation zurueck zur Liste / Query invalidieren
```

### Aenderungen pro Entitaet

**1. Bankkonten (KontenTab.tsx)**
- Delete-Button neben jedem Konto-Eintrag hinzufuegen
- Mutation: `supabase.from('msv_bank_accounts').delete().eq('id', id)`
- Zugehoerige `finapi_connections` Eintraege ebenfalls bereinigen

**2. Immobilien (PortfolioTab.tsx / PropertyDetailPage)**
- Delete-Button in der Immobilien-Akte (Detail-Header)
- Cascade-Warnung: "Alle Einheiten, Mietvertraege und Dokumente werden ebenfalls entfernt"
- Loeschreihenfolge beachten: Leases -> Units -> Documents -> Property

**3. Einheiten (UnitDetailPage.tsx)**
- Delete-Button im Unit-Detail-Header
- Cascade-Warnung fuer verknuepfte Leases

**4. Mietvertraege (TenancyTab.tsx)**
- Delete-Button pro Mietvertrag in der Liste
- Status-Check: Nur Vertraege im Status 'draft' oder 'ended' loeschbar

**5. Listings (VerkaufTab)**
- Delete-Button in Listing-Detail
- Nur im Status 'draft' oder 'withdrawn' loeschbar

**6. Fahrzeuge (CarsFahrzeuge.tsx / VehicleDetailPage.tsx)**
- Delete-Button in der Fahrzeug-Akte
- Verknuepfte Dokumente und Claims beruecksichtigen

**7. PV-Anlagen (AnlagenTab.tsx / PVPlantDossier.tsx)**
- Delete-Button in der Anlagen-Akte
- Verknuepfte Monitoring-Daten und Dokumente beruecksichtigen

**8. Zuhause (MietyHomeDossier.tsx)**
- Delete-Button im Home-Detail
- Cascade-Warnung: Verknuepfte Vertraege werden ebenfalls entfernt

**9. Zuhause-Vertraege (MietyContractsSection.tsx / ContractDrawer)**
- Delete-Button pro Vertragskarte
- Analog zum bestehenden Pattern bei Darlehen (LoanSection)

### Zu aendernde Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/finanzanalyse/KontenTab.tsx` | Delete-Mutation + Button |
| `src/pages/portal/immobilien/PortfolioTab.tsx` | Delete-Mutation + Confirm |
| `src/pages/portal/projekte/UnitDetailPage.tsx` | Delete-Mutation + Button |
| `src/components/portfolio/TenancyTab.tsx` | Delete pro Lease |
| `src/pages/portal/verkauf/*` | Delete pro Listing |
| `src/components/portal/cars/CarsFahrzeuge.tsx` | Delete-Mutation Fahrzeug |
| `src/components/portal/cars/VehicleDetailPage.tsx` | Delete-Button |
| `src/pages/portal/photovoltaik/AnlagenTab.tsx` | Delete-Mutation PV |
| `src/pages/portal/photovoltaik/PVPlantDossier.tsx` | Delete-Button |
| `src/pages/portal/miety/MietyHomeDossierInline.tsx` | Delete Home |
| `src/pages/portal/miety/components/MietyContractsSection.tsx` | Delete Vertrag |

### Shared Component: ConfirmDeleteDialog

Ein wiederverwendbarer Confirm-Dialog wird erstellt, um Konsistenz sicherzustellen:

```text
Datei: src/components/shared/ConfirmDeleteDialog.tsx
Props: 
  - open: boolean
  - onConfirm: () => void
  - onCancel: () => void
  - title: string (z.B. "Immobilie loeschen")
  - description: string (z.B. "Alle verknuepften Daten werden...")
  - isPending: boolean
```

Dieses Pattern wird in allen 10 fehlenden Stellen eingesetzt, um ein homogenes Nutzererlebnis zu gewaehrleisten.
