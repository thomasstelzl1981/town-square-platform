

# Objekteingang: Widget-Upload-Flow und "Alle Eingaenge"-Widget

## Konzept

Die Widget-Leiste im Objekteingang bekommt eine Doppelfunktion:

```text
+------------------+------------------+------------------+
| ALLE EINGAENGE   | ACQ-2026-00001   | (weitere...)     |
| 12 Objekte       | Fam. Investorius |                  |
| (Filter: alle)   | [Drop-Zone]      | [Drop-Zone]      |
+------------------+------------------+------------------+
```

1. **Klick** auf ein Widget = Tabelle filtern (wie bisher)
2. **Drag-and-Drop** auf ein Mandate-Widget = Expose direkt diesem Mandat zuordnen
3. **"Alle Eingaenge"**-Widget oben links = zeigt alle Objekte (kein Filter)

## Aenderungen

### 1. "Neues Mandat"-Widget entfernen

Das `MandateCaseCardNew`-Widget wird aus `ObjekteingangList.tsx` entfernt — es existiert bereits im Dashboard und in Mandate.

### 2. Neues "Alle Eingaenge"-Widget (Position 1)

Ein neues Widget an erster Stelle zeigt die Gesamtanzahl aller Objekteingaenge. Klick darauf setzt `selectedMandateId` auf `null` → Tabelle zeigt alles. Optisch analog zu den Mandate-Kacheln, aber mit einem Inbox-Icon und der Gesamtzahl.

### 3. Mandate-Widgets mit Upload-Funktion

Jedes Mandate-Widget bekommt eine Drag-and-Drop-Zone. Der Ablauf:

- User zieht ein PDF/Bild auf ein Mandate-Widget
- Das Widget zeigt visuelles Feedback (Rahmen, Farbaenderung)
- Die Datei wird hochgeladen und automatisch diesem Mandat (`mandate_id`) zugeordnet
- Die KI-Extraktion wird ausgeloest
- Der neue Eintrag erscheint sofort in der Tabelle

Zusaetzlich: Ein kleines Upload-Icon am Widget signalisiert, dass Drag-and-Drop moeglich ist.

### 4. Upload-Logik aus ExposeDragDropUploader extrahieren

Die Upload-Logik (Datei → Storage → acq_offers → KI-Extraktion) wird aus der bestehenden `ExposeDragDropUploader`-Komponente in einen wiederverwendbaren Hook `useExposeUpload` extrahiert. Dieser Hook akzeptiert eine `mandateId` als Parameter, damit der Upload korrekt zugeordnet wird.

## Technische Umsetzung

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/akquise-manager/ObjekteingangList.tsx` | `MandateCaseCardNew` entfernen; "Alle Eingaenge"-Widget als erstes Element; Mandate-Widgets mit Drag-and-Drop-Wrapper versehen; Upload-Status-Anzeige (Toast + Tabellenrefresh) |
| `src/hooks/useExposeUpload.ts` | Neuer Hook: extrahiert Upload-Logik (processFile) aus ExposeDragDropUploader; akzeptiert `mandateId` Parameter; gibt `{ upload, isUploading, progress }` zurueck |
| `src/components/akquise/MandateUploadWidget.tsx` | Neuer Wrapper um MandateCaseCard: fuegt onDragOver/onDrop hinzu; zeigt Upload-Fortschritt als Overlay; nutzt useExposeUpload Hook |

## Was passiert bei neuen Objekteingaengen

- **Manueller Upload**: User zieht Datei auf das passende Mandate-Widget → sofortige Zuordnung
- **E-Mail-Eingang**: Laeuft weiterhin ueber den bestehenden Inbound-Webhook mit automatischem Routing (Token/Absender/Thread). Erscheint automatisch in der Tabelle beim naechsten Laden
- **Header-Button "Expose hochladen"**: Wird durch den neuen Widget-Upload-Flow ersetzt (Button entfaellt oder wird zum Fallback ohne Mandate-Zuordnung)

## Nicht betroffen

- `ExposeDragDropUploader.tsx` bleibt als eigenstaendige Komponente unter `/tools` bestehen
- Backend-Logik (Edge Functions, Tabellen) bleibt unveraendert
- E-Mail-Inbound-Flow bleibt unveraendert
