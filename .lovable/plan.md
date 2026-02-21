
# DMS Komplett-Ueberarbeitung: Intelligenz + Magic Intake

## Analyse-Ergebnis

### Intelligenz-Seite (aktueller Zustand)
- Layout ist unbalanciert: StorageExtractionCard nimmt 2/3 der Breite ein, Posteingangs-Auslesung ist daneben gequetscht
- Speicherplatz-Karte queried `plans`-Tabelle die vermutlich leer ist (zeigt "Free" mit 0% belegt)
- DataEngineInfoCard ist ein Entwickler-Statusboard (Phase 1/Phase 2, technische Voraussetzungen) -- das gehoert nicht auf eine Nutzerseite
- PostserviceCard ist hier fehl am Platz -- hat nichts mit "Intelligenz" zu tun
- Gesamteindruck: zusammengewuerfelt, keine klare Hierarchie

### Magic Intake Seite (aktueller Zustand)
- Hero-Section und StorageExtractionCard wiederholen dieselben Value Props ("Kein manuelles Hochladen", "Volle Kostenkontrolle")
- Die Seite hat keinen PageShell/ModulePageHeader -- weicht vom Standard aller anderen Tabs ab
- IntakePricingInfo zeigt statische Preise (0,25 EUR) -- das ist UI-Copy, kein Verstoss gegen Demo-Data-Governance
- Checklist und Letzte Uploads kommen korrekt aus der Datenbank

### Tab-uebergreifende Redundanz
- StorageExtractionCard erscheint auf: Intelligenz + Posteingang + Magic Intake (3x!)
- PosteingangAuslesungCard erscheint auf: Intelligenz + Posteingang (2x)
- PostserviceCard erscheint auf: Intelligenz + Posteingang (2x)
- Das verwirrt den Nutzer: wo soll er was konfigurieren?

---

## Verbesserungsplan

### Massnahme 1: Klare Zustaendigkeit pro Tab

Jeder Tab bekommt eine klare Rolle -- keine Komponenten-Dopplung mehr:

| Tab | Rolle | Exklusive Inhalte |
|---|---|---|
| **Intelligenz** | Zentrale Steuerung aller KI-Features | OCR-Toggle, Datenraum-Scan, Kosten-Uebersicht |
| **Dateien** | File-Manager | Miller-Column UI (bleibt) |
| **Posteingang** | E-Mail-Inbox | Tabelle + Vertrag/Adresse + Upload-Link |
| **Sortieren** | Sortierregeln | Kacheln + Regel-Editor (bleibt) |
| **Magic Intake** | Manueller Upload mit KI | Entity-Picker + Upload + Checkliste |

### Massnahme 2: Intelligenz-Seite komplett neu strukturieren

Aktuell: Zusammengewuerfeltes Widget-Grid ohne Hierarchie.

Neu: Vertikale Blockstruktur mit klaren Sektionen.

```text
+-- PageShell + ModulePageHeader --+
|                                  |
|  BLOCK 1: KI-Steuerung          |
|  ┌──────────────────────────────┐|
|  │ PosteingangAuslesungCard     ││
|  │ (Toggle + Pipeline)          ││
|  └──────────────────────────────┘|
|                                  |
|  BLOCK 2: Datenraum-Scan        |
|  ┌──────────────────────────────┐|
|  │ StorageExtractionCard        ││
|  │ (Scan/Angebot/Freigabe)      ││
|  └──────────────────────────────┘|
|                                  |
|  BLOCK 3: Speicher & Kosten     |
|  ┌──────────┐  ┌───────────────┐|
|  │ Speicher  │  │ Kostenmodell  ││
|  │ Plan/Usage│  │ Credits/Preise││
|  └──────────┘  └───────────────┘|
|                                  |
|  BLOCK 4: Postservice           |
|  ┌──────────────────────────────┐|
|  │ PostserviceCard (Vertrag)    ││
|  └──────────────────────────────┘|
+----------------------------------+
```

