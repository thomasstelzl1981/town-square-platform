

## Tab-Reihenfolge im Finanzanalyse-Modul aendern

### Aktuelle Reihenfolge

1. Uebersicht
2. Investment
3. Versicherungen
4. Vorsorge
5. Krankenversicherung
6. Abonnements
7. Testament & Vollmacht
8. Darlehen

### Neue Reihenfolge

1. Uebersicht
2. Investment
3. Krankenversicherung
4. Versicherungen
5. Vorsorge
6. Darlehen
7. Abonnements
8. Testament & Vollmacht

### Technische Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/routesManifest.ts` (Zeilen 501-509) | Tiles-Array in die neue Reihenfolge umsortieren |
| `src/pages/portal/FinanzanalysePage.tsx` | Keine Aenderung noetig -- die Routes sind pfadbasiert und reihenfolge-unabhaengig |

Es wird ausschliesslich die Reihenfolge im `tiles`-Array geaendert. Pfade, Komponenten und Titel bleiben identisch.
