
# Landing Page Builder: Kompletter Flow aus Sicht des Aufteilers

## Das Problem

Der aktuelle Zustand ist ein UI-Prototyp: Man klickt "KI-Entwurf generieren", es laeuft ein Fake-Fortschrittsbalken, und danach sieht man Karten mit Demo-Daten. Es entsteht aber keine echte Website. Es gibt keinen Editing-Modus, keinen Publishing-Flow, keinen Buchungsprozess. Der Aufteiler kann nichts damit anfangen.

## Der vollstaendige Flow — Schritt fuer Schritt aus Aufteiler-Sicht

### Phase 1: Website erstellen (der "Magic"-Moment)

**Was der Aufteiler sieht:**
Der Aufteiler hat sein Projekt bereits angelegt (via Magic Intake oder manuell). Er geht auf den Reiter "Landing Page" und sieht eine Erklaerungsseite mit einem prominenten Button "Website erstellen".

**Optionaler Zwischenschritt — Unternehmens-Website abfragen:**
Bevor die Generierung startet, erscheint ein einfacher Dialog: "Moechten Sie Ihre Unternehmens-Website angeben? Wir koennen daraus weitere Informationen fuer Ihre Projekt-Website beziehen." Ein Input-Feld fuer die URL, plus "Ueberspringen" und "Weiter". Das ist ein Kann, kein Muss. Die eingegebene URL wird gespeichert und spaeter fuer den Anbieter-Tab verwendet.

**Generierung:**
Nach Klick auf "Website erstellen" laeuft die Generierung. Der Fortschrittsbalken zeigt echte Schritte an:
1. "Projektdaten werden geladen..." (Projektdaten aus `dev_projects` und `dev_project_units` lesen)
2. "Lagebeschreibung wird generiert..." (KI generiert Lagebeschreibung aus Adresse/Stadt)
3. "Anbieter-Profil wird erstellt..." (aus `developer_contexts` oder der eingegebenen Website-URL)
4. "Website wird zusammengesetzt..."

Am Ende wird ein Eintrag in der neuen `landing_pages`-Tabelle erstellt mit Status `draft`.

### Phase 2: Website-Vorschau und Bearbeitung

**Was der Aufteiler sieht:**
Nach der Generierung erscheint die Website als Browser-Frame-Vorschau — ein grosser Container im Querformat (ca. 16:10), der wie ein echtes Browserfenster aussieht:

```text
+-- rounded-2xl shadow-2xl bg-white -----------------------------------------+
|  [*] [*] [*]  residenz-am-stadtpark.kaufy.app    [Website oeffnen (neuer Tab)]|
|  =========================================================================== |
|  [Investment]  [Lage & Umgebung]  [Anbieter]  [Legal]                        |
|  =========================================================================== |
|  |                                                                         | |
|  |  HERO: Residenz am Stadtpark                                            | |
|  |  Muenchen · 24 Einheiten · 195.000 - 444.000 EUR                       | |
|  |                                                                         | |
|  |  PREISLISTE (Tabelle):                                                  | |
|  |  WE-001 | 2 Zi | 52 m² | 195.000 EUR | 4,2% | -82 EUR/Mo | [>]        | |
|  |  WE-002 | 3 Zi | 78 m² | 292.500 EUR | 3,9% | -120 EUR/Mo | [>]       | |
|  |  ...                                                                    | |
|  |                                                                         | |
|  =========================================================================== |
+------------------------------------------------------------------------------+

Unterhalb des Frames:
+-- Aktionsleiste -------------------------------------------------------+
|  [Bearbeiten (Stift-Icon)]  [Vorschau im neuen Tab]  [Veroeffentlichen]|
|  Status: Entwurf · Erstellt vor 5 Minuten                              |
+------------------------------------------------------------------------+
```

**Die 4 Seiten der Website:**

