
# Landing Page Builder Standardisierung und MOD-05 Umbau zu Pets

## Zusammenfassung

Der eigenstaendige Website Builder (MOD-05) wird entfernt. Stattdessen erhaelt jedes Manager-Modul (ausser MOD-10) einen eigenen "Landing Page"-Tab. MOD-10 wird von "Leadmanager" zu "Pets" umgebaut. Der bestehende Landing Page Builder aus MOD-13 dient als Referenz-Implementierung und wird als wiederverwendbare Komponente verallgemeinert.

---

## Analyse: Zwei Builder im Vergleich

### Website Builder (MOD-05) — wird entfernt

- **Umfang**: 897 Zeilen Dashboard + 483 Zeilen Editor
- **Features**: Template-Galerie (5 Designs), KI-Inhaltsgenerierung, Firmendaten/Impressum, Bild-Upload, DnD-Section-Editor, Split-View-Editor, SEO, Hosting-Vertrag, Versions-History
- **Datenmodell**: `tenant_websites` + `sot_website_sections` + `hosting_contracts`
- **Section-Types**: 15 Typen (hero, features, about, services, testimonials, gallery, contact, footer, booking, pricing, team, calculator, catalog, unit_list, application)

### Landing Page Builder (MOD-13) — wird zur Basis

- **Umfang**: 145 Zeilen Tab + 262 Zeilen Builder + 154 Zeilen Preview + Website-Renderer
- **Features**: Projekt-Switcher (Widget-Grid), URL-Dialog, KI-Generierung (Lagebeschreibung, Anbieter-Profil), Browser-Frame-Preview, Publish-Flow
- **Datenmodell**: `landing_pages` Tabelle
- **Fokus**: Projektspezifisch mit Investment-Rechner, Einheiten-Tabelle, Anbieter-Info

### Entscheidung

Der Landing Page Builder aus MOD-13 ist der bessere Ausgangspunkt, weil er:
1. Bereits projekt-/kontextgebunden arbeitet (nicht generisch)
2. Einen klaren 2-State-Flow hat (Kein LP → Builder, LP existiert → Preview)
3. KI-Generierung mit echten Entitaetsdaten verbindet
4. Leichtgewichtiger und fokussierter ist

Die wertvollen Features des Website Builders (Section-Editor, Design-Templates, DnD) werden als optionale Erweiterung in der SPEC dokumentiert, aber nicht sofort migriert.

---

## Neue SPEC-Datei: Landing Page Builder Standard

### Neue Datei: `spec/current/02_modules/LANDING_PAGE_BUILDER_STANDARD.md`

Definiert den systemweiten Standard fuer Landing Pages in Manager-Modulen:

**Inhalt:**
1. **Architektur**: Wiederverwendbare Komponenten-Bibliothek unter `src/components/shared/landing-page/`
2. **2-State-Pattern**: Zustand A (kein LP) zeigt Builder mit KI-Generierung, Zustand B (LP existiert) zeigt Browser-Frame-Preview
3. **Profil-Integration**: Jedes Manager-Modul liefert seinen Kontext (Entitaet, Branche, Zielgruppe) an den Builder
4. **Datenmodell**: Alle Landing Pages nutzen die bestehende `landing_pages` Tabelle mit `entity_type` + `entity_id` Zuordnung
5. **Section-Types pro Profil**: Aus `websiteProfileManifest.ts` werden die erlaubten Sektionen geladen
6. **Design-Templates**: Die 5 bestehenden Templates bleiben als visuelle Basis
7. **Abrechnung**: Generierung via Armstrong-Credits
8. **Verfuegbarkeit**: MOD-09, MOD-11, MOD-12, MOD-13 (NICHT MOD-10/Pets)

---

## MOD-05: Website Builder → Pets

### Aenderungen am Routen-Manifest

**Datei**: `src/manifests/routesManifest.ts`

MOD-05 wird umbenannt und neu definiert:

```text
"MOD-05": {
  name: "Pets",
  base: "pets",
  icon: "PawPrint",
  display_order: 5,
  visibility: { default: false, org_types: ["client"], requires_activation: true },
  tiles: [
    { path: "meine-tiere", component: "PetsMeineTiere", title: "Meine Tiere", default: true },
    { path: "caring", component: "PetsCaring", title: "Caring" },
    { path: "shop", component: "PetsShop", title: "Shop" },
    { path: "fotoalbum", component: "PetsFotoalbum", title: "Fotoalbum" },
  ],
  dynamic_routes: [
    { path: ":petId", component: "PetDetailPage", title: "Tierakte", dynamic: true },
  ],
}
```

