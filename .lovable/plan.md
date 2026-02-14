
# Neuordnung: Manager-Module, Operative Desks und Website-Strategie

## Ausgangslage (IST)

### Manager-Module (Zone 2)

| Code | Name | Hat Desk in Z1? | Hat Website-Templates? |
|------|------|-----------------|----------------------|
| MOD-09 | Vertriebsmanager | Teilweise (Sales Desk) | Nein |
| MOD-10 | Leadmanager | Nein | Nein |
| MOD-11 | Finanzierungsmanager | Ja (FutureRoom) | Nein (hardcoded FutureRoom-Website) |
| MOD-12 | Akquisemanager | Ja (Acquiary) | Nein (hardcoded Acquiary-Website) |
| MOD-13 | Projektmanager | Teilweise (Sales Desk) | Nein (hardcoded Projekt-Landing) |

### Probleme

1. **Keine 1:1-Zuordnung** zwischen Manager-Modulen und Operative Desks
2. **Sales Desk** mischt Verantwortlichkeiten von MOD-09 und MOD-13
3. **Website-Templates** sind generisch (5 Design-Templates in `designTemplates.ts`) ohne branchenspezifische Sektionen
4. **Website Hosting** liegt unter "System" statt bei den Operative Desks
5. **Hardcoded Zone-3-Websites** (Kaufy, FutureRoom, Acquiary) existieren parallel zum Website Builder ohne Verbindung

---

## SOLL-Zustand: 1:1 Manager → Desk → Website-Profil

### Neue Operative-Desk-Struktur (Zone 1)

| Manager-Modul | Operative Desk (Z1) | Aufgabe |
|---------------|---------------------|---------|
| MOD-09 Vertriebsmanager | **Sales Desk** (bleibt) | Partner-Distribution, Listing-Governance, Lead-Routing |
| MOD-10 Leadmanager | **Lead Desk** (NEU) | Lead-Pool-Governance, Kampagnen-Monitoring, Abrechnung |
| MOD-11 Finanzierungsmanager | **FutureRoom** (bleibt) | Finanzierungsantraege, Bank-Routing, Zuweisung |
| MOD-12 Akquisemanager | **Acquiary** (bleibt) | Mandat-Governance, Objekt-Routing, Kontakt-Staging |
| MOD-13 Projektmanager | **Projekt Desk** (NEU) | Projekt-Intake, Listing-Aktivierung, Landing-Page-Governance |

Aenderungen gegenueber heute:
- **Lead Desk**: Entsteht aus dem bestehenden `leadpool`-Route + `commissions`-Route, die heute lose unter "Operative Desks" haengen
- **Projekt Desk**: Entsteht aus Teilen des Sales Desk (Projekt-spezifisch) + `landing-pages`
- **Sales Desk**: Wird auf reine Partner/Vertriebs-Distribution fokussiert (MOD-09)

### Neue Website-Profil-Manifest-Datei

**Neue Datei:** `src/manifests/websiteProfileManifest.ts`

Diese Datei definiert fuer jedes Manager-Modul ein Website-Profil mit branchenspezifischen Templates, Sektionstypen und Beispiel-Inhalten:

```text
interface WebsiteProfile {
  moduleCode: string;           // z.B. 'MOD-11'
  profileId: string;            // z.B. 'finance_broker'
  displayName: string;          // z.B. 'Finanzierungsberater'
  description: string;          // Kurzbeschreibung
  defaultTemplate: string;      // Referenz auf designTemplates.ts
  availableSections: string[];  // Erlaubte Section-Types
  requiredSections: string[];   // Pflicht-Sektionen
  sampleContent: Record<string, unknown>; // Beispiel-Inhalte fuer KI-Generierung
  bookingEnabled: boolean;      // Buchungssystem verfuegbar?
  shopEnabled: boolean;         // Shop-Integration verfuegbar?
}
```

**Vordefinierte Profile (5 Manager-Module):**

| Profil-ID | Manager-Modul | Branchen-Beispiele | Besondere Sektionen |
|-----------|---------------|-------------------|---------------------|
| `sales_partner` | MOD-09 | Immobilienmakler, Vertriebspartner | Objekt-Katalog, Beratungstermin-Buchung |
| `lead_agency` | MOD-10 | Marketing-Agentur, Leadgenerator | Kampagnen-Showcase, Kontaktformular |
| `finance_broker` | MOD-11 | Finanzierungsberater, Versicherungsmakler | Rechner-Widget, Antragsstrecke |
| `acquisition_agent` | MOD-12 | Akquise-Dienstleister, Ankaufsberater | Objekt-Einreichung, Netzwerk-Seite |
| `project_developer` | MOD-13 | Bautraeger, Projektentwickler | Projekt-Galerie, Einheiten-Liste, Preisliste |

### Erweiterung der Design-Templates

Die bestehenden 5 Design-Templates (`modern`, `classic`, `minimal`, `elegant`, `fresh`) bleiben als visuelle Grundlage. Neu wird die **Kombination** aus Design-Template + Website-Profil:

```text
Website = Design-Template (Optik) + Website-Profil (Inhalt/Struktur)
```

Die `SECTION_TYPES` in `src/shared/website-renderer/types.ts` werden um profilspezifische Typen erweitert:

| Neue Section-Types | Beschreibung | Verfuegbar fuer |
|-------------------|--------------|-----------------|
| `booking` | Online-Terminbuchung | Alle Profile |
| `pricing` | Preisliste/Pakete | Alle Profile |
| `team` | Team-Vorstellung | Alle Profile |
| `calculator` | Rechner-Widget | finance_broker |
| `catalog` | Objekt-/Produkt-Katalog | sales_partner, project_developer |
| `unit_list` | Einheiten-Tabelle | project_developer |
| `application` | Bewerbungs-/Antragsformular | finance_broker, acquisition_agent |

---

## Umsetzungsplan

### Schritt 1: Website-Profil-Manifest erstellen

**Neue Datei:** `src/manifests/websiteProfileManifest.ts`
- 5 Profile (je eins pro Manager-Modul)
- Referenzen auf bestehende Design-Templates
- Section-Type-Definitionen pro Profil
- Sample-Content-Objekte fuer KI-Generierung

### Schritt 2: Section-Types erweitern

**Datei:** `src/shared/website-renderer/types.ts`
- `SECTION_TYPES` Array um neue Typen erweitern (`booking`, `pricing`, `team`, `calculator`, `catalog`, `unit_list`, `application`)
- `SECTION_TYPE_LABELS` entsprechend ergaenzen

### Schritt 3: Operative-Desk-Struktur in Zone 1 bereinigen

**Datei:** `src/manifests/routesManifest.ts` (Zone 1 Routes)
- Lead Desk Route hinzufuegen (`lead-desk`) — fasst `leadpool` + `commissions` zusammen
- Projekt Desk Route hinzufuegen (`projekt-desk`) — fasst `landing-pages` + Projekt-Governance zusammen
- `website-hosting` von "System" nach "Operative Desks" verschieben (logisch via AdminSidebar-Kategorisierung)

**Datei:** `src/components/admin/AdminSidebar.tsx`
- `getRouteCategory()`: `lead-desk` und `projekt-desk` unter `desks` einordnen
- `website-hosting` von `system` nach `desks` verschieben
- `shouldShowInNav()`: Neue Desk-Eintraege aufnehmen

**Neue Dateien:**
- `src/pages/admin/desks/LeadDesk.tsx` — Lead-Governance-Dashboard
- `src/pages/admin/desks/ProjektDesk.tsx` — Projekt-Governance-Dashboard

**Datei:** `src/pages/admin/desks/index.ts`
- Neue Exports: `LeadDesk`, `ProjektDesk`

**Datei:** `src/router/ManifestRouter.tsx`
- Neue Component-Mappings fuer `LeadDeskDashboard`, `ProjektDeskDashboard`

### Schritt 4: Desk-Manifest erstellen

**Neue Datei:** `src/manifests/operativeDeskManifest.ts`

Zentrales Mapping zwischen Manager-Modul, Operative Desk und Website-Profil:

```text
interface OperativeDeskDefinition {
  deskId: string;              // z.B. 'sales-desk'
  displayName: string;         // z.B. 'Sales Desk'
  managerModuleCode: string;   // z.B. 'MOD-09'
  websiteProfileId: string;    // z.B. 'sales_partner'
  route: string;               // z.B. 'sales-desk'
  icon: string;                // Lucide Icon Name
  responsibilities: string[];  // Governance-Aufgaben
}
```

### Schritt 5: Website Builder mit Profil-Auswahl verbinden

**Datei:** `src/pages/portal/website-builder/WBDashboard.tsx`
- Beim Erstellen einer Website wird das Website-Profil anhand des aktiven Manager-Moduls des Tenants vorgeschlagen
- Template-Galerie zeigt nur die fuer das Profil erlaubten Sektionen
- Sample-Content wird profilspezifisch aus dem Manifest geladen

---

## Zusammenfassung betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/websiteProfileManifest.ts` | NEU — Website-Profile pro Manager-Modul |
| `src/manifests/operativeDeskManifest.ts` | NEU — Desk ↔ Manager ↔ Profil Mapping |
| `src/shared/website-renderer/types.ts` | Erweitert — Neue Section-Types |
| `src/manifests/routesManifest.ts` | Zone 1 Routes: Lead Desk + Projekt Desk |
| `src/components/admin/AdminSidebar.tsx` | Kategorisierung: neue Desks + Hosting-Umzug |
| `src/pages/admin/desks/LeadDesk.tsx` | NEU — Lead-Governance-Dashboard |
| `src/pages/admin/desks/ProjektDesk.tsx` | NEU — Projekt-Governance-Dashboard |
| `src/pages/admin/desks/index.ts` | Erweitert — neue Exports |
| `src/router/ManifestRouter.tsx` | Erweitert — neue Component-Mappings |

### Was sich NICHT aendert

- Bestehende Desks (Sales Desk, Acquiary, FutureRoom) — bleiben, nur Scope wird praezisiert
- Design-Templates (`designTemplates.ts`) — bleiben als visuelle Basis
- Zone 3 hardcoded Websites — bleiben (Kaufy, Miety, FutureRoom, SoT, Acquiary)
- Routen der Manager-Module (Zone 2) — keine Aenderung
- Datenbank-Schema — keine neuen Tabellen in diesem Schritt
