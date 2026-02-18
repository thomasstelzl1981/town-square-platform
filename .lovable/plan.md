

## Neuanlage-Buttons auf Mobile entfernen

### Ansatz

Statt in 20+ einzelnen Dateien die Buttons zu entfernen, gibt es **eine zentrale Stelle**: die `ModulePageHeader`-Komponente. Alle runden Glas-Buttons (Plus-Icons) fuer Neuanlagen werden ueber die `actions`-Prop dieser Komponente gerendert. Wenn wir dort die `actions` auf Mobile ausblenden, verschwinden alle Neuanlage-Buttons auf einen Schlag.

Zusaetzlich gibt es einige wenige Stellen, die bereits `DesktopOnly` verwenden (z.B. FinanceRequestWidgets, SimulationTab, PortfolioTab). Diese sind bereits korrekt und brauchen keine Aenderung.

### Technische Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/components/shared/ModulePageHeader.tsx` | Die `actions`-Sektion in eine `DesktopOnly`-Komponente wrappen. Damit werden alle Neuanlage-Buttons auf Mobile automatisch ausgeblendet. |

### Konkret

In `ModulePageHeader.tsx` wird Zeile 27 geaendert von:

```tsx
{actions && <div className="flex items-center gap-2 ...">
  {actions}
</div>}
```

zu:

```tsx
{actions && (
  <DesktopOnly>
    <div className="flex items-center gap-2 ...">
      {actions}
    </div>
  </DesktopOnly>
)}
```

### Auswirkung

Alle Module, die `ModulePageHeader` mit `actions` verwenden, verlieren auf Mobile automatisch den Neuanlage-Button:
- Finanzanalyse (Investment, Vorsorge, Sachversicherungen, Abonnements, Krankenversicherung)
- Fahrzeuge (Autos, Bikes)
- Pet Manager (Kunden, Personal, Pension, Leistungen)
- Projekte (Kontexte)
- Miety (Uebersicht)
- und alle weiteren Module

Das ist eine einzige Zeilen-Aenderung in einer einzigen Datei.
