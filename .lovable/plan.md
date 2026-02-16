
# Fix: Finanzanalyse-Kacheln oeffnen sich nicht

## Analyse

Nach gruendlicher Pruefung aller 7 Tabs (Uebersicht, Investment, Sachversicherungen, Vorsorge, KV, Abonnements, Vorsorgedokumente) ist die Kernlogik (onClick-Handler, State-Management, bedingte Detail-Anzeige) **korrekt implementiert**. 

Die wahrscheinliche Ursache fuer das Problem sind:

1. **Event-Propagation**: Klick-Events koennten von uebergeordneten Elementen geschluckt werden. Alle Widget-onClick-Handler erhalten `e.stopPropagation()`.
2. **Ungenutzte Imports**: In 3 Dateien werden `getContractWidgetGlow` und `isDemoIdSpec` importiert aber nie verwendet. Dies kann Build-Warnungen verursachen.

## Aenderungen

### 1. Event-Propagation fixen (alle 7 Tabs)

In jedem Tab wird `e.stopPropagation()` zu den onClick-Handlern der Kacheln hinzugefuegt:

**Betroffene Dateien:**
- `UebersichtTab.tsx` — Personen-Kacheln (Zeile 341) und Konto-Kacheln (Zeilen 107, 134)
- `InvestmentTab.tsx` — Personen-Kacheln (Zeile 112)
- `SachversicherungenTab.tsx` — Vertrags-Kacheln (Zeile 309)
- `VorsorgeTab.tsx` — Vertrags-Kacheln (Zeile 216)
- `KrankenversicherungTab.tsx` — KV-Kacheln (Zeile 58)
- `AbonnementsTab.tsx` — Abo-Kacheln (Zeile 225)
- `VorsorgedokumenteTab.tsx` — Personen-Kacheln (Zeile 136) und Testament-Kacheln (Zeile 197)

Muster:
```text
// Vorher:
onClick={() => toggleCard(person.id)}

// Nachher:
onClick={(e) => { e.stopPropagation(); toggleCard(person.id); }}
```

### 2. Ungenutzte Imports entfernen

| Datei | Entfernter Import |
|-------|------------------|
| `SachversicherungenTab.tsx` | `getContractWidgetGlow`, `isDemoId as isDemoIdSpec` aus widgetCategorySpec |
| `VorsorgeTab.tsx` | `getContractWidgetGlow` aus widgetCategorySpec |
| `AbonnementsTab.tsx` | `getContractWidgetGlow` aus widgetCategorySpec |

### 3. Keyboard-Accessibility

Alle Kacheln mit `role="button"` erhalten zusaetzlich einen `onKeyDown`-Handler fuer Enter/Space:

```text
onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handler(); }}}
```

---

## Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | stopPropagation + onKeyDown |
| `src/pages/portal/finanzanalyse/InvestmentTab.tsx` | stopPropagation + onKeyDown |
| `src/pages/portal/finanzanalyse/SachversicherungenTab.tsx` | stopPropagation + onKeyDown + Import-Cleanup |
| `src/pages/portal/finanzanalyse/VorsorgeTab.tsx` | stopPropagation + onKeyDown + Import-Cleanup |
| `src/pages/portal/finanzanalyse/KrankenversicherungTab.tsx` | stopPropagation + onKeyDown |
| `src/pages/portal/finanzanalyse/AbonnementsTab.tsx` | stopPropagation + onKeyDown + Import-Cleanup |
| `src/pages/portal/finanzanalyse/VorsorgedokumenteTab.tsx` | stopPropagation + onKeyDown |