### Neue Tab-Dateien (Platzhalter)

| Datei | Beschreibung |
|-------|--------------|
| `src/pages/portal/pets/PetsMeineTiere.tsx` | Tier-Liste mit RecordCard-Pattern (wie Stammdaten/Personen) |
| `src/pages/portal/pets/PetsCaring.tsx` | Pflege-Kalender, Tierarzt-Termine, Medikamente |
| `src/pages/portal/pets/PetsShop.tsx` | Shop-Integration (Futter, Zubehoer) |
| `src/pages/portal/pets/PetsFotoalbum.tsx` | Foto-Galerie pro Tier |
| `src/pages/portal/pets/PetDetailPage.tsx` | RecordCard-Akte fuer ein einzelnes Tier |
| `src/pages/portal/PetsPage.tsx` | Modul-Router (ersetzt WebsiteBuilderPage.tsx) |

### Zone 1: Petmanager Desk (Platzhalter)

**Datei**: `src/manifests/routesManifest.ts` (Zone 1)
- Neue Route: `{ path: "petmanager", component: "PetmanagerDashboard", title: "Petmanager" }`

**Neue Datei**: `src/pages/admin/desks/PetmanagerDesk.tsx`
- Platzhalter-Dashboard analog zu LeadDesk/ProjektDesk

### Operative Desk Manifest aktualisieren

**Datei**: `src/manifests/operativeDeskManifest.ts`
- MOD-10 Lead Desk `websiteProfileId` entfernen (kein LP fuer Leads/Pets)
- Neuen Desk `petmanager` hinzufuegen fuer MOD-05

### Website Profile Manifest aktualisieren

**Datei**: `src/manifests/websiteProfileManifest.ts`
- Profil `lead_agency` (MOD-10) entfernen
- Neues Profil `pet_services` (MOD-05) hinzufuegen mit `shopEnabled: true` und `bookingEnabled: true`

---

## Landing Page Tab in Manager-Module integrieren

### MOD-09 (Vertriebsmanager)

**Datei**: `src/manifests/routesManifest.ts`
- Neuer Tile: `{ path: "landing-page", component: "VMPartnerLandingPage", title: "Landing Page" }`

**Neue Datei**: `src/pages/portal/vertriebspartner/VMPartnerLandingPage.tsx`
- Nutzt `websiteProfileManifest` Profil `sales_partner`
- Kontextdaten: Partner-Name, Katalog-Objekte, Beratungsangebote

### MOD-11 (Finanzierungsmanager)

**Datei**: `src/manifests/routesManifest.ts`
- Neuer Tile: `{ path: "landing-page", component: "FMLandingPage", title: "Landing Page" }`

**Neue Datei**: `src/pages/portal/finanzierungsmanager/FMLandingPage.tsx`
- Nutzt Profil `finance_broker`
- Kontextdaten: Berater-Profil, Leistungen, Rechner-Widget

### MOD-12 (Akquisemanager)

**Datei**: `src/manifests/routesManifest.ts`
- Neuer Tile: `{ path: "landing-page", component: "AkquiseLandingPage", title: "Landing Page" }`

**Neue Datei**: `src/pages/portal/akquise-manager/AkquiseLandingPage.tsx`
- Nutzt Profil `acquisition_agent`
- Kontextdaten: Mandate, Netzwerk, Objekt-Einreichung

### MOD-13 (Projektmanager)

Bleibt wie bisher — `LandingPageTab` ist bereits integriert und dient als Referenz.

---

## Aufraeumen: Website Builder entfernen

### Dateien die entfernt werden

| Datei | Grund |
|-------|-------|
| `src/pages/portal/WebsiteBuilderPage.tsx` | Modul-Router fuer MOD-05 alt |
| `src/pages/portal/website-builder/WBDashboard.tsx` | Durch LP-Tabs in Modulen ersetzt |
| `src/pages/portal/website-builder/WBEditor.tsx` | Durch LP-Tabs in Modulen ersetzt |
| `src/pages/portal/website-builder/WBDesign.tsx` | Nicht mehr benoetigt |
| `src/pages/portal/website-builder/WBSeo.tsx` | Nicht mehr benoetigt |
| `src/pages/portal/website-builder/WBVertrag.tsx` | Nicht mehr benoetigt |
| `src/pages/portal/website-builder/ProcessStepper.tsx` | Nicht mehr benoetigt |
| `src/pages/portal/website-builder/VersionHistory.tsx` | Nicht mehr benoetigt |
| `src/pages/portal/website-builder/DemoSections.ts` | Nicht mehr benoetigt |
| `src/pages/portal/website-builder/WebsiteThumbnail.tsx` | Nicht mehr benoetigt |

