
# Korrekturplan: Vermietereinheiten UI/UX Optimierung

## Zusammenfassung der identifizierten Probleme

| # | Problem | Bereich | Schweregrad |
|---|---------|---------|-------------|
| 1 | Optische Überladung der Eigentümer-Karten | KontexteTab | Mittel |
| 2 | Buttons-Layout (Bearbeiten/Zuordnen) zu gedrängt | KontexteTab | Leicht |
| 3 | Edit-Dialog zeigt nur Schritt 1 initial | CreateContextDialog | Mittel |
| 4 | Dialog insgesamt etwas unübersichtlich | CreateContextDialog | Leicht |

## Technische Analyse

### Aktuelle Code-Struktur

**Datei:** `src/components/shared/CreateContextDialog.tsx` (777 Zeilen)
- Schritt 1 (Zeilen 376-474): Grunddaten (Name, Typ, Steuersatz, Adresse)
- Schritt 2a (Zeilen 475-677): PRIVATE - Eigentümer mit Steuerdaten
- Schritt 2b (Zeilen 678-748): BUSINESS - Gesellschaftsdaten

**Datei:** `src/pages/portal/immobilien/KontexteTab.tsx` (353 Zeilen)
- Zeilen 175-316: Karten-Grid mit Eigentümer-Anzeige

### Bestätigung: Gleiche Datenquelle

Beide Views nutzen:
- `landlord_contexts` Tabelle (Grunddaten)
- `context_members` Tabelle (Eigentümer mit Steuerdaten)
- Identische Query-Keys: `['landlord-contexts']`, `['context-members']`

---

## Korrekturplan

### Phase 1: KontexteTab UI-Optimierung

**Datei:** `src/pages/portal/immobilien/KontexteTab.tsx`

**1.1 Karten-Header kompakter gestalten:**
```
Aktuell:
┌──────────────────────────────────────┐
│ [Icon] Familie Mustermann   [Badge] │
│         GmbH                         │
└──────────────────────────────────────┘

Neu:
┌──────────────────────────────────────┐
│ [Icon] Familie Mustermann · [Badge] │
│ 30% Steuersatz                       │
└──────────────────────────────────────┘
```

**1.2 Eigentümer-Grid optimieren:**
```
Aktuell (überladen):
┌─────────────────────────┬─────────────────────────┐
│ Lisa Mustermann         │ Max Mustermann          │
│ geb. Schmidt            │ *01.05.80 Stkl. III     │
│ *15.08.82 Stkl. V       │ Software-Entwickler     │
│ Marketing-Managerin     │ 72.000 €                │
│ 54.000 €                │ 50% Anteil              │
│ 50% Anteil              │                         │
└─────────────────────────┴─────────────────────────┘

Neu (kompakter):
┌─────────────────────────┬─────────────────────────┐
│ Max Mustermann          │ Lisa Mustermann         │
│ Stkl. III · 72.000 €    │ geb. Schmidt · Stkl. V  │
│ Software-Entwickler     │ 54.000 €                │
│ 50%                     │ 50%                     │
└─────────────────────────┴─────────────────────────┘
```

**1.3 Buttons-Layout verbessern:**
```
Aktuell:
[1 Objekt(e)]  [Bearbeiten] [Objekte zuordnen]

Neu:
┌──────────────────────────────────────────────────┐
│ 1 Objekt(e)                                      │
├──────────────────────────────────────────────────┤
│ [Bearbeiten]              [Objekte zuordnen]     │
└──────────────────────────────────────────────────┘
```

### Phase 2: CreateContextDialog Optimierung

**Datei:** `src/components/shared/CreateContextDialog.tsx`

**2.1 Steuersatz-Feld prominenter machen:**
- Eigene Card/Box für den Steuersatz mit Info-Text

**2.2 Eigentümer-Grid Layout verbessern:**
- Kompaktere Felder-Anordnung
- Bessere visuelle Trennung zwischen Sektionen
- Scroll-Bereich für viele Eigentümer

**2.3 Business-Step: Adresse hinzufügen**
Aktuell fehlt in Schritt 2b die Firmenadresse - diese wird nur in Schritt 1 erfasst. Das ist korrekt, aber die Beschreibung "Firmenadresse *" erscheint in Schritt 1 bei BUSINESS.

---

## Betroffene Dateien

| Datei | Änderungen |
|-------|------------|
| `src/pages/portal/immobilien/KontexteTab.tsx` | Karten-Layout, Buttons, Eigentümer-Grid |
| `src/components/shared/CreateContextDialog.tsx` | Steuersatz-Box, Eigentümer-Kompaktierung |

## Keine strukturellen Änderungen nötig

- Die Datenquelle ist bereits konsistent
- Der Wizard-Flow (2 Schritte) ist korrekt
- Edit-Modus lädt Daten korrekt (existingMembers Query)
- Routen sind identisch (kein Route-Bruch)

---

## Erwartetes Ergebnis nach Implementierung

### KontexteTab:
- Visuell aufgeräumtere Karten
- Buttons in eigener Zeile mit mehr Platz
- Eigentümer-Infos kompakter aber vollständig

### CreateContextDialog:
- Steuersatz visuell hervorgehoben
- Eigentümer-Eingabe übersichtlicher
- Konsistente Darstellung zwischen Anlegen und Bearbeiten

---

## Validierungskriterien

- [ ] Karten zeigen Eigentümer-Daten kompakt
- [ ] Buttons haben ausreichend Platz
- [ ] Dialog zeigt korrekten Titel (Anlegen vs. Bearbeiten)
- [ ] Schritt 2 zeigt Eigentümer-Daten im Edit-Modus
- [ ] Speichern aktualisiert die Karten-Ansicht korrekt
