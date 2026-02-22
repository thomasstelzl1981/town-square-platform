
## Kaufy Website -- Tiefenanalyse und Redesign-Plan

### Befund: Aktuelle Probleme

**1. Tote Links im Footer (11 von 15 sind tot oder Dummy)**

| Link | Aktuell | Status |
|------|---------|--------|
| Uberblick | `/website/kaufy` (Homepage) | Dummy |
| Funktionen | `/website/kaufy` | Dummy |
| Immo-Wallet | `/website/kaufy` | Dummy |
| Vertriebstools | `/website/kaufy` | Dummy |
| Automationen | `/website/kaufy` | Dummy |
| Fur Investoren | `/website/kaufy` | Dummy |
| Demo anfragen | `href="#"` | Tot |
| Uber kaufy | `href="#"` | Tot |
| Kontakt | `href="#"` | Tot |
| Karriere | `href="#"` | Tot |
| Partner | `href="#"` | Tot |
| Presse | `href="#"` | Tot |
| Fur Vermieter | `/website/kaufy/vermieter` | OK |
| Fur Anbieter | `/website/kaufy/verkaeufer` | OK |
| Fur Vertriebspartner | `/website/kaufy/vertrieb` | OK |

**2. Visuell inkonsistente Unterseiten**
- Startseite: Cinematic Hero mit Bild, Search Bar, hochwertig
- Vermieter: Hat ein Hero-Bild, aber anderer Stil (dunklerer Overlay, anderes Layout)
- Verkaufer: Kein Hero-Bild, nur Text-Hero mit Badge
- Partner: Kein Hero-Bild, nur Text-Hero
- Kein einheitliches Design-Pattern uber alle Unterseiten

**3. Placeholder-Inhalte**
- PerspektivenAkkordeon zeigt "Dashboard-Vorschau" Platzhalter statt eines echten Bildes
- Doppelte Uberschrift "Eine Plattform. Drei Perspektiven." in PerspektivenKarten UND PerspektivenAkkordeon

**4. DEMO_PROJECT Hardcoded Data**
- In `Kaufy2026Verkaeufer.tsx` (Zeilen 31-46): Hardcodiertes Demo-Projekt-Objekt. Dies ist ein Verstoss gegen die Demo Data Governance Regel, sollte aber als UI-Beispiel (Storybook-Style) fur eine Vorschau akzeptiert werden, da es nicht mit einer Business-Entity verbunden ist.

---

### Redesign-Konzept

**Design-Prinzip:** Alle Unterseiten orientieren sich an der Startseite -- clean, helle Flachen, abgerundete Container, konsistente Typografie, Sky-Blue Akzente auf fast-weissem Hintergrund.

#### A. Footer komplett uberarbeiten

Statt 15 Links (11 davon tot) auf **8 sinnvolle Links** reduzieren:

| Spalte | Links | Ziel |
|--------|-------|------|
| KAUFY (Logo + Claim) | -- | Branding |
| Plattform | Investment-Suche, Fur Vermieter, Fur Anbieter, Fur Partner | Bestehende Seiten |
| Rechtliches | Impressum, Datenschutz | Bestehende Seiten |
| Kontakt | E-Mail-Link, Registrieren-CTA | Sinnvolle Aktion |

Alle `href="#"` Links und Dummy-Wiederholungen werden entfernt.

#### B. Unterseiten visuell vereinheitlichen

Alle drei Unterseiten (Vermieter, Verkaufer, Partner) bekommen ein einheitliches Hero-Pattern:
- Text-basierter Hero (wie Verkaufer aktuell, aber besser)
- Konsistentes Layout: Badge oben, grosse Headline, Beschreibung, CTA-Button
- Gleiche Padding/Spacing-Werte
- Gleiche Farbpalette (kein separates Hero-Bild noetig -- sauberer, homogener Look)

Die Vermieter-Seite wird vom Bild-Hero auf den gleichen Text-Hero umgestellt wie die anderen Seiten, damit alles einheitlich aussieht.

#### C. PerspektivenAkkordeon verbessern

- Den SVG-Placeholder durch ein existierendes Asset (`perspektiven.png`) ersetzen
- Die doppelte Uberschrift entfernen -- PerspektivenKarten behalten den Titel, PerspektivenAkkordeon bekommt einen neuen: "Was KAUFY fur Sie tut"

#### D. Search Engine pruefen

Die Investment-Suche (Kaufy2026SearchBar + Kaufy2026Home) nutzt korrekt:
- `useInvestmentEngine` Hook
- `sot-investment-engine` Edge Function
- Demo-Listings via `useDemoListings`

Die Search Engine funktioniert korrekt und ist an die aktuelle Engine-Architektur angebunden.

#### E. Magic Intake pruefen

Der Magic Intake auf der Verkaufer-Seite nutzt:
- `sot-public-project-intake` Edge Function (existiert)
- Storage-First-Pattern uber `public-intake` Bucket
- 6-Schritt-Wizard: Upload, Analyse, Review, Kontakt, Vertrag, Submit

Die Architektur ist korrekt. Die Edge Function existiert und ist deployed.

---

### Technischer Plan

| Nr | Datei | Anderung |
|----|-------|----------|
| 1 | `src/pages/zone3/kaufy2026/Kaufy2026Layout.tsx` | Footer komplett ueberarbeiten: 8 sinnvolle Links statt 15 tote |
| 2 | `src/pages/zone3/kaufy2026/Kaufy2026Vermieter.tsx` | Hero-Bild entfernen, einheitlichen Text-Hero wie Verkaufer/Partner |
| 3 | `src/components/zone3/kaufy2026/PerspektivenAkkordeon.tsx` | Uberschrift andern, Placeholder durch `perspektiven.png` ersetzen |
| 4 | `src/components/zone3/kaufy2026/PerspektivenKarten.tsx` | Keine Aenderung (bleibt Referenz-Design) |

**Keine neuen Dateien noetig.** Alle Aenderungen sind innerhalb bestehender Zone-3-Dateien, die NICHT unter das Modul-Freeze-System fallen (Zone 3 ist kein Portal-Modul).
