
# UX/UI-Review: MOD-14 Social — Analyse und Verbesserungsplan

## Gesamteindruck

Das Social-Modul hat eine solide technische Basis mit 9 Sub-Pages und einer funktionierenden Sidebar-Navigation. Allerdings fehlt es an mehreren Stellen an **Erklaerungen fuer den Nutzer**, einer **klaren Prozessfuehrung** und **visueller Konsistenz**. Der Nutzer wird in ein komplexes System geworfen, ohne zu verstehen, in welcher Reihenfolge er vorgehen soll und was jeder Schritt bewirkt.

---

## Gefundene Probleme

### 1. Fehlende Onboarding-Erklaerung auf der Overview-Seite

**Problem:** Die Overview-Seite zeigt Setup-Fortschritt, Plattform-Karten und Schnellzugriffe — aber erklaert nicht, **was Social ueberhaupt ist** und **wie der Workflow funktioniert**. Ein neuer Nutzer sieht "Baue deine Personal Brand auf" und hat keine Ahnung, was als naechstes passieren soll.

**Loesung:** Eine **Workflow-Visualisierung** (Stepper/Timeline) einfuegen, die den Golden Path erklaert:
1. Audit (Persoenlichkeit erfassen)
2. Themen definieren (Knowledge Base)
3. Inspiration sammeln
4. Assets hochladen
5. Content erstellen
6. Kalender planen
7. Manuell posten und Kennzahlen erfassen

### 2. "Plattform verbinden" ist irrefuehrend

**Problem:** Die Plattform-Karten (LinkedIn, Facebook, Instagram) suggerieren eine **API-Verbindung** (OAuth), speichern aber nur eine Profil-URL in der `social_inspiration_sources`-Tabelle. Der Nutzer denkt, er verbindet seinen Account — es passiert aber nichts ausser einer URL-Speicherung.

**Loesung:**
- Titel aendern von "Deine Plattformen" zu "Deine Profile"
- "Verbunden"-Badge ersetzen durch "Profil hinterlegt"
- Klartext ergaenzen: "Wir publizieren nicht automatisch — du postest manuell und trackst hier deine Ergebnisse."

### 3. Sidebar-Labels sind unklar

**Problem:** Einige Navigation-Labels sind nicht selbsterklaerend:
- "Individual Content" — was ist das? (Es sind persoenliche Momente/Erlebnisse)
- "Audit" — klingt wie eine Pruefung, nicht wie ein kreatives Gespraech
- "Knowledge Base" — technischer Fachbegriff

**Loesung:** Labels anpassen:
- "Audit" → "Mein Profil" (oder "Persoenlichkeit")
- "Individual Content" → "Meine Momente"
- "Knowledge Base" → "Meine Themen"
- "Ideen & Inspiration" → "Vorbilder"

### 4. Inkonsistente max-width und Padding

**Problem:** Die Sub-Pages verwenden unterschiedliche Layouts:
- OverviewPage: `max-w-7xl mx-auto px-4 py-6 md:px-6`
- InspirationPage: `p-6 max-w-3xl` (kein mx-auto!)
- CalendarPage: `p-6 max-w-4xl` (kein mx-auto!)
- PerformancePage: `p-6 max-w-2xl` (kein mx-auto!)
- KnowledgePage, AuditPage, InboundPage, AssetsPage, CreatePage: `max-w-7xl mx-auto px-4 py-6 md:px-6`

**Loesung:** Einheitlich `max-w-7xl mx-auto px-4 py-6 md:px-6` verwenden (gemaess dem bestehenden UX-Standard "manager-module-visual-standard").

### 5. Kalender-Seite ist auf Mobile unbrauchbar

**Problem:** Das 7-Spalten-Grid (`grid-cols-7`) bricht auf kleinen Bildschirmen zusammen. Es gibt keine responsive Anpassung.

**Loesung:** Auf Mobile eine Listenansicht (Tagesansicht) statt Grid anbieten.

### 6. Kein "Wie geht es weiter?"-Hinweis nach Abschluss einzelner Schritte

**Problem:** Nach Abschluss des Audits zeigt die Seite die Dimensionswerte, aber der CTA "Weiter zur Knowledge Base" ist leicht zu uebersehen. Gleiches auf anderen Seiten — es fehlt eine klare **naechste Aktion**.

**Loesung:** Auf jeder Sub-Page nach erfolgreichem Abschluss einen prominenten "Naechster Schritt"-Banner einfuegen, der zum naechsten logischen Schritt im Workflow fuehrt.

### 7. Performance-Seite verwendet native `<select>` statt Radix Select

**Problem:** Die Performance-Seite nutzt `<select>` HTML-Elemente statt der projekteigenen `<Select>`-Komponente aus Radix UI. Das bricht die visuelle Konsistenz.

**Loesung:** Native `<select>` durch `<Select>` Radix-Komponente ersetzen.

### 8. Fehlender Hinweis zum manuellen Posting-Workflow

**Problem:** Nirgends wird klar erklaert, dass der Nutzer seinen Content **manuell auf LinkedIn/Instagram/Facebook posten muss** und dann im System als "gepostet" markiert. Der Workflow "Kopieren → Plattform oeffnen → Posten → Zurueckkommen → Als gepostet markieren" fehlt komplett.

**Loesung:** Im Kalender und in der Content-Creation-Seite einen klaren Hinweis-Banner einfuegen:
"So funktioniert es: Content kopieren → In LinkedIn/Instagram einfuegen → Hier als gepostet markieren"

---

## Aenderungsplan (Dateien)

| Datei | Aenderung |
|---|---|
| `SocialSidebar.tsx` | Labels umbenennen (Audit → Mein Profil, etc.) |
| `OverviewPage.tsx` | Workflow-Stepper ergaenzen, "Deine Plattformen" → "Deine Profile", Badge-Text aendern, Erklaertext zum manuellen Posting |
| `InspirationPage.tsx` | Layout auf `max-w-7xl mx-auto px-4 py-6 md:px-6` vereinheitlichen |
| `CalendarPage.tsx` | Layout vereinheitlichen, Mobile-Listenansicht ergaenzen, Posting-Workflow-Hinweis |
| `PerformancePage.tsx` | Layout vereinheitlichen, native `<select>` durch Radix `<Select>` ersetzen |
| `AuditPage.tsx` | "Naechster Schritt"-Banner prominenter gestalten |
| `CreatePage.tsx` | Posting-Hinweis ("Content kopieren → posten → markieren") ergaenzen |
| `InboundPage.tsx` | Keine Aenderung (bereits konsistent) |
| `AssetsPage.tsx` | Keine Aenderung (bereits konsistent) |
| `KnowledgePage.tsx` | Keine Aenderung (bereits konsistent) |

## Keine DB-Aenderungen

Alle Aenderungen sind rein im Frontend (UI/UX-Verbesserungen). Keine Migrationen, keine neuen Edge Functions.