Was entfernt wird:
- **DataEngineInfoCard** -- Entwickler-Roadmap gehoert nicht auf die Nutzerseite. Die Info ist intern relevant aber kein User-Feature.

### Massnahme 3: Magic Intake entschlacken

Aenderungen:
1. **PageShell + ModulePageHeader** hinzufuegen (Konsistenz mit allen anderen Tabs)
2. **StorageExtractionCard entfernen** -- die ist bereits auf der Intelligenz-Seite. Stattdessen ein kompakter Hinweis-Link: "Fuer automatische Massenverarbeitung: Intelligenz-Tab"
3. **Hero-Section kuerzen** -- die 3 Value-Proposition-Karten werden zu einem einzeiligen Infotext zusammengefasst. Die Schrittleiste "So funktioniert's" bleibt
4. **IntakePricingInfo** wird zu einem kompakten Einzeiler im Hero oder im Upload-Bereich (statt eines eigenen Blocks)

Neue Block-Reihenfolge:
```text
+-- PageShell + ModulePageHeader ----+
|                                    |
|  BLOCK 1: Schrittleiste            |
|  "So funktioniert's" (4 Steps)     |
|                                    |
|  BLOCK 2: Entity-Picker + Upload   |
|  Kategorie waehlen > Objekt > Drop |
|  (Kostenhinweis: 1 Credit/Dok)     |
|                                    |
|  BLOCK 3: Dokument-Checkliste      |
|  (Live-Fortschritt aus DB)         |
|                                    |
|  BLOCK 4: Letzte Uploads           |
|  (aus documents-Tabelle)           |
|                                    |
|  Kompakt-Link: "Automatisch alle   |
|  Dokumente verarbeiten? -> Intel." |
+------------------------------------+
```

### Massnahme 4: Posteingang-Tab bereinigen

Die Karten-Grid am Ende des Posteingangs (PosteingangAuslesungCard, StorageExtractionCard, PostserviceCard) wird entfernt. Diese Steuerungselemente gehoeren auf die Intelligenz-Seite.

Der Posteingang behaelt:
- Die Inbox-Tabelle (immer sichtbar)
- Die Upload-E-Mail-Karte (bei aktivem Vertrag) / Aktivierungs-CTA (ohne Vertrag)
- Kein Widget-Grid am Ende

---

## Technische Aenderungen

### Dateien die geaendert werden

| Datei | Aenderung |
|---|---|
| `src/pages/portal/dms/EinstellungenTab.tsx` | Komplettes Refactoring: vertikale Block-Struktur, DataEngineInfoCard entfernt, Speicher+Kosten nebeneinander |
| `src/pages/portal/dms/IntakeTab.tsx` | PageShell+Header, StorageExtractionCard raus, Hero kuerzen, Pricing inline |
| `src/components/dms/IntakeHowItWorks.tsx` | Nur noch Schrittleiste, Value Props und Hero-Block entfernt |
| `src/pages/portal/dms/PosteingangTab.tsx` | Widget-Grid am Ende entfernt (3 Karten raus) |

### Dateien die NICHT geaendert werden
- `StorageExtractionCard.tsx` -- wird weiterverwendet auf Intelligenz-Seite
- `PosteingangAuslesungCard.tsx` -- wird weiterverwendet auf Intelligenz-Seite
- `PostserviceCard.tsx` -- wird weiterverwendet auf Intelligenz-Seite
- `IntakeUploadZone.tsx`, `IntakeEntityPicker.tsx`, `IntakeChecklistGrid.tsx` -- funktionieren korrekt
- Kein Routing, keine Manifests, kein DB-Schema betroffen

### Was entfernt wird
- `DataEngineInfoCard` wird nicht mehr importiert (Komponente bleibt fuer spaetere interne Nutzung)
- `IntakePricingInfo.tsx` wird aufgeloest -- der Inhalt wird als Einzeiler in den Upload-Block integriert
