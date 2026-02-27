

# Compliance Detailanalyse — Alle rechtlichen Texte

## Uebersicht: 7 Brands, 14 Dokumente

| Brand | Impressum | Datenschutz | Rendering |
|-------|-----------|-------------|-----------|
| Kaufy | DB (Zone3LegalPage) | DB (Zone3LegalPage) | Markdown via compliance_documents |
| FutureRoom | DB (Zone3LegalPage) | DB (Zone3LegalPage) | Markdown via compliance_documents |
| SoT | DB (Zone3LegalPage) | DB (Zone3LegalPage) | Markdown via compliance_documents |
| Acquiary | DB (Zone3LegalPage) | DB (Zone3LegalPage) | Markdown via compliance_documents |
| Lennox | DB (Zone3LegalPage) | DB (Zone3LegalPage) | Markdown via compliance_documents |
| Ncore | TSX (hardcoded) | TSX (hardcoded) | Direkt im Code |
| Otto² | TSX (hardcoded) | TSX (hardcoded) | Direkt im Code |

---

## KRITISCHE FEHLER (sofort beheben)

### F1: OttoImpressum.tsx — Komplett veraltet
- **"§ 5 TMG"** statt DDG — TMG ist seit 2024 aufgehoben
- **"Komplett ZL Finanzdienstleistungen GmbH"** — Firmenname falsch ("Komplett" gehoert nicht dazu)
- **Adresse falsch**: "Tisinstraße 19, 82041 Deisenhofen" statt korrekt Ruselstrasse 16, 94327 Bogen
- **Telefon falsch**: "089 / 158 933 41-0" statt +49 (0)9422 4845
- **E-Mail falsch**: "info@otto2advisory.com" statt otto.stelzl@otto2advisory.com
- **GF falsch**: "Otto Stelzl, Thomas Otto Stelzl" — korrekt muesste "Otto Stelzl" sein (oder was aktuell stimmt)
- **Register: "wird nachgetragen"** — nicht akzeptabel fuer ein oeffentliches Impressum
- **USt-ID: "wird nachgetragen"** — nicht akzeptabel
- **Berufsbezeichnung falsch**: "Versicherungsmakler und Finanzanlagenvermittler nach §§ 34d, 34f GewO" — laut Datenschutz ist es "Versicherungsvertreter nach § 34d Abs. 1 GewO" (Vertreter ≠ Makler!)
- **OS-Plattform**: Link auf ec.europa.eu/consumers/odr/ — seit 20.07.2025 eingestellt
- **Keine IHK-Registrierungsnummer** (Pflicht fuer § 34d)
- **Kein Vermittlerregister-Eintrag** (Pflicht fuer § 34d: Registernr. D-XXXX-XXXXX-XX)
- **Meta-Description**: "Komplett ZL" — falscher Firmenname

### F2: SoT Impressum (DB) — OS-Plattform-Link noch aktiv
- Enthaelt noch den Link `https://ec.europa.eu/consumers/odr` — eingestellt seit 20.07.2025
- HRB-Nummer fehlt: `{commercial_register.number}` — Platzhalter leer in DB (number: "")

### F3: SoT Company Profile — Unvollstaendig
- `phone: "folgt"` — muss ergaenzt werden
- `vat_id: "In Gründung — folgt"` — muss nach Gruendung aktualisiert werden
- `commercial_register.number: ""` — HRB-Nummer fehlt

### F4: FutureRoom Company Profile — Unvollstaendig
- `phone: "folgt"` — muss ergaenzt werden
- `vat_id: "In Gründung — folgt"` — muss nach Gruendung aktualisiert werden

---

## MITTLERE PROBLEME

### M1: OttoDatenschutz.tsx — Optionale Module noch sichtbar
- §§ 7, 8, 9 (Analytics, Pixel, Externe Inhalte) sind als orange Boxen mit "NUR WENN GENUTZT" sichtbar
- Da keine Analytics/Pixel/externe Inhalte genutzt werden, sollten diese Abschnitte entfernt werden (oder zumindest nicht oeffentlich sichtbar sein)
- Die gelbe Checkliste-Box am Anfang ist ebenfalls fuer interne Zwecke — darf nicht auf der Live-Website erscheinen

