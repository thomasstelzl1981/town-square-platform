
# SoT Website Remastering — Tech-Plattform fuer Haushalt, Finanzen und KI

## Ausgangslage

Die aktuelle SoT-Website ist auf "Immobilienverwaltung" fokussiert. Die Plattform hat sich aber weiterentwickelt zu einer umfassenden **Haushalts- und Finanzmanagement-Plattform mit KI-Integration**. Die bisherige Seitenstruktur (Management, Real Estate, Finance, Energy, Armstrong) bildet das nicht ab. Ausserdem fehlen die neuen Kern-Features: **Armstrong Intelligence** (Datenraum-Extraktion, KI-Zugriff auf alle Dokumente) und **Magic Intake** (KI-gesteuerte Datenerfassung).

Die Manager-Module (MOD-09, MOD-10, MOD-11, MOD-12, MOD-13, MOD-22) gehoeren zu den Marken KAUFY, FUTURE ROOM, ACQUIARY und LENNOX — sie werden NICHT auf der SoT-Website beworben.

---

## Neue Seitenstruktur

### Navigation (SotLayout)

```text
SYSTEM OF A TOWN

[HOME] [PLATTFORM] [INTELLIGENZ] [MODULE] [PREISE] [DEMO] [FAQ]  🌙 LOGIN
```

Bisherige Einzelseiten (Real Estate, Finance, Management, Energy) werden **zusammengefuehrt** in eine einzige, umfassende **PLATTFORM**-Seite. Armstrong bekommt eine eigene **INTELLIGENZ**-Seite (statt nur "Armstrong").

### Seitenzuordnung

| Route | Seite | Status |
|-------|-------|--------|
| `/website/sot` | **Home** — komplett neu | Rewrite |
| `/website/sot/plattform` | **Plattform** — was die Software kann (Areas: Client, Service, Base) | NEU (ersetzt real-estate, finance, management, energy) |
| `/website/sot/intelligenz` | **Intelligenz** — Armstrong + Datenraum + Magic Intake | NEU (ersetzt armstrong) |
| `/website/sot/module` | **Module** — Detailuebersicht aller Module | Update |
| `/website/sot/preise` | **Preise** — Kostenfrei + Pay-per-Use | Update |
| `/website/sot/demo` | **Demo** — Demo-Tenant Vorschau | Update |
| `/website/sot/faq` | **FAQ** — Bleibt | Minimal |
| `/website/sot/karriere` | **Karriere** — Bleibt | Minimal |
| `/website/sot/real-estate` | Redirect → `/website/sot/plattform` | Legacy |
| `/website/sot/finance` | Redirect → `/website/sot/plattform` | Legacy |
| `/website/sot/management` | Redirect → `/website/sot/plattform` | Legacy |
| `/website/sot/energy` | Redirect → `/website/sot/plattform` | Legacy |
| `/website/sot/armstrong` | Redirect → `/website/sot/intelligenz` | Legacy |

---

## Seite 1: HOME (SotHome.tsx) — Kompletter Rewrite

### Hero
- Headline: **"Struktur und KI fuer Ihren Haushalt."**
- Subline: "Immobilien, Finanzen, Dokumente, Energie und Fahrzeuge — zentral verwaltet, intelligent analysiert. Kein Abo. Pay per Use."
- Feature-Pills: Immobilien, Finanzen, Dokumente, Energie, Fahrzeuge, KI-Assistent
- CTAs: "Kostenlos starten" + "Plattform entdecken"

### Sektion: Die 3 Bereiche (Areas)
Statt 8 generischer Widget-Kacheln zeigen wir die **3 User-Areas** mit ihren echten Use Cases:

**Client** (Ihr Vermoegen)
- Finanzen: Konten, Einnahmen, Ausgaben, Vertraege
- Immobilien: Portfolio, Objektakten, Mietvertraege
- Finanzierung: Selbstauskunft, Bankfertige Unterlagen
- Immo Suche: Kapitalanlagen finden, Rendite berechnen
- Verkauf: Inserate, Anfragen, Reservierungen
- KI Office: E-Mails, Briefe, Kalender, WhatsApp

