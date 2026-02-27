

## Vorschau-Container: Dynamische Hoehe statt fester 900px

### Problem

Die iframe hat `height: 900px` und `scrolling="no"` — zeigt nur den oberen Teil der Website. Der Rest ist abgeschnitten. Doppeltes Scrolling entsteht, weil der Container die tatsaechliche Seitenlaenge nicht kennt.

### Loesung

Da die iframe **same-origin** ist (gleiche Domain), kann nach dem Laden `contentDocument.body.scrollHeight` ausgelesen werden. Die iframe-Hoehe wird dynamisch auf die volle Dokumenthoehe gesetzt, skaliert mit dem Container-Faktor. So sieht man die **gesamte** Landing Page ohne internen Scroll.

### Aenderung in `LandingPageTab.tsx` (Zeilen 428-450)

```text
Vorher:
  iframe { width: 1440px, height: 900px, scale(0.5), scrolling="no" }
  container { paddingBottom: 62.5% }

Nachher:
  iframe { width: 1440px, height: [dynamisch aus contentDocument.scrollHeight], scale(containerWidth/1440) }
  container { height: scrollHeight * scale }
  scrolling bleibt "no" — kein interner Scroll
```

Konkret:
- `onLoad`-Handler liest `iframe.contentDocument.body.scrollHeight` (z.B. 4200px)
- Setzt `iframe.style.height = scrollHeight + 'px'`
- Setzt Container `paddingBottom = scrollHeight * scale + 'px'`
- Ergebnis: Die gesamte Website ist skaliert sichtbar, ohne Scrollbalken

| Datei | Aenderung |
|-------|----------|
| `src/pages/portal/projekte/LandingPageTab.tsx` | onLoad: dynamische Hoehe aus contentDocument.scrollHeight |

