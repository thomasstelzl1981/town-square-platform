

# Audit: ImageSlotGrid Format-Konsistenz

## Befund

Die `ImageSlotGrid`-Komponente ist **nicht CI-konform** mit dem Design Manifest. Es gibt drei Probleme:

### 1. Kein Bezug zum Design Manifest

Die Komponente verwendet **inline `style={{ height: slotHeight }}`** (Standard: 140px) statt der im Design Manifest definierten Widget-Standards. Das Design Manifest kennt kein `IMAGE_SLOT`-Token — es fehlt komplett.

### 2. Inkonsistente Verwendung über Module hinweg

```text
Modul           columns  slotHeight  Ergebnis
──────────────  ───────  ──────────  ──────────────────────
MOD-13 Projekte    4       140px     4 quadratische Slots (OK)
MOD-01 Avatar      1        80px     1 winziger Streifen (zu klein)
MOD-01 Logo        1        80px     1 winziger Streifen (zu klein)
MOD-22 Galerie     4       140px     4 quadratische Slots (OK)
```

Die MOD-01 Slots mit `slotHeight={80}` und `columns={1}` ergeben einen flachen Querstreifen — das ist das "komische Format", das du gesehen hast.

### 3. Hardcoded Label "Projektbilder"

Die Komponente hat `<p>Projektbilder</p>` als festen Titel (Zeile 134), was in MOD-01 (Avatar) und MOD-22 (Galerie) falsch ist.

---

## Fix-Plan

### Änderung 1: Design Manifest erweitern

Neues `IMAGE_SLOT`-Token in `designManifest.ts`:

```typescript
export const IMAGE_SLOT = {
  HEIGHT: 140,                    // Standard-Höhe für alle Bild-Slots
  HEIGHT_COMPACT: 80,             // Kompakt-Variante (Avatar/Logo)
  BORDER: 'border-2 border-dashed rounded-lg',
  COLUMNS_DEFAULT: 4,
  COLUMNS_SINGLE: 1,
} as const;
```

### Änderung 2: ImageSlotGrid CI-konform machen

- `slotHeight` Default aus `IMAGE_SLOT.HEIGHT` lesen statt Hardcode `140`
- Hardcoded `"Projektbilder"` durch einen optionalen `title`-Prop ersetzen (Default: keinen Titel anzeigen, die aufrufende Komponente setzt ihn)
- Klassen aus Design Manifest verwenden statt Inline-Styles wo möglich

### Änderung 3: MOD-01 ProfilTab anpassen

- Avatar-Slot: `slotHeight={IMAGE_SLOT.HEIGHT_COMPACT}` statt `80`
- Logo-Slot: `slotHeight={IMAGE_SLOT.HEIGHT_COMPACT}` statt `80`
- Referenz zum Manifest statt Magic Numbers

### Änderung 4: MOD-13 & MOD-22 — kein Change nötig

Diese nutzen bereits `slotHeight={140}` bzw. den Default — bleiben konsistent.

---

## Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| `src/config/designManifest.ts` | `IMAGE_SLOT` Token hinzufügen |
| `src/components/shared/ImageSlotGrid.tsx` | `title`-Prop + Manifest-Referenzen |
| `src/pages/portal/stammdaten/ProfilTab.tsx` | Manifest-Konstanten statt Magic Numbers |