1. **Investment (Seite 1):** Hero mit Projektname, Standort, Key Facts und Bildern oben. Darunter eine Preislisten-Tabelle aller Einheiten mit Spalten: Einheit, Zimmer, Flaeche, Etage, Preis, EUR/m2, Rendite, monatliche Belastung, Status. Beim Klick auf eine Zeile oeffnet sich das Verkaufsexpose der jeweiligen Wohnung — mit der **echten SSOT Investment Engine**: InvestmentSliderPanel (Eigenkapital, zvE, Tilgung, Zins, Familienstand, Kirchensteuer), MasterGraph (40-Jahres-Projektion), Haushaltsrechnung (T-Konto), FinanzierungSummary, DetailTable40Jahre. Exakt dasselbe wie bei Kaufy, nur mit den Daten dieses Projekts.

2. **Lage und Umgebung (Seite 2):** KI-generierte Lagebeschreibung (mit Badge "KI-generiert"), basierend auf Adresse und Stadt. Highlights der Umgebung, Infrastruktur, Verkehrsanbindung. Kartenplatzhalter.

3. **Anbieter (Seite 3):** Bautraeger-Profil aus `developer_contexts`. Falls eine Website-URL angegeben wurde, wird diese verlinkt. "Ueber uns"-Text, Kontaktdaten, Referenzen.

4. **Legal und Dokumente (Seite 4):** Anbieterkennzeichnung, Impressum-Pflichtangaben, DMS-Dokumente zum Download.

**Wie kann der Aufteiler die Website bearbeiten?**

Es gibt zwei Editing-Ebenen:

**Ebene 1 — Inline-Editing (sofort verfuegbar, Phase 1):**
Unterhalb des Browser-Frames gibt es einen "Bearbeiten"-Button. Wenn der Aufteiler darauf klickt, werden die editierbaren Texte innerhalb der Website-Vorschau zu Eingabefeldern:
- Hero-Headline und Sub-Headline
- Projektbeschreibung
- Lagebeschreibung (der KI-generierte Text kann ueberschrieben werden)
- Anbieter "Ueber uns"-Text
- Kontaktdaten (E-Mail, Telefon)

Jedes editierbare Feld bekommt einen dezenten Stift-Icon-Overlay. Klick darauf oeffnet ein Inline-Textfeld oder einen kleinen Editor. Aenderungen werden in der `landing_pages`-Tabelle gespeichert (Spalten wie `hero_headline`, `hero_subheadline`, `location_description`, `about_text`, `contact_email`, `contact_phone`).

Es gibt "Speichern" und "Verwerfen"-Buttons im Edit-Modus.

**Ebene 2 — Armstrong KI-Editing (Phase 2, spaeter):**
In einer spaeteren Phase kann der Aufteiler Armstrong nutzen, um Texte zu verbessern: "Mache die Lagebeschreibung ausfuehrlicher" oder "Fuege einen Absatz ueber die Sanierung hinzu". Das ist eine Erweiterung, die auf dem bestehenden Armstrong-Framework aufbaut und hier nicht implementiert wird.

### Phase 3: Veroeffentlichen und Buchung

**Was der Aufteiler sieht:**
Wenn der Aufteiler mit der Website zufrieden ist, klickt er auf "Veroeffentlichen". Es erscheint ein Dialog mit drei Optionen:

1. **Kaufy.app Subdomain (kostenlos, 36h Vorschau):** Die Website wird sofort unter `residenz-am-stadtpark.kaufy.app` live geschaltet. Der Aufteiler hat 36 Stunden Vorschauzeit. Danach wird die Website automatisch gesperrt, es sei denn, er bucht das Landing-Page-Paket (200 EUR/Monat laut MOD-13-Spezifikation).

2. **Eigene Domain verbinden:** Der Aufteiler kann seine eigene Domain eingeben (z.B. `www.residenz-am-stadtpark.de`). Die DNS-Einrichtung erfolgt ueber die native Lovable-Domain-Anbindung — A-Record auf 185.158.133.1, TXT-Record zur Verifikation.

3. **Neue Domain buchen:** Platzhalter fuer spaeteren Domain-Registrierungs-Service.

