

# Beschriftung "Tax" zu "Steuer" aendern

## Aenderung

In `src/manifests/routesManifest.ts`, Zeile 252: Den Sub-Tab-Titel von `"Tax"` auf `"Steuer"` aendern.

```
// Vorher:
{ path: "verwaltung", component: "VerwaltungTab", title: "Tax" }

// Nachher:
{ path: "verwaltung", component: "VerwaltungTab", title: "Steuer" }
```

## Technische Details

- Betrifft nur eine einzige Zeile in `src/manifests/routesManifest.ts` (Zeile 252)
- Die Navigation-Tabs fuer MOD-04 Immobilien lesen den Titel direkt aus dem Manifest — keine weiteren Dateien betroffen
- Der Kommentar in Zeile 251 ("Tax: Vermietung + Verwaltung — Anlage V Steuererklaerung") kann optional ebenfalls angepasst werden

