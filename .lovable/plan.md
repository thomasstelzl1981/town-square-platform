# MOD-05 MSV — Korrekturplan (ABGESCHLOSSEN v2.0)

## Zusammenfassung

Alle Phasen wurden implementiert inkl. Master-Komponenten-Architektur:

| Phase | Beschreibung | Status |
|-------|--------------|--------|
| Phase A | Navigations-Vereinheitlichung (Tabs entfernt) | ✅ ERLEDIGT |
| Phase 1 | PropertyTable Master-Komponente | ✅ ERLEDIGT |
| Phase 2 | ObjekteTab Refactor (PropertyTable) | ✅ ERLEDIGT |
| Phase 3 | VermietungTab Refactor + Row-Navigation | ✅ ERLEDIGT |
| Phase 4 | RentalExposeDetail Seite (identisch zu MOD-04) | ✅ ERLEDIGT |
| Phase 5 | App.tsx Route /portal/msv/vermietung/:id | ✅ ERLEDIGT |
| Phase 6 | MieteingangTab Konsistenz (Eye-Button) | ✅ ERLEDIGT |

---

## Master-Komponenten Architektur (2026-01-27)

### PropertyTable (`src/components/shared/PropertyTable.tsx`)

Wiederverwendbare Master-Tabelle für alle Immobilien-Listen mit:
- Konfigurierbare Spalten (PropertyTableColumn)
- Einheitliches Empty-State-Pattern (Leerzeile + Action-Button)
- Konsistenter Eye-Button für Row-Actions
- Row-Click Navigation
- Integrierte Suche

### Utility-Komponenten

| Komponente | Verwendung |
|------------|------------|
| PropertyCodeCell | Einheitliche Code/ID Darstellung (font-mono) |
| PropertyAddressCell | Adresse + Subtitle Layout |
| PropertyCurrencyCell | Währungsformatierung mit Variants |
| PropertyStatusCell | Badge-basierte Statusanzeige |

---

## Konsistenz-Pattern

### Empty State (alle MOD-05 Tabs)

```typescript
// Alle Tables zeigen bei leerem Zustand:
1. Leerzeile mit Platzhaltern (–) und Eye-Button
2. Hinweistext + Action-Button zum Erstellen
```

### Row-Actions

```typescript
// Alle Tables haben konsistente Actions:
1. Eye-Button (links) → direkter Zugriff auf Detail/Exposé
2. DropdownMenu (rechts) → erweiterte Aktionen
```

### Navigation

```typescript
// MOD-05 VermietungTab Row-Click navigiert zu:
/portal/msv/vermietung/:id → RentalExposeDetail

// MOD-05 ObjekteTab Row-Click navigiert zu:
/portal/immobilien/:id → PropertyDetail (MOD-04)
```

---

## RentalExposeDetail Layout

Die neue Seite `/portal/msv/vermietung/:id` verwendet:
- Identische Header-Struktur wie PropertyDetail (MOD-04)
- Card-Grid Layout (2x2) für Objektdaten
- Tabs: Daten | Beschreibung | Publikation
- KI-Beschreibungsgenerierung im Header
- Integration mit RentalPublishDialog

---

## KI-Beschreibungsgenerierung

**Edge Function:** `sot-expose-description`
- AI-basierte Immobilienbeschreibung (google/gemini-3-flash-preview)
- Prompt-Struktur: Einleitung, Lage, Ausstattung, Besonderheiten

**Integrationen:**
- `RentalListingWizard.tsx`: "Mit KI generieren" Button
- `PropertyDetail.tsx`: "Beschreibung generieren" Button im Header
- `RentalExposeDetail.tsx`: Beide Buttons (Header + Beschreibung-Tab)

---

## Dateien geändert

| Datei | Aenderung |
|-------|-----------|
| `src/components/shared/PropertyTable.tsx` | NEU - Master-Komponente |
| `src/components/shared/index.ts` | Export hinzugefügt |
| `src/pages/portal/msv/ObjekteTab.tsx` | REFACTOR - PropertyTable |
| `src/pages/portal/msv/VermietungTab.tsx` | REFACTOR - PropertyTable + Row-Navigation |
| `src/pages/portal/msv/MieteingangTab.tsx` | UPDATE - Eye-Button + Konsistenz |
| `src/pages/portal/msv/RentalExposeDetail.tsx` | NEU - Vermietungs-Exposé Seite |
| `src/pages/portfolio/PropertyDetail.tsx` | UPDATE - Button-Layout korrigiert |
| `src/App.tsx` | UPDATE - Route hinzugefügt |

---

## Source of Truth: MOD-04 → MOD-05

```
MOD-04 (Immobilien)
  └── properties, units (Stammdaten)
       │
       └── READ-ONLY
            │
            ▼
MOD-05 (MSV)
  └── leases, rent_payments, msv_enrollments, rental_listings
```

Alle Objektdaten werden aus MOD-04 gelesen. MOD-05 schreibt NUR in eigene Tabellen.
