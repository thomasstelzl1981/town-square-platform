
# ACQUIARY Website — Zone 3 Neuaufbau

## Analyse der bisherigen Version

Die exportierte Acquiary-Website hat 16 Seiten und 13 Nav-Eintraege. Das Kernproblem: zu viel Redundanz.

| Seiten-Cluster | Inhaltsueberschneidung |
|---|---|
| Methodik + So funktioniert's + Leistungen | Alle drei beschreiben denselben Prozess |
| Zusammenarbeit + Partnerkreis | Beide erklaeren das Netzwerkmodell |
| Akquisemanager + Karriere | Beide werben Akquise-Manager an |
| Mandantenportal + KI | Guter eigenstaendiger Inhalt, aber als Unterseite zu granular |

## Neues Konzept: 5 Seiten (Investment-House-Aesthetik)

Vorbild: Diskrete, minimalistische Optik wie Houlihan Lokey, Lazard, oder deutsche Family-Office-Websites (z.B. FINVIA, HQ Trust). Wenig Text, viel Weissraum, subtile Animationen. Azure Blue bleibt als Primaerfarbe, aber zurueckhaltender eingesetzt.

### Seitenstruktur (5 Seiten + Objekt anbieten)

```text
/acquiary               Start (Hero + Kompakt-Prozess + USPs + CTA)
/acquiary/methodik      Methodik & Technologie (Prozess + KI + Portal — konsolidiert)
/acquiary/netzwerk      Netzwerk & Partner (Zusammenarbeit + Partnerkreis — konsolidiert)
/acquiary/karriere      Akquisemanager werden (Karriere + Manager-Details — konsolidiert)
/acquiary/objekt        Objekt anbieten (Lead-Capture — bleibt eigenstaendig)
```

### Navigation (Header)

```text
[A] ACQUIARY    Methodik    Netzwerk    Karriere    |  Objekt anbieten [Button]  |  [Theme] Login
```

5 Nav-Eintraege statt 13. "Start" ist das Logo. "Objekt anbieten" als primaerer CTA-Button rechts.

## Design-Sprache

- **Farbpalette:** Azure Blue (#2196F3) als Akzent, Dark Mode Default (wie SoT), helle Variante verfuegbar
- **Typografie:** Grosse, duenne Headlines (light weight 300-400), viel Tracking. Keine Uppercase-Display wie SoT (zu laut), stattdessen elegante Serifenlose
- **Layout:** 1280px Container, grosszuegige Sektions-Abstande (120px+), subtile Trennlinien statt Hintergrundwechsel
- **Karten:** Minimale Borders, kein Shadow-Hover (Investment-House-Stil), ggf. subtiler Border-Highlight
- **Animationen:** Dezentes Fade-In beim Scrollen, keine Hover-Lifts
- **Trust-Elemente:** Diskrete Badges (DSGVO, KI-gestuetzt, NDA-geschuetzt) am Footer, nicht als eigene Sektion

## Technische Umsetzung

### Neue Dateien

```text
src/pages/zone3/acquiary/
  AcquiaryLayout.tsx         Layout (Header + Footer + Outlet)
  AcquiaryHome.tsx           Startseite
  AcquiaryMethodik.tsx       Methodik & Technologie
  AcquiaryNetzwerk.tsx       Netzwerk & Partner
  AcquiaryKarriere.tsx       Akquisemanager werden
  AcquiaryObjekt.tsx         Objekt anbieten (Lead-Capture)
  index.ts                   Barrel-Export

src/styles/acquiary-premium.css   Eigene CSS-Variablen und Styles (analog futureroom-premium.css)
```

### Routing (routesManifest.ts)

Neuer Eintrag in `zone3Websites`:
```typescript
acquiary: {
  base: "/acquiary",
  layout: "AcquiaryLayout",
  routes: [
    { path: "", component: "AcquiaryHome", title: "ACQUIARY" },
    { path: "methodik", component: "AcquiaryMethodik", title: "Methodik" },
    { path: "netzwerk", component: "AcquiaryNetzwerk", title: "Netzwerk" },
    { path: "karriere", component: "AcquiaryKarriere", title: "Karriere" },
    { path: "objekt", component: "AcquiaryObjekt", title: "Objekt anbieten" },
  ],
},
```

### Inhaltszuordnung (alt nach neu)

| Alter Inhalt | Neuer Ort |
|---|---|
| Home Hero + Stats | AcquiaryHome (Hero, kompakter) |
| Methodik | AcquiaryMethodik Sektion 1 |
| So funktioniert's | AcquiaryMethodik Sektion 2 (3-Schritt-Prozess) |
| Leistungen | AcquiaryMethodik Sektion 3 (Leistungskatalog) |
| Mandantenportal + KI | AcquiaryMethodik Sektion 4 (Portal + KI-Features) |
| Zusammenarbeit | AcquiaryNetzwerk Sektion 1 (Kooperationsmodell) |
| Partnerkreis | AcquiaryNetzwerk Sektion 2 (Partner-Typen) |
| Akquisemanager | AcquiaryKarriere (Haupt-Karriereseite) |
| Karriere | AcquiaryKarriere (konsolidiert: Was Sie tun, Was Sie bekommen, Wen wir suchen) |
| Objekt anbieten | AcquiaryObjekt (1:1 uebernommen, Lead-Capture) |
| Immobilienangebote | Entfaellt (intern, nicht fuer Website) |
| Erstprofil/Kontakt | CTAs auf allen Seiten, kein separater Screen |
| Impressum/Datenschutz/AGB | Footer-Links (Platzhalter-Seiten) |

### CSS-Architektur (acquiary-premium.css)

Eigene CSS-Custom-Properties mit `--aq-` Praefix (analog `--fr-` fuer FutureRoom):
- **Hero:** Dunkler, subtiler Gradient (kein radial glow wie SoT, eher linear und ruhig)
- **Sections:** Alternierend weisser Hintergrund und sehr helles Grau (#FAFBFC)
- **Cards:** 1px Border, kein Shadow, groesserer Radius (20px)
- **Buttons:** Primaer-Button mit Azure Fill, Secondary als Ghost mit feiner Border
- **Footer:** Dunkler Hintergrund, 4-Spalten-Grid (wie FutureRoom-Pattern)

### Kein Datenbank-Aenderung noetig

Die Seite ist rein statisch (Zone 3 = read-only). Lead-Capture ("Objekt anbieten") nutzt den bestehenden Edge Function Endpunkt `/api/public/leads`. Keine neuen Tabellen oder RLS-Policies erforderlich.
