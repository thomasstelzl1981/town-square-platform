---
item_code: KB.RE.014
category: real_estate
content_type: article
title_de: "Mietrendite vs Gesamtrendite: Wie rechnen?"
summary_de: "Unterschied zwischen Mietrendite und tatsächlicher Rendite verstehen."
version: "1.0.0"
status: "published"
scope: "global"
confidence: "high"
valid_until: null
sources: []
---

# Mietrendite vs Gesamtrendite

## Bruttomietrendite

Die einfachste Kennzahl:

```
Bruttomietrendite = Jahreskaltmiete / Kaufpreis × 100
```

**Beispiel:**
- Jahreskaltmiete: 12.000 €
- Kaufpreis: 200.000 €
- Rendite: 6,0%

**Problem:** Ignoriert alle Kosten!

---

## Nettomietrendite

Berücksichtigt Bewirtschaftungskosten:

```
Nettomietrendite = (Jahreskaltmiete - Bewirtschaftungskosten) / Gesamtinvestition × 100
```

**Gesamtinvestition:** Kaufpreis + Kaufnebenkosten

**Bewirtschaftungskosten:**
- Verwaltung (300-500 €/Jahr)
- Instandhaltung (10-15 €/m²/Jahr)
- Nicht umlegbare NK
- Mietausfallwagnis (2-3%)

**Realistischer:** Typisch 1,5-2% unter Bruttorendite

---

## Eigenkapitalrendite

Der Hebel durch Fremdfinanzierung:

```
EK-Rendite = (Jahresüberschuss / Eigenkapital) × 100
```

**Jahresüberschuss:**
- Mieteinnahmen
- - Zinskosten
- - Bewirtschaftungskosten
- + Steuereffekt (AfA, Werbungskosten)

**Beispiel:**
- 30.000 € EK eingesetzt
- 4.500 € Jahresüberschuss
- EK-Rendite: 15%

---

## Gesamtrendite (IRR)

Berücksichtigt alles:
- Laufende Cashflows
- Wertsteigerung
- Exit-Erlös
- Zeitwert des Geldes

```
Gesamtrendite (IRR) = Interner Zinsfuß aller Zahlungsströme
```

**Schwer zu berechnen, aber am aussagekräftigsten!**

---

## Vergleich am Beispiel

| Kennzahl | Wert |
|----------|------|
| Bruttomietrendite | 6,0% |
| Nettomietrendite | 4,2% |
| EK-Rendite (Jahr 1) | 12,5% |
| Gesamtrendite (10 Jahre, 2% Wertsteigerung) | 9,8% |

---

## Armstrong-Tipp

Nutze `ARM.MOD04.CALCULATE_KPI` für eine vollständige Renditeberechnung basierend auf deinen Dossier-Daten.
