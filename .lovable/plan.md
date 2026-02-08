
# KAUFY Website Komplettüberarbeitung — Phasenplan

## Übersicht

Dieser Plan umfasst die vollständige Überarbeitung der KAUFY-Website in 5 aufeinander aufbauenden Phasen. Jede Phase ist in sich abgeschlossen und testbar.

---

## Phase 1: Golden Path — Daten & Sichtbarkeit

**Ziel:** Das Golden Path Listing wird sichtbar und die Investment-Suche zeigt Objekte.

### 1.1 Datenbank-Fix
- SQL-Migration: `public_id` für Listing setzen
- Prüfung: `listing_publications` für KAUFY aktiv

### 1.2 Query-Erweiterung
- `KaufyExpose.tsx`: Mietdaten aus `properties.annual_income` laden
- `KaufyHome.tsx`: Query validieren (bereits korrekt)

### 1.3 Validierung
- Investment-Suche zeigt Leipzig-Listing
- Klick führt zu vollständigem Exposé
- Alle Slider und Charts funktionieren

**Betroffene Dateien:**
| Datei | Änderung |
|-------|----------|
| DB Migration | `UPDATE listings SET public_id = ...` |
| `KaufyExpose.tsx` | Query um `annual_income` erweitern |

---

## Phase 2: Investment-Rechner Konsolidierung

**Ziel:** Alle Investment-Exposés nutzen die gleichen Komponenten (keine Duplikation).

### 2.1 Bestandsanalyse (abgeschlossen)
```text
✓ useInvestmentEngine     — Gemeinsamer Hook
✓ MasterGraph             — Gemeinsame Komponente
✓ Haushaltsrechnung       — Gemeinsame Komponente
✓ InvestmentSliderPanel   — Gemeinsame Komponente
✓ DetailTable40Jahre      — Gemeinsame Komponente
```

### 2.2 MOD-08 Refaktorisierung
- `InvestmentExposePage.tsx`: Duplizierte UI durch Imports ersetzen
- Lokale Chart/Slider-Implementierungen entfernen
- Gemeinsame Komponenten importieren

### 2.3 Zone 3 KAUFY Refaktorisierung
- `KaufyExpose.tsx`: Duplizierte UI durch Imports ersetzen
- Gleiche Komponenten wie MOD-08/MOD-09

### 2.4 Validierung
- Alle drei Orte zeigen identische UI
- Slider-Änderungen wirken konsistent
- Charts und Tabellen sind synchron

**Betroffene Dateien:**
| Datei | Änderung |
|-------|----------|
| `InvestmentExposePage.tsx` | Refaktorisieren: Gemeinsame Komponenten |
| `KaufyExpose.tsx` | Refaktorisieren: Gemeinsame Komponenten |
| `src/components/investment/*` | Keine Änderung (bleiben SSOT) |

---

## Phase 3: Website UI/UX Redesign

**Ziel:** Minimalistisches, CI-konformes Design mit dezenter Himmel-Atmosphäre.

### 3.1 CI-Anpassung
```css
.theme-kaufy {
  --z3-background: 210 40% 99%;    /* Dezentes Himmelblau */
  --z3-secondary: 210 30% 97%;
  --z3-border: 210 20% 92%;
}
```

### 3.2 Navigation schärfen
```text
Vorher:  Vermieter | Verkäufer | Vertriebe | Module
Nachher: Immobilien | Vermieter | Verkäufer | Partner
```

### 3.3 Armstrong Sidebar Fix
- Position: `lg:top-16` (64px Header-Offset)
- Höhe: `lg:h-[calc(100vh-64px)]`
- In `KaufyExpose.tsx` integrieren mit Objekt-Kontext

### 3.4 Hero-Texte optimieren
| Seite | Vorher | Nachher |
|-------|--------|---------|
| Home | "Die KI-Plattform für..." | "Finden Sie Ihre Rendite-Immobilie" |
| Home | "Marktplatz & digitale..." | "Steueroptimiert kaufen. Digital verwalten." |

### 3.5 Responsive Validierung
- Mobile: Investment-Suche funktioniert
- Desktop: Sidebar korrekt positioniert
- Tablet: Layout bricht nicht

