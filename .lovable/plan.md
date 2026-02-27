

## Analyse: Anbieter-Daten im Projekt "Menden Living"

### Ist-Zustand

Das Projekt "Menden Living" (BT-2026-001) hat folgendes Problem:

```text
intake_data.developer         = "Kalo Eisenach GmbH"     ← KI hat den Namen extrahiert
developer_context_id          → "Meine Gesellschaft"      ← Generischer Fallback wurde verknüpft
developer_contexts Felder     = alle leer (kein Street, PLZ, GF, HRB, USt-ID)
```

**Ursache:** Beim Erstellen des Projekts wurde der Developer-Name "Kalo Eisenach GmbH" zwar im Exposé erkannt, aber der `reviewedData.developer`-Wert wurde nicht korrekt an die Create-Funktion übergeben, sodass der Fallback-Pfad ("Meine Gesellschaft") griff. Außerdem wurden die Impressum-Felder (Rechtsform, GF, Straße, HRB, USt-ID) bei der Erstextraktion nicht mit Tool-Calling extrahiert — das wurde erst nachträglich ergänzt.

### Was bereits automatisch funktioniert (für NEUE Projekte)

Die `sot-project-intake` Funktion (Zeile 657-726) macht bei **neuen** Projekten bereits:
1. Extrahiert Developer-Name + Impressum-Felder aus dem Exposé via Gemini Tool-Calling
2. Sucht bestehenden `developer_context` per Name-Match
3. Ergänzt leere Felder (Safe Update) oder erstellt neuen Kontext
4. Verknüpft mit `dev_projects.developer_context_id`

→ **Zukünftige Projekte werden automatisch befüllt.** Das funktioniert korrekt.

### Was fehlt: Re-Analyse für bestehende Projekte

Es gibt aktuell keinen Button/Prozess, um für ein **bereits angelegtes** Projekt die Exposé-Daten erneut zu analysieren und den Developer Context nachträglich zu befüllen.

### Plan

**1. "Anbieter aus Exposé laden" Button im ProjectDataSheet**
- Neuer Button im Anbieter/Impressum-Bereich des Datenblatts
- Liest den gespeicherten Exposé-Pfad aus `intake_data.files.expose`
- Ruft `sot-project-intake` im `analyze`-Modus auf
- Extrahierte Developer-Felder werden direkt in die Formular-State-Variablen geschrieben
- User sieht die Daten sofort, kann korrigieren, und speichert mit dem bestehenden "Speichern"-Button

**2. Zusätzlich: Developer Context korrigieren**
- Wenn der aktuelle Context "Meine Gesellschaft" heißt und der Exposé-Name anders ist → Context umbenennen auf den extrahierten Namen
- Alle Impressum-Felder (legal_form, managing_director, street, postal_code, city, hrb_number, ust_id) aus der KI-Antwort übernehmen

**3. Sofort-Fix für "Menden Living"**
- Der Button löst die Re-Analyse aus
- Alternativ: Ich kann die Felder auch direkt per DB-Update setzen, falls die Daten bekannt sind

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/projekte/ProjectDataSheet.tsx` | Button "Anbieter aus Exposé laden" + Handler |
| `supabase/functions/sot-project-intake/index.ts` | Keine Änderung nötig — `analyze` Mode existiert bereits |

### Technischer Ablauf

```text
User klickt "Anbieter aus Exposé laden"
  → Liest intake_data.files.expose aus fullProject
  → supabase.functions.invoke('sot-project-intake', { mode: 'analyze', storagePaths: { expose } })
  → Response enthält extractedData.developer, developerLegalForm, etc.
  → Setzt devName, devLegalForm, devStreet, ... in State
  → User prüft → klickt "Speichern" → developer_contexts wird aktualisiert
```

