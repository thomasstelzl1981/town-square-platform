# Landing Page Builder Standard

**Version:** 1.0.0  
**Status:** Approved  
**Gilt für:** MOD-09, MOD-11, MOD-12, MOD-13 (NICHT MOD-10/Pets)

---

## 1. Architektur

Jedes Manager-Modul erhält einen "Landing Page"-Tab als eigenen Tile im routesManifest. Die Implementierung basiert auf der MOD-13 Referenz (`src/components/projekte/landing-page/`).

### Shared Components (geplant)
```
src/components/shared/landing-page/
├── LandingPageBuilder.tsx    # 2-State-Pattern: Builder vs. Preview
├── LandingPagePreview.tsx    # Browser-Frame-Preview
├── LandingPageUrlDialog.tsx  # URL-Konfiguration
└── LandingPageAiPanel.tsx    # KI-Generierung
```

### Modul-spezifische Tabs
```
src/pages/portal/vertriebspartner/VMPartnerLandingPage.tsx    # MOD-09
src/pages/portal/finanzierungsmanager/FMLandingPage.tsx        # MOD-11
src/pages/portal/akquise-manager/AkquiseLandingPage.tsx        # MOD-12
src/components/projekte/landing-page/LandingPageTab.tsx        # MOD-13 (Referenz)
```

## 2. 2-State-Pattern

### Zustand A: Keine Landing Page
- Builder-Ansicht mit KI-Generierungsoption
- Profil-spezifische Vorschläge aus `websiteProfileManifest.ts`
- Design-Template-Auswahl (5 Templates aus `designTemplates.ts`)

### Zustand B: Landing Page existiert
- Browser-Frame-Preview
- URL-Anzeige und Kopier-Funktion
- Edit/Regenerate-Optionen
- Publish-Button

## 3. Datenmodell

Alle Landing Pages nutzen die bestehende `landing_pages` Tabelle:

| Feld | Beschreibung |
|------|-------------|
| `entity_type` | Modul-Kontext (z.B. `partner`, `finance_broker`, `acquisition_agent`, `project`) |
| `entity_id` | ID der zugehörigen Entität |
| `tenant_id` | Mandant |
| `slug` | URL-Pfad |
| `content_json` | Generierter Inhalt |
| `design_template_id` | Referenz auf Design-Template |
| `status` | `draft` / `published` |

## 4. Profil-Integration

Jedes Manager-Modul liefert seinen Kontext an den Builder:

| Modul | Profil-ID | Kontextdaten |
|-------|-----------|-------------|
| MOD-09 | `sales_partner` | Partner-Name, Katalog-Objekte, Beratungsangebote |
| MOD-11 | `finance_broker` | Berater-Profil, Leistungen, Rechner-Widget |
| MOD-12 | `acquisition_agent` | Mandate, Netzwerk, Objekt-Einreichung |
| MOD-13 | `project_developer` | Projekt-Daten, Einheiten, Investment-Rechner |

## 5. Section-Types pro Profil

Aus `src/manifests/websiteProfileManifest.ts` werden die erlaubten Sektionen pro Profil geladen. Jedes Profil definiert:
- `availableSections`: Alle nutzbaren Section-Types
- `requiredSections`: Pflicht-Sektionen (immer vorhanden)
- `sampleContent`: KI-Prompts für die Inhaltsgenerierung

## 6. Design-Templates

Die 5 bestehenden Templates aus `src/shared/website-renderer/designTemplates.ts` bleiben als visuelle Basis:
1. **Modern** — Clean, professionell, viel Weißraum
2. **Klassisch** — Seriös, konservativ, vertrauenswürdig
3. **Minimalistisch** — Schwarz-Weiß, reduziert, fokussiert
4. **Elegant** — Luxuriös, warm, hochwertig
5. **Frisch** — Jung, energetisch, einladend

## 7. Abrechnung

- Generierung: via Armstrong-Credits (`ARM.LP.GENERATE_LANDING_PAGE`, 5 Credits)
- Veröffentlichung: via Armstrong-Credits (`ARM.LP.PUBLISH`, 10 Credits)
- Keine monatlichen Hosting-Kosten für Landing Pages

## 8. Shared Website Renderer

Die folgenden Dateien bleiben als gemeinsame Basis:
- `src/shared/website-renderer/types.ts` — Section-Types und Interfaces
- `src/shared/website-renderer/designTemplates.ts` — Design-Templates
- `src/shared/website-renderer/` — Rendering-Komponenten für Zone 3

## 9. Abgrenzung

- **Landing Pages** (dieser Standard): Einzelseiten, modul-gebunden, leichtgewichtig
- **Zone 3 Websites** (Kaufy, Miety, SoT, etc.): Hardcoded, eigenständige Multi-Page-Websites
- **Pets (MOD-05)**: Hat Shop + Booking, aber KEINE Landing Page
