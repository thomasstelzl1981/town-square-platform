

# Briefgenerator Redesign: Live-Vorschau statt Popups

## Zusammenfassung

Die rechte Sidebar (aktuell: "Letzte Entwuerfe" + "Vorlagen") wird ersetzt durch eine **permanente Brief-Vorschau** im DIN-A4-Stil. Schritt 5 (Versandkanal + Aktions-Buttons) wird aus der linken Karte entfernt und in/unter die Vorschau-Karte verschoben. Kein Popup mehr -- alles auf der Arbeitsflaeche.

## Neues Layout

```text
+--------------------------------------+  +----------------------------+
| KI-Briefgenerator                    |  | BRIEF-VORSCHAU             |
|                                      |  |                            |
| 0. Absender (ein Klick)             |  | [Logo]     Firma GmbH      |
| 1. Empfaenger auswaehlen            |  |            Strasse 1       |
| 2. Betreff                          |  |            12345 Stadt     |
| 3. Anliegen beschreiben             |  |                            |
|                                      |  | An: Max Mueller            |
| [Brief generieren]                   |  |     Musterstr. 5           |
|                                      |  |     80000 Muenchen         |
| 4. Brief bearbeiten (Textarea)      |  |                            |
|                                      |  | Betreff: Mieterhoehung     |
|                                      |  |                            |
|                                      |  | Sehr geehrter Herr ...     |
|                                      |  | ... Brieftext ...          |
|                                      |  |                            |
|                                      |  | Mit freundlichen Gruessen  |
+--------------------------------------+  +----------------------------+
                                          | Versandkanal: O E-Mail     |
                                          |              O Fax O Post  |
                                          | [Speichern] [Senden]       |
                                          +----------------------------+
                                          | Letzte Entwuerfe (kompakt) |
                                          +----------------------------+
```

## Technische Aenderungen

### 1. Neue Komponente: `LetterPreview.tsx`

Datei: `src/components/portal/office/LetterPreview.tsx`

- Rendert eine DIN-A4-artige Briefvorschau (weisser Hintergrund, Schatten, festes Seitenverhaeltnis)
- **Props:**
  - `senderName`, `senderCompany`, `senderAddress` -- fuer den Briefkopf oben links
  - `logoUrl` (string | null) -- zeigt das Briefkopf-Logo (Fallback: Armstrong-Default-Logo)
  - `recipientName`, `recipientCompany` -- Empfaengerblock
  - `subject` -- Betreffzeile
  - `body` -- Der generierte Brieftext
  - `date` -- Aktuelles Datum (auto-formatiert auf deutsch)
- Laedt `letterhead_logo_url`, `letterhead_company_line`, Bankverbindung etc. aus dem Profil
- Zeigt Platzhalter-Text wenn noch kein Brief generiert wurde ("Ihr Brief erscheint hier...")

### 2. Umstrukturierung von `BriefTab.tsx`

**Linke Spalte (col-span-7):** Bleibt wie bisher, ABER:
- Schritt 5 (Versandkanal-RadioGroup) wird entfernt
- Aktions-Buttons (PDF Vorschau, Speichern, Senden) werden entfernt
- Es bleiben: Schritte 0-4 + "Brief generieren" Button

**Rechte Spalte (col-span-5):** Neu aufgebaut:
1. **Brief-Vorschau** (LetterPreview) -- Hauptelement, nimmt den meisten Platz ein
2. **Versandkanal + Aktionen** -- RadioGroup (E-Mail/Fax/Post) + Speichern/Senden-Buttons direkt unter der Vorschau
3. **Letzte Entwuerfe** -- Kompakte Liste (bleibt, aber kleiner)
4. **Vorlagen** -- Entfernt oder in die linke Spalte integriert (optional)

### 3. Profil-Daten fuer Vorschau laden

- Query `profiles` fuer `letterhead_logo_url`, `letterhead_company_line`, `letterhead_extra_line`, Bankdaten
- Diese Felder existieren bereits in der DB (aus dem Stammdaten-Briefkopf-Widget)
- Das Armstrong-Default-Logo (`src/assets/logos/armstrong_logo_light.jpg`) wird als Fallback verwendet

### Dateien betroffen

| Datei | Aktion |
|-------|--------|
| `src/components/portal/office/LetterPreview.tsx` | NEU erstellen |
| `src/pages/portal/office/BriefTab.tsx` | Umstrukturieren (rechte Spalte, Schritte verschieben) |

### Umfang
- 1 neue Datei
- 1 Datei stark editiert
- Kein Backend/DB-Aenderung noetig (Profil-Daten existieren bereits)

