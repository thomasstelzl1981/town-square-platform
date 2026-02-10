

# PIN-geschützte Published URL + Admin-Link

## Zur Frage: Aktualisierung der Published URL

**Frontend-Änderungen** (UI, Komponenten, Styling) müssen jedes Mal neu publiziert werden ("Update" klicken im Publish-Dialog). Die Published URL zeigt immer den letzten Stand zum Zeitpunkt des Publishings.

**Backend-Änderungen** (Edge Functions, Datenbank-Migrationen) werden sofort automatisch deployed -- die wirken also auch auf der Published URL ohne erneutes Publishing.

Kurz: Wenn wir am Chat-Widget oder Layout weiterarbeiten, muss danach nochmal "Update" geklickt werden. Wenn wir nur an der Armstrong Edge Function arbeiten, ist das sofort live.

---

## Was wird gebaut

### 1. PIN-Gate für die Kaufy-Seite (Code: 4409)

Eine einfache Zwischenseite, die vor dem Kaufy-Layout erscheint:
- Eingabe eines 4-stelligen Codes
- Bei korrektem Code (4409) wird ein Flag in `sessionStorage` gesetzt
- Solange die Session aktiv ist, kein erneutes Eingeben noetig
- Bei falschem Code: kurze Fehlermeldung, erneuter Versuch

Das Design bleibt minimal und passt zum Kaufy-Branding (dunkler Hintergrund, zentrierte Eingabe).

```text
+----------------------------------+
|                                  |
|        KAUFY Preview             |
|                                  |
|    Bitte Zugangscode eingeben:   |
|        [  _ _ _ _  ]            |
|                                  |
|        [ Zugang ]               |
|                                  |
+----------------------------------+
```

### 2. Link im Admin-Dashboard (Zone 1)

Im Admin-Dashboard (`/admin`) wird eine kleine Karte oder ein Link-Button eingefuegt:
- Label: "Kaufy Preview (Published)"
- Icon: ExternalLink
- Oeffnet die Published URL `/kaufy2026` in neuem Tab
- Nur sichtbar fuer Platform Admins

---

## Technische Details

### Neue Datei: `src/components/zone3/kaufy2026/KaufyPinGate.tsx`

- Nutzt die bestehende `InputOTP`-Komponente (4 Slots)
- Prueft gegen den hardcoded PIN "4409"
- Setzt `sessionStorage.setItem('kaufy_pin_verified', 'true')` bei Erfolg
- Zeigt Fehlermeldung bei falschem Code

### Aenderung: `src/pages/zone3/kaufy2026/Kaufy2026Layout.tsx`

- Beim Laden pruefen: `sessionStorage.getItem('kaufy_pin_verified')`
- Falls nicht verifiziert: `KaufyPinGate` rendern statt `<Outlet />`
- Falls verifiziert: normales Layout wie bisher

### Aenderung: `src/pages/admin/Dashboard.tsx`

- Neue kleine Card oder Button-Zeile mit Link zur Published URL + `/kaufy2026`
- Nur sichtbar wenn `isPlatformAdmin`
- Oeffnet in neuem Tab (`target="_blank"`)

### Sicherheitshinweis

Der PIN ist ein einfacher Sichtschutz fuer die Praesentation, kein echtes Auth-System. Er verhindert, dass zufaellige Besucher die Preview-Seite sehen. Der Code liegt client-seitig -- das ist fuer diesen Zweck ausreichend.

