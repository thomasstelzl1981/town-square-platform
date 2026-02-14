

# WhatsApp-Widget von Profil nach Abrechnung verschieben

## Aenderung

Die WhatsApp Business Kachel (Owner-Control Nummer, Auto-Reply, Verbindungsstatus) wird aus dem Profil-Tab entfernt und in den Abrechnung-Tab verschoben — direkt in den Armstrong-Bereich, wo sie thematisch hingehoert.

## Umsetzung

### Datei 1: `src/pages/portal/stammdaten/ProfilTab.tsx`

- Zeilen 420-426 entfernen: Die beiden `WhatsAppWidget`-Renderings (`isRecordOpen` und `!isRecordOpen` Varianten)
- Zeilen 466-582 entfernen: Die gesamte `WhatsAppWidget`-Funktion
- Nicht mehr benoetigte Imports aufraeumen (`MessageSquare`, `Bot` aus WhatsApp-Kontext, `Switch`, `Textarea`, `Badge`, `Label` — sofern nicht anderweitig benutzt)

### Datei 2: `src/pages/portal/stammdaten/AbrechnungTab.tsx`

- Die `WhatsAppWidget`-Funktion (ca. 115 Zeilen) hierher verschieben — als eigenstaendige Komponente innerhalb der Datei
- Platzierung: Im Armstrong-Bereich (nach Zeile 220, vor `</div>` des Armstrong-Blocks), als neue Card zwischen `KostenDashboard` und `AktionsKatalog`
- Noetige Imports ergaenzen: `useAuth` (fuer `userId`), `useMutation`, `useQueryClient`, `Switch`, `Textarea`, `Badge`, `Label`, `MessageSquare`, `Save`, `toast` aus sonner, sowie die `FormSection`/`FormInput`/`ProfileWidget`-Komponenten (oder direkt als Card umbauen)
- Da der AbrechnungTab keine `ProfileWidget`-Wrapper nutzt, wird das WhatsApp-Widget als regulaere `Card` dargestellt (konsistent mit dem restlichen Tab-Design)

### Ergebnis

- **Profil-Tab**: Zeigt nur noch persoenliche Daten, RecordCard (Briefkopf) und Outbound-Kennung — schlanker und fokussierter
- **Abrechnung-Tab**: Zeigt Plan, Rechnungen und den gesamten Armstrong-Block inklusive WhatsApp-Steuerung — alles KI-bezogene an einem Ort

