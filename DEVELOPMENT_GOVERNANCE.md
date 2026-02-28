# DEVELOPMENT GOVERNANCE

**Projekt:** System of a Town (SoT)  
**Version:** v1.0 FROZEN  
**Datum:** 2026-01-27

---

## Eiserne Regeln

### Regel 1: Zone 2 ist der Master
Das Entwicklungsportal (`/portal/*`) ist die **einzige Source of Truth** für:
- UI-Komponenten und Layouts
- Feature-Implementierungen
- Datenflüsse und Business-Logik
- Edge Functions und API-Patterns

### Regel 2: Explizite Besprechung
Änderungen am Master-Portal erfolgen **ausschließlich** nach:
1. Expliziter Diskussion im Chat
2. Erstellung eines strukturierten Plans
3. Freigabe durch den Projektverantwortlichen

**Keine autonomen Änderungen. Keine Annahmen. Keine Abkürzungen.**

### Regel 3: Zone 1 = Dokumentation
Zone 1 (Admin-Bereich `/admin/*`) dient als:
- Oversight und Monitoring des Master-Portals
- Dokumentation aller implementierten Patterns
- Registry für Tiles, APIs und Integrationen

**Zone 1 verändert niemals Zone 2. Der Datenfluss ist unidirektional.**

---

## Hierarchie

```
MASTER (Zone 2: /portal/*)
    │
    ▼ [Dokumentation]
OVERSIGHT (Zone 1: /admin/*)
    │
    ▼ [Read-Only]
EXTERNAL (Zone 3: Websites)
```

---

## Prüfpflichten

Bei jeder Feature-Implementierung:

| Schritt | Beschreibung | Verantwortlich |
|---------|--------------|----------------|
| 1 | Feature in Zone 2 implementieren | Nach Freigabe |
| 2 | Tile Catalog in Zone 1 aktualisieren | Automatisch |
| 3 | Integration Registry prüfen | Bei API-Nutzung |
| 4 | Dokumentation synchronisieren | Nach Abschluss |

---

## Verbotene Aktionen

- ❌ Autonome Änderungen ohne Chat-Diskussion
- ❌ Zone 1 als Entwicklungsumgebung nutzen
- ❌ Hardcoded Daten in Zone 1 statt DB-Anbindung
- ❌ Dokumentation ohne Master-Implementierung
- ❌ API-Registrierung ohne Edge Function

---

## Modul-Referenz (Stand: 2026-02-28)

> Tile-Anzahl variiert je Modul. Die alleinige SSOT ist `src/manifests/routesManifest.ts`.

| MOD | Name | Master-Route | Tiles | Status |
|-----|------|--------------|-------|--------|
| MOD-00 | Dashboard | `/portal/dashboard` | 0 | aktiv |
| MOD-01 | Stammdaten | `/portal/stammdaten` | 5 | aktiv |
| MOD-02 | KI Office | `/portal/office` | 5 | aktiv |
| MOD-03 | DMS | `/portal/dms` | 4 | aktiv |
| MOD-04 | Immobilien | `/portal/immobilien` | 7 | aktiv |
| MOD-05 | Pets | `/portal/pets` | 5 | aktiv |
| MOD-06 | Verkauf | `/portal/verkauf` | 6 | aktiv |
| MOD-07 | Finanzierung | `/portal/finanzierung` | 5 | aktiv |
| MOD-08 | Investment-Suche | `/portal/investments` | 6 | aktiv |
| MOD-09 | Immomanager | `/portal/vertriebspartner` | 5 | aktiv |
| MOD-10 | Lead Manager | `/portal/lead-manager` | 6 | aktiv |
| MOD-11 | Finanzierungsmanager | `/portal/finanzierungsmanager` | 7 | aktiv (Rolle) |
| MOD-12 | Akquisemanager | `/portal/akquise-manager` | 6 | aktiv |
| MOD-13 | Projektmanager | `/portal/projekte` | 6 | aktiv |
| MOD-14 | Communication Pro | `/portal/communication-pro` | 4 | aktiv |
| MOD-15 | Fortbildung | `/portal/fortbildung` | 4 | aktiv |
| MOD-16 | Shop | `/portal/services` | 4 | aktiv |
| MOD-17 | Car-Management | `/portal/cars` | 4 | aktiv |
| MOD-18 | Finanzen | `/portal/finanzanalyse` | 5 | aktiv |
| MOD-19 | Photovoltaik | `/portal/photovoltaik` | 5 | aktiv |
| MOD-20 | Miety | `/portal/miety` | 6 | aktiv |
| MOD-21 | KI-Browser | `/portal/ki-browser` | 5 | hidden (Beta) |
| MOD-22 | Pet Manager | `/portal/petmanager` | 5 | aktiv |

---

*Dieses Dokument ist verbindlich für alle Entwicklungsaktivitäten.*
