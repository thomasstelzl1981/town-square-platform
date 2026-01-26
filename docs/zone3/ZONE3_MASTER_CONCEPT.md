# ZONE 3 — MASTER CONCEPT

**Version:** 1.0.0  
**Status:** FROZEN  
**Last Updated:** 2026-01-26

---

## 1. Übersicht

Zone 3 umfasst drei unabhängige Marketing-Websites, die als Entry-Layer für Zone 2 (User Portal) dienen und Leads generieren. Die Websites sind markengetrennt mit eigenem CI, eigener Navigation und eigener Tonalität.

---

## 2. Brand-Map

| Brand | Domain (Canonical) | Zielgruppe | Value Proposition | Module-Zugang |
|-------|-------------------|------------|-------------------|---------------|
| **KAUFY** | kaufy.app | Kapitalanleger, Vertriebspartner, Verkäufer | Marktplatz für Rendite-Immobilien + Partner-Netzwerk | MOD 01–10 |
| **System of a Town** | systemofatown.app | Vermieter, Portfoliohalter, Verwaltungsteams | KI-gestützte Immobilienverwaltung | MOD 01–08 |
| **MIETY** | miety.app | Mieter (eingeladene Nutzer) | Digitaler Mieterzugang für Dokumente + Kommunikation | Mieterzugang |

---

## 3. Design-Prinzipien (Zone 3 CI)

### 3.1 Gemeinsame Basis
- **Mode:** Light Mode (alle drei Brands)
- **Layout:** `max-w-[1400px]` Container, zentriert
- **Cards:** `rounded-3xl`, subtle shadows
- **Spacing:** 8px Grid-System
- **Typography:** System font stack, klare Hierarchie

### 3.2 Brand-spezifische Farben

| Brand | Primary | Accent | Background | Text |
|-------|---------|--------|------------|------|
| **KAUFY** | `#111111` | `#111111` | `#fafafa` | `#111111` |
| **System of a Town** | `#0f172a` | `#3b82f6` | `#f8fafc` | `#0f172a` |
| **MIETY** | `#0f172a` | `#0ea5e9` | `#f8fafc` | `#0f172a` |

### 3.3 Button-Styles
- **Primary:** Solid, `rounded-full`, brand-color
- **Secondary:** Ghost/Outline, `rounded-full`

---

## 4. Entry-Mechanik ins Portal (Zone 2)

### 4.1 CTAs
- "Portal öffnen" → `/portal` (logged-in users)
- "Registrieren" → `/auth?mode=register&source={brand}`
- "Anmelden" → `/auth?mode=login`

### 4.2 Registrierungs-Logik
- **Kaufy-Registrierung:** `source=kaufy` → Modules 01–10 sichtbar
- **SoT-Registrierung:** `source=sot` → Modules 01–08 sichtbar
- **Miety:** Nur über Einladungslink (`/auth?invite=...`)

---

## 5. SEO-Grundgerüst

### 5.1 Meta-Struktur
- Title: `{Page} | {Brand}` (max 60 chars)
- Description: Nutzen-fokussiert (max 155 chars)
- H1: Exakt ein H1 pro Seite
- H2-H6: Semantische Hierarchie

### 5.2 Strukturierte Daten
- FAQ-Snippets (JSON-LD) auf relevanten Seiten
- Organization Schema pro Brand
- WebPage Schema

---

## 6. Sitemaps

### 6.1 KAUFY (7 Seiten)
```
/kaufy                      → Home
/kaufy/vermieter           → Für Vermieter
/kaufy/verkaeufer          → Für Verkäufer
/kaufy/vertrieb            → Für Vertriebspartner
/kaufy/beratung            → Kapitalanlage-Beratung
/kaufy/meety               → Miety Integration
/kaufy/impressum           → Impressum
/kaufy/datenschutz         → Datenschutz
```

### 6.2 System of a Town (10 Seiten)
```
/sot                        → Home
/sot/produkt               → Produktübersicht
/sot/module                → Modul-Übersicht (01–08)
/sot/preise                → Preise/Pakete
/sot/use-cases             → Anwendungsfälle
/sot/ueber-uns             → Über uns
/sot/impressum             → Impressum
/sot/datenschutz           → Datenschutz
```

### 6.3 MIETY (8 Seiten)
```
/miety                      → Home
/miety/leistungen          → Leistungen
/miety/vermieter           → Für Vermieter
/miety/app                 → Miety-App
/miety/preise              → Preise
/miety/so-funktioniert     → So funktioniert Miety
/miety/kontakt             → Kontakt + FAQ
/miety/registrieren        → Registrierung
/miety/impressum           → Impressum
/miety/datenschutz         → Datenschutz
```

---

## 7. Zone 1 Quick Actions

Im Admin-Dashboard (Zone 1) werden folgende Quick Actions angezeigt:

| Action | Label | Target |
|--------|-------|--------|
| Kaufy | "Kaufy Website öffnen" | `/kaufy` |
| SoT | "System of a Town Website öffnen" | `/sot` |
| Miety | "Miety Website öffnen" | `/miety` |

---

## 8. Keine technischen Interna

Die Websites erwähnen NICHT:
- API-Endpunkte oder Nummernkreise
- Datenbank-Strukturen oder RLS
- Externe Integrationspartner (Scout24, Future Room, Meta, etc.)
- Scraper-Tools oder Worker-Architekturen

**Fokus:** Nutzen, Ergebnisse, Funktionen, Vertrauen.

---

*Dieses Dokument ist die verbindliche Grundlage für die Zone-3 Website-Entwicklung.*
