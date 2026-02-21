

# Magic Intake Center — Erweiterter Plan mit Entity-Zuordnung

## Zusammenfassung

Ein neuer Tile "Magic Intake Center" unter MOD-03 (DMS) in Area Base. Kernidee: **Bevor** der Nutzer eine Datei hochlaedt, waehlt er in einem 2-stufigen Dropdown, **worum es geht** und **zu welchem konkreten Objekt** das Dokument gehoert. Dadurch weiss das System sofort: welcher Parser-Modus, welche Ziel-Tabelle, welche Entity-ID — oder ob ein neues Objekt angelegt werden muss.

---

## Block-Struktur der Seite

Die Seite `/portal/dms/intake` ist eine vertikale Scroll-Page (Golden Path konform):

```text
+----------------------------------------------------------+
| ModulePageHeader: "Magic Intake Center"                   |
| "Ihr digitaler Datenraum — alles an einem Ort"           |
+----------------------------------------------------------+
|                                                          |
| BLOCK 1: WIE FUNKTIONIERT ES? (3-Schritt-Erklaerung)    |
| [1. Kategorie waehlen] -> [2. Hochladen] -> [3. Fertig] |
|                                                          |
+----------------------------------------------------------+
|                                                          |
| BLOCK 2: ENTITY-PICKER + UPLOAD-ZONE (NEU)               |
|                                                          |
|  Schritt 1: "Um was geht es?"                            |
|  ┌──────────────────────────────────────────────┐        |
|  │  [Immobilie] [Fahrzeug] [PV-Anlage]          │        |
|  │  [Versicherung] [Vorsorge] [Haustier]        │        |
|  │  [Finanzierung] [Person] [Sonstiges]         │        |
|  └──────────────────────────────────────────────┘        |
|                                                          |
|  Schritt 2: "Zu welchem Objekt?"                         |
|  ┌──────────────────────────────────────────────┐        |
|  │  Select-Dropdown mit vorhandenen Entitaeten  │        |
|  │  z.B. "Musterstr. 12, Berlin" (Immobilie)    │        |
|  │       "BMW 320d (B-AB 1234)" (Fahrzeug)      │        |
|  │  ── Trennlinie ──                            │        |
|  │  "+ Neues Objekt anlegen"                     │        |
|  └──────────────────────────────────────────────┘        |
|                                                          |
|  Schritt 3: Upload-Dropzone (erst jetzt aktiv)           |
|  ┌──────────────────────────────────────────────┐        |
|  │  Drag & Drop oder Klick zum Hochladen        │        |
|  │  Erlaubte Dokumente fuer [Kategorie]:         │        |
|  │  "Kaufvertrag, Grundbuchauszug, Expose..."   │        |
|  │  (aus parserManifest.exampleDocuments)        │        |
|  └──────────────────────────────────────────────┘        |
|                                                          |
+----------------------------------------------------------+
|                                                          |
| BLOCK 3: AKTEN-CHECKLISTEN (aus storageManifest)         |
| Pro Kategorie: welche Dokumente fehlen noch?             |
| Immobilie "Musterstr. 12": 2 von 4 vorhanden ████░░     |
| Fahrzeug "BMW 320d": 1 von 3 vorhanden ██░░░░░░         |
|                                                          |
+----------------------------------------------------------+
|                                                          |
| BLOCK 4: DATENRAUM DIGITALISIEREN                        |
| StorageExtractionCard (bestehend, eingebettet)           |
|                                                          |
+----------------------------------------------------------+
|                                                          |
| BLOCK 5: LETZTE UPLOADS                                  |
| Status-Log: Datei | Kategorie | Objekt | Status         |
|                                                          |
+----------------------------------------------------------+
```

---

## Der 2-stufige Entity-Picker im Detail

### Schritt 1 — Kategorie waehlen

Kachel-Grid mit den Kategorien, die direkt aus `parserManifest.ts` kommen:

| Kachel | parseMode | entityType | Ziel-Tabelle |
|---|---|---|---|
| Immobilie | `immobilie` | `property` | `units` |
| Fahrzeug | `fahrzeugschein` | `vehicle` | `cars_vehicles` |
| PV-Anlage | `pv_anlage` | `pv_plant` | `pv_plants` |
| Versicherung | `versicherung` | `insurance` | `insurance_contracts` |
| Vorsorge | `vorsorge` | `vorsorge` | `vorsorge_contracts` |
| Haustier | `haustier` | `pet` | `pets` |
| Finanzierung | `finanzierung` | null | `finance_requests` |
| Person | `person` | `person` | `household_persons` |
| Sonstiges | `allgemein` | null | -- (nur DMS-Ablage) |

Jede Kachel zeigt das Icon aus `recordCardManifest.ts` und den Label-Text.

### Schritt 2 — Objekt waehlen oder neu anlegen

Nach Kategorie-Wahl laedt ein Select-Dropdown die vorhandenen Entitaeten des Nutzers aus der jeweiligen Ziel-Tabelle:

| Kategorie | DB-Query | Anzeige-Format |
|---|---|---|
| Immobilie | `units` WHERE tenant_id | "{address}, {city}" |
| Fahrzeug | `cars_vehicles` WHERE tenant_id | "{brand} {model} ({license_plate})" |
| PV-Anlage | `pv_plants` WHERE tenant_id | "{name} ({capacity_kwp} kWp)" |
| Versicherung | `insurance_contracts` WHERE tenant_id | "{provider_name} — {category}" |
| Vorsorge | `vorsorge_contracts` WHERE tenant_id | "{provider_name} — {contract_type}" |
| Haustier | `pets` WHERE tenant_id | "{name} ({species})" |
| Person | `household_persons` WHERE tenant_id | "{first_name} {last_name}" |
| Finanzierung | `finance_requests` WHERE tenant_id | "{bank_name} — {loan_amount}€" |

Am Ende jeder Liste steht immer die Option: **"+ Neues Objekt anlegen"**

### Was passiert bei "Neues Objekt"?

Wenn der Nutzer "Neues Objekt anlegen" waehlt:
1. Die Upload-Zone wird aktiviert **ohne entityId**
2. Nach dem Upload + KI-Parsing: `useDocumentIntake` erkennt, dass keine `entityId` vorhanden ist
3. Im Preview-Schritt wird dem Nutzer angeboten, das neue Objekt direkt aus den extrahierten Daten anzulegen
4. `confirmImport()` schreibt INSERT in die Ziel-Tabelle und gibt die neue ID zurueck
5. Das Dokument wird automatisch der neuen Entity zugeordnet

### Was passiert bei bestehendem Objekt?

1. `entityId` wird aus dem Select-Dropdown uebernommen
2. Upload + Parsing laeuft mit `entityId` -> Datei landet im richtigen DMS-Unterordner
3. Extrahierte Daten werden als UPDATE-Vorschlag angezeigt (Preview)
4. Nutzer kann bestehende Felder aktualisieren oder nur das Dokument ablegen

### Was passiert bei "Sonstiges"?

1. Kein Entity-Picker (Schritt 2 wird uebersprungen)
2. Upload in den allgemeinen Posteingang (`INBOX`)
3. KI versucht auto-detection (`parseMode: 'allgemein'`)
4. Nach Analyse: System schlaegt eine Kategorie + Entity-Zuordnung vor

---

## Technische Umsetzung

### Dateien die erstellt werden

| Datei | Zweck |
|---|---|
| `src/pages/portal/dms/IntakeTab.tsx` | Hauptseite "Magic Intake Center" |
| `src/components/dms/IntakeHowItWorks.tsx` | Block 1: 3-Schritt-Erklaerung |
| `src/components/dms/IntakeEntityPicker.tsx` | Block 2: 2-stufiger Kategorie- + Objekt-Picker |
| `src/components/dms/IntakeUploadZone.tsx` | Block 2: Upload-Dropzone (aktiviert nach Entity-Auswahl) |
| `src/components/dms/IntakeChecklistGrid.tsx` | Block 3: Checklisten mit Fortschritt pro Entity |
| `src/components/dms/IntakeRecentActivity.tsx` | Block 5: Letzte Upload-Aktivitaeten |
| `src/hooks/useIntakeEntityLoader.ts` | Hook: Laedt Entitaeten pro Kategorie aus der DB |

