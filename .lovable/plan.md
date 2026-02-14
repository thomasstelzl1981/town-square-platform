

# Systemweite Lesbarkeits-Offensive — Kontrast, Clutter, Konsistenz

## Kernproblem

Drei zusammenhaengende Ursachen fuer schlechte Lesbarkeit:

1. **Zu schwacher Kontrast**: `--muted-foreground` steht auf `215 20% 65%` (Dark Mode) — das ergibt ein blasses Grau, das auf dunklem Hintergrund schwer lesbar ist. SpaceX verwendet deutlich hellere Sekundaertexte.
2. **111 Dateien umgehen die globale Schriftskala**: Hardcodierte `text-[10px]`, `text-[11px]`, `text-[9px]` werden vom Tailwind-Override nicht erfasst.
3. **Redundante Inhalte**: Area-Uebersichtsseiten listen Module mit Beschreibungen, Benefits und Bereichen auf — alles bereits im Menue sichtbar.

---

## Massnahme 1: Kontrast-Upgrade (CSS-Token)

**Datei**: `src/index.css`

| Token | Vorher (Dark) | Nachher (Dark) | Effekt |
|---|---|---|---|
| `--muted-foreground` | `215 20% 65%` | `215 20% 75%` | +10% Helligkeit, deutlich lesbarer |
| `--text-secondary` | `215 20% 65%` | `215 20% 75%` | Gleicher Lift |
| `--text-dimmed` | `215 15% 45%` | `215 15% 55%` | Auch unterste Stufe heben |

Das entspricht dem SpaceX-Ansatz: Sekundaertext ist sichtbar, nicht versteckt.

---

## Massnahme 2: Hardcodierte Pixel-Schriftgroessen eliminieren

**Umfang**: 111 Dateien mit insgesamt ca. 2041 Vorkommen

**Systematische Ersetzung**:

| Vorher | Nachher | Begruendung |
|---|---|---|
| `text-[9px]` | `text-xs` (= 13.5px) | Mindestgroesse fuer Lesbarkeit |
| `text-[10px]` | `text-xs` (= 13.5px) | Unter 13px nicht ganztags lesbar |
| `text-[11px]` | `text-xs` (= 13.5px) | Konsistenz mit Skala |

Dieses Batch-Update betrifft Badges, Labels, Footer-Texte, Timestamps und Metadaten in allen Modulen.

**Wichtig**: Dies wird als systematischer Durchlauf ueber alle 111 Dateien ausgefuehrt. Die Logik bleibt ueberall unveraendert — nur die CSS-Klasse wird getauscht.

---

## Massnahme 3: Area-Uebersichtsseiten radikal vereinfachen

**Problem**: Die Karten auf `/portal/area/operations` (und allen anderen Areas) zeigen:
- MOD-Nummer Badge
- Titel + Beschreibung
- 3 Benefit-Zeilen mit Icons
- "Bereiche:"-Label mit Sub-Tile-Chips
- "Modul oeffnen"-Button

Das ist zu viel. Der User sieht die Module bereits im Menue. Die Karten sollen nur schnellen Zugang bieten.

**Neues Design fuer AreaModuleCard**:

- MOD-Badge: **entfernt**
- Beschreibung (oneLiner): **entfernt**
- Benefits-Liste: **entfernt**
- "Bereiche:"-Label: **entfernt**
- Sub-Tile-Chips: **bleiben** (groesser, `text-sm`)
- "Modul oeffnen"-Button: **entfernt** — gesamte Karte wird klickbar
- Titel: **vergroessert** auf `text-xl font-semibold`

Ergebnis: Saubere, klickbare Karten mit nur Titel + Bereichs-Chips.

**Datei**: `src/components/portal/AreaModuleCard.tsx`

**AreaOverviewPage** (`src/pages/portal/AreaOverviewPage.tsx`):
- Beschreibungszeile unter "MANAGER" / "CLIENT" etc.: **entfernt** (selbsterklaerend durch Menue)

**AreaPromoCard** (`src/components/portal/AreaPromoCard.tsx`):
- Bleibt, aber "Details ansehen"-Button wird entfernt — gesamte Karte klickbar

---

## Massnahme 4: Design-Manifest-Tokens auffrischen

**Datei**: `src/config/designManifest.ts`

| Token | Vorher | Nachher |
|---|---|---|
| `TABLE.HEADER_CELL` | `text-xs font-medium text-muted-foreground` | `text-sm font-medium text-muted-foreground` |
| `TABULAR_FORM.LABEL_CELL` | `text-xs text-muted-foreground` | `text-sm text-muted-foreground` |
| `TABULAR_FORM.SECTION_ROW` | `text-xs font-semibold` | `text-sm font-semibold` |
| `MOBILE.CARD_LABEL` | `text-xs text-muted-foreground` | `text-sm text-muted-foreground` |

---

## Zusammenfassung der Dateien

| Aenderung | Dateien | Art |
|---|---|---|
| CSS-Kontrast-Tokens | 1 (`index.css`) | Token-Wert |
| Hardcodierte Pixel ersetzen | ~111 Dateien | Klassen-Tausch |
| AreaModuleCard vereinfachen | 1 | Redesign |
| AreaOverviewPage entschlacken | 1 | Text entfernen |
| AreaPromoCard vereinfachen | 1 | Button entfernen |
| designManifest.ts Tokens | 1 | Token-Update |

Keine Logik-Aenderungen, keine DB-Aenderungen. Rein visuell und typografisch.

---

## Umsetzungsreihenfolge

1. CSS-Tokens anpassen (sofortige Wirkung auf alle `text-muted-foreground`-Stellen)
2. designManifest.ts Tokens hochsetzen
3. AreaModuleCard + AreaOverviewPage + AreaPromoCard vereinfachen
4. Systematischer Durchlauf: alle `text-[9px]`, `text-[10px]`, `text-[11px]` durch `text-xs` ersetzen

