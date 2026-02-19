

# Posteingang Fix -- Inbox wird nicht angezeigt

## Ursache

Die `postservice_mandates`-Tabelle hat genau einen Eintrag mit Status **`cancelled`**. Der Code prueft auf `status === 'active'` (Zeile 63) -- da kein aktiver Vertrag existiert, zeigt er die Aktivierungskarte statt der Inbox.

Die 3 Demo-E-Mails (WEG-Jahresabrechnungen) sind in `inbound_emails` vorhanden und korrekt, werden aber nie abgefragt, weil die Query `enabled: !!user && hasActiveContract` ist (Zeile 107).

## Loesung

### Schritt 1: Demo-Mandat reaktivieren
SQL-Migration: Status des bestehenden Mandats auf `active` setzen, damit die Inbox sofort sichtbar wird.

### Schritt 2: PosteingangTab-Logik korrigieren
Die aktuelle Logik ist zu restriktiv. Der Posteingang sollte IMMER die Inbox-Tabelle anzeigen (auch ohne aktiven Vertrag), weil:
- Demo-Daten sollen immer sichtbar sein
- Die Aktivierungs-Info kann als kleinere Karte NEBEN oder UNTER der Tabelle stehen
- Die E-Mail-Upload-Karte wird nur bei aktivem Vertrag gezeigt

Konkrete Aenderungen in `PosteingangTab.tsx`:
- E-Mails werden IMMER geladen (Query `enabled` aendern)
- Die Inbox-Tabelle wird IMMER gerendert (nicht hinter `if (!hasActiveContract)` versteckt)
- Ohne aktiven Vertrag: Inbox-Tabelle oben, darunter eine kompakte Aktivierungskarte
- Mit aktivem Vertrag: Inbox-Tabelle oben, darunter die Upload-E-Mail-Karte
- Steuerungs-Kacheln bleiben ganz unten in beiden Faellen

```text
NEUES LAYOUT (beide Zustaende):
+--------------------------------------------------+
|  POSTEINGANG                                     |
+--------------------------------------------------+
|  [Inbox-Tabelle: IMMER sichtbar]                 |
|  - WEG Berliner Str. 42    | 2 PDFs | Bereit    |
|  - WEG Maximilianstr. 8    | 2 PDFs | Bereit    |
|  - WEG Elbchaussee 120     | 2 PDFs | Bereit    |
+--------------------------------------------------+
|  [Nur wenn KEIN Vertrag:]                        |
|  Kompakte Aktivierungskarte (1 Zeile CTA)        |
|  [Nur wenn Vertrag AKTIV:]                       |
|  Upload-E-Mail-Karte mit Adresse                 |
+--------------------------------------------------+
|  [Steuerungs-Grid: 3 Kacheln]                    |
|  Auslesung | Extraktion | Postservice            |
+--------------------------------------------------+
```

### Geaenderte Dateien
- `src/pages/portal/dms/PosteingangTab.tsx` -- Inbox IMMER rendern, Queries immer aktiv, Layout umstrukturieren

### Datenbank
- SQL: `UPDATE postservice_mandates SET status = 'active' WHERE id = 'bae27a56-...'` (Demo-Mandat reaktivieren)

