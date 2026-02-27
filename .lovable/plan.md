

## SoT Website Redesign — KI-Power & klare Demo/Login-Trennung

### Probleme identifiziert

1. **Demo/Login-Chaos**: Header hat nur "Login" Button (→ `/auth`), kein separater "Demo" Button. Demo-Link in Nav führt auf Unterseite statt direkt zum Demo-Account. User müssen sich durch mehrere Seiten klicken.
2. **Broken Link**: Preise-Seite hat `ctaLink: '/sot/demo'` statt `/website/sot/demo`
3. **KI-Power nicht kommuniziert**: Keine Erwähnung der konkreten KI-Modelle (Gemini 2.5 Pro, GPT-5). Keine Zahlen zu Token-Kapazitäten. Armstrong wird als generische KI beschrieben statt als Multi-Modell-Powerhouse.
4. **Module-Aufzählung oberflächlich**: Nur Name + 1-Zeiler. Keine konkreten KI-Features pro Modul (ChatGPT-Style Upload, automatische Dokumenterkennung, etc.)
5. **CTA-Wirrwarr**: `SotCTA` default-Text sagt "14 Tage kostenlos" — Plattform ist aber dauerhaft kostenlos
6. **Hero-Email-Form**: CTA-Eingabefeld hat keinen Submit-Handler

### Änderungen

**1. SotLayout.tsx — Header: Demo-Button + Login klar trennen**
- Header bekommt zwei Buttons: "Demo testen" (→ `/portal?mode=demo`, grün/auffällig) + "Login" (→ `/auth`, dezent)
- Nav-Item "DEMO" bleibt, verweist weiterhin auf Info-Seite `/website/sot/demo`
- Mobile: Gleiche Trennung

**2. SotHome.tsx — Hero + KI-Power Sektion komplett überarbeiten**
- Hero-Pills um "Gemini 2.5 Pro" und "GPT-5" ergänzen
- Neue "KI-Power" Sektion nach Armstrong: konkrete Modell-Auflistung, Token-Kapazitäten, was unsere KI-Engines alles können (Dokument-Parsing, Exposé-Extraktion, E-Mail-Generierung, Web-Recherche, Meeting-Zusammenfassungen, Marktanalysen)
- Armstrong-Sektion: "Powered by Gemini 2.5 Pro & GPT-5" Badge, konkrete Zahlen (35+ KI-Engines, 32.000 Token Dokumentanalyse, 8.000 Token Recherchen)
- Stats-Bar: "15+" → "20+" Module, "35+" KI-Engines hinzufügen
- CTA unten: Email-Submit verlinkt auf `/auth?mode=register&source=sot`
- Demo-Link klar auf `/portal?mode=demo`

**3. SotDemo.tsx — Demo-Seite: direkter Einstieg**
- "Demo starten" Button bleibt auf `/portal?mode=demo` (korrekt)
- Modul-Links: alle korrekt mit `?mode=demo` (bereits gut)
- Zusätzlich: KI-Features der Demo hervorheben (Armstrong testen, Dokument-Upload testen)

**4. SotPreise.tsx — Broken Link fixen**
- `ctaLink: '/sot/demo'` → `'/website/sot/demo'`

**5. SotCTA.tsx — Default-Text korrigieren**
- "14 Tage kostenlos" → "Keine Grundgebühr. Alle Module kostenfrei."

**6. SotIntelligenz.tsx — KI-Modell-Details**
- Neue Sektion: "Welche KI-Modelle nutzen wir?" mit Gemini 2.5 Pro (Reasoning & Dokumentanalyse), GPT-5 (Textgenerierung), Gemini 2.5 Flash (Schnelle Klassifikation)
- Konkrete Zahlen: 32.000 Token max. Context, 35+ Edge Functions, 6 KI-Kategorien

**7. SotPlattform.tsx — Module mit KI-Badges**
- Module die KI nutzen bekommen "KI-powered" Badge
- Kurze Erklärung was die KI dort konkret macht

### Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| `src/pages/zone3/sot/SotLayout.tsx` | Header: Demo + Login Buttons trennen |
| `src/pages/zone3/sot/SotHome.tsx` | KI-Power Sektion, Stats, Hero, CTA |
| `src/pages/zone3/sot/SotDemo.tsx` | KI-Highlights in Demo-Preview |
| `src/pages/zone3/sot/SotPreise.tsx` | Broken link fix |
| `src/pages/zone3/sot/SotIntelligenz.tsx` | KI-Modell-Übersicht |
| `src/components/zone3/sot/SotCTA.tsx` | Default-Text fix |

Alle Dateien sind in Zone3 → Freeze-Check: `zone3_freeze.json` zeigt `"SOT": { "frozen": false }` — frei.

