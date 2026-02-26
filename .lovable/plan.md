

## ManagerVisitenkarte — Bild auf volle Kartenhoehe

### Problem

Die Karte hat `min-h-[280px]`, aber der innere Flex-Container hat keine explizite Hoehe. `items-stretch` wirkt nur, wenn der Container selbst eine definierte Hoehe hat. Deshalb bleibt das Foto auf die natuerliche Texthoehe begrenzt (~120px) statt die vollen ~260px (280px minus Padding und Gradient-Bar) zu nutzen.

### Loesung (1 Datei, 3 Zeilen)

**`src/components/shared/ManagerVisitenkarte.tsx`:**

| # | Aenderung | Zeile |
|---|-----------|-------|
| 1 | Card: `flex flex-col` hinzufuegen, damit CardContent wachsen kann | 71 |
| 2 | CardContent: `flex-1` hinzufuegen, damit es die volle Resthoehe einnimmt | 75 |
| 3 | Inneres Flex-Div: `h-full` hinzufuegen, damit `items-stretch` greift | 76 |

### Ergebnis

```text
┌──────────────────────────────────────────────┐
│ ██ gradient bar ██████████████████████████████│
│  ┌─────────┐                                 │
│  │         │  Ralph Reinhold            [✏]  │
│  │         │  PROJEKTMANAGER                 │
│  │  FOTO   │  ✉ rr@unitys.com               │
│  │ (volle  │  📞 +49 170 5591993            │
│  │ Hoehe)  │  📍 Ottostraße 3, 80333        │
│  │  128px  │                                 │
│  │  breit  │  [0 aktive Projekte]            │
│  │         │                                 │
│  └─────────┘                                 │
└──────────────────────────────────────────────┘
```

Das Foto fuellt jetzt die gesamte Kartenhoehe (ca. 260px) als saubere Kachel aus.

