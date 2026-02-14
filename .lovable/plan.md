

# SoT Website — Login als PIN-Erlebnis + Kachel-Transition

## Konzept

Der gesamte Login-Prozess wird in die SoT-Website integriert. Es gibt keinen separaten Login im Header und kein Login-Widget. Stattdessen:

1. E-Mail eingeben (zentrale Kachel auf der Startseite)
2. Armstrong bestaetigt per Chat-Bubble ("Code gesendet")
3. PIN-Eingabe im Bank-Stil (6-stelliger OTP-Code, wie `KaufyPinGate`)
4. Nach erfolgreicher Eingabe: Die Website-Kacheln fliegen nach links, rechts und oben aus dem Bildschirm — das Zone-2-Dashboard baut sich auf

Kein "Anmelden"-Button im Header mehr. Die Website IST der Login.

## Aktualisierte Layout-Skizze: Startseite

```text
+--------+--------------------------------------------------+---------+
| A      |                                                  |         |
| R      |          SYSTEM OF A TOWN                        |  Real   |
| M      |          Investments finden.                     | Estate  |
| S      |                                                  |         |
| T      |   [Investment | Klassisch]                       +---------+
| R      |   [zVE] [EK] [Standort] [Berechnen ->]           |         |
| O      |                                                  | Capital |
| N      |   Werbeinhalt / USPs / Drei Wege ...             |         |
| G      |                                                  +---------+
|        |                                                  |         |
|        |   +--------------------------------------+       |Projects |
|        |   |                                      |       |         |
|        |   |   Testen Sie unser System.            |       +---------+
|        |   |   [ihre@email.de           ] [->]     |       |         |
|        |   |                                      |       |  Mgmt   |
|        |   +--------------------------------------+       |         |
|        |                                                  +---------+
|        |   Trust Badges / Footer                          |         |
|        |                                                  | Energy  |
|        |                                                  +---------+
|        |                                                  |Karriere |
+--------+--------------------------------------------------+---------+
```

## Nach E-Mail-Eingabe: Armstrong Chat-Bubble + PIN

```text
+--------+--------------------------------------------------+---------+
| A      |                                                  |         |
| R      |          SYSTEM OF A TOWN                        |  Real   |
| M      |                                                  | Estate  |
| S      |                                                  +---------+
| T      |   +--------------------------------------+       |         |
| R      |   |  +------------------------------+   |       | Capital |
| O      |   |  | Armstrong:                   |   |       |         |
| N      |   |  | "Wir haben Ihnen eine E-Mail |   |       +---------+
| G      |   |  |  geschickt. Geben Sie Ihren  |   |       |         |
|        |   |  |  Code ein."                  |   |       |Projects |
|        |   |  +------------------------------+   |       |         |
|        |   |                                      |       +---------+
|        |   |      [ _ ][ _ ][ _ ][ _ ][ _ ][ _ ] |       |  Mgmt   |
|        |   |          6-stelliger PIN             |       |         |
|        |   |          (Bank-Feeling)              |       +---------+
|        |   |                                      |       | Energy  |
|        |   +--------------------------------------+       +---------+
|        |                                                  |Karriere |
+--------+--------------------------------------------------+---------+
```

Die PIN-Felder nutzen die bestehende `InputOTP`-Komponente (6 Slots statt 4 wie bei KaufyPinGate) mit dem dunklen Glas-Styling.

## Nach PIN-Eingabe: Kachel-Transition

```text
Schritt 1 (0.0s): PIN akzeptiert — gruener Glow auf den PIN-Feldern
Schritt 2 (0.3s): Kacheln fliegen raus:
  - Widgets rechts  -> translateX(+120%) nach rechts raus
  - Armstrong links -> translateX(-120%) nach links raus
  - Header oben     -> translateY(-120%) nach oben raus
  - Main Content    -> scale(0.95) + opacity -> 0
  Alle mit cubic-bezier(0.4, 0, 0.2, 1), 0.6s

Schritt 3 (0.9s): Bildschirm ist leer (kurzer Moment, dunkler Hintergrund)

Schritt 4 (1.0s): Zone-2 Dashboard baut sich auf:
  - SystemBar      -> slideDown von oben
  - Widget-Grid    -> scale(0.95) -> scale(1), fade-in
  - BottomNav      -> slideUp von unten (mobile)
  Duration: 0.5s ease-out
```

