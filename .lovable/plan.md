

# MOD-05 Mietverwaltung (MSV) — UX-Ueberarbeitung

## Analyse

Das MSV-Modul hat 4 Tabs (Objekte, Mieteingang, Vermietung, Einstellungen), die funktional gebaut sind, aber visuell veraltet wirken:

### Probleme

**1. ObjekteTab** (Startseite)
- Hat bereits CI-Header ("MIETVERWALTUNG") — aber der ist manuell geschrieben statt via `ModulePageHeader`
- Kein visueller Kontext was MSV bietet — man sieht sofort eine nackte Tabelle
- Empty-State verweist auf "MOD-04" (technischer Jargon, nicht nutzertauglich)
- Kontextfilter-Dropdown ist funktional, aber es fehlt eine Kurzuebersicht (KPIs: Einheiten, Gesamtmiete, Leerstand)
- Kein visueller Hinweis auf die MSV-Features (Mahnung, Mietbericht etc.)

**2. MieteingangTab**
- Statistik-Karten sind zu klein und klobig (3er-Grid mit minimaler Info)
- PaywallBanner ist gut, aber optisch nicht integriert
- Tabelle ist funktional — aber die Empty-State-Row mit Strichen sieht unprofessionell aus
- Insgesamt zu trocken fuer eine Praesentation

**3. VermietungTab**
- Gut aufgebaut mit PropertyTable, Info-Card am Ende erwaehnt "MOD-04" (technisch)
- Funktional OK, braucht nur kleine CI-Anpassungen

**4. EinstellungenTab**
- Gut strukturiert mit glass-card-Pattern
- Funktional komplett — braucht kaum Aenderungen

### Hauptprobleme zusammengefasst
- **Fehlende Willkommens-/Feature-Karten** die zeigen was MSV kann
- **Technische Referenzen** ("MOD-04", "MOD-05") statt nutzerfreundliche Sprache
- **ObjekteTab** ist zu nackt — es fehlt der "Wow-Faktor" fuer die Praesentation
- **MieteingangTab** Stats-Karten sind zu klein und haben keine glass-card-Optik
- **Headers** sind teilweise manuell statt via `ModulePageHeader`-Komponente

---

## Ueberarbeitungsplan

### A. ObjekteTab — Aufwertung mit KPI-Leiste und Feature-Hinweis

**Aenderungen:**
- Header auf `ModulePageHeader` umstellen (mit Beschreibung: "Alle Objekte und Mietvertraege aus Ihrem Portfolio — verwaltet, ueberwacht, automatisiert")
- **KPI-Leiste** (3er-Grid, glass-card) oberhalb der Tabelle:
  - Einheiten gesamt (aus units-Query)
  - Aktive Mietvertraege (aus leases count)
  - Gesamtmiete kalt (Summe)
  - Optional: Leerstandsquote
- **Empty-State** ueberarbeiten: "Noch keine Immobilien vorhanden" mit CTA "Immobilie anlegen" (ohne "MOD-04")
- Kontextfilter optisch aufwerten (glass-card Wrapper)

### B. MieteingangTab — Statistiken aufwerten

**Aenderungen:**
- Stats-Karten: `glass-card`-Styling, groessere Zahlen, bessere Proportionen
- Empty-State: Die haessliche Leer-Zeile mit Strichen entfernen — stattdessen ein einladender zentrierter Empty-State mit Icon
- "MOD-04" / technische Texte durch nutzerfreundliche Sprache ersetzen

### C. VermietungTab — Kleine CI-Anpassungen

**Aenderungen:**
- Info-Card am Ende: "MOD-04 Objektdaten" durch "Ihren Immobiliendaten" ersetzen
- Sonst minimal — der Tab ist bereits gut aufgebaut

### D. EinstellungenTab — Bereits gut

**Aenderungen:**
- Keine wesentlichen Aenderungen noetig — ist bereits mit glass-card CI aufgebaut

### E. Alle Tabs — Konsistenz

- Alle manuellen h1/p-Bloecke durch `ModulePageHeader` ersetzen (ObjekteTab, MieteingangTab haben es manuell)

---

## Technische Umsetzung

### Geaenderte Dateien (3)

**1. `src/pages/portal/msv/ObjekteTab.tsx`**
- Manuellen Header durch `ModulePageHeader` ersetzen (import hinzufuegen)
- KPI-Leiste (3 glass-cards) mit Einheiten, Mietvertraege, Gesamtmiete einfuegen — berechnet aus bestehender `units`-Query
- Empty-State-Text aendern: "MOD-04" entfernen, nutzerfreundliche Sprache
- Beschreibungstext aufwerten

**2. `src/pages/portal/msv/MieteingangTab.tsx`**
- Manuellen Header durch `ModulePageHeader` ersetzen
- Stats-Karten auf `glass-card` umstellen, groessere Typografie
- Empty-State (Zeile 317-349): Die Leer-Zeile mit Strichen komplett entfernen, durch zentrierten Empty-State mit Icon und einladendem Text ersetzen
- Technische Referenzen entfernen

**3. `src/pages/portal/msv/VermietungTab.tsx`**
- Info-Card Zeile 313: "MOD-04 Objektdaten" durch "Ihren Immobiliendaten" ersetzen
- Header ist bereits gut (hat schon ModulePageHeader-Stil, nur manuell) — auf Komponente umstellen

### Keine DB-Aenderungen, keine neuen Dateien

Alle Aenderungen sind rein visuell/textlich in den bestehenden 3 Dateien. Die Daten kommen aus den bereits vorhandenen Queries.