**Der 36-Stunden-Mechanismus:**
- Bei Klick auf "Veroeffentlichen" wird `published_at = now()` und `preview_expires_at = now() + 36h` gesetzt
- Status wechselt von `draft` zu `preview`
- Eine Edge Function (Cron-Job, alle 15 Minuten) prueft: Wenn `preview_expires_at < now()` und Status noch `preview`, wird Status auf `locked` gesetzt
- Gesperrte Website zeigt: "Diese Website ist nicht mehr verfuegbar. Kontaktieren Sie den Anbieter."
- Wenn der Aufteiler bucht (manuell oder ueber Buchungs-CTA): Status wechselt zu `active`, `booked_at` wird gesetzt, keine automatische Sperre mehr
- In Zone 1 kann ein Admin die Sperre auch manuell aufheben

### Phase 4: Zone 1 — Landing Pages verwalten

**Was der Admin in Zone 1 sieht:**
Im Admin-Bereich gibt es einen neuen Sidebar-Eintrag "Landing Pages" unter der Gruppe "Operative Desks". Dort sieht der Admin eine Tabelle aller Landing Pages:

```text
| Projekt                   | Kunde (Org)        | URL-Slug                | Status  | Laeuft ab in | Aktionen              |
|---------------------------|--------------------|-------------------------|---------|--------------|-----------------------|
| Residenz am Stadtpark     | Stadtpark Wohnen   | residenz-am-stadtpark   | preview | 28:15:22     | [Oeffnen] [Entsperren]|
| Isar Lofts Sendling       | Isar Immobilien    | isar-lofts-sendling     | active  | —            | [Oeffnen] [Sperren]   |
```

Quick Action Buttons pro Zeile:
- "Website oeffnen" — oeffnet die oeffentliche URL im neuen Tab
- "Portal-Vorschau" — navigiert zum Kunden-Portal-Reiter
- "Entsperren" / "Sperren" — manueller Status-Override
- "Deaktivieren" — setzt Status auf `locked`

---

## Technische Umsetzung

### Datenbank: Neue Tabelle `landing_pages`

```text
Spalte                   | Typ          | Beschreibung
-------------------------|--------------|----------------------------------
id                       | uuid PK      | ID
project_id               | uuid FK      | FK zu dev_projects
organization_id          | uuid         | FK zu organizations
slug                     | text UNIQUE   | URL-Slug (z.B. "residenz-am-stadtpark")
status                   | text          | draft / preview / active / locked
developer_website_url    | text          | Bautraeger-Website (optional)
hero_headline            | text          | Editierbarer Titel
hero_subheadline         | text          | Editierbare Sub-Headline
location_description     | text          | KI-generierte oder editierte Lagebeschreibung
about_text               | text          | Ueber-uns-Text
contact_email            | text          | Kontakt-E-Mail
contact_phone            | text          | Kontakt-Telefon
published_at             | timestamptz   | Zeitpunkt der Veroeffentlichung
preview_expires_at       | timestamptz   | published_at + 36h
locked_at                | timestamptz   | Zeitpunkt der Sperrung
booked_at                | timestamptz   | Zeitpunkt der Buchung
created_at               | timestamptz   | Standard (default now())
updated_at               | timestamptz   | Standard (default now())
created_by               | uuid          | Ersteller
```

RLS-Policies:
- SELECT: Org-Members koennen ihre eigenen Landing Pages lesen. Admin-Rolle kann alle lesen.
- INSERT/UPDATE: Org-Members koennen ihre eigenen erstellen und bearbeiten.
- Die oeffentliche Route liest via `slug` ohne Auth (anon SELECT auf `status IN ('preview', 'active')`).

### Neue Dateien (6)

```text
src/components/projekte/landing-page/
  LandingPageWebsite.tsx            Kontextfreie Website-Kern-Komponente (4 Tabs)
  LandingPageEditOverlay.tsx        Inline-Edit-Modus fuer Texte

src/pages/zone3/projekt/
  ProjektLandingPage.tsx            Oeffentliche Route /projekt/:slug
  ProjektLandingLayout.tsx          Minimales Layout ohne Portal-Header

src/pages/admin/
  AdminLandingPages.tsx             Zone 1 Verwaltungstabelle

src/hooks/
  useLandingPage.ts                 CRUD-Hook fuer landing_pages-Tabelle
```

