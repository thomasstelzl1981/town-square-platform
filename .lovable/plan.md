
# Armstrong-Seite fuer die SoT-Website (Zone 3)

## Problem

Die Armstrong-Erklaerungen und Credit-Uebersicht sind aktuell unter **Stammdaten > Abrechnung** versteckt. Das ist fuer potenzielle und bestehende Nutzer nicht der richtige Ort, um zu verstehen, was Armstrong kann und warum er besonders ist. Armstrong braucht eine eigene, oeffentlich zugaengliche Seite auf der SoT-Website.

---

## Loesung

Eine neue Seite `/website/sot/armstrong` als vollwertiger Menuepunkt in der SoT-Website-Navigation. Diese Seite erklaert:

- Was Armstrong ist (KI-Co-Pilot)
- Was er alles **kostenlos** kann
- Was er mit **Credits** kann (und was das kostet)
- Wie er arbeitet (ThinkingSteps-Visualisierung als Referenz)
- Was ihn besonders macht (Plan → Confirm → Execute, Transparenz, kein Abo)

---

## Seitenstruktur

### Hero-Sektion
- Headline: "Armstrong — Ihr KI-Co-Pilot"
- Subline: "Arbeitet fuer Sie. Transparent. Nur wenn Sie es wollen."
- Animierter Orb/Glow als visuelles Element

### Sektion 1: Was Armstrong kostenlos kann
- Begriffe erklaeren, FAQ beantworten, Navigation, How-it-Works
- Widgets verwalten, Dashboard-Tipps
- Alles was `cost_model: 'free'` hat im Manifest

### Sektion 2: Was Armstrong mit Credits kann
- Tabelle/Karten mit Aktionskategorien aus dem Manifest:
  - Dokument-Analyse (1 Credit)
  - Texte/Briefe generieren (2 Credits)
  - Web-Research mit Quellen (4 Credits)
  - Kontaktanreicherung (2 Credits)
  - Datenraum-Extraktion (1 Credit/Dokument)
  - Magic Intakes (1-4 Credits je nach Typ)
- Jede Karte zeigt: Aktion, Credit-Preis, kurze Erklaerung

### Sektion 3: Wie Armstrong arbeitet
- Drei-Schritte-Erklaerung: Plan → Bestaetigen → Ausfuehren
- Verweis auf die ThinkingSteps-Visualisierung (man sieht jeden Schritt)
- Betonung: Kein Black-Box — volle Transparenz

### Sektion 4: Was Armstrong besonders macht
- Kein Abo, kein Vendor-Lock-in
- Multi-Modul: arbeitet ueberall (Immobilien, Finanzen, DMS, Kontakte)
- Datenschutz: Daten bleiben beim Mandanten
- Credits = faire Abrechnung, nur bei echtem KI-Einsatz

### Sektion 5: FAQ
- "Brauche ich Armstrong?" — Nein, alles funktioniert auch ohne
- "Wie lade ich Credits?" — In der Plattform unter Stammdaten
- "Kann Armstrong Fehler machen?" — Ja, deshalb Plan → Confirm → Execute

### CTA
- "Jetzt kostenfrei starten" mit Link zu /auth?mode=register

---

## Technische Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/pages/zone3/sot/SotArmstrong.tsx` | **NEU** — Die Armstrong-Erklaerseite |
| `src/manifests/routesManifest.ts` | Route `armstrong` in `zone3Websites.sot.routes` hinzufuegen |
| `src/pages/zone3/sot/SotLayout.tsx` | `ARMSTRONG` als neuen navItem einfuegen |
| `src/router/ManifestRouter.tsx` | Lazy import `SotArmstrong` + Eintrag in `sotComponentMap` |
| `src/components/zone3/sot/SotWidgetSidebar.tsx` | Neuen Widget-Eintrag "Armstrong" mit Bot-Icon hinzufuegen |

### Keine Aenderung an:
- `AbrechnungTab.tsx` — Die Credit-Uebersicht dort bleibt bestehen (ist fuer eingeloggte User relevant). Die neue Seite ist die **oeffentliche Erklaerung** fuer Website-Besucher.

### Datenquelle fuer Credit-Preise
Die Seite liest die Action-Kategorien und Preise direkt aus dem `armstrongManifest.ts` (bereits exportiert), sodass Aenderungen im Manifest automatisch auf der Website reflektiert werden — Single Source of Truth.

---

## Geschaetzter Umfang

- ~250 Zeilen: `SotArmstrong.tsx` (Hero + 5 Sektionen + CTA)
- ~5 Zeilen: Route-Registrierungen (Manifest, Router, Layout, Sidebar)
- Kein Backend noetig — rein statische/manifest-basierte Seite
