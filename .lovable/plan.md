

# Verbleibende SEO-, Analytics- und AI-Auffindbarkeits-Lücken

## Befund: Was fehlt noch?

### 1. Keine XML-Sitemaps vorhanden
Die `robots.txt` referenziert 5 Sitemaps (`sitemap-sot.xml`, `sitemap-kaufy.xml` etc.), aber **keine einzige existiert** als Datei oder wird dynamisch generiert. Google Search Console würde sofort Fehler melden. Auch Ncore und Otto² haben keine Sitemap-Referenz.

### 2. Kein Analytics / Kein Tracking
Auf **keiner einzigen Brand-Website** ist ein Analytics-System implementiert. Die Ncore-Datenschutzseite bestätigt das sogar explizit ("keine Analyse-Tools"). Ohne Analytics gibt es **null Daten** über Besucherverhalten, Conversion, Seitenaufrufe oder Absprungraten.

### 3. Keine Cross-Brand-Verlinkungen
Die Brands verlinken **nicht untereinander**. Kaufy verlinkt nicht auf SoT, FutureRoom nicht auf Acquiary, etc. Das verschenkt massiv Link-Equity innerhalb des eigenen Ökosystems. Google sieht die Brands als isolierte Inseln.

### 4. Kein BreadcrumbList-Schema
Wurde in Phase 4 als "deferred" markiert und fehlt weiterhin. Breadcrumbs verbessern die SERP-Darstellung erheblich.

### 5. Keine regelmäßigen Inhalte (Content Engine)
Nur SoT hat Ratgeber-Artikel. Kaufy, FutureRoom, Acquiary, Lennox, Ncore und Otto² haben **null redaktionellen Content**. Ohne regelmäßige neue Inhalte stagniert die SEO-Sichtbarkeit.

### 6. llms.txt nur für 5 von 7 Brands
Es gibt `llms.txt`, `llms-kaufy.txt`, `llms-futureroom.txt`, `llms-acquiary.txt`, `llms-lennox.txt` — aber **kein `llms-ncore.txt`** und **kein `llms-otto.txt`**. Diese Brands sind für KI-Crawler unsichtbar.

### 7. IndexNow nur für SoT
`sot2026indexnow.txt` existiert, aber IndexNow ist nicht für die anderen Brands konfiguriert.

### 8. Keine OG-Images
`BRAND_SEO_CONFIG` definiert `logo` als OG-Image-Fallback, aber keine Brand hat ein dediziertes `og:image` (1200×630px Social-Sharing-Bild).

---

## Empfohlener Plan

### Phase A — Kritische Infrastruktur

**A1. XML-Sitemaps generieren**
- Edge Function `sot-sitemap-generator` erstellen, die pro Brand dynamisch eine XML-Sitemap aus dem `routesManifest.ts` generiert
- Alternativ: statische XML-Dateien in `public/` für alle 7 Brands
- Sitemaps für Ncore und Otto² in `robots.txt` ergänzen

**A2. llms-ncore.txt und llms-otto.txt erstellen**
- Gleiche Struktur wie bestehende llms-*.txt Dateien
- In `robots.txt` für GPTBot/ClaudeBot/PerplexityBot registrieren

**A3. BreadcrumbList-Schema in SEOHead einbauen**
- Neues optionales Prop `breadcrumbs` in `SEOHead`
- Automatische JSON-LD-Generierung aus Pfad-Segmenten

### Phase B — Analytics (DSGVO-konform, ohne Cookie-Banner)

**B1. Datenschutzkonformes Analytics einbauen**
- Option 1: Server-side Pageview-Counter via Edge Function (eigene DB-Tabelle `page_views`, kein Cookie, kein Tracking, 100% DSGVO-konform)
- Option 2: Plausible Analytics (Cookie-frei, EU-hosted, Open Source)
- Option 3: Matomo self-hosted
- Empfehlung: **Eigene Edge Function** — keine externe Abhängigkeit, volle Kontrolle, Daten bleiben in der eigenen DB

**B2. Analytics-Dashboard im Portal**
- Neues Widget im Dashboard oder unter Services: Seitenaufrufe pro Brand, Top-Seiten, Trends

### Phase C — Cross-Brand-Verlinkungen

**C1. "Powered by" / "Ein Produkt von" Footer-Links**
- Kaufy Footer → "Ein Produkt der System of a Town GmbH" mit Link auf systemofatown.com
- Acquiary Footer → "Ein Produkt der FutureRoom GmbH" mit Link auf futureroom.online
- Lennox Footer → "Plattform: System of a Town" mit Link

**C2. Brand-Ökosystem-Sektion auf SoT**
- SoT-Startseite oder /plattform: Sektions-Block mit allen Brands + Links

### Phase D — Content Engine (regelmäßige Berichte)

**D1. KI-gestützter Content-Generator als Edge Function**
- Monatlich automatisierte Marktberichte (wie `sot-market-pulse-report` — existiert bereits!)
- Erweiterung: Pro Brand spezifische Reports generieren und als statische Seiten veröffentlichen
- Architektur: Cron-Job → Edge Function → generiert Markdown → speichert in DB-Tabelle `brand_articles`
- Frontend: `/ratgeber`-Sektion pro Brand, die aus DB liest

**D2. Ratgeber-Seiten für Sub-Brands**
- Kaufy: "Rendite bei Kapitalanlageimmobilien", "Nebenkosten für Vermieter"
- FutureRoom: "Bonitätsprüfung erklärt", "Baufinanzierung 2026"
- Acquiary: "Institutionelle Immobilienakquise", "Off-Market Deals"
- Lennox: "Hundepension vs. Hundesitter", "Reisen mit Hund"

### Phase E — OG-Images und Social Sharing

**E1. Brand-spezifische OG-Images**
- 1200×630px Social-Sharing-Bilder pro Brand in `/public/og/`
- In `BRAND_SEO_CONFIG` als Default-OG-Image hinterlegen

---

## Technische Details

- **Sitemaps**: XML-Format nach Sitemap Protocol 0.9, mit `<lastmod>`, `<changefreq>`, `<priority>`
- **Analytics-Edge-Function**: `POST /sot-page-view` mit `{brand, path, referrer, ua}`, kein Cookie, kein IP-Speicherung, aggregiert in `page_views`-Tabelle
- **Content Engine**: Nutzt bestehende `sot-market-pulse-report` als Vorlage, erweitert um Brand-spezifische Prompts
- **Cross-Brand-Links**: `rel="noopener"` + `target="_blank"` für externe Brand-Domains, interne Links als React Router `<Link>`