**Service** (Ihr Haushalt)
- Fortbildung: Buecher, Kurse, Zertifikate
- Haustiere: Tierakten, Caring, Tierservice
- Shops: Amazon Business, OTTO, Bestellungen
- Fahrzeuge: Fuhrpark, TUeV, Fahrtenbuch
- Photovoltaik: PV-Anlagen, Ertraege, Wartung
- Kommunikation Pro: E-Mail-Serien, Tracking

**Base** (Ihr System)
- Dokumente (DMS): Datenraum, Posteingang, KI-Sortierung
- Stammdaten: Profile, Kontakte, Vertraege
- Armstrong: KI-Co-Pilot, Datenraum-Extraktion

### Sektion: Armstrong Intelligence (Highlight)
- Emotionaler Pitch: "Ihre KI liest Ihren gesamten Datenraum"
- 3 Highlights: Kein Upload noetig, Einmal aktivieren, Volle Kostenkontrolle
- Verweis auf `/website/sot/intelligenz`

### Sektion: So funktioniert es
1. Registrieren (kostenfrei)
2. Daten anlegen oder importieren
3. Datenraum aktivieren (Armstrong Intelligence)
4. KI arbeiten lassen

### Sektion: Warum System of a Town
- Zentralisiert, Automatisiert, Skalierbar (aktualisierte Texte)

### Sektion: Stats
- 15+ Module, DSGVO-konform, 24/7 KI, Pay per Use

### CTA
- E-Mail-Eingabe + "Kostenlos starten"

---

## Seite 2: PLATTFORM (SotPlattform.tsx) — NEU

Ersetzt die 4 Einzelseiten (Real Estate, Finance, Management, Energy).

### Hero
- Headline: **"Eine Plattform. Drei Bereiche. Alles im Griff."**
- Subline: "Von der Kontoauswertung bis zur Nebenkostenabrechnung — SoT bringt Ordnung in Ihren Haushalt."

### Area: Client — Ihr Vermoegen
Detailbloecke fuer: Finanzen (MOD-18), Immobilien (MOD-04), Finanzierung (MOD-07), KI Office (MOD-02), Verkauf (MOD-06), Immo Suche (MOD-08)
- Jeder Block: Icon, Titel, Beschreibung, 3 Pain Points, Features
- Daten aus `sotWebsiteModules.ts` (gefiltert nach relevanten Codes)

### Area: Service — Ihr Haushalt
Detailbloecke fuer: Fortbildung (MOD-15), Haustiere (MOD-05), Shops (MOD-16), Fahrzeuge (MOD-17), Photovoltaik (MOD-19), Kommunikation Pro (MOD-14)

### Area: Base — Ihr System
Detailbloecke fuer: DMS (MOD-03), Stammdaten (MOD-01), Armstrong (ARMSTRONG)

### Verbindendes Element
- "Alle Module arbeiten zusammen" — Daten fliessen zwischen Bereichen
- Armstrong kennt alles

---

## Seite 3: INTELLIGENZ (SotIntelligenz.tsx) — NEU

Die wichtigste neue Seite. Hier erklaeren wir das Killer-Feature.

### Hero
- Headline: **"Armstrong Intelligence"**
- Subline: "Ihre KI liest Ihren gesamten Datenraum — ohne manuelles Hochladen, ohne Copy-Paste."
- Badge: "GAME CHANGER"

### Sektion: Das Problem
- Emotionaler Einstieg: "Kennen Sie das? Sie wollen Ihre KI fragen, was in Ihrem Mietvertrag steht — aber zuerst muessen Sie das PDF finden, hochladen, warten, und naechstes Mal von vorne."
- Vergleich: ChatGPT (manuell hochladen), Microsoft Copilot (Abo + Einschraenkungen), SoT Armstrong (einmal aktivieren, dauerhaft nutzen)

### Sektion: Die Loesung — Datenraum-Extraktion
- Scan → Angebot → Freigabe → Abarbeitung (4-Schritte visuell)
- "Scannen Sie Ihren Datenraum. Sie sehen den Preis vorher. Nach der Freigabe arbeitet Armstrong Ihre Dokumente ab — und kann sie ab sofort lesen."

### Sektion: Magic Intake
- Erklaerung: Daten nicht muehsam eintippen, sondern KI erfasst
- Beispiele: Selbstauskunft ausfuellen, Immobilienakte anlegen, Projektdaten importieren