**Betroffene Dateien:**
| Datei | Änderung |
|-------|----------|
| `zone3-theme.css` | Himmelblauer Background |
| `KaufyLayout.tsx` | Navigation anpassen |
| `ArmstrongSidebar.tsx` | Position-Fix |
| `KaufyHome.tsx` | Hero-Texte |
| `KaufyExpose.tsx` | Armstrong-Sidebar einbinden |

---

## Phase 4: Marketingstrategie — Drei Zielgruppen

**Ziel:** Jede Zielgruppe wird perfekt angesprochen mit klarer Value Proposition.

### 4.1 Vermieter (KaufyVermieter.tsx)

**Value Proposition:** "Verwaltung wird einfacher"

| Feature | Beschreibung |
|---------|--------------|
| Portfolio-Zentrale | Alle Objekte, Werte, Dokumente |
| Mieter-Service | Kommunikation, Zahlungen, Abrechnungen |
| Verkaufs-Option | Nahtlos über KAUFY-Netzwerk |

**Änderungen:**
- Modul-Nummern (04, 05, 06) entfernen
- Nutzen-fokussierte Kommunikation
- Armstrong als Verwaltungs-Assistent positionieren

### 4.2 Verkäufer (KaufyVerkaeufer.tsx)

**Value Proposition:** "Ihre Immobilie. Unser Netzwerk."

| Track | Zielgruppe | Fokus |
|-------|------------|-------|
| Privat | Einzelobjekt-Verkäufer | Einfacher Prozess, maximaler Preis |
| Gewerblich | Bauträger, Aufteiler | Projektvertrieb, Partner-Netzwerk |

**Änderungen:**
- Zwei-Track-Differenzierung
- Bauträger-Features hervorheben (Projekte-Modul, Website-Builder)
- Investmentrechner als Verkaufstool

### 4.3 Partner/Vertriebe (KaufyVertrieb.tsx)

**Value Proposition:** "Verdienen Sie mit System"

| Feature | Beschreibung |
|---------|--------------|
| Investment-Engine | Objekte finden, simulieren, beraten |
| Partner-Netzwerk | Kollegen, Provisionen, Kooperationen |
| Lead-Management | Pipeline, Interessenten, Abschlüsse |

**Änderungen:**
- Modul-Nummern (09, 10) entfernen
- Verdienstmöglichkeiten prominent
- Investment-Engine als Kern-Tool

### 4.4 Module-Seite überarbeiten
```text
Vorher:
  MOD-01 Stammdaten | MOD-02 KI Office | ...

Nachher:
  Für Eigentümer:
    • Immobilien-Management
    • Mietsonderverwaltung
    • Dokumentenablage
    
  Für Partner:
    • Investment-Suche
    • Lead-Management
    • KI-Assistent
    
  Für Bauträger:
    • Projekte
    • Website-Builder
    • Investmentrechner
```

**Betroffene Dateien:**
| Datei | Änderung |
|-------|----------|
| `KaufyVermieter.tsx` | Modul-IDs entfernen, Nutzen-Fokus |
| `KaufyVerkaeufer.tsx` | Zwei-Track-Struktur, Bauträger-Features |
| `KaufyVertrieb.tsx` | Modul-IDs entfernen, Verdienst-Fokus |
| `KaufyModule.tsx` | Gruppierung nach Zielgruppe |

---

## Phase 5: Portal-Eröffnung (Vorbereitung)

**Ziel:** Architektur für Self-Service Portal-Registrierung vorbereiten.

**Status:** Nur Konzept — Umsetzung erfolgt später

### 5.1 Entry Points definieren

| Zielgruppe | CTA | Ziel-Route | Ergebnis |
|------------|-----|------------|----------|
| Vermieter | "Portal eröffnen" | `/auth?mode=register&source=kaufy&role=landlord` | Org-Typ: client |
| Verkäufer | "Objekt eintragen" | `/auth?mode=register&source=kaufy&role=seller` | Org-Typ: client |
| Partner | "Partner werden" | `/auth?mode=register&source=kaufy&role=partner` | Org-Typ: partner |
| Bauträger | "Projekt-Demo" | `/kontakt?type=developer` | Lead → Zone 1 |

### 5.2 Registrierungs-Flow (Konzept)

