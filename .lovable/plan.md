
# Menuelabels in MOD-18 Finanzanalyse umbenennen

Drei Sub-Tab-Titel in `src/manifests/routesManifest.ts` werden gekuerzt:

| Bisheriger Titel | Neuer Titel |
|-----------------|-------------|
| Sachversicherungen | Versicherungen |
| Vorsorgevertraege | Vorsorge |
| Abonnements | Abos |

Die Aenderungen betreffen **zwei Stellen** in der Datei (Zeilen 397-399 und 503-505), da MOD-18 offenbar doppelt referenziert wird (Finanzmanager + Finanzanalyse).

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/routesManifest.ts` | Titel-Strings an 6 Stellen anpassen |
