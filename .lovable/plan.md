
# Daten-Architektur bereinigen: Demo-Mandat + Leere Mandatsakte

## Ist-Zustand (Analyse)

Das Demo-Mandat "Familie Investorius (Demo)" (`ACQ-2026-00001`) liegt bereits korrekt in der Datenbank — es ist kein hardcodierter Wert im Code. Es hat ein verknuepftes Objekt ("Rotklinkeranlage") im Objekteingang.

**Probleme identifiziert:**

1. **ObjekteingangList**: Eine separate Spezial-Query (Zeilen 48-60) holt Mandate per `tenant_id` zusaetzlich zur normalen Manager-Query und merged sie. Das fuehrt zu doppelten/falschen Anzeigen und der falschen Beschriftung.

2. **AkquiseMandate (Mandate-Seite)**: Die Widget-Leiste oben zeigt nur existierende Mandate. Es fehlt eine **Platzhalter-Kachel "Neues Mandat"** links, die immer sichtbar ist und zur leeren Erfassungs-Ansicht fuehrt.

3. **AkquiseDashboard**: Gleiches Thema — die "Neues Mandat"-Kachel fehlt im Widget-Grid.

## Aenderungen

### 1. `ObjekteingangList.tsx` — Spezial-Query entfernen

Die redundante Demo-Query (Zeilen 48-69) wird entfernt. Stattdessen wird nur die Standard-Query `useAcqMandatesActive()` plus `useAcqMandatesForManager()` verwendet, die alle Mandate des Managers korrekt laedt — inkl. des Demo-Mandats, da es dem User als Manager zugewiesen ist.

| Entfernt | Ersetzt durch |
|----------|--------------|
| `useQuery(['acq-mandates-demo'])` mit hardcoded `tenant_id` | Standard `useAcqMandatesForManager()` (laedt alle Mandate des Users) |
| `useMemo` Merge-Logik | Direkte Verwendung der Hook-Daten |

### 2. `AkquiseMandate.tsx` — "Neues Mandat"-Kachel im Widget-Grid

In der Mandate-Uebersicht oben (Zeilen 492-506) wird links **immer eine Platzhalter-Kachel** "Neues Mandat" angezeigt. Klick darauf scrollt zur leeren Erfassungs-Ansicht (oder setzt den State zurueck).

```text
+------------------+------------------+------------------+
| + NEUES MANDAT   | ACQ-2026-00001   | (weitere...)     |
| (Platzhalter)    | Fam. Investorius |                  |
+------------------+------------------+------------------+
```

- Die Kachel nutzt das bestehende `MandateCaseCardPlaceholder`-Design, aber mit anklickbarem Verhalten
- Klick setzt `activeMandateId = null` und scrollt/fokussiert die Erfassungskacheln

### 3. `AkquiseDashboard.tsx` — "Neues Mandat"-Kachel

Im Dashboard-Grid unter "Aktive Mandate" wird ebenfalls immer eine "Neues Mandat"-Platzhalter-Kachel angezeigt (als erste Kachel), die zur Mandate-Erstellungsseite navigiert.

### 4. `MandateCaseCard.tsx` — Neue Variante `MandateCaseCardNew`

Neue exportierte Komponente: Eine klickbare "Plus"-Kachel mit Icon und Text "Neues Mandat", die das gleiche aspect-square Design nutzt wie bestehende Mandate-Karten. Wird in Dashboard, Mandate-Seite und ggf. MandateDetail verwendet.

## Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| `ObjekteingangList.tsx` | Demo-Spezial-Query + Merge entfernen, nur `useAcqMandatesForManager()` nutzen |
| `MandateCaseCard.tsx` | Neue Komponente `MandateCaseCardNew` (Plus-Kachel) |
| `AkquiseMandate.tsx` | "Neues Mandat"-Kachel immer links im Grid anzeigen |
| `AkquiseDashboard.tsx` | "Neues Mandat"-Kachel im Aktive-Mandate-Grid |

## Daten-Sicherheit

Das Demo-Mandat `ACQ-2026-00001` bleibt unangetastet in der Datenbank. Es wird weiterhin korrekt angezeigt, da es dem eingeloggten User als Manager zugewiesen ist. Keine Migration, kein Seed-Script noetig.
