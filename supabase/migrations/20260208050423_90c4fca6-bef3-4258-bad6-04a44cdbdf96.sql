-- =============================================================================
-- ARMSTRONG KNOWLEDGE BASE SEED — PHASE 1 (46 Items)
-- Version: 1.0.0 | Status: published | Scope: global
-- Categories: system, real_estate, finance, tax_legal, sales, templates
-- =============================================================================

-- Delete existing seed items to allow re-seeding
DELETE FROM public.armstrong_knowledge_items 
WHERE scope = 'global' 
  AND item_code LIKE 'KB.%';

-- =============================================================================
-- KB.SYSTEM (6 Items)
-- =============================================================================

INSERT INTO public.armstrong_knowledge_items (
  item_code, category, subcategory, content_type, title_de, summary_de, content, 
  version, status, scope, confidence, sources
) VALUES

-- KB.SYSTEM.001
('KB.SYSTEM.001', 'system', 'core', 'article', 
 'Was ist Armstrong (SOT) — Rolle, Grenzen, Nutzen',
 'Definition von Armstrong als Orchestrator: erklären, vorschlagen, mit Confirm ausführen.',
 E'# Armstrong — Rolle & Grenzen

## Kurzdefinition
Armstrong ist der Assistenz- und Orchestrierungsagent innerhalb von „System of a Town". Er hilft Nutzern beim Verstehen, Strukturieren und Umsetzen — aber **nicht autonom**.

## Darf Armstrong?
- Erklären, zusammenfassen, strukturieren
- Daten lesen (nur innerhalb Rollen/Org/RLS)
- Aktionen **nur aus dem Action-Katalog** vorschlagen
- Aktionen ausführen **nur** gemäß `execution_mode` + Confirm-Gate

## Darf Armstrong NICHT?
- Actions erfinden
- Policies/KB ohne Review überschreiben
- Rechts-/Steuer-/Finanzberatung „verbindlich" leisten
- Ohne Bestätigung schreiben/versenden/teilen

## Nutzerversprechen
„Ich gebe dir klare Next Steps, prüfe Risiken, und mache es dir leicht."',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SYSTEM.002
('KB.SYSTEM.002', 'system', 'core', 'playbook',
 'Operating Model: Plan → Propose → Confirm → Execute → Log → Summarize',
 'Das Standard-Prozessmodell für Armstrong-Interaktionen.',
 E'# Armstrong Operating Model (Standard)

## 1) Plan
- Kontext: Modul, Entity, Rolle, Org, Ziele
- Risiko/Kosten prüfen

## 2) Propose
- 1–3 Lösungsvorschläge
- Passende Actions (mit Mode/Kosten)

## 3) Confirm (wenn nötig)
- „Soll ich fortfahren?" + Side Effects + Kosten

## 4) Execute
- Nur katalogisierte Actions

## 5) Log
- action_run (ohne PII-Rohtext)

## 6) Summarize
- Ergebnis + was fehlt + nächste Schritte

## Warum wichtig?
- Verhindert Black-Box-Aktionen
- Macht Armstrong steuerbar und auditierbar
- Trennt „Wissen/Regeln" von „Ausführung"',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SYSTEM.003
('KB.SYSTEM.003', 'system', 'architecture', 'article',
 'Zonen-Prinzip (Zone 1 Governance vs Zone 2 Operativ)',
 'Trennung zwischen Governance (Zone 1) und operativem Arbeiten (Zone 2).',
 E'# Zonen-Prinzip

## Zone 2: Nutzerarbeit
- Module, operativer Chat
- Immobilienakte, Finanzierung, Investment
- Interaktiver Armstrong-Chat

## Zone 1: Governance
- Audit, Policies, Knowledge Base
- Kostenübersicht, Action-Logs
- Kein Chat (nur Konsole)

## Warum Trennung?
- Klare Verantwortlichkeiten
- Auditierbarkeit
- Policies zentral verwaltbar',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SYSTEM.004
('KB.SYSTEM.004', 'system', 'governance', 'checklist',
 'Action-Checkliste: Darf ich das ausführen?',
 'Kurze Prüfliste für execution_mode, Rolle, Scope, Consent, Kosten.',
 E'# Action-Checkliste (vor Ausführung)

- [ ] Ist action_code im Katalog?
- [ ] Zone/Modul passt?
- [ ] Rolle erlaubt?
- [ ] execution_mode korrekt? (readonly/draft/confirm)
- [ ] Daten-Scope erlaubt (read/write)?
- [ ] Consent nötig? (Code vorhanden + aktiv)
- [ ] Kosten klar? (Credits-Schätzung angezeigt)
- [ ] Bei Writes: Confirm erhalten?',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SYSTEM.005
('KB.SYSTEM.005', 'system', 'governance', 'faq',
 'FAQ: Warum bestätigt man Aktionen?',
 'Erklärung des Confirm-Gate-Prinzips.',
 E'# FAQ Confirm-Gate

**Q: Warum fragt Armstrong nach Bestätigung?**

A: Weil Aktionen Nebenwirkungen haben können (Datensatz anlegen, Dokument verknüpfen, Export erstellen). Bestätigung schützt vor Fehlern und gibt Kostentransparenz.

**Q: Was passiert ohne Bestätigung?**

A: Armstrong bleibt bei Erklärung, Vorschlag oder Entwurf.',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SYSTEM.006
('KB.SYSTEM.006', 'system', 'tone', 'playbook',
 'Armstrong Tonalität: professionell, verkaufsstark, seriös',
 'Textbausteine und Kommunikationsstandards.',
 E'# Tonalität-Standard

- Klar & strukturiert (Bullet Points, kurze Sätze)
- „Mehrwert zuerst" (Zahlen, Fakten, Schritte)
- Keine Absolutheit (insb. Steuern/Recht/Finanzierung)
- Immer „Next Step" anbieten (eine konkrete Frage)

## Beispiel
„Wenn du magst, kann ich jetzt (a) die Datenqualität prüfen oder (b) eine Kurzbewertung als Entwurf erstellen."',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- =============================================================================
-- KB.REAL_ESTATE (12 Items)
-- =============================================================================

-- KB.RE.001
('KB.RE.001', 'real_estate', 'investment', 'article',
 'Kapitalanlage-Immobilie: Was zählt wirklich?',
 'Die 5 Kernfaktoren für Investment-Entscheidungen.',
 E'# Kapitalanlage — Kernfaktoren

## 5 Treiber
1. **Mikrolage** (Nachfrage, Infrastruktur, Arbeitgeber, Leerstand)
2. **Mietertrag** (Kaltmiete, Entwicklung, Index, Neuvermietbarkeit)
3. **Zustand/Risiko** (Dach, Heizung, Leitungen, WEG-Stau)
4. **Preis/Multiplikator** (Kaufpreis vs Ertrag, Instandhaltung eingepreist?)
5. **Exit** (verkaufbar in 5–10 Jahren? Zielgruppe?)

## Quick-Check Fragen
- Gibt es harte Risiken (Heizung/WEG/Sanierung)?
- Ist die Miete markt- und steigerungsfähig?
- Ist das Objekt „vermietbar" auch ohne Rabatt?',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.RE.002
('KB.RE.002', 'real_estate', 'due_diligence', 'checklist',
 'Besichtigungs-Checkliste (Investor)',
 'Prüfpunkte vor Ort: Technik, Zustand, Umfeld, Dokumente.',
 E'# Besichtigungs-Checkliste (Investor)

## Objekt
- [ ] Dach/Fassade/Fenster (Alter, sichtbare Schäden)
- [ ] Heizung/Energieträger (Typ, Baujahr, Wartung)
- [ ] Feuchte/Schimmel Indizien
- [ ] Elektro/Steigleitungen (Altbau-Risiko)
- [ ] Keller/Dämmung/Brandschutz

## Einheit
- [ ] Grundriss nutzbar?
- [ ] Bad/Küche Zustand
- [ ] Lärm/Belichtung
- [ ] Zähler/Ablesung, Warmwasser

## Umfeld
- [ ] Parken/ÖPNV/Nahversorgung
- [ ] Eindruck Nachbarschaft/Fluktuation',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.RE.003
('KB.RE.003', 'real_estate', 'due_diligence', 'playbook',
 'Dokumentenprüfung vor Kauf: Reihenfolge & Red Flags',
 'Welche Dokumente zuerst, was sind typische Dealbreaker.',
 E'# Dokumentenprüfung vor Kauf

## Reihenfolge
1. Mietvertrag + Miethistorie
2. WEG-Unterlagen (bei ETW): Protokolle, WP, Hausgeld, Instandhaltungsrücklage
3. Energieausweis (Plausibilität)
4. Grundbuch (Lasten, Rechte)
5. Baulasten/Altlasten (falls verfügbar)
6. Versicherungen/Abrechnungen

## Red Flags
- Hohe Rückstände in WEG / viele Streitigkeiten
- Große Maßnahmen ohne Rücklage
- Mietvertrag mit ungewöhnlichen Klauseln
- Ungeklärte Sondernutzungsrechte',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.RE.004
('KB.RE.004', 'real_estate', 'weg', 'article',
 'WEG & Hausgeld: Was Anleger verstehen müssen',
 'Hausgeld, Rücklage, nicht umlagefähige Kosten erklärt.',
 E'# WEG & Hausgeld

- **Hausgeld** = laufende Kosten + Rücklage (nicht alles umlagefähig)
- **Nicht umlagefähig** ist entscheidend für Cashflow
- **Protokolle** zeigen: Streit, Sanierungsdruck, Rückstandsquote

## Armstrong-Frage an Nutzer
„Hast du die letzten 3 Protokolle und den Wirtschaftsplan? Dann kann ich Red Flags herausziehen."',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.RE.005
('KB.RE.005', 'real_estate', 'analysis', 'article',
 'Mietniveau einschätzen: Markt, Potenzial, Risiko',
 'Wie man Mieten plausibilisiert und Potenziale bewertet.',
 E'# Mietniveau — Plausibilisierung

- Vergleich: ähnliche Lage/Baujahr/Größe
- Abstand zu „gefühlter Marktmiete" dokumentieren
- Risiken: sozialer Status, Leerstand, Modernisierung

## Praktikabler Ansatz
- Konservativ rechnen (Miete +0%, Kosten +, Leerstandspuffer)
- Potenzial separat als Szenario',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.RE.006
('KB.RE.006', 'real_estate', 'analysis', 'checklist',
 'Exposé in 3 Minuten lesen: die 10 Signale',
 'Schnelle Exposé-Analyse für Investoren.',
 E'# Exposé-Scan (10 Signale)

1. Kaltmiete p.a. vs Kaufpreis (Multiplikator grob)
2. Hausgeld, Rücklage, nicht umlagefähig
3. Modernisierungen (was genau, wann?)
4. Mietvertrag: Staffelmiete/Index?
5. Energieausweis (Klasse, Heizung)
6. WEG-Protokolle erwähnt?
7. Leerstand / Mietausfall?
8. Lagebeschreibung konkret oder vage?
9. Fotos: Feuchte/Altzustand Hinweise?
10. „Schnellverkauf"/„Investor only" — warum?',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.RE.007
('KB.RE.007', 'real_estate', 'valuation', 'article',
 'Bewertung: Verkehrswert vs Kaufpreis vs Ertragswert',
 'Was die Begriffe bedeuten und wie Anleger sie nutzen.',
 E'# Bewertung — Begriffe

- **Kaufpreis**: Marktpreis im Deal
- **Verkehrswert**: Gutachterlicher Marktwert (Stichtag, Annahmen)
- **Ertragswert**: Wert aus nachhaltig erzielbarem Ertrag (für Anleger zentral)

## Investor-Praxis
- Nicht nur „Wert", sondern „Rendite + Risiko" betrachten',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.RE.008
('KB.RE.008', 'real_estate', 'risk', 'article',
 'Sanierungsrisiko: Heizung, Dach, Leitungen — Ampelcheck',
 'Schnelle Ampel-Logik zur Risikoeinordnung.',
 E'# Sanierungs-Ampel (Schnell)

## 🟢 Grün
- Maßnahmen dokumentiert, Rücklage ok, keine akuten Themen

## 🟡 Gelb
- Teilmodernisierung, unklare Restlaufzeiten, moderate Rücklage

## 🔴 Rot
- Heizung alt/unklar, Dach/Fassade fällig, WEG-Protokolle voller Maßnahmen

## Frage
„Gibt es Protokolle/WP, aus denen ein Maßnahmenplan hervorgeht?"',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.RE.009
('KB.RE.009', 'real_estate', 'contracts', 'checklist',
 'Mietvertrag-Kurzcheck: Anleger-Perspektive',
 'Worauf man beim Mietvertrag als Käufer achtet.',
 E'# Mietvertrag-Kurzcheck

- Miethöhe, NK-VZ, Zahlungsweise
- Index/Staffel: sauber formuliert?
- Kaution vorhanden?
- Übergabeprotokolle / Mängel?
- Kündigungsfristen / Sondervereinbarungen

## Deal-Frage
„Gibt es Mietrückstände oder offene Mängel?"',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.RE.010
('KB.RE.010', 'real_estate', 'negotiation', 'playbook',
 'Angebotsstrategie: Wie du sicher verhandelst (Anleger)',
 'Faktenbasierte Verhandlungsstrategie für Käufer.',
 E'# Angebotsstrategie — Playbook

1. **Faktenliste** (Risiken, Kosten, Modernisierung)
2. **Angebot in 2 Stufen**:
   - A: schnell & sicher (kleiner Discount)
   - B: bei offenen Punkten (größerer Discount)
3. **Bedingungen**:
   - Unterlagen vollständig
   - Finanzierungsnachweis / Zeitplan

## Formulierung
„Wenn wir X/Y bestätigt bekommen, können wir bei Preis A in 7 Tagen notariell durchziehen."',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.RE.011
('KB.RE.011', 'real_estate', 'analysis', 'article',
 'Cashflow vs Rendite: Warum beides zählt',
 'Netto-Cashflow, Instandhaltung, nicht umlagefähige Kosten.',
 E'# Cashflow vs Rendite

- **Rendite** (brutto/netto) ist nur ein Teil
- **Cashflow** entscheidet, ob du entspannt hältst
- Instandhaltung + nicht umlagefähig + Leerstandspuffer einplanen

## Daumenregel
„Erst konservativer Cashflow, dann Upside-Szenario."',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.RE.012
('KB.RE.012', 'real_estate', 'strategy', 'checklist',
 'Objekt-Fit: Passt die Immobilie zu deinem Ziel?',
 'Matching von Investorenprofil und Objekteigenschaften.',
 E'# Objekt-Fit Check

- [ ] Ziel: Cashflow, Wertsteigerung, Steuern, Altersvorsorge?
- [ ] Haltedauer: 5/10/20 Jahre?
- [ ] Risiko-Toleranz: Sanierung/WEG/Leerstand?
- [ ] Management-Aufwand: MSV nötig?
- [ ] Exit: für wen ist das Objekt später attraktiv?',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- =============================================================================
-- KB.FINANCE (8 Items)
-- =============================================================================

-- KB.FIN.001
('KB.FIN.001', 'finance', 'basics', 'article',
 'Annuitätendarlehen in 5 Minuten',
 'Grundlagen: Rate, Zins, Tilgung, Zinsbindung.',
 E'# Annuität kurz erklärt

- Rate bleibt (meist) konstant
- Zinsanteil sinkt über Zeit, Tilgungsanteil steigt
- **Zinsbindung**: Zeitraum, in dem der Zinssatz fix ist

## Investor-Frage
„Wie wichtig ist dir Planungssicherheit vs Flexibilität?"',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.FIN.002
('KB.FIN.002', 'finance', 'basics', 'article',
 'Beleihung & Eigenkapital: Wichtige Begriffe',
 'LTV, Eigenkapital, Nebenkosten erklärt.',
 E'# Beleihung (LTV)

- **LTV** = Darlehen / Kaufpreis (vereinfacht)
- Mehr EK senkt Risiko und oft Zins
- **Nebenkosten** (Notar/GrESt/Makler) sind realer Cash-Bedarf',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.FIN.003
('KB.FIN.003', 'finance', 'preparation', 'playbook',
 'Finanzierungsfähigkeit vorbereiten: Unterlagen & Reihenfolge',
 'Schritt-für-Schritt zur Bankfähigkeit.',
 E'# Playbook: Finanzierung vorbereiten

1. **Identität & Haushalt** (Einkommen, Fixkosten)
2. **Objektunterlagen** (Exposé, Mietvertrag, WEG)
3. **Eigenkapitalnachweis**
4. **Szenario**: konservativ / realistisch / optimistisch
5. **Bankgespräch**: Ziele + Grenzen

Armstrong bietet in MOD-07: „Doc-Checklist + Readiness-Check".',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.FIN.004
('KB.FIN.004', 'finance', 'analysis', 'checklist',
 'Haushaltsrechnung Quick-Check',
 'Schnelle Prüfung der finanziellen Tragfähigkeit.',
 E'# Haushaltsrechnung — Quick

- Nettoeinkommen stabil?
- Fixkosten (Miete, Kredite, Auto, etc.)
- Puffer: mind. 10–20% frei
- **Stress-Test**: Zins +2% / Leerstand 2 Monate',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.FIN.005
('KB.FIN.005', 'finance', 'strategy', 'article',
 'Tilgung: Warum 1% vs 2% ein großer Unterschied ist',
 'Tilgungsstrategien und deren Auswirkungen.',
 E'# Tilgung

- Höhere Tilgung → schneller runter, weniger Zinsrisiko
- Niedrigere Tilgung → mehr Cashflow, aber höhere Restschuld
- **Sondertilgung** als Flexibilitätshebel',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.FIN.006
('KB.FIN.006', 'finance', 'strategy', 'faq',
 'FAQ: Welche Zinsbindung ist sinnvoll?',
 'Orientierung zur Zinsbindungswahl.',
 E'# Zinsbindung — FAQ (Orientierung)

Es gibt kein „immer richtig". Entscheidend sind:

- Risikotoleranz
- Cashflow-Puffer
- Haltedauer
- Strategie (halten/verkaufen)

## Armstrong-Formulierung
„Ich kann dir die Trade-offs erklären, die Entscheidung ist individuell."',
 '1.0.0', 'published', 'global', 'medium', '[]'::jsonb),

-- KB.FIN.007
('KB.FIN.007', 'finance', 'kpi', 'article',
 'Rendite-Rechnung: Brutto, Netto, Cash-on-Cash',
 'Welche Rendite sagt was aus und wann sie sinnvoll ist.',
 E'# Renditearten

- **Bruttorendite**: schnell, aber grob
- **Nettorendite**: nach Kosten, realistischer
- **Cash-on-Cash**: Cashflow bezogen auf eingesetztes EK

## Tipp
„Immer 1 konservatives Basisszenario rechnen."',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.FIN.008
('KB.FIN.008', 'finance', 'communication', 'script',
 'Finanzierungs-Next-Step: Bankgespräch vorbereiten (Script)',
 'Gesprächsleitfaden für das Bankgespräch.',
 E'# Bankgespräch — Script

1. **Ziel**: „Kapitalanlage, langfristig halten, konservativer Cashflow."
2. **Objekt in 3 Zahlen**: Kaufpreis, Kaltmiete p.a., Hausgeld/nicht umlagefähig
3. **EK-Plan**: Nebenkosten + Puffer
4. **Wunsch**: Zinsbindung + Tilgung + Sondertilgung
5. **Frage**: „Welche Unterlagen fehlen für eine Vorabzusage?"',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- =============================================================================
-- KB.TAX_LEGAL (4 Items) — MIT DISCLAIMER
-- =============================================================================

-- KB.TL.001
('KB.TL.001', 'tax_legal', 'vv', 'article',
 'Steuern bei Vermietung: Grundbegriffe (Orientierung)',
 'Einnahmen, Werbungskosten, AfA — nur zur Orientierung.',
 E'# WICHTIGER HINWEIS (Disclaimer)
Diese Inhalte dienen nur zur Orientierung und ersetzen keine Steuer- oder Rechtsberatung.

---

# V+V Grundlagen (Orientierung)

- **Einnahmen**: Kaltmiete, Umlagen (teilweise), sonstige
- **Werbungskosten**: Zinsen, Instandhaltung (je nach Art), Verwaltung, Fahrtkosten (regelgebunden)
- **AfA**: Abschreibung auf Gebäudewert (vereinfachtes Konzept)

## Armstrong-Standard
„Für verbindliche Auskünfte bitte Steuerberater."',
 '1.0.0', 'published', 'global', 'medium', '[]'::jsonb),

-- KB.TL.002
('KB.TL.002', 'tax_legal', 'vv', 'checklist',
 'Steuer-Checkliste vor Kauf (Orientierung)',
 'Wichtige steuerliche Prüfpunkte vor dem Immobilienkauf.',
 E'# WICHTIGER HINWEIS (Disclaimer)
Diese Inhalte dienen nur zur Orientierung und ersetzen keine Steuer- oder Rechtsberatung.

---

# Checkliste (Orientierung)

- [ ] Nutzung: Vermietung geplant? gemischt?
- [ ] Instandhaltung vs Herstellung (kann relevant sein)
- [ ] AfA-Basis: Gebäudeanteil plausibel?
- [ ] Fahrt/Verwaltung: Belege/Struktur',
 '1.0.0', 'published', 'global', 'medium', '[]'::jsonb),

-- KB.TL.003
('KB.TL.003', 'tax_legal', 'mietrecht', 'article',
 'Mietrecht Basics für Käufer (Orientierung)',
 'Grundlegende mietrechtliche Aspekte für Investoren.',
 E'# WICHTIGER HINWEIS (Disclaimer)
Diese Inhalte dienen nur zur Orientierung und ersetzen keine Rechtsberatung.

---

# Mietrecht — warum wichtig

- Mieterhöhungen folgen Regeln (Form, Fristen, Begründung)
- Kündigung/Eigenbedarf komplex',
 '1.0.0', 'published', 'global', 'medium', '[]'::jsonb),

-- KB.TL.004
('KB.TL.004', 'tax_legal', 'guardrail', 'playbook',
 'Sicher kommunizieren bei Steuer/Recht/Finanzierung (Armstrong Guardrail)',
 'Textbausteine + sichere Formulierungen.',
 E'# Guardrail-Playbook

## Erlaubte Formulierungen
- „Zur Orientierung…"
- „Typischerweise…"
- „Bitte professionell prüfen…"

## Verboten (Beispiele)
- „Das ist steuerlich immer so."
- „Das ist garantiert möglich."
- „Banken müssen…"

## Standard-Schluss
„Wenn du willst, erstelle ich dir eine Fragenliste für Steuerberater/Bank."',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- =============================================================================
-- KB.SALES (14 Items)
-- =============================================================================

-- KB.SALES.001
('KB.SALES.001', 'sales', 'methodology', 'playbook',
 'Sales Loop: Explain → Vertrauen → Next Step',
 'Seriöses Verkaufsframework für Immobilienberatung.',
 E'# Sales Loop (seriös)

1. **Klarheit**: „Was willst du erreichen?"
2. **Diagnose**: Zahlen + Risiken
3. **Nutzen**: „Was gewinnt der Kunde?"
4. **Next Step**: Eine konkrete, kleine Handlung
5. **Confirm**: Nur bei Side Effects',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SALES.002
('KB.SALES.002', 'sales', 'scripts', 'script',
 'Gesprächs-Script: Erstkontakt Kapitalanlage (5–7 Minuten)',
 'Strukturierter Gesprächsleitfaden für den Erstkontakt.',
 E'# Script: Erstkontakt Kapitalanlage

## Eröffnung
„Damit ich dir passende Objekte zeigen kann: Was ist dein Ziel — Cashflow, Steuervorteil, Wertsteigerung oder Altersvorsorge?"

## Qualifizierung (3 Fragen)
1. „Welche monatliche Belastung ist für dich komfortabel?"
2. „Wie viel Eigenkapital willst du einsetzen (inkl. Nebenkosten)?"
3. „Wie ist deine Risikotoleranz bei Sanierung/WEG/Leerstand?"

## Value
„Super — dann rechnen wir konservativ und schauen, was nachhaltig passt."

## Next Step
„Soll ich als Nächstes (a) ein Suchmandat anlegen oder (b) ein konkretes Objekt durchrechnen?"',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SALES.003
('KB.SALES.003', 'sales', 'objections', 'script',
 'Script: Einwandbehandlung (Preis zu hoch / Rendite zu niedrig)',
 '3-Punkt-Framework: zustimmen, reframen, Optionen.',
 E'# Einwand: „Zu teuer / Rendite zu niedrig"

## 1. Zustimmen
„Verstehe ich — Rendite ist ein zentraler Punkt."

## 2. Reframe
„Wichtig ist: Rendite und Risiko. Bei niedrigerem Risiko kann eine niedrigere Rendite sinnvoll sein."

## 3. Optionen
„Wollen wir (a) mehr Rendite mit höherem Risiko suchen oder (b) konservativer bleiben und am Preis verhandeln?"',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SALES.004
('KB.SALES.004', 'sales', 'objections', 'script',
 'Script: Einwand (Ich will erstmal überlegen)',
 'Soft close + konkrete nächste Aktion.',
 E'# Einwand: „Ich will überlegen"

## Dann:
- Vergleichsliste anbieten
- Konservativen Cashflow rechnen
- Dokumenten-Red-Flag-Check anbieten

## Nächster Schritt
„Sollen wir einen 10-Minuten-Termin machen, nachdem du die 3 Unterlagen gesehen hast?"',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SALES.005
('KB.SALES.005', 'sales', 'qualification', 'article',
 'Qualifizierung: Investor-Typen & passende Angebote',
 'Mapping Kunde → Objektprofil (schnell).',
 E'# Investor-Typen

- **Cashflow-orientiert** (stabil, wenig Aufwand)
- **Value-Add** (Modernisierung, Upside)
- **Steuermotiviert** (nur mit Profi prüfen)
- **Portfolio-Aufbau** (Prozess & Skalierung)

## Armstrong fragt
„Was ist dir wichtiger: Stabilität oder Upside?"',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SALES.006
('KB.SALES.006', 'sales', 'discovery', 'checklist',
 'Discovery-Fragen: Die 12 besten Fragen im Verkauf',
 'Wichtige Fragen zur Bedarfsermittlung.',
 E'# Discovery-Fragen

1. Was ist dein Ziel mit der Immobilie?
2. Welchen Zeithorizont hast du?
3. Wie viel möchtest du investieren?
4. Wie wichtig ist dir Cashflow vs Wertsteigerung?
5. Welche Risiken willst du vermeiden?
6. Hast du bereits Immobilien?
7. Wie ist deine Finanzierungssituation?
8. Welche Region bevorzugst du?
9. Selbst verwalten oder MSV?
10. Was wäre ein „No-Go"?
11. Wer entscheidet mit?
12. Was ist der nächste Schritt?',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SALES.007
('KB.SALES.007', 'sales', 'closing', 'playbook',
 'Closing ohne Druck: 3 seriöse Abschlusswege',
 'Zeitplan, Alternativen, Commitment klein halten.',
 E'# 3 seriöse Closings

## 1. Timeline Close
„Wenn das passt, wann möchtest du notariell abschließen?"

## 2. Option Close
„Lieber Objekt A (stabil) oder B (mehr Upside)?"

## 3. Next-Step Close
„Sollen wir als nächstes die Finanzierungsvorabprüfung starten?"',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SALES.008
('KB.SALES.008', 'sales', 'trust', 'article',
 'Vertrauen im Immobilienverkauf: Do''s & Don''ts',
 'Wie Armstrong seriös bleibt und trotzdem verkauft.',
 E'# Vertrauen

## Do''s
- Transparent über Risiken sprechen
- Zahlen zeigen + konservativ rechnen
- Klare Next Steps

## Don''ts
- Garantierte Aussagen
- „Zu gut um wahr zu sein"
- Druck („nur heute")

## 3 wichtige Fragen
1. Exit wichtig?
2. Finanzierung schon geklärt?
3. Was wäre ein „No-Go"?',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SALES.009 (Sales Script Pack)
('KB.SALES.009', 'sales', 'follow_up', 'script',
 'Script: Follow-up nach Exposé-Versand (24h/72h)',
 'Nachfass-Texte für verschiedene Zeitpunkte.',
 E'# Follow-up nach Exposé

## 24h
„Hi [Name], kurze Rückfrage: Konntest du das Exposé schon ansehen? Wenn du magst, gebe ich dir in 5 Minuten die 3 wichtigsten Punkte (Rendite, Risiko, Next Step). Sollen wir kurz telefonieren — heute oder morgen?"

## 72h
„Hi [Name], ich wollte kurz sicherstellen, dass du alle Unterlagen hast. Was ist dir bei der Immobilie am wichtigsten: stabiler Cashflow, Upside oder möglichst wenig Aufwand? Dann kann ich dir gezielt 1–2 passende Optionen/Schritte vorschlagen."',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SALES.010
('KB.SALES.010', 'sales', 'appointments', 'script',
 'Script: Terminvereinbarung (Besichtigung/Telefon/Bank)',
 'Textbausteine für Terminvereinbarungen.',
 E'# Terminvereinbarung

## Telefon
„Passt dir ein kurzer 10–15 Minuten Call? Agenda: Zielbild, Budget/EK, Risikotoleranz, dann 1–2 passende Objekte/Next Steps. Ich kann [Option A: Datum/Uhrzeit] oder [Option B: Datum/Uhrzeit] anbieten — was ist besser?"

## Besichtigung
„Für die Besichtigung: Ich schlage vor, wir gehen die 5 Investor-Punkte durch (Zustand, WEG, Miete, Kosten, Exit). Passt [Option A] oder [Option B]?"',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SALES.011
('KB.SALES.011', 'sales', 'negotiation', 'script',
 'Script: Preisverhandlung (professionell, faktenbasiert)',
 'Strukturierte Preisverhandlung mit 2 Angebotsoptionen.',
 E'# Preisverhandlung — Rahmen

„Danke für die Unterlagen. Ich habe die Punkte konservativ kalkuliert. Aus Investorensicht gibt es drei Kosten-/Risikohebel: [A], [B], [C]."

## Angebot A (schnell & sicher)
„Wenn wir X/Y bestätigt bekommen, können wir bei Preis A in [7–14] Tagen notariell durchziehen."

## Angebot B (bei offenen Punkten)
„Wenn die Punkte offen bleiben, wäre Preis B angemessen, damit das Risiko sauber eingepreist ist."

## Abschlussfrage
„Welche Variante passt besser zu euren Erwartungen — A mit schneller Abwicklung oder B mit Risikopuffer?"',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SALES.012
('KB.SALES.012', 'sales', 'objections', 'script',
 'Script: Einwand (Ich habe schon einen Berater / Konkurrenz)',
 'Differenzierung ohne Abwertung der Konkurrenz.',
 E'# Einwand: „Ich habe schon einen Berater"

„Verstehe ich komplett — wichtig ist, dass du eine gute Entscheidung triffst. Darf ich kurz fragen, was dir an der Zusammenarbeit am wichtigsten ist: (1) beste Konditionen, (2) maximale Sicherheit/Transparenz, oder (3) Tempo?

Unser Vorteil ist der Prozess: wir rechnen konservativ, dokumentieren Risiken sauber und halten die nächsten Schritte klar. 

Wenn du willst, mache ich dir einen 1-Seiter Vergleich (Objekt, KPIs, Risiken, Next Step) — dann kannst du neutral entscheiden."',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SALES.013
('KB.SALES.013', 'sales', 'closing', 'script',
 'Script: Abschluss (Reservierung / Unterlagen / nächste Schritte)',
 'Seriöser Abschluss: Commitment klein, Schritte klar.',
 E'# Script: Abschluss

„Wenn das Objekt grundsätzlich passt, würde ich vorschlagen:

1. Wir sichern die nächsten Unterlagen (Mietvertrag, WEG-Protokolle, WP).
2. Parallel machen wir die Finanzierungsvorabprüfung (damit du handlungsfähig bist).
3. Danach entscheiden wir final: Angebot/Notartermin.

Soll ich dir die Unterlagenliste direkt als Nachricht formulieren oder willst du erst eine kurze Schnellanalyse (1 Seite) zur Entscheidung?"',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.SALES.014
('KB.SALES.014', 'sales', 'process', 'playbook',
 'Playbook: Verkaufs-Pipeline (Stages, KPIs, Cadence)',
 'Minimal-Pipeline für Kapitalanlage-Vertrieb.',
 E'# Pipeline (Minimal)

## Stages
1. Lead neu
2. Qualifiziert (Ziel, Budget, EK, Risiko klar)
3. Exposé gesendet
4. Termin (Call/Besichtigung)
5. Unterlagen vollständig
6. Finanzierung ready
7. Angebot/Verhandlung
8. Notar / Abschluss
9. After-Sales (Onboarding / Verwaltung)

## KPIs (einfach)
- Response-Rate nach Exposé
- Terminquote
- Time-to-Decision
- Abschlussquote pro Stage

## Cadence (Nachfassen)
- 24h nach Exposé
- 72h nach Exposé
- 7 Tage: Abschlussfrage / Alternative anbieten',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- =============================================================================
-- KB.TEMPLATES (2 Items)
-- =============================================================================

-- KB.TPL.001
('KB.TPL.001', 'templates', 'analysis', 'article',
 'Template: Objekt-Schnellanalyse (1 Seite)',
 'Struktur für eine kurze Analyse: Zahlen, Risiken, Next Steps.',
 E'# Objekt-Schnellanalyse Template

## 1) Eckdaten
- Kaufpreis:
- Kaltmiete p.a.:
- Hausgeld / nicht umlagefähig:
- Zustand / Maßnahmen:

## 2) KPIs (konservativ)
- Brutto:
- Netto (grob):
- Cashflow (mit Puffer):

## 3) Risiken
- WEG / Sanierung:
- Miete / Leerstand:
- Dokumente fehlen:

## 4) Empfehlung
- „Go" wenn:
- „No-Go" wenn:
- Nächster Schritt:',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb),

-- KB.TPL.002
('KB.TPL.002', 'templates', 'due_diligence', 'checklist',
 'Template: Fragenliste an Makler/Verkäufer (Due Diligence)',
 'Standardfragen für die Unterlagenbeschaffung.',
 E'# Fragenliste (Makler/Verkäufer)

- Bitte Mietvertrag + Mietzahlungen (letzte 12 Monate)
- WEG: Wirtschaftsplan, Hausgeldaufstellung, Rücklage, letzte 3 Protokolle
- Maßnahmen: was wurde wann gemacht? Rechnungen vorhanden?
- Energieausweis + Heizung (Baujahr, Wartung)
- Gibt es Mietrückstände/Mängel?
- Grundbuch: gibt es Besonderheiten/Lasten?',
 '1.0.0', 'published', 'global', 'high', '[]'::jsonb);

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- Total: 46 Items seeded
-- Categories: system(6), real_estate(12), finance(8), tax_legal(4), sales(14), templates(2)