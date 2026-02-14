

## SoT Homepage -- Vergleich und Anpassungen

### 1. Duenne Linien ueber und unter den Menuepunkten

Im Portal hat die `TopNavigation` ein `border-b` auf dem aeusseren `nav`-Element und ein `border-b` auf dem inneren AreaTabs-Container. Die SoT SubBar hat aktuell keine Rahmenlinien.

**Aenderung in `SotHome.tsx`:**
- SubBar-Container bekommt `border-y border-border/30` fuer duenne Linien oben und unten, identisch zum Portal-Stil.

### 2. Armstrong Stripe -- Breite und Hoehe anpassen

Aktuell ist der Stripe nur 45px (idle) / 58px (hover) breit -- das entspricht ca. 1cm auf dem Bildschirm. Im Portal-Screenshot ist der expanded Armstrong deutlich breiter (304px) mit Header "ARMSTRONG", Minimize/Close Buttons und Datei-Drop-Zone.

**Aenderung in `SotArmstrongStripe.tsx`:**
- Breite erhoehen auf ca. 200px (idle), passend zum Portal-Referenz-Screenshot
- Hoehe: Der Stripe soll nicht die volle Hoehe einnehmen, sondern nur den Content-Bereich (unter der SystemBar). Das ist bereits korrekt durch das Flex-Layout, aber der innere Content wird auf `justify-center` umgestellt statt `justify-end`, damit der Armstrong-Content vertikal zentriert sitzt statt ganz unten
- Oben den "ARMSTRONG" Schriftzug horizontal anzeigen (wie im Portal) plus Minimize/Close Buttons
- "Dateien hierher ziehen" Platzhalter in der Mitte

### 3. Zentrierung von Headline und Kacheln

Das Problem: Der Armstrong Stripe ist ein Flex-Sibling von `main` im Layout. Dadurch wird der sichtbare Bereich nach links verschoben.

**Aenderung in `SotLayout.tsx`:**
- Die `main` bekommt `flex items-center justify-center` oder der innere Content wird relativ zum Viewport zentriert
- Alternativ: Armstrong Stripe wird `position: fixed` auf der rechten Seite, sodass er den Content-Flow nicht beeinflusst. Der Main-Content zentriert sich dann unabhaengig ueber die volle Breite.

**Empfohlene Loesung:** Armstrong als `fixed right-0` positionieren, damit Kacheln und Headline immer perfekt mittig im Viewport sitzen, unabhaengig von der Stripe-Breite.

### 4. Investment Engine vereinfachen

Statt 4 Eingabefelder (Ort, Budget, Rendite, Objektart) + blauer Button wird die Eingabe reduziert auf:
- 2 Zahlen-Inputs (z.B. "Budget" und "Rendite" oder "Min" und "Max")
- Rechts daneben ein runder/quadratischer Glass-Suchbutton (nav-tab-glass Stil mit Search-Icon)
- Der breite blaue "Investments durchsuchen" Button entfaellt komplett
- Die gesamte Eingabezeile wird kompakt in einer Zeile dargestellt

**Aenderung in `SotHome.tsx`:**
- Investment Engine Card: Nur noch eine horizontale Zeile mit 2 Input-Feldern + Glass-Button
- Inputs: `type="number"`, Placeholder z.B. "Budget ab" und "Rendite ab"
- Suchbutton: Runder Glass-Button mit Search-Icon, kein solider blauer Hintergrund

### Zusammenfassung der Dateiaenderungen

| Datei | Aenderung |
|---|---|
| `SotHome.tsx` | SubBar `border-y`, Investment Engine auf 2 Inputs + Glass-Button vereinfachen |
| `SotArmstrongStripe.tsx` | Breite auf ~200px, "ARMSTRONG" Header oben, "Dateien hierher ziehen" Platzhalter, vertikale Zentrierung |
| `SotLayout.tsx` | Armstrong Stripe auf `fixed right-0` umstellen, damit Content unabhaengig zentriert bleibt |

