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

## Modul-Referenz

| MOD | Name | Master-Route | 4-Tile Pattern |
|-----|------|--------------|----------------|
| MOD-01 | Stammdaten | `/portal/stammdaten` | Profil, Firma, Abrechnung, Sicherheit |
| MOD-02 | KI Office | `/portal/office` | E-Mail, Brief, Kontakte, Kalender |
| MOD-03 | DMS | `/portal/dms` | Storage, Posteingang, Sortieren, Einstellungen |
| MOD-04 | Immobilien | `/portal/immobilien` | Kontexte, Portfolio, Sanierung, Bewertung |
| MOD-05 | MSV | `/portal/msv` | Objekte, Mieteingang, Vermietung, Einstellungen |
| MOD-06 | Verkauf | `/portal/verkauf` | Listings, Aktivität, Transaktionen, Einstellungen |
| MOD-07 | Finanzierung | `/portal/finanzierung` | Vorgänge, Readiness, Export, Partner |
| MOD-08 | Investments | `/portal/investments` | Suche, Favoriten, Simulation, Einstellungen |
| MOD-09 | Vertriebspartner | `/portal/vertriebspartner` | Dashboard, Katalog, Beratung, Netzwerk |
| MOD-10 | Leadgenerierung | `/portal/leads` | Inbox, Pipeline, Kampagnen, Statistiken |

---

*Dieses Dokument ist verbindlich für alle Entwicklungsaktivitäten.*
