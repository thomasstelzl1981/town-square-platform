

## MOD-11 Finanzierungsmanager: Dashboard + Finanzierungsakte aufraumen

### Probleme (aus Screenshots)

| Problem | Wo | Loesung |
|---------|-----|---------|
| "Neuer Fall" ist ein breiter blauer Button statt runder Glasbutton | Dashboard, rechts oben | Runder Glasbutton (variant="glass", size="icon-round") wie CI-Standard |
| Widget-Leiste oben auf Finanzierungsakte zeigt "00000000 active" und "Aktuelle Akte" | Finanzierungsakte, Zeilen 217-243 | Komplett entfernen — verwirrt, fuehrt nirgendwo hin |
| Pfeil-Button (ArrowLeft) fuehrt zurueck zum Dashboard — redundant | Finanzierungsakte, Zeile 247 | Entfernen — Navigation erfolgt ueber Sub-Tabs |
| Header "NEUE FINANZIERUNGSAKTE" ist ein eigener div statt ModulePageHeader | Finanzierungsakte, Zeilen 246-273 | Durch `ModulePageHeader` ersetzen mit Titel "Finanzierungsakte" + runder Plus-Button und Split-View-Toggle als Actions |
| Demo-Widget "Max Muster, Berlin" fuehrt zu Route `faelle/__demo__` die nicht existiert | Dashboard WidgetGrid | Bleibt als Demo-Widget, aber Route wird geprueft/korrigiert |

### Umsetzung

**1. `FMDashboard.tsx` — "Neuer Fall" Button**

Aktuell (Zeile 279):
```tsx
<Button onClick={...} size="sm">
  <Plus /> Neuer Fall
</Button>
```

Neu (CI-Standard runder Glasbutton):
```tsx
<Button variant="glass" size="icon-round" onClick={...}>
  <Plus className="h-4 w-4" />
</Button>
```

**2. `FMFinanzierungsakte.tsx` — Widget-Leiste + Header**

- **Zeilen 217-243 loeschen**: Die gesamte `existingCases`-WidgetGrid mit den Kacheln "00000000" und "Aktuelle Akte" wird entfernt
- **Zeilen 246-273 ersetzen**: Der eigene Header-div (ArrowLeft + h2 + Split-View-Toggle) wird durch `ModulePageHeader` ersetzt:

```tsx
<ModulePageHeader
  title="Finanzierungsakte"
  description="Neue Akte manuell befuellen und erstellen"
  actions={
    <div className="flex items-center gap-2">
      {/* Split-View Toggle */}
      <div className="hidden lg:flex items-center gap-1 border rounded-lg p-0.5">
        <Button variant={!splitView ? 'default' : 'ghost'} size="sm" ...>Standard</Button>
        <Button variant={splitView ? 'default' : 'ghost'} size="sm" ...>Split-View</Button>
      </div>
      {/* Runder Plus-Button fuer neue Akte */}
      <Button variant="glass" size="icon-round" onClick={...}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  }
/>
```

### Technische Dateien

| Datei | Aktion |
|-------|--------|
| `src/pages/portal/finanzierungsmanager/FMDashboard.tsx` | EDIT — "Neuer Fall" Button auf runden Glasbutton umstellen |
| `src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx` | EDIT — Widget-Leiste (existingCases) entfernen, Header durch ModulePageHeader ersetzen, ArrowLeft entfernen |

### Ergebnis

- Dashboard: Sauberer runder Plus-Button oben rechts (CI-konform)
- Finanzierungsakte: Kein verwirrender Akten-Balken mehr oben, kein Zurueck-Pfeil, stattdessen sauberer ModulePageHeader mit Split-View-Toggle und Plus-Button
- Konsistentes Erscheinungsbild wie alle anderen Manager-Module