### M2: SoT Datenschutz (DB) — "Barbara Straße 2D"
- Im Company Profile steht "Barbara Straße 2D" — korrekt waere "Barbarastraße 2D" (ein Wort)

### M3: Acquiary/Kaufy/FutureRoom Impressums — Telefon zeigt "folgt"
- Platzhalter `{phone}` wird mit "folgt" aus dem FutureRoom-Profil ersetzt — sieht unprofessionell aus

### M4: DB-basierte Datenschutz-Dokumente — Keine TTDSG-Referenz pruefbar
- Die DB-Vorschau zeigt nur 500 Zeichen — volle Pruefung der DSGVO-Abschnitte nicht moeglich ohne vollstaendige Inhalte. Aber aus der Struktur der Previews ist erkennbar, dass zumindest die Grundstruktur (Verantwortlicher, Datenschutzkontakt) vorhanden ist.

---

## KONFORM / KEIN HANDLUNGSBEDARF

- **NcoreImpressum.tsx**: DDG-konform, KG-Struktur korrekt, Komplementaer, Register, USt-IdNr, OS-Plattform-Hinweis (eingestellt), MStV — alles sauber
- **NcoreDatenschutz.tsx**: DSGVO/TTDSG/DDG-konform, IONOS-Hosting korrekt, AVV, Server-Logs, Cookies-Abschnitt, Betroffenenrechte, BayLDA — alles sauber. Keine optionalen Module, finalisiert
- **Lennox Company Profile**: Vollstaendig (Telefon, USt-IdNr DE359400241)
- **Lennox Impressum/Datenschutz (DB)**: Robyn Gebhard, Einzelunternehmen, korrekt
- **Zone 3 Cookie-Policy**: Korrekt — keine nicht-notwendigen Cookies, kein Banner noetig

---

## EMPFOHLENER MASSNAHMENPLAN

### Prioritaet 1 — OttoImpressum.tsx komplett neu schreiben
- DDG statt TMG
- Korrekter Firmenname: ZL Finanzdienstleistungen GmbH
- Korrekte Adresse: Ruselstrasse 16, 94327 Bogen
- Korrektes Telefon, korrekte E-Mail
- § 34d Abs. 1 GewO Versicherungsvertreter (NICHT Makler)
- Vermittlerregister-Nummer (muss der Betreiber liefern)
- IHK-Registrierung
- OS-Plattform-Hinweis: eingestellt
- Register + USt-ID eintragen oder "in Gründung" explizit

### Prioritaet 2 — OttoDatenschutz.tsx bereinigen
- Gelbe Checkliste-Box entfernen
- Orange optionale Module (§§ 7-9) entfernen
- Interne Hinweise entfernen (z.B. "[Hinweis intern: Speicherdauer mit IONOS-Vertrag abgleichen]")

### Prioritaet 3 — SoT Impressum (DB) aktualisieren
- OS-Plattform-Link entfernen oder auf "eingestellt" hinweisen
- HRB-Nummer im Company Profile ergaenzen (wenn bekannt)

### Prioritaet 4 — Company Profiles vervollstaendigen
- SoT: Telefon, USt-IdNr, HRB-Nummer
- FutureRoom: Telefon, USt-IdNr
- SoT Datenschutz: "Barbara Straße" → "Barbarastraße" korrigieren

### Zusammenfassung

| Bereich | Status |
|---------|--------|
| Ncore Impressum | KONFORM |
| Ncore Datenschutz | KONFORM |
| Otto Impressum | KRITISCH — komplett veraltet |
| Otto Datenschutz | MITTEL — interne Elemente entfernen |
| SoT Impressum | MITTEL — OS-Link + fehlende Daten |
| SoT Datenschutz | MITTEL — Tippfehler Adresse |
| Kaufy/FutureRoom/Acquiary | MITTEL — "folgt"-Platzhalter |
| Lennox | KONFORM |

Soll ich mit Prioritaet 1+2 (Otto Impressum + Datenschutz bereinigen) sofort starten?

