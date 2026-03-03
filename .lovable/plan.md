

# Bewertung: Minimale Token-Korrektur (3 Zeilen)

## Was die Änderungen bewirken

1. **`:root --background: 210 20% 98%`** — Light-BG bekommt einen leichten Blau-Unterton statt reinem Weiss. Reduziert Blendwirkung bei langen Sessions, harmoniert mit der D-DIN Font und dem Enterprise-Look. Gute Entscheidung.

2. **`:root --card: 0 0% 100% / 0.92`** — Glass-Alpha von 0.8 auf 0.92 erhöht. Cards werden opaker, Text-Lesbarkeit auf durchscheinendem Gradient verbessert sich deutlich. Der Glass-Effekt bleibt subtil erhalten. Sinnvoll.

3. **`.dark --text-dimmed: 215 18% 65%`** — Von `215 15% 55%` auf `215 18% 65%`. Hebt den Kontrast von ~3.5:1 auf ~5.2:1 (über WCAG AA). Behebt den dokumentierten Pain Point #1. Korrekt.

## Bewertung

Alle drei Änderungen sind minimal-invasiv, treffen genau die richtigen Stellschrauben und brechen nichts. Keine Komponenten betroffen, nur CSS-Variablen in `src/index.css`.

## Umsetzung

Drei Zeilen in `src/index.css` ändern — fertig. Keine weiteren Dateien betroffen.