```text
Zone 3 Website
      │
      ▼
[CTA "Portal eröffnen"]
      │
      ▼
/auth?mode=register&source=kaufy&role=...
      │
      ▼
┌─────────────────────────────────────┐
│  Registrierung (E-Mail, Passwort)   │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  Org-Wizard (Name, Typ, Adresse)    │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  E-Mail-Verifizierung               │
└─────────────────────────────────────┘
      │
      ▼
Zone 2 Portal (Dashboard)
```

### 5.3 Modul-Freischaltung nach Rolle

| Rolle | Freigeschaltete Module |
|-------|------------------------|
| landlord | MOD-01, 03, 04, 05 |
| seller | MOD-01, 03, 04, 06 |
| partner | MOD-01, 03, 08, 09, 10 |
| developer | MOD-01, 03, 13 + Sales-Kontakt |

### 5.4 Noch NICHT umsetzen
- Auth-Flow Erweiterung
- Org-Wizard
- Modul-Freischaltungslogik
- E-Mail-Templates

**Dokumentation:**
| Dokument | Inhalt |
|----------|--------|
| `docs/zone3/PORTAL_ENTRY_SPEC.md` | Detaillierte Spezifikation |

---

## Umsetzungsreihenfolge

```text
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: Golden Path                                       │
│  • DB-Fix (public_id)                                       │
│  • Query-Erweiterung                                        │
│  • Validierung: Listing erscheint                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: Investment-Rechner Konsolidierung                 │
│  • InvestmentExposePage refaktorisieren                     │
│  • KaufyExpose refaktorisieren                              │
│  • Validierung: Gleiche UI überall                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: UI/UX Redesign                                    │
│  • CI-Anpassung (Himmelblau)                                │
│  • Navigation schärfen                                      │
│  • Armstrong Sidebar Fix                                    │
│  • Hero-Texte                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 4: Marketingstrategie                                │
│  • Vermieter-Seite optimieren                               │
│  • Verkäufer-Seite (+ Bauträger)                            │
│  • Partner-Seite optimieren                                 │
│  • Module-Seite ohne IDs                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 5: Portal-Eröffnung (NUR KONZEPT)                    │
│  • Entry Points dokumentieren                               │
│  • Flow-Spezifikation                                       │
│  • KEINE Code-Änderungen                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Zeitschätzung

| Phase | Geschätzter Aufwand |
|-------|---------------------|
| Phase 1 | 1-2 Prompts |
| Phase 2 | 2-3 Prompts |
| Phase 3 | 2-3 Prompts |
| Phase 4 | 3-4 Prompts |
| Phase 5 | 1 Prompt (nur Doku) |
| **Gesamt** | **9-13 Prompts** |

---

## Was NICHT geändert wird

- `useInvestmentEngine.ts` — Hook bleibt SSOT
- `sot-investment-engine` Edge Function — Bleibt unverändert
- Datenbank-Schema — Nur public_id Update
- MOD-04/05/06 SSOT-Logik — Unberührt
- Zone 1 Admin — Unberührt
- Zone 2 Portal (außer MOD-08) — Unberührt

---

## Erfolgskriterien

### Phase 1 ✓
- [x] Leipzig-Listing erscheint in Investment-Suche
- [x] Klick führt zu vollständigem Exposé
- [x] Mietdaten werden korrekt angezeigt

### Phase 2 ✓
- [x] Keine duplizierten Chart/Slider-Komponenten mehr
- [x] MOD-08, MOD-09, KAUFY nutzen gleiche UI
- [x] Alle Slider funktionieren identisch

### Phase 3 ✓
- [x] Dezenter Himmel-Touch sichtbar
- [x] Armstrong Sidebar korrekt positioniert
- [x] Navigation zeigt: Immobilien | Vermieter | Verkäufer | Partner

### Phase 4 ✓
- [x] Keine Modul-IDs auf öffentlichen Seiten
- [x] Jede Zielgruppe hat klare Value Proposition
- [x] Verkäufer-Seite mit How-it-works Flow

### Phase 5 ✓
- [x] Spezifikation dokumentiert (docs/zone3/PORTAL_ENTRY_SPEC.md)
- [x] Entry Points definiert
- [x] Keine Code-Änderungen (nur Dokumentation)
