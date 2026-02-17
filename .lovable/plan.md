
## SoT Website Redesign — Software-Praesentationsseite mit 8-Widget-Grid

### Strategische Neupositionierung

Die SoT-Website wird von einer Investment/Marketplace-Plattform zu einer **Software-Praesentationsseite** fuer private Nutzer umgebaut. Fokus: Immobilien, Finanzen, KI-Office — alles was Zone 2 fuer Endkunden bietet (ohne Manager-Module).

---

### IST-Zustand (was sich aendert)

| Element | IST | SOLL |
|---------|-----|------|
| Hero | Investment Engine mit Suchfeldern | Klare H1/H2 Software-Headline |
| Startseite | 5 Scroll-Snap Screens (Engine, 3 Wege, Features, KPIs, CTA) | Hero + 8-Widget-Grid + "Warum SoT?" + CTA |
| Header (SubBar) | Real Estate, Capital, Projects, Mgmt, Energy, Career | MANAGEMENT, REAL ESTATE, FINANCE, ENERGY, CAREER, LOGIN |
| Armstrong Stripe | 300px fixed rechts mit Chat | Entfernen (spaeter als schwebendes Element) |
| Layout | 300px Spacer + Content + 300px Armstrong | Volle Breite, zentrierter Content |
| SystemBar | Zone-2-Klon mit 6 Glass-Buttons | Entfernen — wird durch neue Header-Nav ersetzt |
| Detail-Seiten | Stub-Seiten (nur Headline) | Ausgebaute Landingpages mit 3-4 Leistungsbloecken |
| Footer | Links zu Capital, Projects etc. | Aktualisierte Links passend zur neuen Struktur |

---

### Dateiaenderungen

#### 1. `src/pages/zone3/sot/SotLayout.tsx` — Layout vereinfachen

- Armstrong Stripe entfernen (kein Import, kein Rendering)
- 300px Left-Spacer entfernen
- SystemBar entfernen — durch neue Header-Komponente ersetzen
- SotWidgetBarMobile entfernen
- Neuer Header: Einfache Nav-Leiste mit Pills (MANAGEMENT | REAL ESTATE | FINANCE | ENERGY | CAREER | LOGIN)
- Layout wird: Header + Main (volle Breite, scrollbar) + Footer

#### 2. `src/pages/zone3/sot/SotHome.tsx` — Komplett neu

**Hero Section:**
- H1: "System of a Town"
- H2: "Der digitale Manager fuer Immobilien und private Finanzen."
- Subline: "Organisieren. Verwalten. Analysieren. Automatisieren."
- 2 Buttons: "Kostenlos starten" + "Demo ansehen"
- Kein Suchfeld, kein Intake, keine Slider

**8-Widget-Grid** (2x4, responsive 4-2-1):

| # | Titel | Kurztext | Icon |
|---|-------|----------|------|
| 1 | Immobilien | Portfolio, Akten und Dokumente zentral verwalten. | Building2 |
| 2 | Dokumente | Digitaler Datenraum mit Struktur und KI-Unterstuetzung. | FileText |
| 3 | Finanzen | Konten, Vertraege und Vorsorge im Ueberblick. | Wallet |
| 4 | Energie | Verbrauch, Vertraege und Photovoltaik transparent steuern. | Zap |
| 5 | KI Office | Intelligente Assistenz fuer Organisation und Aufgaben. | Brain |
| 6 | E-Mail und Kommunikation | Posteingang, Kommunikation und Prozesse buendeln. | Mail |
| 7 | Reports und Analyse | Kennzahlen, Auswertungen und Performance im Blick. | BarChart3 |
| 8 | Sicherheit und Struktur | Zentrale Verwaltung mit klaren Rollen und Zugriffen. | Shield |

Widget-Design:
- Dunkle Karten (bg-card/80, border-border/30)
- Leichter Glow bei Hover (shadow-primary/10)
- Subtile Scale-Animation (hover:scale-[1.02])
- Minimalistische Lucide Icons
- Viel Negativraum

**"Warum System of a Town?" Section:**
- 3 Bloecke: Zentralisiert, Automatisiert, Skalierbar
- Minimale Icons, kurze Texte

**CTA Section:**
- E-Mail-Eingabe + "Jetzt starten" Button
- Links: Demo ansehen | Kontakt

