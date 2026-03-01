

# Analyse: Verkehrswert-Mismatch zwischen Zuhause (MOD-20) und Finanzanalyse (MOD-18)

## Befund

Die Datenpipeline ist grundsaetzlich korrekt verdrahtet:

```text
miety_homes.market_value (DB)
  → useFinanzberichtData (SELECT id, name, market_value, ...)
    → calcAssets() → homeValue (Summe aller market_value)
    → buildPropertyList() → marketValue pro Zeile
      → FinanzberichtSection (Tabelle "Immobilienaufstellung")
```

**Das Problem liegt nicht in der Pipeline, sondern in fehlenden Daten:**

Die DB zeigt, dass mehrere Eigenheim-Eintraege `market_value = NULL` haben. In der Finanzanalyse wird `h.market_value || 0` gerechnet, d.h. diese Immobilien erscheinen zwar in der Liste (weil `ownership_type = 'eigentum'`), aber mit **0 EUR Verkehrswert**.

### Ursachen fuer fehlende market_value

1. **Auto-Create-Pfad**: `UebersichtTile.tsx` (Z. 92-102) erstellt Homes automatisch mit nur `name, address, city, ownership_type, property_type` — **ohne market_value**.

2. **Kein Inline-Edit im Dossier**: `BuildingDetailsSection` zeigt den Verkehrswert nur **read-only** an. Um ihn zu aendern, muss der User den "Bearbeiten"-Button finden, der das gesamte `MietyCreateHomeForm` oeffnet — nicht offensichtlich.

3. **Kein Hinweis auf fehlende Daten**: Wenn market_value null ist, zeigt die Finanzanalyse still `0 EUR` an, ohne Warnung dass der Wert fehlt.

## Vorgeschlagene Fixes

### Fix 1: BuildingDetailsSection editierbar machen
Den Verkehrswert im Dossier direkt editierbar machen (Inline-Input statt nur Anzeige). Beim Verlassen des Feldes wird `miety_homes.market_value` per `.update()` gespeichert.

### Fix 2: Finanzanalyse — fehlende Werte kennzeichnen
In der Immobilienaufstellungs-Tabelle: wenn `marketValue === 0` und die Immobilie eigengenutzt ist, statt "0 EUR" einen Hinweis zeigen wie "— (nicht hinterlegt)" mit Link zum Dossier.

### Fix 3: Fallback-Schaetzung (optional)
Wenn `market_value` null ist, koennte man als Fallback `purchase_price` verwenden (falls vorhanden). Allerdings haben Zuhause-Eintraege keinen `purchase_price` — nur Portfolio-Properties. Daher ist der beste Ansatz: den User zur Eingabe auffordern.

## Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/miety/components/BuildingDetailsSection.tsx` | Verkehrswert-Feld editierbar machen (Inline-Save) |
| `src/components/finanzanalyse/FinanzberichtSection.tsx` | "nicht hinterlegt" Hinweis bei fehlenden Werten |

Kein Engine-Change noetig — die Berechnung ist korrekt, nur die Daten fehlen.

