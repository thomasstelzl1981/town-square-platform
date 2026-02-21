

# Plan: SoT Website Content-Relaunch + Teststrategie

## Teil 1: Teststrategie -- Morgen bereit fuer Partner

### Manueller Testplan (sofort umsetzbar)

Zum Testen der Plattform vor dem Partner-Rollout empfehle ich folgende Schritte:

**Zone 3 Websites (oeffentlich, kein Login)**
1. Alle 5 Websites aufrufen und durchklicken:
   - `/website/sot` -- System of a Town
   - `/website/kaufy` -- Kaufy
   - `/website/futureroom` -- FutureRoom
   - `/website/acquiary` -- Acquiary
   - `/website/tierservice` -- Lennox and Friends
2. Pruefen: Alle Links funktionieren, keine 404-Seiten, keine kaputten Bilder
3. Mobile-Ansicht testen (Handy oder Browser-DevTools)
4. Dark/Light Mode umschalten auf SoT

**Auth-Flow**
5. Registrierung testen unter `/auth?mode=register`
6. Login testen unter `/auth`
7. Passwort-Reset testen (falls implementiert)

**Zone 2 Portal (nach Login)**
8. Dashboard laden -- zeigt es Tiles und Widgets?
9. Jedes aktivierte Modul einmal oeffnen
10. Demo-Daten pruefen: Sind Beispieldaten vorhanden?
11. Armstrong Chat oeffnen und eine Frage stellen

**Zone 1 Admin**
12. `/admin` aufrufen -- nur als platform_admin sichtbar?
13. Testdaten-Dashboard pruefen: Stimmen die Zahlen?

### Automatisierte Tests (optional, spaeter)
- Vitest-Setup existiert bereits (`vitest.config.ts`)
- Playwright ist installiert fuer E2E-Tests
- Kann spaeter aufgebaut werden, aber fuer morgen reicht manuelles Testing

---

## Teil 2: SoT Website Content-Relaunch

### Problem-Analyse

Die aktuelle SoT-Website hat inhaltliche Schwaechen:
- **Zu eng auf Immobilien fokussiert** -- der Slogan "Software fuer Immobilienverwaltung" verschenkt das volle Potenzial
- **Digitalisierung als Kernversprechen fehlt** -- "Chaos beseitigen", "Digitalisierung greifbar machen", "buchbar und umsetzbar" kommt nicht rueber
- **Keine klare Zielgruppen-Ansprache** fuer KMU/Unternehmer/Selbstaendige
- **Die Use Cases sind nur Immobilien-bezogen** -- Service- und Base-Module werden kaum vermarktet
- **SotProdukt.tsx sagt "Software fuer Immobilienverwaltung"** statt die breite Plattform zu erklaeren

### Geplante Aenderungen

#### 1. `SotHome.tsx` -- Neuer Hero und Messaging (Hauptseite)

**Vorher:** "Struktur und KI fuer Ihren Haushalt"
**Nachher:** Neues Messaging rund um:
- "Digitalisierung greifbar machen -- ohne grosse Investitionen"
- "Chaos beseitigen. Struktur schaffen. KI nutzen."
- Klare Zielgruppen: Unternehmer, Vermieter, Teams
- Neuer Hero-Text der Digitalisierung als buchbare Dienstleistung positioniert
- Neue "Pain-Point"-Sektion: Was kostet Sie fehlendes System? (Zeit, Geld, Nerven)
- Social Proof / Zahlen-Sektion aufwerten

#### 2. `SotProdukt.tsx` -- Komplett ueberarbeiten

**Vorher:** "Software fuer Immobilienverwaltung" mit 4 generischen Prinzipien
**Nachher:**
- Titel: "Digitalisierung. Greifbar. Buchbar. Umsetzbar."
- 3 klare Versprechen: Chaos beseitigen / Sofort nutzbar / Keine eigene IT-Investition
- Problem-Loesung-Ergebnis neu formuliert fuer breites Publikum
- Konkrete Beispiele aus allen Bereichen (nicht nur Immobilien)

#### 3. `SotUseCases.tsx` -- Erweitern um Service + Base

**Vorher:** 6 Use Cases, alle Immobilien-bezogen
**Nachher:** 10+ Use Cases aus allen 3 Bereichen:
- CLIENT: Finanzueberblick, Verkauf ohne Makler, Finanzierungspaket
- SERVICE: Fuhrpark-Management, PV-Ertraege monitoren, E-Mail-Automatisierung
- BASE: Dokumentenchaos beseitigen, KI-Assistent fuer alles, Kontakte synchronisieren

#### 4. `SotPlattform.tsx` -- Staerkerer Einstieg

- Neuer Hero-Text: "Eine Plattform ersetzt 15 Einzelloesungen"
- Konkretere Beschreibungen pro Area
- "Was Sie NICHT mehr brauchen"-Sektion (Excel, Ordner, 5 Apps)

#### 5. `sotWebsiteModules.ts` -- Beschreibungen schl.rfen

- MOD-05 umbenennen (aktuell "Website Builder" -- das passt nicht zum SOT-Kontext, sollte Mietverwaltung/MSV sein)
- Alle Taglines und Descriptions ueberarbeiten mit Marketing-Fokus
- Pain Points konkreter und emotionaler formulieren

#### 6. `SotFAQ.tsx` -- Aktualisieren

- FAQ-Antworten an neues Messaging anpassen
- "Was ist System of a Town?" neu formulieren (nicht nur Immobilien)
- Neue FAQ-Kategorie "Fuer Unternehmen" hinzufuegen

#### 7. `SotLayout.tsx` -- Meta-Description aktualisieren

- Document Meta anpassen: Nicht nur "Immobilien und private Finanzen"
- Neuer Untertitel: "Die Digitalisierungsplattform fuer Unternehmer und Vermieter"

### Nicht geaendert (bereits gut)

- `SotIntelligenz.tsx` -- Armstrong-Seite ist stark, nur kleine Textanpassungen
- `SotPreise.tsx` -- Pricing-Modell ist klar und ueberzeugend
- `SotDemo.tsx` -- Demo-Seite funktioniert gut
- Alle anderen Zone-3 Websites (Kaufy, FutureRoom, Acquiary, Lennox) -- die sind gut

### Technische Details

- Alle Aenderungen betreffen nur Zone 3 SoT-Dateien (kein Freeze relevant)
- Keine Datenbank-Aenderungen noetig
- Keine neuen Abhaengigkeiten
- Dateien betroffen:
  - `src/pages/zone3/sot/SotHome.tsx`
  - `src/pages/zone3/sot/SotProdukt.tsx`
  - `src/pages/zone3/sot/SotUseCases.tsx`
  - `src/pages/zone3/sot/SotPlattform.tsx`
  - `src/pages/zone3/sot/SotFAQ.tsx`
  - `src/pages/zone3/sot/SotLayout.tsx`
  - `src/data/sotWebsiteModules.ts`

