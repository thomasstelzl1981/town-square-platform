
# Upload-E-Mail in Outbound-Kennung zusammenfuehren

## Aenderung

Die separate Kachel "Upload-E-Mail" (UploadEmailWidget) wird entfernt. Ihr Inhalt — die Inbound-Mailbox-Adresse mit Kopier-Button — wird als neuer Abschnitt unten in die bestehende "Outbound-Kennung"-Kachel (OutboundIdentityWidget) integriert.

## Umsetzung

### Datei 1: `src/components/portal/OutboundIdentityWidget.tsx`

- Neuer Abschnitt nach dem Info-Block (Zeile 267), vor dem Save-Button:
  - Trennlinie (`border-t`)
  - Label "Upload-E-Mail" mit Beschreibung "PDFs per Mail ins DMS senden"
  - Mailbox-Adresse als `code`-Block + Kopieren-Button (1:1 aus UploadEmailWidget uebernommen)
- Die Mailbox-Query (`sot-inbound-receive?action=mailbox`) wird direkt in die Komponente aufgenommen
- Import von `Copy` Icon hinzufuegen

### Datei 2: `src/pages/portal/stammdaten/ProfilTab.tsx`

- Zeile 420-421 entfernen: `{!isRecordOpen && <UploadEmailWidget />}`
- Die gesamte `UploadEmailWidget`-Funktion (Zeilen 466-508) entfernen
- Nicht mehr benoetigte Imports aufraeumen (`Copy` wird nur noch im OutboundIdentityWidget gebraucht)

### Ergebnis

Statt zwei separater Kacheln gibt es nur noch eine "Outbound-Kennung"-Kachel, die sowohl die ausgehende Absenderkennung (Brand, E-Mail, Anzeigename) als auch die eingehende Upload-Adresse zeigt. Die WhatsApp-Kachel rueckt entsprechend nach oben.
