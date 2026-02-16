

# Area-Reorganisation: Module verschieben und Promo-Widgets entfernen

## Zusammenfassung

Drei Aenderungen an der Navigationsstruktur:

### 1. Promo-Widgets komplett entfernen

Die `AreaPromoCard`-Komponente wird aus der `AreaOverviewPage` entfernt. Die Datei `areaPromoContent.ts` und die zugehoerigen Promo-Bilder bleiben vorerst im Code (kein toter Import mehr), koennen spaeter aufgeraeumt werden.

### 2. Modul-Verschiebungen

```text
VORHER                              NACHHER
─────────────────────────────────    ─────────────────────────────────
Client (missions)                   Client (missions)
  MOD-18, MOD-02, MOD-04,            MOD-18, MOD-02, MOD-04,
  MOD-07, MOD-06, MOD-08             MOD-07, MOD-06, MOD-08
                                      (unveraendert)

Manager (operations)                Manager (operations)
  MOD-13, MOD-09, MOD-11,            MOD-13, MOD-09, MOD-11,
  MOD-12, MOD-10                      MOD-12, MOD-10, MOD-14
                                      (+Kommunikation Pro)

Service (services)                  Service (services)
  MOD-14, MOD-15, MOD-05,            MOD-15, MOD-05, MOD-16,
  MOD-16                              MOD-17, MOD-19
                                      (-KommPro, +Fahrzeuge, +PV)

Base (base)                         Base (base)
  MOD-03, MOD-17, MOD-19,            MOD-03, MOD-01
  MOD-01                              (-Fahrzeuge, -PV)
```

### 3. Area-Beschreibungen aktualisieren

Die Untertitel auf den Uebersichtsseiten werden an die neue Zusammensetzung angepasst.

## Technische Aenderungen

| Datei | Aenderung |
|---|---|
| `src/manifests/areaConfig.ts` | Module-Arrays in allen 4 Areas aktualisieren |
| `src/pages/portal/AreaOverviewPage.tsx` | AreaPromoCard-Import und -Rendering entfernen, areaDescriptions aktualisieren |

Keine Route-Aenderungen noetig -- die Routen bleiben identisch, nur die Gruppierung aendert sich.

