

# Konsolidierungsstatus: Vollstaendige Pruefung

## Was ist umgesetzt?

### Phase 1: Orphan Cleanup — KOMPLETT ERLEDIGT
| Datei | Status |
|-------|--------|
| `src/components/zone3/kaufy/ArmstrongSidebar.tsx` | Geloescht |
| `src/components/zone3/kaufy/InvestmentSearchCard.tsx` | Geloescht |
| `src/components/zone3/kaufy/KaufyPropertyCard.tsx` | Geloescht |
| `src/components/zone3/kaufy/PerspektivenAccordion.tsx` | Geloescht |
| `src/components/zone3/kaufy/ZahlenSektion.tsx` | Geloescht |
| `src/components/immobilienakte/UnitDossierView.tsx` | Geloescht |
| `kaufy/index.ts` — reduziert auf KaufyInputBar | Erledigt |
| `immobilienakte/index.ts` — Export entfernt | Erledigt |

### Phase 2: Expose-Konsolidierung — KOMPLETT ERLEDIGT (5/5)
| Seite | Nutzt SSOT? | Hook | Zeilen |
|-------|-------------|------|--------|
| InvestmentExposePage (MOD-08) | `InvestmentExposeView` | `useExposeListing` | 53 |
| PartnerExposePage (MOD-09) | `InvestmentExposeView` | `useExposeListing` | 53 |
| Kaufy2026Expose (Zone 3) | `InvestmentExposeView` | `useExposeListing` | 145 |
| InvestEngineExposePage (MOD-13) | `InvestmentExposeView` | `useProjectUnitExpose` | 84 |
| ProjectLandingExpose (Zone 3 Landing) | `InvestmentExposeView` | `useProjectUnitExpose` | 130 |

### Shared Helper — ERLEDIGT
- `src/lib/createPropertyFromUnit.ts` — Erstellt, wird von `CreatePropertyFromUnits` und `SalesApprovalSection` genutzt.

### Freeze-Status — KORREKT
- Alle Module (MOD-00 bis MOD-22) frozen
- Alle Zone 3 Sites frozen
- Alle Infra-Bereiche frozen (inkl. `shared_investment`)

---

## Was ist noch offen?

### 1. Governance-Regel F (TSX Creation Check) — OFFEN
Muss manuell in Custom Knowledge eingetragen werden. Der Text wurde bereits formuliert:

```text
F. MANDATORY RULE – TSX CREATION CHECK

Before creating ANY new .tsx file, you MUST:

1. Search for existing components with similar purpose using
   search_files with patterns matching the intended functionality
   (e.g., "ImageGallery", "SearchCard", "ResultTile", "Calculator")

2. Check these directories for reusable SSOT components:
   - src/components/shared/ — Cross-module UI patterns
   - src/components/investment/ — Investment/Expose SSOT
   - src/components/ui/ — Base UI primitives
   - src/components/immobilienakte/ — Property dossier blocks

3. If a component with >70% functional overlap exists:
   - REFUSE creation and say:
     "COMPONENT DUPLICATE: [proposed file] overlaps with [existing file].
      Extend the existing component with props/variants instead of
      creating a new file."
   - Propose a props-based extension of the existing component

4. If the new component serves a genuinely new purpose, proceed
   but register it in the appropriate index.ts barrel export.

This rule prevents the drift from 2 versions to 5 versions that
caused the Expose regression chain.
```

Du musst diesen Text selbst in dein Custom Knowledge einfuegen (Einstellungen des Projekts). Ich kann Custom Knowledge nicht direkt aendern.

### 2. Keine weiteren Code-Luecken gefunden
- Alle 5 Expose-Seiten sind Thin Wrappers (53-145 Zeilen) auf die SSOT-Komponente `InvestmentExposeView` (388 Zeilen).
- Beide Hooks (`useExposeListing` fuer DB-Listings, `useProjectUnitExpose` fuer Projekt-Einheiten) sind korrekt getrennt und nutzen dasselbe `ExposeListingData`-Interface.
- `createPropertyFromUnit` erzeugt Properties mit allen Feldern, die `useExposeListing` downstream braucht (`annual_income`, `year_built`, `heating_type`, etc.).
- Die Barrel-Exports in `investment/index.ts` exportieren `InvestmentExposeView` und `ExposeListingData`.
- Keine verwaisten Dateien mehr im Kaufy- oder Immobilienakte-Verzeichnis.

### 3. Moeglicher Verbesserungspunkt (kein Blocker)
`InvestmentExposeView` listet MOD-13 und Zone 3 Project Landing noch nicht im JSDoc-Header (Zeile 7-8). Das ist rein kosmetisch, aber fuer Konsistenz sollte der Kommentar aktualisiert werden, wenn das naechste Mal einer der beteiligten Bereiche unfrozen wird.

---

## Zusammenfassung

```text
ERLEDIGT:
✅ Phase 1: 6 verwaiste Dateien geloescht, Barrel-Exports bereinigt
✅ Phase 2: 5/5 Expose-Seiten auf InvestmentExposeView SSOT konsolidiert
✅ Shared Helper createPropertyFromUnit erstellt und integriert
✅ Alle Module und Bereiche korrekt re-frozen

OFFEN:
⬜ Regel F in Custom Knowledge eintragen (manuell durch dich)
```

