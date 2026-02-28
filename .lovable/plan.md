

# SEO & LLM Audit + Maschinenlesbarkeit: ZL Wohnbau + Otto² Advisory

## Audit-Ergebnis

### ZL Wohnbau — Defizite

| Bereich | Status | Problem |
|---------|--------|---------|
| LLM-Datei | FEHLT | Keine `llms-zlwohnbau.txt` vorhanden |
| robots.txt | FEHLT | ZL Wohnbau nicht in robots.txt eingetragen |
| Sitemap | FEHLT | Kein `zlwohnbau` Brand im Sitemap-Generator |
| Sitemap-Eintrag | FEHLT | Keine `Sitemap:` Zeile in robots.txt |
| Kontaktformular | FEHLT | Nur statische Kontaktdaten, kein Formular mit Lead-Submission |
| Header-Bilder Unterseiten | FEHLT | Leistungen, Portfolio, Kontakt haben nur Text-Header (bg-slate-50) |
| Browser-Titel | FALSCH | Zeigt "Wohnraum für Mitarbeiter \| ZL Wohnbau" statt "ZL Wohnbau" als Basis |
| Ratgeber | FEHLT | Keine /ratgeber Route registriert (andere Brands haben das) |
| Content Engine | FEHLT | ZL Wohnbau nicht im Content-Engine-Cron registriert |

### Otto² Advisory — Defizite

| Bereich | Status | Problem |
|---------|--------|---------|
| LLM-Datei | OK | `llms-otto.txt` existiert |
| robots.txt | OK | Otto eingetragen |
| Sitemap | TEILWEISE | Routen-Pfade falsch: `/privathaushalte` statt `/private-haushalte` |
| Kontaktformular | OK | Formular mit Lead-Submission vorhanden |
| Header-Bilder Unterseiten | FEHLT | Unternehmer und Privathaushalte haben nur Text-Header ohne Bild |
| Ratgeber | OK | /ratgeber Route vorhanden |
| Adresse Kontakt | UNVOLLSTÄNDIG | Standort zeigt nur "Deutschland", keine Straße |

---

## Umsetzungsplan

### 1. LLM-Datei für ZL Wohnbau erstellen
- Neue Datei: `public/llms-zlwohnbau.txt`
- Inhalt: Unternehmen, Leistungen, Portfolio, Kontaktdaten, FAQ — analog zu `llms-otto.txt`

### 2. robots.txt aktualisieren
- `Allow: /llms-zlwohnbau.txt` bei Googlebot, GPTBot, PerplexityBot, ClaudeBot hinzufügen

### 3. Sitemap-Generator erweitern
- `supabase/functions/sot-sitemap-generator/index.ts`: Brand `zlwohnbau` mit Domain `https://zl-wohnbau.de` und allen 6 Routen hinzufügen
- Fehler-Meldung aktualisieren (valid brands)
- `robots.txt`: `Sitemap: https://zl-wohnbau.de/sitemap-zlwohnbau.xml` hinzufügen

### 4. Otto² Sitemap-Routen korrigieren
- `/privathaushalte` → `/private-haushalte` (muss mit tatsächlicher Route übereinstimmen)
- `/kontakt` und `/faq` mit `/ratgeber` ergänzen

### 5. Kontaktformular für ZL Wohnbau
- `ZLWohnbauKontakt.tsx` komplett überarbeiten: Formular mit Name, E-Mail, Telefon, Nachricht, Interesse (Wohnraum anfragen / Objekt anbieten / Allgemein)
- Submission an `sot-ncore-lead-submit` Edge Function mit `brand: 'zlwohnbau'`
- JSON-LD ContactPage Schema hinzufügen

### 6. Header-Bilder für Unterseiten (ZL Wohnbau)
- Leistungen, Portfolio, Kontakt: Bestehende Hero-Bilder (`heroImg`, `townImg`, `energyImg`) als subtile Hintergrundbilder in den Header-Sektionen einsetzen (wie auf der Home-Page)
- Gradient-Overlay für Lesbarkeit

### 7. Header-Bilder für Unterseiten (Otto² Advisory)
- Unternehmer-Seite: `advisoryImg` als Header-Hintergrund
- Privathaushalte-Seite: `heroFamilyImg` als Header-Hintergrund

### 8. Browser-Titel korrigieren (ZL Wohnbau Layout)
- Layout SEOHead: `title` von "Wohnraum für Mitarbeiter" auf "ZL Wohnbau" ändern, damit der Fallback-Titel `ZL Wohnbau | ZL Wohnbau` korrekt ist
- Einzelseiten überschreiben den Titel ohnehin spezifisch

### 9. Otto² Kontakt-Adresse vervollständigen
- Vollständige Adresse (Ruselstraße 16, 94327 Bogen) in OttoKontakt.tsx ergänzen

### 10. Ratgeber-Route für ZL Wohnbau registrieren
- Route `/ratgeber` und `/ratgeber/:slug` in routesManifest.ts für ZL Wohnbau hinzufügen
- Shared RatgeberListPage/RatgeberArticlePage verwenden (wie bei anderen Brands)

### Betroffene Dateien
- `public/llms-zlwohnbau.txt` (NEU)
- `public/robots.txt`
- `supabase/functions/sot-sitemap-generator/index.ts`
- `src/pages/zone3/zlwohnbau/ZLWohnbauKontakt.tsx`
- `src/pages/zone3/zlwohnbau/ZLWohnbauLeistungen.tsx`
- `src/pages/zone3/zlwohnbau/ZLWohnbauPortfolio.tsx`
- `src/pages/zone3/zlwohnbau/ZLWohnbauLayout.tsx`
- `src/pages/zone3/otto/OttoKontakt.tsx`
- `src/pages/zone3/otto/OttoUnternehmer.tsx`
- `src/pages/zone3/otto/OttoPrivateHaushalte.tsx`
- `src/manifests/routesManifest.ts` (Ratgeber-Route ZL Wohnbau)