### Dateien die BLEIBEN

| Datei | Grund |
|-------|-------|
| `src/shared/website-renderer/*` | Wird weiterhin fuer Zone 3 Websites und LP-Preview genutzt |
| `src/shared/website-renderer/designTemplates.ts` | Design-Templates bleiben als Basis |
| `src/shared/website-renderer/types.ts` | Section-Types bleiben |
| `src/hooks/useWebsites.ts` | Kann fuer bestehende tenant_websites weiterverwendet werden |
| `src/hooks/useSections.ts` | Kann fuer Section-Editing weiterverwendet werden |
| `src/components/projekte/landing-page/*` | MOD-13 Referenz-Implementierung bleibt |

### Weitere Anpassungen

| Datei | Aenderung |
|-------|-----------|
| `src/router/ManifestRouter.tsx` | `website-builder` Mapping entfernen, `pets` Mapping hinzufuegen, `PetmanagerDashboard` hinzufuegen |
| `src/components/admin/AdminSidebar.tsx` | `petmanager` in ICON_MAP und Desk-Kategorie aufnehmen |
| `src/manifests/armstrongManifest.ts` | UI-Entrypoints von `/portal/website-builder` auf modul-spezifische Pfade aendern |
| `src/manifests/goldenPathProcesses.ts` | MOD-05 Prozess von Website Builder auf Pets aktualisieren |
| `src/manifests/demoDataManifest.ts` | MOD-05 Demo-Daten-Referenz aktualisieren |
| `src/pages/admin/desks/index.ts` | Export fuer PetmanagerDesk hinzufuegen |

---

## Zusammenfassung: Neue Datei-Liste

| Datei | Status |
|-------|--------|
| `spec/current/02_modules/LANDING_PAGE_BUILDER_STANDARD.md` | NEU |
| `src/pages/portal/PetsPage.tsx` | NEU |
| `src/pages/portal/pets/PetsMeineTiere.tsx` | NEU (Platzhalter) |
| `src/pages/portal/pets/PetsCaring.tsx` | NEU (Platzhalter) |
| `src/pages/portal/pets/PetsShop.tsx` | NEU (Platzhalter) |
| `src/pages/portal/pets/PetsFotoalbum.tsx` | NEU (Platzhalter) |
| `src/pages/portal/pets/PetDetailPage.tsx` | NEU (Platzhalter) |
| `src/pages/admin/desks/PetmanagerDesk.tsx` | NEU (Platzhalter) |
| `src/pages/portal/vertriebspartner/VMPartnerLandingPage.tsx` | NEU |
| `src/pages/portal/finanzierungsmanager/FMLandingPage.tsx` | NEU |
| `src/pages/portal/akquise-manager/AkquiseLandingPage.tsx` | NEU |
| `src/manifests/routesManifest.ts` | Geaendert (MOD-05 → Pets, LP-Tiles, Petmanager) |
| `src/manifests/operativeDeskManifest.ts` | Geaendert |
| `src/manifests/websiteProfileManifest.ts` | Geaendert |
| `src/router/ManifestRouter.tsx` | Geaendert |
| `src/components/admin/AdminSidebar.tsx` | Geaendert |
| `src/manifests/armstrongManifest.ts` | Geaendert |
| `src/manifests/goldenPathProcesses.ts` | Geaendert |
| `src/pages/portal/WebsiteBuilderPage.tsx` | ENTFERNT |
| `src/pages/portal/website-builder/*` (10 Dateien) | ENTFERNT |

### Was sich NICHT aendert

- Datenbank-Tabellen — keine Aenderungen
- Zone 3 hardcoded Websites (Kaufy, Miety, etc.) — bleiben
- MOD-13 LandingPageTab und Komponenten — bleiben als Referenz
- Shared Website Renderer — bleibt
- Design-Templates — bleiben