#### 3. `src/pages/zone3/sot/SotManagement.tsx` — Ausgebaute Landingpage

Fokus: KI Office, Aufgaben, E-Mail, Organisation
- H1: "Management"
- H2: "KI-gestuetzte Organisation fuer Ihren Alltag."
- 4 Leistungsbloecke: Aufgabenmanagement, E-Mail-Integration, Dokumentenverwaltung, Automatisierung
- CTA am Ende

#### 4. `src/pages/zone3/sot/SotRealEstate.tsx` — Ausgebaute Landingpage

Fokus: Immobilienakte, Portfolio, Dokumente
- H1: "Real Estate"
- H2: "Ihr Immobilienportfolio im Griff."
- 4 Leistungsbloecke: Portfolio-Uebersicht, Objektakte, Datenraum, Analyse

#### 5. `src/pages/zone3/sot/SotCapital.tsx` → Umbenennen zu **SotFinance.tsx**

Fokus: Private Finanzen (keine Finanzierung, keine Investment Engine)
- H1: "Finance"
- H2: "Private Finanzen transparent und digital."
- 3 Leistungsbloecke: Kontenuebersicht, Versicherungen und Vertraege, Vorsorge
- Route: `/website/sot/finance` statt `/website/sot/capital`

#### 6. `src/pages/zone3/sot/SotEnergy.tsx` — Ausgebaute Landingpage

Fokus: Vertraege, PV, Monitoring
- 3 Leistungsbloecke: Energievertraege, Photovoltaik-Dashboard, Verbrauchsmonitoring

#### 7. `src/pages/zone3/sot/SotKarriere.tsx` — Ausgebaute Landingpage

Fokus: Partnerprogramme (high-level)
- Keine Modul-Namen, keine Prozessdetails
- 3 Bloecke: Warum Partner werden, Wer kann Partner werden, Naechste Schritte

#### 8. `src/manifests/routesManifest.ts` — Routen aktualisieren

- `capital` → `finance` (Route + Komponente)
- `projects` Route entfernen (gehoert zu Kaufy)
- Legacy-Redirects fuer `capital` → `finance`

#### 9. `src/components/zone3/sot/SotFooter.tsx` — Links aktualisieren

- "Capital" → "Finance"
- "Projects" entfernen
- Footer-Beschreibung aktualisieren

#### 10. Zu entfernende Dateien/Importe

- `SotProjects.tsx` — gehoert zu Kaufy, nicht mehr verlinkt
- `SotArmstrongStripe.tsx` — wird nicht mehr im Layout verwendet
- `SotWidgetSidebar.tsx` — wird nicht mehr im Layout verwendet
- `SotSystemBar.tsx` — wird nicht mehr im Layout verwendet (neuer inline Header)
- `SotInputBar.tsx` — Investment Engine entfernt

---

### Design-Sprache

- Zone-2-Aesthetik uebertragen: Dunkle Karten, Glas-Effekte, viel Negativraum
- SpaceX-Inspiration: Grosse Headlines, minimale Farben, keine grellen Akzente
- Dark/Light Mode wie Zone 2
- Keine Modulnummern (MOD-xx), keine technischen Begriffe
- Keine Manager-Begriffe

---

### Zusammenfassung

| Datei | Aktion |
|-------|--------|
| `SotLayout.tsx` | Stark vereinfachen (kein Armstrong, kein SystemBar, neuer Header) |
| `SotHome.tsx` | Komplett neu: Hero + 8-Widget-Grid + Warum + CTA |
| `SotManagement.tsx` | Ausbauen: 4 Leistungsbloecke |
| `SotRealEstate.tsx` | Ausbauen: 4 Leistungsbloecke |
| `SotCapital.tsx` → `SotFinance.tsx` | Umbenennen + Ausbauen: 3 Leistungsbloecke |
| `SotEnergy.tsx` | Ausbauen: 3 Leistungsbloecke |
| `SotKarriere.tsx` | Ausbauen: 3 Leistungsbloecke |
| `SotFooter.tsx` | Links aktualisieren |
| `routesManifest.ts` | capital→finance, projects entfernen |
| Armstrong/SystemBar/Sidebar | Nicht mehr im Layout verwendet |

Keine DB-Aenderungen, kein Backend, rein Frontend-Refactoring. Zone 1, Zone 2, Golden Path, Edge Functions bleiben komplett unberuehrt.