### Geaenderte Dateien (8)

```text
src/components/projekte/landing-page/
  LandingPageBuilder.tsx            Unternehmens-URL-Dialog vor Generierung + echte DB-Erstellung
  LandingPagePreview.tsx            Browser-Frame + Edit/Publish-Aktionsleiste
  LandingPageInvestmentTab.tsx      Preislisten-Tabelle statt Bild-Kacheln + monatl. Belastung
  LandingPageUnitExpose.tsx         Komplett ersetzen durch InvestmentExposeView (SSOT)
  LandingPageProjektTab.tsx         Umbenennung "Lage & Umgebung" + KI-Badge + editierbar
  LandingPageAnbieterTab.tsx        Website-URL-Feld + editierbarer Ueber-uns-Text
  LandingPagePublishSection.tsx     Echter Publish-Dialog mit 3 Optionen + 36h-Info

src/manifests/routesManifest.ts     Neue Routes: Zone 1 landing-pages + Zone 3 /projekt/:slug
src/components/admin/AdminSidebar   "Landing Pages" Eintrag
src/router/ManifestRouter.tsx       Neue Komponenten registrieren
```

### SSOT Investment Engine Integration

Das aktuelle `LandingPageUnitExpose.tsx` (303 Zeilen mit eigenen Slidern und Recharts-Charts) wird komplett ersetzt. Stattdessen wird die `InvestmentExposeView`-Komponente aus `@/components/investment` eingebettet — exakt wie in `Kaufy2026Expose.tsx`. Der Aufteiler-Kunde und sein Endkunde sehen dann beim Klick auf eine Wohnung dasselbe Expose wie auf Kaufy: Eigenkapital-Slider, zvE-Eingabe, Tilgung, Zins, Familienstand, Kirchensteuer, MasterGraph, Haushaltsrechnung, FinanzierungSummary, DetailTable40Jahre.

Die Unit-Daten (aus `dev_project_units` oder Demo) werden auf das `ListingData`-Interface gemappt:
- `unit.list_price` wird zu `listing.asking_price`
- `unit.rent_monthly` wird zu `listing.monthly_rent`
- `unit.area_sqm` wird zu `listing.total_area_sqm`
- `unit.unit_number` wird zu `listing.title`

### 36h-Sperr-Logik (Edge Function)

Eine Edge Function `check-landing-page-expiry` wird als Cron-Job registriert (alle 15 Minuten). Sie fuehrt aus:

```sql
UPDATE landing_pages
SET status = 'locked', locked_at = now()
WHERE status = 'preview'
  AND preview_expires_at < now()
  AND booked_at IS NULL;
```

### Oeffentliche Route

Die Route `/projekt/:slug` wird im `routesManifest.ts` als Zone-3-Route registriert. `ProjektLandingPage.tsx` liest anhand des Slugs die Landing-Page-Daten und die zugehoerigen Projektdaten aus der DB. Wenn der Status `locked` ist, wird eine Platzhalter-Seite angezeigt. Wenn `preview` oder `active`, wird `LandingPageWebsite` gerendert — dieselbe Komponente wie im Portal, nur ohne Browser-Frame.

### Umsetzungsreihenfolge (4 Nachrichten)

**Nachricht 1:** DB-Migration (`landing_pages` Tabelle + RLS) + `useLandingPage.ts` Hook

**Nachricht 2:** `LandingPageBuilder.tsx` (URL-Dialog + echte Generierung) + `LandingPagePreview.tsx` (Browser-Frame) + `LandingPageWebsite.tsx` (Kern-Komponente)

**Nachricht 3:** `LandingPageInvestmentTab.tsx` (Preisliste) + `LandingPageUnitExpose.tsx` (SSOT Engine) + `LandingPageProjektTab.tsx` + `LandingPageAnbieterTab.tsx` + `LandingPagePublishSection.tsx` (Publish-Dialog)

**Nachricht 4:** Zone 3 Route (`ProjektLandingPage` + Layout) + Zone 1 Admin (`AdminLandingPages`) + Manifest/Router + Edge Function (Cron)
