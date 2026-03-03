

# Pet Manager (MOD-22) — Audit-Ergebnis und Wiederherstellungsplan

## Diagnose: Was ist passiert?

Ich habe das gesamte MOD-22 durchleuchtet. Hier ist die gute Nachricht zuerst: **Der Code ist nicht kaputt und es sind keine hardcoded Daten im eigentlichen Sinne.** Die Daten kommen aus der Datenbank. Das Problem liegt woanders:

### Ist-Zustand (verifiziert)

1. **Datenbank funktioniert**: 4 Services existieren in `pet_services` (Hundesalon 65€, Gassi 25€, Tagesbetreuung 45€, Urlaubsbetreuung 56€). Alle haben Demo-IDs (`d0000000-*`), sind aber echte DB-Eintraege.

2. **API-Aufrufe funktionieren**: Die Network-Requests zeigen, dass `pet_services`, `pet_providers`, `pet_service_cases` alle korrekt geladen werden (Status 200).

3. **Preise sind editierbar** — aber nur im Tab "Leistungen" (`/portal/petmanager/leistungen`). Dort gibt es ein Dialog-CRUD mit Preis-Eingabe (€-Feld mit Cent-Konvertierung). Das funktioniert technisch.

4. **Das Problem**: Der Tab "Leistungen" ist **nicht in der Sub-Navigation sichtbar** (fehlt im `routesManifest.ts` als Tile!). Die Route existiert (`PetManagerPage.tsx` Zeile 36), aber es gibt kein Tile dafuer:

```text
routesManifest.ts MOD-22 Tiles:
  ✅ dashboard, profil, pension, services, mitarbeiter
  ✅ buchungen, kalender, kunden, finanzen
  ❌ "leistungen" FEHLT als Tile!
```

Das heisst: Man kann `/portal/petmanager/leistungen` manuell aufrufen, aber es gibt keinen sichtbaren Link dahin.

5. **Weiteres Problem**: Alle 4 Services haben Demo-IDs (`d0000000-*`). Wenn Demo-Modus AUS ist, filtert `isDemoId()` diese potentiell weg (je nach Page-Implementierung). In `PMLeistungen.tsx` wird allerdings kein Demo-Filter angewandt — dort werden immer alle Services angezeigt.

6. **PLC-Engine funktioniert**: 2 echte `pet_service_cases` existieren mit korrekten Preisen (22500 Cents = 225€).

## Was die 3 Stunden produziert haben

Die PLC-Engine (`src/engines/plc/`), `pet_service_cases`, `pet_lifecycle_events`, die Z3-Proxy-Architektur, das Stripe-Payment-Flow — das alles existiert und funktioniert. Die Buchungen in `pet_service_cases` beweisen das. Das Problem ist rein **UI/Navigation**: Der Preis-Editor ist da, aber versteckt.

## Wiederherstellungsplan (3 Schritte)

### Schritt 1: "Leistungen"-Tile im routesManifest sichtbar machen
In `src/manifests/routesManifest.ts` bei MOD-22 den Tile `leistungen` hinzufuegen (zwischen `services` und `mitarbeiter`).

### Schritt 2: PMLeistungen CI-konform machen
Die Seite `PMLeistungen.tsx` nutzt bereits `ModulePageHeader`, `PageShell`, und CRUD-Dialog. Pruefen, ob sie dem Design Manifest (DESIGN-Tokens, Card-Patterns) entspricht — und ggf. angleichen.

### Schritt 3: PMPersonal (Mitarbeiter-Tab) CI-Audit
Du hast gesagt, der Mitarbeiter-Tab ist "verhunzt" und ausserhalb eures CI. Ich wuerde `PMPersonal.tsx` pruefen und an den Design Manifest Standard anpassen (PageShell, ModulePageHeader, DESIGN.CARD, DESIGN.LIST Tokens).

## Betroffene Dateien (alle MOD-22, nicht frozen)

| Datei | Aenderung |
|---|---|
| `src/manifests/routesManifest.ts` | Tile `leistungen` in MOD-22 tiles einfuegen |
| `src/pages/portal/petmanager/PMLeistungen.tsx` | CI-Audit (Design-Tokens, ggf. Feinschliff) |
| `src/pages/portal/petmanager/PMPersonal.tsx` | CI-Audit (Design-Tokens, Layout-Korrektur) |

Keine DB-Migration noetig. Keine Engine-Aenderung noetig. Keine Freeze-Konflikte (MOD-22 ist unfrozen).