### Sektion: Was danach moeglich ist
- Konkrete Armstrong-Beispiele mit Sprechblasen-UI:
  - "Fasse alle Mietvertraege zusammen und zeige die Kuendigungsfristen"
  - "Vergleiche die Nebenkostenabrechnungen 2024 und 2025"
  - "Welche Versicherungen laufen naechsten Monat aus?"
  - "Erstelle eine Uebersicht aller offenen Rechnungen"
  - "Was steht im Grundbuch der Musterstrasse 5?"

### Sektion: Posteingangs-Pipeline
- Automatische End-to-End-Verarbeitung neuer Dokumente
- 1 Credit/Dokument, inklusive NK-Beleg-Parsing

### Sektion: Wie Armstrong arbeitet
- Plan → Bestaetigen → Ausfuehren (3-Schritte, wie bisher)

### Sektion: Kostenlos vs. Credits
- Free-Actions und Credit-Kategorien (aus armstrongManifest)

### Sektion: Datenschutz
- Kein Training mit Mandantendaten, DSGVO, deutsche Server

---

## Updates an bestehenden Seiten

### SotModule.tsx
- Kategorie-Labels aktualisieren auf die Area-Terminologie (Client, Service, Base statt Foundation, Management, Finance, Extensions)
- Keine Manager-Module anzeigen (bereits korrekt ausgeschlossen)

### SotPreise.tsx
- Texte aktualisieren: "Haushalt und Finanzen" statt nur "Immobilienverwaltung"
- Armstrong Intelligence als Premium-Feature hervorheben

### SotDemo.tsx
- Text-Updates fuer die neue Positionierung

---

## Technische Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/pages/zone3/sot/SotLayout.tsx` | Navigation: navItems auf neue Struktur (Home, Plattform, Intelligenz, Module, Preise, Demo) |
| `src/pages/zone3/sot/SotHome.tsx` | Kompletter Rewrite: Areas-basierte Struktur, Armstrong-Highlight, neue Texte |
| `src/pages/zone3/sot/SotPlattform.tsx` | **NEU** — Ersetzt Real Estate + Finance + Management + Energy |
| `src/pages/zone3/sot/SotIntelligenz.tsx` | **NEU** — Armstrong Intelligence + Datenraum + Magic Intake |
| `src/pages/zone3/sot/SotModule.tsx` | Kategorie-Labels aktualisieren |
| `src/pages/zone3/sot/SotPreise.tsx` | Text-Updates |
| `src/pages/zone3/sot/SotDemo.tsx` | Text-Updates |
| `src/data/sotWebsiteModules.ts` | Kategorien umbenennen (client, service, base statt foundation, management, finance, extensions) |
| `src/manifests/routesManifest.ts` | Neue Routes (plattform, intelligenz), Legacy-Redirects fuer alte Pfade |
| `src/router/ManifestRouter.tsx` | Lazy imports fuer SotPlattform + SotIntelligenz, Redirects fuer alte Seiten |

### Dateien die NICHT mehr als eigene Seite benoetigt werden (bleiben als Legacy-Redirect):
- `SotRealEstate.tsx` — Redirect auf `/website/sot/plattform`
- `SotFinance.tsx` — Redirect auf `/website/sot/plattform`
- `SotManagement.tsx` — Redirect auf `/website/sot/plattform`
- `SotEnergy.tsx` — Redirect auf `/website/sot/plattform`
- `SotArmstrong.tsx` — Redirect auf `/website/sot/intelligenz`

---

## Umsetzungsreihenfolge

1. `SotLayout.tsx`: Neue Navigation
2. `sotWebsiteModules.ts`: Kategorien umbenennen
3. `SotHome.tsx`: Kompletter Rewrite mit Areas und Armstrong-Highlight
4. `SotPlattform.tsx`: Neue Seite mit allen 3 Areas im Detail
5. `SotIntelligenz.tsx`: Neue Seite — Armstrong Intelligence, Datenraum, Magic Intake
6. `SotModule.tsx`, `SotPreise.tsx`, `SotDemo.tsx`: Text-Updates
7. `routesManifest.ts` + `ManifestRouter.tsx`: Neue Routes + Legacy-Redirects
