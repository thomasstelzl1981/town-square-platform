

## SoT Homepage -- Erweiterte Anpassungen

### Uebersicht der Aenderungen

Die Startseite wird visuell ueberarbeitet: Die Ueberschrift wird zu "Investment Engine", der gesamte Content wird vertikal zentriert (nicht nur oben angedockt), die Investment-Engine-Eingabe bekommt die richtigen Felder (Eigenkapital + zvE), und der Armstrong Stripe wird korrekt positioniert.

---

### 1. Ueberschrift aendern (`SotHome.tsx`)

- "Welcome on Board" wird ersetzt durch **"Investment Engine"**
- Bleibt `text-center` mit `HEADER.PAGE_TITLE` Styling

### 2. Content vertikal und horizontal zentrieren (`SotHome.tsx`)

- Der aeussere Scroll-Container bekommt `flex items-center justify-center min-h-full` statt nur `flex-1 overflow-y-auto`
- Dadurch sitzt der gesamte Block (Ueberschrift + Eingabe + Kacheln) **mittig im Viewport** -- vertikal und horizontal
- Mehr Abstand zwischen Ueberschrift und Eingabezeile: `space-y-6 md:space-y-8` statt dem Standard-Spacing

### 3. Investment Engine Eingabe ueberarbeiten (`SotHome.tsx`)

Die aktuelle Eingabe hat falsche Felder ("Budget ab", "Rendite ab"). Korrektur:

- **Linker Glass-Button**: Sliders-Icon (`SlidersHorizontal` aus lucide), oeffnet spaeter erweiterte Parameter
- **Input 1**: `type="number"`, Placeholder "Eigenkapital €" (das ist `equity` im useInvestmentEngine)
- **Input 2**: `type="number"`, Placeholder "zvE €" (zu versteuerndes Einkommen = `taxableIncome`)
- **Rechter Glass-Button**: Search-Icon, gleicher `nav-tab-glass` Stil
- Das Label "Investment Engine" in der Card entfaellt (steht ja schon als Ueberschrift darueber)
- Beide Buttons: `h-10 w-10 rounded-xl nav-tab-glass border border-primary/20`

### 4. SubBar-Linien sichtbarer machen (`SotHome.tsx`)

- `border-border/30` wird zu `border-border/50` fuer bessere Sichtbarkeit der horizontalen Trennlinien

### 5. Armstrong Stripe Position und Breite (`SotArmstrongStripe.tsx`)

Aktuell `top-12` (48px = SystemBar). Der Stripe muss unterhalb der SubBar beginnen:

- **Expanded State**: `top-12` aendern zu `top-[88px]` (48px SystemBar + 40px SubBar), Breite bleibt 200px
- **Minimized State**: Gleiche Top-Position, Breite bleibt 45px
- Der Stripe ist bereits `fixed right-0`, beeinflusst also den Content-Flow nicht -- die Kacheln bleiben mittig unabhaengig vom Stripe
- Der Main-Content in `SotHome.tsx` bekommt KEIN padding-right -- der Content zentriert sich ueber die volle Viewport-Breite, der Stripe ueberlappt bei Bedarf leicht

### 6. Kacheln bleiben unveraendert

- WidgetGrid mit 3 Kacheln (Investment finden, Objekt einreichen, Finanzierung starten) bleibt wie bisher
- `w-full` auf dem Grid sorgt dafuer, dass sie innerhalb des zentrierten Containers korrekt sitzen

---

### Zusammenfassung der Dateiaenderungen

| Datei | Aenderungen |
|---|---|
| `SotHome.tsx` | Ueberschrift "Investment Engine", vertikale Zentrierung (`min-h-full flex items-center justify-center`), SubBar-Border auf `/50`, Investment-Eingabe: EK + zvE + links SlidersHorizontal-Button + rechts Search-Button, Label entfernt, mehr Spacing |
| `SotArmstrongStripe.tsx` | `top-[88px]` statt `top-12` fuer beide States (expanded + minimized), damit Stripe unter SubBar beginnt |

Keine Aenderungen an `SotLayout.tsx` noetig -- der Stripe ist bereits fixed positioniert.

