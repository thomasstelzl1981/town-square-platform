# Zone 2: Strukturierter Deep-Dive Plan

> Erstellt: 2026-02-12 | Status: Entwurf

## Übersicht: 21 Module in Zone 2

Zone 2 umfasst alle Portal-Module, organisiert in 4 Areas:

### Area: Missions (Kernprozesse)
| # | Modul | Code | Seite | Priorität | Status |
|---|-------|------|-------|-----------|--------|
| 1 | Dashboard | MOD-00 | PortalDashboard.tsx | 🔴 Hoch | ⬜ Offen |
| 2 | Stammdaten | MOD-01 | StammdatenPage.tsx | 🟡 Mittel | ⬜ Offen |
| 3 | KI-Office | MOD-02 | OfficePage.tsx | 🟡 Mittel | ⬜ Offen |
| 4 | Dokumente (DMS) | MOD-03 | DMSPage.tsx | 🟡 Mittel | ⬜ Offen |
| 5 | **Immobilien** | **MOD-04** | ImmobilienPage.tsx | 🔴 Hoch | ⬜ Offen |
| 6 | Verkauf | MOD-05 | VerkaufPage.tsx | 🟡 Mittel | ⬜ Offen |
| 7 | Finanzierung | MOD-07 | FinanzierungPage.tsx | 🔴 Hoch | ⬜ Offen |

### Area: Operations (Management)
| # | Modul | Code | Seite | Priorität | Status |
|---|-------|------|-------|-----------|--------|
| 8 | Investment-Suche | MOD-08 | InvestmentsPage.tsx | 🔴 Hoch | ⬜ Offen |
| 9 | Vertriebspartner | MOD-09 | VertriebspartnerPage.tsx | 🟡 Mittel | ⬜ Offen |
| 10 | Leads | MOD-10 | LeadsPage.tsx | 🟡 Mittel | ⬜ Offen |
| 11 | Finanz-Manager | MOD-11 | FinanzierungsmanagerPage.tsx | 🔴 Hoch | ⬜ Offen |
| 12 | Akquise-Manager | MOD-12 | AkquiseManagerPage.tsx | 🔴 Hoch | ⬜ Offen |
| 13 | Projekte | MOD-13 | ProjektePage.tsx | 🔴 Hoch | ⬜ Offen |

### Area: Base (Infrastruktur)
| # | Modul | Code | Seite | Priorität | Status |
|---|-------|------|-------|-----------|--------|
| 14 | Miety Portal | MOD-20 | MietyPortalPage.tsx | 🟢 Niedrig | ⬜ Offen |
| 15 | Shops | MOD-16 | ServicesPage.tsx | 🟢 Niedrig | ✅ Erledigt |
| 16 | Fortbildung | MOD-17 | FortbildungPage.tsx | 🟢 Niedrig | ✅ Erledigt |
| 17 | Finanzanalyse | MOD-18 | FinanzanalysePage.tsx | ⏸️ Zurückgestellt | ⏸️ |
| 18 | Fuhrpark | MOD-19 | CarsPage.tsx | 🟢 Niedrig | ⬜ Offen |

### Area: Services
| # | Modul | Code | Seite | Priorität | Status |
|---|-------|------|-------|-----------|--------|
| 19 | MSV | MOD-06 | MSVPage.tsx | 🟢 Niedrig | ⬜ Offen |
| 20 | Communication Pro | MOD-15 | CommunicationProPage.tsx | 🟡 Mittel | ⬜ Offen |
| 21 | Photovoltaik | MOD-14 | PhotovoltaikPage.tsx | 🟢 Niedrig | ⬜ Offen |

---

## Sprint-Planung: 4 Wellen

### Welle 1: Golden Path Kernmodule (Prio 🔴)
**Ziel:** Die 7 kritischen Module, die den Golden Path abbilden, auf Vollständigkeit prüfen.

| Modul | Prüfpunkte |
|-------|------------|
| MOD-00 Dashboard | Widget-Daten live? Armstrong-Integration? Task-Widgets? |
| MOD-04 Immobilien | Dossier-Vollständigkeit, Sanierungs-Workflow, Bewertung, Kontexte |
| MOD-07 Finanzierung | Selbstauskunft-Sektionen, Anfrage-Tab, Snapshot-Logik |
| MOD-08 Investments | Mandat CRUD, Suche, Favoriten, Exposé-Ansicht |
| MOD-11 FM-Manager | Split-View, Case-Cockpit, Einreichung, KDF-Rechner |
| MOD-12 Akquise | Mandat-Flow, E-Mail-Workflow, Angebotsanalyse |
| MOD-13 Projekte | Landing Page Builder, Einheiten-Matrix, Exposé-Preview |

### Welle 2: Operations & Vertrieb (Prio 🟡)
| Modul | Prüfpunkte |
|-------|------------|
| MOD-01 Stammdaten | Profil-Vollständigkeit, Bankkonten, Kontexte |
| MOD-02 KI-Office | Armstrong Chat, Wissensbasis, Aktions-Ausführung |
| MOD-03 DMS | Ordnerstruktur, Upload, Preview, Suche |
| MOD-05 Verkauf | Verkaufsauftrag, Listing-Status, Backbone-Integration |
| MOD-09 Vertriebspartner | Partner-Liste, Zuordnung, Provision |
| MOD-10 Leads | Lead-Pipeline, Konversion, Zuweisung |
| MOD-15 CommPro | E-Mail/Brief-Versand, Vorlagen |

### Welle 3: Base-Module (Prio 🟢)
| Modul | Prüfpunkte |
|-------|------------|
| MOD-06 MSV | Mieterservice-Workflows |
| MOD-19 Fuhrpark | Fahrzeugverwaltung |
| MOD-20 Miety | Mieter-Portal Integration |

### Welle 4: Zurückgestellt
| Modul | Grund |
|-------|-------|
| MOD-14 Agenten | Erfordert Armstrong-Architektur-Sprint |
| MOD-18 Finanzanalyse | Blueprint/Stub — späterer Sprint |

---

## Prüf-Checkliste pro Modul

Für jedes Modul werden folgende Punkte geprüft:

- [ ] **PageShell + ModulePageHeader** korrekt implementiert
- [ ] **EmptyStates** statt Dummy-Daten (Showcase Readiness)
- [ ] **Mobile Responsiveness** (375px Viewport)
- [ ] **Golden Path Guards** wo nötig
- [ ] **DB-Anbindung** live (keine hardcodierten Daten)
- [ ] **Toast statt console.log** für User-Feedback
- [ ] **Navigation** (SubTabNav, Routing) funktional
- [ ] **Error Boundary** vorhanden

---

## Nächste Schritte

1. **Welle 1 starten:** MOD-00 Dashboard als erstes analysieren
2. Pro Modul: Code lesen → Browser testen → Issues dokumentieren → Fixes umsetzen
3. Nach jeder Welle: audit-tracker.md aktualisieren
