---
item_code: KB.FIN.009
category: finance
content_type: faq
title_de: "Was ist DSCR? (Proxy-Erklärung)"
summary_de: "Debt Service Coverage Ratio einfach erklärt."
version: "1.0.0"
status: "published"
scope: "global"
confidence: "high"
valid_until: null
sources: []
---

# FAQ: DSCR (Debt Service Coverage Ratio)

---

## Was bedeutet DSCR?

**DSCR = Debt Service Coverage Ratio**

Auf Deutsch: **Schuldendienstdeckungsgrad**

Die Kennzahl zeigt, wie gut die Einnahmen den Schuldendienst (Zins + Tilgung) decken.

---

## Wie berechnet man DSCR?

```
DSCR = Netto-Mieteinnahmen / Jährlicher Schuldendienst
```

**Netto-Mieteinnahmen:** Kaltmiete - Bewirtschaftungskosten
**Schuldendienst:** Alle Zins- und Tilgungszahlungen

---

## Wie interpretiere ich den DSCR?

| DSCR | Bedeutung |
|------|-----------|
| < 1,0 | ❌ Mieteinnahmen decken Kredit nicht |
| 1,0 - 1,1 | ⚠️ Knapp, kein Puffer |
| 1,1 - 1,3 | ✓ Akzeptabel, kleiner Puffer |
| 1,3 - 1,5 | ✅ Gut, solider Puffer |
| > 1,5 | 🌟 Sehr gut, hohe Sicherheit |

---

## Beispiel

**Objekt:**
- Jahresnettomiete: 12.000 €
- Bewirtschaftungskosten: 2.400 €
- Netto-Mieteinnahmen: 9.600 €
- Jährlicher Schuldendienst: 7.200 €

```
DSCR = 9.600 € / 7.200 € = 1,33
```

→ Gut! Die Einnahmen decken den Kredit mit 33% Puffer.

---

## Warum ist DSCR wichtig?

### Für den Investor
- Zeigt Cashflow-Stabilität
- Warnt vor Unterdeckung
- Hilft bei Investmententscheidung

### Für die Bank
- Wichtiges Prüfkriterium
- Zeigt Kreditrisiko
- Beeinflusst Konditionen

---

## Was tun bei niedrigem DSCR?

1. **Mehr Eigenkapital** → Weniger Kredit → Niedrigerer Schuldendienst
2. **Längere Zinsbindung** → Planungssicherheit
3. **Niedrigere Tilgung** → Achtung: Restschuld bleibt hoch
4. **Mietpotenzial prüfen** → Ggf. Mieterhöhung möglich

---

## Armstrong berechnet DSCR

Als Teil der KPI-Berechnung (`ARM.MOD04.CALCULATE_KPI`) wird der DSCR-Proxy automatisch ermittelt.
