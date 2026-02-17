
## Audit und Vereinheitlichung: Add-Buttons fuer Entitaeten

### Problem
Die "Hinzufuegen"-Buttons fuer Entitaeten (Personen, Fahrzeuge, Tiere, Zuhause, Gesellschaften) sehen jeweils unterschiedlich aus. Manche sind Text-Buttons, manche Icon-Buttons, verschiedene Varianten und Groessen.

### Regel
- **Entitaeten** (Personen, Tiere, Fahrzeuge, Zuhause, Gesellschaften): Runder Glass-Button (`variant="glass" size="icon-round"`) mit Plus-Icon im `ModulePageHeader actions`-Prop
- **Vorgaenge** (Versicherungen, Sparplaene, Abos, Darlehen, Vorsorge): Bleiben wie sie sind — bereits als `icon-round` Plus-Buttons korrekt implementiert

### Betroffene Stellen (7 Dateien)

| Datei | Aktuell | Aenderung |
|-------|---------|-----------|
| `src/pages/portal/pets/PetsMeineTiere.tsx` | `size="sm"` Text-Button AUSSERHALB von `actions`, in manuellem flex-Layout | Button in `ModulePageHeader actions` verschieben, `variant="glass" size="icon-round"` |
| `src/components/portal/cars/CarsAutos.tsx` | Default-Variant Text-Button "Fahrzeug hinzufuegen" | Umstellen auf `variant="glass" size="icon-round"` nur Plus-Icon |
| `src/components/portal/cars/CarsBikes.tsx` | Default-Variant Text-Button "Bike hinzufuegen" | Umstellen auf `variant="glass" size="icon-round"` nur Plus-Icon |
| `src/components/portal/cars/CarsFahrzeuge.tsx` | Default-Variant Text-Button in DesktopOnly | Umstellen auf `variant="glass" size="icon-round"` nur Plus-Icon |
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | `size="icon-round"` OHNE variant (default/primary) | `variant="glass"` ergaenzen |
| `src/pages/portal/miety/tiles/UebersichtTile.tsx` | `size="sm" variant="outline"` Text-Button "Weiteres Zuhause" | Umstellen auf `variant="glass" size="icon-round"` nur Plus-Icon |
| `src/pages/portal/projekte/KontexteTab.tsx` | Default-Variant Text-Button "Neue Gesellschaft" | Umstellen auf `variant="glass" size="icon-round"` nur Plus-Icon |

### Ziel-Pattern (einheitlich)

```text
<ModulePageHeader
  title="..."
  description="..."
  actions={
    <Button variant="glass" size="icon-round" onClick={...}>
      <Plus className="h-5 w-5" />
    </Button>
  }
/>
```

### Vorgaenge-Buttons (KEINE Aenderung noetig)
Diese sind bereits korrekt als `icon-round` Plus-Buttons:
- SachversicherungenTab.tsx (Versicherungsvertrag)
- InvestmentTab.tsx (Sparplan)
- AbonnementsTab.tsx (Abonnement)
- DarlehenTab.tsx (Darlehen)
- VorsorgeTab.tsx (Vorsorgevertrag)

Einzige Ergaenzung: Auch hier `variant="glass"` setzen fuer visuelle Konsistenz (aktuell default/primary).

### Zusammenfassung
- 7 Dateien fuer Entitaet-Buttons: Layout-Fix + `variant="glass" size="icon-round"`
- 5 Dateien fuer Vorgang-Buttons: Nur `variant="glass"` ergaenzen
- Gesamt: 12 Dateien, rein visuelle Aenderungen