## Header-Aenderung

Der Header (`SotHeader.tsx`) verliert "Anmelden" und "Starten". Stattdessen nur noch:

```text
+--------------------------------------------------+
| [Logo] System of a Town              [Theme] [?] |
+--------------------------------------------------+
```

Kein Login-Button. Der Login passiert ausschliesslich ueber die "Testen Sie unser System"-Kachel auf der Startseite (und spaeter auch ueber Direktlinks).

## Mobile: Bottom-Nav mit Glassknoepfen

```text
+--------------------------------+
| SoT Logo              [Theme] |
+--------------------------------+
|                                |
|   Investments finden.          |
|   [Investment | Klassisch]     |
|   [Suchen...]                  |
|                                |
|   Werbeinhalt...               |
|                                |
|   +--------------------------+ |
|   | Testen Sie unser System. | |
|   | [email          ] [->]   | |
|   +--------------------------+ |
|                                |
+--------------------------------+
| (RE)(Cap)(Proj)(Mgt)(En)(Car)  |  <- 6 Glass Circles, fixed bottom
+--------------------------------+
```

Die Mobile Bottom-Nav nutzt exakt den `MobileBottomNav`-Stil aus Zone 2: `w-14 h-14 rounded-full`, `nav-tab-glass`, fixed bottom.

## Technische Umsetzung

### Dateien

| Nr | Datei | Art | Beschreibung |
|----|-------|-----|-------------|
| 1 | `SotHeader.tsx` | Aenderung | "Anmelden" und "Starten" Links entfernen. Nur Logo + Theme-Toggle behalten. |
| 2 | `SotWidgetSidebar.tsx` | Aenderung | Login-Widget aus der Liste entfernen (6 statt 7). Mobile: `SotWidgetBarMobile` komplett ersetzen durch fixed Bottom-Nav mit 6 runden Glassknoepfen (`nav-tab-glass`, `w-14 h-14 rounded-full`). |
| 3 | `SotHome.tsx` | Erweiterung | Pill-Tabs (Investment/Klassisch) + Investment Engine Suchleiste + "Testen Sie unser System"-Kachel einbauen. Kachel bindet `SotDemoLogin` ein. |
| 4 | `SotDemoLogin.tsx` | Neu | State-Machine-Komponente mit 4 Phasen: (1) E-Mail-Eingabe, (2) Armstrong Chat-Bubble + 6-stellige PIN via `InputOTP`, (3) Success-Glow, (4) Transition-Trigger. Nutzt Supabase Auth OTP (`signInWithOtp`) fuer echte E-Mail-Verifizierung. |
| 5 | `SotLoginTransition.tsx` | Neu | Animations-Wrapper fuer die gesamte SoT-Seite. Steuert die CSS-Transitions: Kacheln fliegen raus (translate + opacity), Dashboard fadet ein. Nutzt `useNavigate('/portal')` nach Animationsende. |
| 6 | `SotLayout.tsx` | Anpassung | `SotLoginTransition` als Wrapper einbinden. `data-transitioning`-State fuer CSS-Animationen. Mobile Bottom-Nav als fixed Element positionieren. |

### Auth-Flow (technisch)

1. User gibt E-Mail ein
2. `supabase.auth.signInWithOtp({ email })` wird aufgerufen — sendet echten 6-stelligen Code per E-Mail
3. Armstrong-Bubble erscheint (lokale UI, kein Edge-Function-Call)
4. User gibt 6-stelligen Code ein via `InputOTP` (6 Slots, Bank-Styling)
5. `supabase.auth.verifyOtp({ email, token, type: 'email' })` verifiziert den Code
6. Bei Erfolg: Session wird gesetzt, Transition startet
7. Nach Animation: Navigation zu `/portal`

Fuer Erstbesucher ohne Account wird automatisch ein Account erstellt (Supabase OTP erstellt den User bei Bedarf). Das ist der smootheste Flow — kein Passwort, kein Registrierungsformular, nur E-Mail + PIN.

### Was NICHT geaendert wird

- FutureRoom Website
- Zone 2 Portal / Dashboard
- Golden Path Engine
- Auth.tsx (bleibt als Fallback bestehen)
- Bestehende Edge Functions
- Datenbank-Schema

