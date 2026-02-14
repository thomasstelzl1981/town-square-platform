

## SoT Homepage — Kompletter Neuaufbau mit Scroll-Snap

### Architektur

1. **Scroll-Snap Sektionen**: `scroll-snap-type: y mandatory` auf `main`, 5 viewport-fuellende Sektionen mit `scroll-snap-align: start`
2. **Symmetrisches Layout**: Unsichtbarer linker Spacer (300px) = rechter Armstrong Stripe (300px) → Content exakt mittig
3. **Mobile**: Inputs gestapelt, Kacheln vertikal, Armstrong als FAB + Fullscreen-Chat

### 5 Sektionen

| # | Name | Inhalt |
|---|---|---|
| 1 | Investment Engine | Headline + EK/zvE Inputs + 8 Advanced-Parameter |
| 2 | Drei Wege | 3 grosse Kacheln (Suche, Upload, Calc) |
| 3 | Plattform-Vorteile | 2x2 Feature-Grid (KI, Steuer, Markt, E2E) |
| 4 | Social Proof | 3 KPI-Zahlen mit Count-up Animation |
| 5 | CTA | E-Mail-Eingabe + Demo/Kontakt Links |

### Dateien

| Datei | Aktion |
|---|---|
| `src/pages/zone3/sot/SotLayout.tsx` | Flex-Container mit linkem Spacer (300px), `main` scroll-snap |
| `src/pages/zone3/sot/SotHome.tsx` | Komplett neu: 5 Snap-Sektionen |
| `src/styles/sot-premium.css` | Scroll-Snap CSS-Klassen |
| `src/components/zone3/sot/SotArmstrongStripe.tsx` | Bleibt (300px, top-12, inline Chat) |
| `src/components/zone3/sot/SotWidgetSidebar.tsx` | Mobile: Armstrong FAB hinzufuegen |
