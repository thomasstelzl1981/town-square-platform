
# Impressum im Portal (Zone 2) — § 5 DDG Compliance

## Rechtlicher Hintergrund

Jedes Telemedium in Deutschland muss ein Impressum haben, das "leicht erkennbar, unmittelbar erreichbar und staendig verfuegbar" ist (§ 5 DDG). Das Portal ist ein eigenstaendiges Telemedium und braucht daher ein eigenes Impressum. Da das Portal von der **System of a Town GmbH** betrieben wird, verwenden wir das bereits in der Datenbank vorhandene Dokument `website_imprint_sot`.

## Zwei Massnahmen

### 1. Impressum in RechtlichesTab anzeigen (Stammdaten > Rechtliches)

Das SoT-Impressum wird als **dritte, read-only Karte** in der RechtlichesTab angezeigt — unterhalb der AGB und Datenschutzerklaerung. Kein Consent-Checkbox noetig, da das Impressum nur informativ ist.

**Datei:** `src/pages/portal/stammdaten/RechtlichesTab.tsx`
- Zweite Query ergaenzen die `website_imprint_sot` aus `compliance_documents` + aktive Version laedt
- Neue `DocCard` unterhalb der bestehenden Karten rendern mit Titel "Impressum" und dem Markdown-Inhalt
- Kein Consent-Mechanismus — reine Anzeige

### 2. Impressum-Link im SystemBar (ueberall erreichbar)

Ein kleiner, dezenter "Impressum"-Link wird im SystemBar ergaenzt, damit er von **jeder Seite im Portal** aus erreichbar ist — wie gesetzlich gefordert.

**Datei:** `src/components/portal/SystemBar.tsx`
- Kleiner Text-Link "Impressum" hinzufuegen (z.B. neben dem Logo-Bereich oder am rechten Rand)
- Verlinkt auf `/portal/stammdaten/rechtliches` (wo der Volltext steht)
- Styling: dezent, `text-xs text-muted-foreground` — sichtbar aber nicht stoerend

## Kein neues Dokument noetig

Das Impressum `website_imprint_sot` (ID: bereits in DB, doc_key: `website_imprint_sot`) ist aktiv mit Version 1. Es wird einfach wiederverwendet — gleicher Platzhalter-Mechanismus via `renderComplianceMarkdown()` mit dem `sot` Company Profile.

## Datei-Zusammenfassung

| Aktion | Datei | Beschreibung |
|--------|-------|-------------|
| EDIT | `src/pages/portal/stammdaten/RechtlichesTab.tsx` | Impressum-Karte (read-only) ergaenzen |
| EDIT | `src/components/portal/SystemBar.tsx` | Dezenter "Impressum"-Link hinzufuegen |