### Dateien die geaendert werden

| Datei | Aenderung |
|---|---|
| `src/manifests/routesManifest.ts` | Neuer Tile `intake` in MOD-03 mit Route |
| `src/pages/portal/dms/index.ts` | Export `IntakeTab` hinzufuegen |
| `src/pages/portal/DMSPage.tsx` | Route `intake` fuer IntakeTab hinzufuegen |

### Keine Aenderungen noetig fuer

- Edge Functions — bestehende `sot-document-parser` wird wiederverwendet
- `useDocumentIntake` — wird AS-IS aufgerufen, nur mit korrekten Parametern
- `useUniversalUpload` — wird intern von `useDocumentIntake` genutzt
- `parserManifest.ts` — liefert alle Kategorie-Daten (Labels, Modi, Beispieldokumente)
- `storageManifest.ts` — liefert `required_docs` fuer Checklisten
- `recordCardManifest.ts` — liefert Icons und DMS-Ordner-Definitionen

### Neuer Hook: `useIntakeEntityLoader`

```text
Eingabe:  parseMode (z.B. 'immobilie')
Aktion:   Schlaegt im parserManifest die targetTable nach
          Queried supabase.from(targetTable).select('id, [display_fields]')
          WHERE tenant_id = activeTenantId
Ausgabe:  Array<{ id: string, label: string }> + loading state
```

Dieser Hook kapselt die DB-Abfrage und das Display-Label-Mapping pro Kategorie.

### Datenfluss

```text
Nutzer waehlt "Immobilie"
  -> IntakeEntityPicker setzt parseMode = 'immobilie'
  -> useIntakeEntityLoader('immobilie') queried units-Tabelle
  -> Dropdown zeigt: "Musterstr. 12, Berlin" | "+ Neue Immobilie"

Nutzer waehlt "Musterstr. 12, Berlin" (entityId = "abc-123")
  -> IntakeUploadZone wird aktiv mit { parseMode: 'immobilie', entityId: 'abc-123' }
  -> Zeigt erlaubte Dokumente: "Kaufvertrag, Grundbuchauszug, ..."

Nutzer dropped PDF
  -> useDocumentIntake.intake(file, { parseMode: 'immobilie', entityId: 'abc-123' })
  -> Phase 1: Upload nach tenant-documents/{tenantId}/MOD_04/abc-123/datei.pdf
  -> Phase 2: sot-document-parser mit parseMode 'immobilie'
  -> Preview: Extrahierte Felder (Adresse, Kaufpreis, etc.)
  -> Confirm: UPDATE units SET ... WHERE id = 'abc-123'
  -> DMS: Datei in Unterordner '01_Grunddaten' einsortiert
```

### Reihenfolge der Implementierung

1. `useIntakeEntityLoader.ts` — Hook fuer Entity-Laden pro Kategorie
2. `IntakeEntityPicker.tsx` — 2-stufiger Picker (Kategorie-Grid + Entity-Select)
3. `IntakeUploadZone.tsx` — Upload-Dropzone mit Kontext-Anzeige
4. `IntakeHowItWorks.tsx` — Erklaerungsblock
5. `IntakeChecklistGrid.tsx` — Checklisten mit Live-Fortschritt
6. `IntakeRecentActivity.tsx` — Letzte Uploads
7. `IntakeTab.tsx` — Hauptseite, bindet alle Bloecke zusammen
8. `routesManifest.ts` — Tile-Definition
9. `DMSPage.tsx` + `dms/index.ts` — Route + Export
10. Visueller Test der gesamten Seite

