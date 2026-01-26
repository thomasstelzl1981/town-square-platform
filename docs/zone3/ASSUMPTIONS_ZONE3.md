# ZONE 3 — ASSUMPTIONS LOG

**Version:** 1.0.0  
**Last Updated:** 2026-01-26

---

## Übersicht

Dieses Dokument enthält alle Annahmen, die während der Zone-3 Website-Entwicklung getroffen wurden, um ohne Rückfragen voranzukommen.

---

## Annahmen

### A1: Domain-Struktur
**Annahme:** Alle drei Websites werden initial unter relativen Pfaden im gleichen Projekt gehostet (`/kaufy`, `/sot`, `/miety`).
**Grund:** Keine Informationen über separate Deployments vorhanden.
**Alternative:** Separate Domains können später konfiguriert werden.

### A2: Routing-Präfixe
**Annahme:** Die Website-Routes verwenden die Präfixe:
- `/kaufy/*` für Kaufy
- `/sot/*` für System of a Town
- `/miety/*` für Miety
**Grund:** Klare Trennung von Zone-2 Portal-Routes (`/portal/*`) und Zone-1 Admin-Routes (`/admin/*`).

### A3: Light Mode Design
**Annahme:** Alle drei Zone-3 Websites verwenden Light Mode als Standard, unabhängig vom Dark-Mode-Default der Zone-1/Zone-2 Anwendung.
**Grund:** Marketing-Websites haben typischerweise Light Mode für bessere Lesbarkeit und Conversion.

### A4: Pricing-Werte
**Annahme:** Die angegebenen Preise (z.B. 29€, 49€, 79€) sind Platzhalter und können angepasst werden.
**Grund:** Keine finale Preisstrategie kommuniziert.

### A5: Shared Layout Components
**Annahme:** Jede Brand hat ein eigenes Layout-Component mit Header und Footer.
**Grund:** Unterschiedliche Navigation und Branding erfordern separate Layouts.

### A6: No Cross-Brand Links
**Annahme:** In der Navigation einer Brand werden keine Links zu anderen Brands angezeigt (keine Kaufy-Links auf SoT-Website).
**Grund:** Klare Markentrennung gemäß Prompt-Anforderung.
**Ausnahme:** "Miety" wird auf Kaufy als Feature erwähnt (nicht als Hauptnavigation).

### A7: Auth-Routes
**Annahme:** Login/Registrierung erfolgt über die bestehende `/auth`-Route mit Query-Parameter für Source (`?source=kaufy`, `?source=sot`, `?source=miety`).
**Grund:** Wiederverwendung der bestehenden Auth-Infrastruktur.

### A8: Module-Beschreibungen
**Annahme:** Die Modul-Beschreibungen sind nutzenorientiert formuliert ohne technische Details.
**Grund:** Keine technischen Interna auf Marketing-Websites.

### A9: No Real Images
**Annahme:** Platzhalter für Bilder werden verwendet (Icons, simple SVGs).
**Grund:** Keine echten Assets bereitgestellt.

### A10: German Language Only
**Annahme:** Alle Websites sind ausschließlich auf Deutsch.
**Grund:** Alle bereitgestellten Texte sind auf Deutsch.

### A11: Mobile Responsive
**Annahme:** Alle Websites sind mobile-first responsive.
**Grund:** Best Practice für Marketing-Websites.

### A12: No Cookie Banner Initially
**Annahme:** Cookie-Banner wird nicht im ersten Build implementiert.
**Grund:** Fokus auf Grundstruktur; kann später ergänzt werden.

### A13: FAQ Structure
**Annahme:** FAQs werden als Accordion implementiert.
**Grund:** Gängiges UX-Pattern für FAQ-Sections.

### A14: Contact Forms
**Annahme:** Kontaktformulare senden initial keine E-Mails, sondern zeigen Erfolgsmeldung.
**Grund:** E-Mail-Integration erfordert Backend-Konfiguration.

### A15: Chatbot-Placeholder
**Annahme:** Die Chatbot-Buttons (AQ auf Kaufy, Chat auf Miety) sind Platzhalter ohne Funktionalität.
**Grund:** Chatbot-Integration erfolgt später.

---

## Offene Fragen (für spätere Klärung)

1. Finale Domains für Produktion
2. Exakte Preisstruktur und Pakete
3. E-Mail-Template für Kontaktformulare
4. Chatbot-Integration (Provider, Flows)
5. Analytics-Tracking (Google Analytics, Plausible, etc.)
6. Cookie-Consent-Anforderungen

---

*Dieses Dokument wird bei neuen Annahmen aktualisiert.*
