-- ============================================================
-- KB SEED MIGRATION: Phase 1 - 49 Knowledge Items
-- ============================================================
-- This migration seeds the armstrong_knowledge_items table with
-- 49 verified knowledge base articles from src/data/kb-seeds/v1/
-- ============================================================

-- Clear existing seed data (if re-running)
DELETE FROM public.armstrong_knowledge_items 
WHERE item_code LIKE 'KB.%' 
  AND created_by IS NULL;

-- ============================================================
-- SYSTEM CATEGORY (6 items)
-- ============================================================

INSERT INTO public.armstrong_knowledge_items (
  item_code, category, content_type, title_de, summary_de, content, 
  version, status, scope, confidence, sources
) VALUES 
(
  'KB.SYSTEM.001',
  'system',
  'article',
  'Golden Path: Überblick der 10 Phasen',
  'Erklärt den strukturierten Weg durch das System of a Town von Phase 1 bis 10.',
  E'# Golden Path: Überblick der 10 Phasen\n\nDer **Golden Path** ist der optimale Weg durch System of a Town (SOT) – von der ersten Kontaktaufnahme bis zum erfolgreichen Investment.\n\n## Die 10 Phasen im Überblick\n\n### Phase 1: Onboarding\nRegistrierung und erste Orientierung im Portal. Profil anlegen, Ziele definieren.\n\n### Phase 2: Selbstauskunft\nErfassung der finanziellen Situation für die Finanzierbarkeit. Die Daten bleiben beim Nutzer.\n\n### Phase 3: Investmentsuche\nDefinieren von Suchkriterien und Aktivieren eines Suchmandats.\n\n### Phase 4: Objektanalyse\nBewertung von Angeboten mit KI-gestützter Analyse. Favoriten markieren.\n\n### Phase 5: Due Diligence\nTiefenprüfung des Wunschobjekts. Dokumente sammeln und prüfen.\n\n### Phase 6: Finanzierung\nZusammenstellen des Finanzierungspakets. Export zu Bankpartnern.\n\n### Phase 7: Notar\nBegleitung durch den Notarprozess bis zur Unterschrift.\n\n### Phase 8: Übergabe\nSchlüsselübergabe und Dokumentation. Beginn der Vermietung.\n\n### Phase 9: Verwaltung\nLaufende Verwaltung der Immobilie im Portfolio.\n\n### Phase 10: Exit oder Expansion\nVerkauf, Refinanzierung oder Kauf weiterer Objekte.\n\n## Warum der Golden Path?\n\n- **Struktur:** Jeder Schritt baut auf dem vorherigen auf\n- **Transparenz:** Klare Übersicht über den Fortschritt\n- **Effizienz:** Keine Schleifen oder Rückschritte nötig\n- **Unterstützung:** Armstrong begleitet in jeder Phase',
  '1.0.0',
  'published',
  'global',
  'verified',
  '[]'::jsonb
),
(
  'KB.SYSTEM.002',
  'system',
  'article',
  'Zonen-Architektur: Zone 1/2/3 Rollen und Grenzen',
  'Erklärt die drei Zonen des Systems und ihre unterschiedlichen Zugriffsebenen.',
  E'# Zonen-Architektur: Zone 1/2/3\n\nSystem of a Town verwendet eine strikte Zonen-Trennung für Sicherheit und klare Verantwortlichkeiten.\n\n## Zone 1 — Admin/Governance\n\n**Zugang:** Nur platform_admin und autorisierte Operatoren\n\n**Funktionen:**\n- Armstrong Console (Konfiguration)\n- Action-Overrides und Policies\n- Knowledge Base Administration\n- Billing-Übersicht\n- Audit Logs\n\n**Armstrong:** Keine Chat-Funktion, nur Governance-UI\n\n---\n\n## Zone 2 — Portal (Authentifiziert)\n\n**Zugang:** Alle authentifizierten Nutzer (org_member, org_admin)\n\n**Funktionen:**\n- Vollständiges Musterportal\n- Armstrong FULL (Chat + Actions)\n- MOD-00 bis MOD-10\n- Persönliche Daten und Dokumente\n- Mandantenfähig (Org-Isolation)\n\n**Armstrong:**\n- Voller Funktionsumfang\n- Schreibende Actions (mit Bestätigung)\n- Web-Recherche (Opt-in)\n- RAG über eigene Daten\n\n---\n\n## Zone 3 — Websites (Öffentlich)\n\n**Zugang:** Alle Besucher (anonym oder authentifiziert)\n\n**Funktionen:**\n- KAUFY, MIETY, SOT, Futureroom Websites\n- Öffentliche Rechner\n- Lead-Erfassung\n- Publizierte Inserate\n\n**Armstrong LITE:**\n- Nur readonly Actions\n- Keine Mandantendaten\n- FAQs und Erklärungen\n- Lead-Weiterleitung\n\n---\n\n## Wichtige Regeln\n\n1. **Daten fließen nie von Zone 2 nach Zone 3** (außer explizit publiziert)\n2. **Zone 1 hat keinen direkten DB-Zugriff** auf Kundendaten\n3. **RLS isoliert Mandanten** in Zone 2 vollständig\n4. **Armstrong respektiert Zonengrenzen** automatisch',
  '1.0.0',
  'published',
  'global',
  'verified',
  '[]'::jsonb
),
(
  'KB.SYSTEM.003',
  'system',
  'playbook',
  'Wie Armstrong arbeitet: Plan → Propose → Confirm → Execute → Log',
  'Schritt-für-Schritt-Anleitung zum Verständnis des Armstrong-Workflows.',
  E'# Wie Armstrong arbeitet\n\nArmstrong folgt einem strukturierten Workflow für alle Aktionen:\n\n## Der 5-Stufen-Workflow\n\n### 1. Plan (Verstehen)\nArmstrong analysiert die Anfrage:\n- Was will der Nutzer erreichen?\n- Welche Action ist passend?\n- Welche Daten werden benötigt?\n- Welche Kosten entstehen?\n\n### 2. Propose (Vorschlagen)\nArmstrong erstellt einen Vorschlag:\n- Konkreter Aktionsplan\n- Geschätzte Credits/Kosten\n- Erwartetes Ergebnis\n- Mögliche Risiken oder Hinweise\n\n### 3. Confirm (Bestätigen)\nDer Nutzer prüft und bestätigt:\n- Bei `readonly`: Automatisch (kein Gate)\n- Bei `execute_with_confirmation`: Explizite Bestätigung\n- Bei `draft_only`: Hinweis auf Review-Pflicht\n- Anzeige: \"X Credits (≈ Y €)\"\n\n### 4. Execute (Ausführen)\nArmstrong führt die Action aus:\n- Zugriff nur auf erlaubte Daten (RLS)\n- Audit-Event wird geloggt\n- Credits werden reserviert\n- Ergebnis wird zurückgegeben\n\n### 5. Log (Dokumentieren)\nVollständige Nachverfolgung:\n- `armstrong_action_runs` Eintrag\n- Input/Output (redacted)\n- Tokens, Kosten, Dauer\n- Correlation ID für Debugging',
  '1.0.0',
  'published',
  'global',
  'verified',
  '[]'::jsonb
),
(
  'KB.SYSTEM.004',
  'system',
  'faq',
  'Was ist SSOT? Warum MOD-04 Dossier die Wahrheit ist',
  'FAQ zur Single Source of Truth und der zentralen Rolle des Immobilien-Dossiers.',
  E'# FAQ: Single Source of Truth (SSOT)\n\n## Was bedeutet SSOT?\n\n**Single Source of Truth** (Einzige Wahrheitsquelle) bedeutet, dass es für jede Information genau einen autoritativen Speicherort gibt. Änderungen erfolgen nur dort.\n\n---\n\n## Warum ist das MOD-04 Dossier die SSOT für Immobilien?\n\nDas Immobilien-Dossier in MOD-04 ist die zentrale Wahrheit für alle Objektdaten:\n\n- **Stammdaten:** Adresse, Baujahr, Fläche\n- **Einheiten:** Wohnungen, Gewerbe, Stellplätze\n- **Mietverträge:** Aktuelle und historische\n- **Dokumente:** Verknüpft aus dem DMS\n- **KPIs:** Berechnet aus den Rohdaten\n\n---\n\n## Was passiert, wenn Daten an mehreren Stellen liegen?\n\n❌ **Problem:** Inkonsistenz\n- Finanzierung zeigt andere Fläche als Dossier\n- Investment-Rechner verwendet veraltete Miete\n- Export enthält widersprüchliche Werte\n\n✅ **Lösung:** SSOT-Prinzip\n- Alle Module lesen aus MOD-04\n- Änderungen nur im Dossier\n- Automatische Synchronisation',
  '1.0.0',
  'published',
  'global',
  'verified',
  '[]'::jsonb
),
(
  'KB.SYSTEM.005',
  'system',
  'article',
  'Rollenmodell: platform_admin, org_admin, org_member, agent roles',
  'Übersicht aller Rollen im System und ihrer Berechtigungen.',
  E'# Rollenmodell im System of a Town\n\n## Hierarchie der Rollen\n\n```\nplatform_admin\n    └── org_admin\n            └── org_member\n                    └── (agent_roles)\n```\n\n---\n\n## platform_admin\n\n**Scope:** Systemweit (Zone 1)\n\n**Berechtigungen:**\n- Zugriff auf Armstrong Console\n- Globale Action-Overrides\n- Knowledge Base: Alle Items publishen\n- Policies erstellen und aktivieren\n- Alle Organisationen einsehen (Governance)\n- Billing-Übersicht gesamt\n\n**Kann NICHT:**\n- Auf Kundendaten zugreifen (RLS)\n- Im Namen von Nutzern handeln\n\n---\n\n## org_admin\n\n**Scope:** Eigene Organisation (Zone 2)\n\n**Berechtigungen:**\n- Vollzugriff auf alle Org-Daten\n- Nutzer einladen und verwalten\n- Immobilien anlegen/bearbeiten\n- Finanzierungen verwalten\n- Dokumente hochladen/verknüpfen\n- KB Items für Org publishen\n\n**Armstrong:** Alle Actions der Org\n\n---\n\n## org_member\n\n**Scope:** Eigene Organisation, eingeschränkt (Zone 2)\n\n**Berechtigungen:**\n- Eigenes Profil verwalten\n- Dokumente hochladen\n- Favoriten verwalten\n- Finanzierung vorbereiten\n- Dashboard nutzen\n\n**Kann NICHT:**\n- Andere Nutzer verwalten\n- Immobilien-Stammdaten ändern\n- Mandanten-weite Einstellungen',
  '1.0.0',
  'published',
  'global',
  'verified',
  '[]'::jsonb
),
(
  'KB.SYSTEM.006',
  'system',
  'checklist',
  'Must-Not-Break Regeln (Governance)',
  'Checkliste der unveränderlichen Governance-Regeln.',
  E'# Must-Not-Break Regeln\n\nDiese Regeln dürfen unter keinen Umständen verletzt werden.\n\n---\n\n## K1: execution_mode Enum\n\n- [ ] Nur erlaubte Werte: `readonly`, `draft_only`, `execute_with_confirmation`, `execute`\n- [ ] Niemals \"confirm\" als Wert verwenden\n- [ ] `execute` nur bei: `risk_level=''low'' AND data_scopes_write=[] AND cost_model=''free''`\n\n---\n\n## K2: Credits ↔ Cents Konsistenz\n\n- [ ] 1 Credit = 0,50 EUR = 50 Cent\n- [ ] `credits_estimate × 50 = cost_hint_cents`\n- [ ] Alle `free` Actions: `credits_estimate=0`\n\n---\n\n## K3: Confirm Gate\n\n- [ ] Alle `metered`/`premium` Actions mit Writes: `execute_with_confirmation`\n- [ ] Cost Estimate vor Ausführung anzeigen\n- [ ] \"Warum kostet das?\" erklärbar\n\n---\n\n## K4: Draft Only Constraint\n\n- [ ] `draft_only` Actions schreiben keine SSOT-Änderungen\n- [ ] Research Memos immer `status=''draft''`\n- [ ] Publish nur via Review UI\n\n---\n\n## K5: Research Memo Review Gate\n\n- [ ] Armstrong darf nur Drafts erstellen\n- [ ] `valid_until` maximal 90 Tage\n- [ ] Quellen müssen dokumentiert sein\n- [ ] Publish erfordert Human Review',
  '1.0.0',
  'published',
  'global',
  'verified',
  '[]'::jsonb
);

-- ============================================================
-- REAL_ESTATE CATEGORY (17 items)
-- ============================================================

INSERT INTO public.armstrong_knowledge_items (
  item_code, category, content_type, title_de, summary_de, content, 
  version, status, scope, confidence, sources
) VALUES 
(
  'KB.RE.001',
  'real_estate',
  'article',
  'Kapitalanlage Immobilie: Grundbegriffe',
  'Erklärt die wichtigsten Begriffe für Immobilien als Kapitalanlage.',
  E'# Kapitalanlage Immobilie: Grundbegriffe\n\n## Rendite-Begriffe\n\n### Bruttomietrendite\n\n```\nBruttomietrendite = (Jahreskaltmiete / Kaufpreis) × 100\n```\n\nBeispiel: 12.000 € Jahresmiete / 200.000 € Kaufpreis = **6,0%**\n\n**Wichtig:** Enthält keine Nebenkosten oder Aufwendungen.\n\n---\n\n### Nettomietrendite\n\n```\nNettomietrendite = ((Jahreskaltmiete - Bewirtschaftungskosten) / Kaufpreis) × 100\n```\n\nBewirtschaftungskosten: Verwaltung, Instandhaltungsrücklage, nicht umlegbare NK\n\n**Realistischer** als Bruttorendite, typisch 1-2% niedriger.\n\n---\n\n### Eigenkapitalrendite\n\n```\nEK-Rendite = (Jahresüberschuss nach Zins / Eigenkapital) × 100\n```\n\nBerücksichtigt den Hebel durch Fremdfinanzierung.',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.RE.002',
  'real_estate',
  'article',
  'Standortanalyse: Mikro vs Makro',
  'Wie man einen Immobilienstandort systematisch analysiert.',
  E'# Standortanalyse: Mikro vs Makro\n\nEine fundierte Standortanalyse ist entscheidend für den Erfolg einer Immobilieninvestition.\n\n## Makrostandort (Region/Stadt)\n\n### Wirtschaftliche Faktoren\n- Arbeitslosenquote\n- Branchenstruktur (Diversifikation)\n- Große Arbeitgeber\n- Wirtschaftswachstum\n- Kaufkraftindex\n\n### Demografische Faktoren\n- Bevölkerungsentwicklung\n- Altersstruktur\n- Wanderungssaldo\n- Haushaltsgrößen\n\n### Infrastruktur\n- Verkehrsanbindung (Autobahn, ICE, Flughafen)\n- Bildungseinrichtungen (Unis = Nachfrage)\n- Gesundheitsversorgung\n- Kulturangebot\n\n---\n\n## Mikrostandort (Lage/Umgebung)\n\n### Direkte Umgebung\n- Straßenbild und Zustand\n- Nachbarbebauung\n- Grünflächen\n- Lärmbelastung\n\n### Nahversorgung\n- Supermärkte (< 500m)\n- Apotheke, Arzt\n- Schulen, Kitas\n- Gastronomie',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.RE.003',
  'real_estate',
  'checklist',
  'Objektprüfung vor Kauf: Unterlagenliste',
  'Vollständige Checkliste der benötigten Unterlagen für eine Kaufprüfung.',
  E'# Objektprüfung vor Kauf: Unterlagenliste\n\n## Grundlegende Unterlagen\n\n### Kaufvertragsentwurf\n- [ ] Vollständiger Entwurf vom Notar\n- [ ] Übergabetermin definiert\n- [ ] Zahlungsmodalitäten klar\n\n### Grundbuchauszug\n- [ ] Aktuell (nicht älter als 3 Monate)\n- [ ] Eigentümerverhältnisse\n- [ ] Abteilung II: Lasten (Wegerechte, Wohnrechte)\n- [ ] Abteilung III: Grundschulden\n\n### Flurkarte/Lageplan\n- [ ] Grundstücksgrenzen\n- [ ] Zufahrt/Wegerecht\n\n---\n\n## Gebäude & Technik\n\n### Baupläne\n- [ ] Grundrisse aller Geschosse\n- [ ] Schnitte\n- [ ] Ansichten\n\n### Baugenehmigung\n- [ ] Vorhanden und vollständig\n- [ ] Nutzung entspricht Genehmigung\n\n### Energieausweis\n- [ ] Gültiger Ausweis (10 Jahre)\n- [ ] Typ: Bedarfs- oder Verbrauchsausweis\n- [ ] Energieeffizienzklasse',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.RE.004',
  'real_estate',
  'playbook',
  'Due Diligence Workflow (privat, vermietet)',
  'Schritt-für-Schritt Prüfung vor dem Immobilienkauf.',
  E'# Due Diligence Workflow\n\n## Überblick\n\nDie Due Diligence ist die systematische Prüfung einer Immobilie vor dem Kauf. Sie minimiert Risiken und schafft Klarheit über den wahren Zustand und Wert.\n\n---\n\n## Phase 1: Dokumentenprüfung (Desk Review)\n\n### Rechtliche Dokumente\n- [ ] Grundbuchauszug (nicht älter als 3 Monate)\n- [ ] Teilungserklärung + Gemeinschaftsordnung (bei WEG)\n- [ ] Baulastenverzeichnis\n- [ ] Altlastenkataster\n\n### Wirtschaftliche Dokumente\n- [ ] Mietverträge (alle Einheiten)\n- [ ] Betriebskostenabrechnungen (3 Jahre)\n- [ ] Hausgeldabrechnungen (3 Jahre, bei WEG)\n- [ ] Wirtschaftsplan aktuell\n\n### Technische Dokumente\n- [ ] Energieausweis\n- [ ] Grundrisse + Flächenberechnung\n- [ ] Baugenehmigung\n- [ ] Modernisierungsnachweise',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.RE.005',
  'real_estate',
  'article',
  'WEG Basics: Teilungserklärung, MEA, Hausgeld, Rücklage',
  'Grundlagen des Wohnungseigentumsrechts für Kapitalanleger.',
  E'# WEG Basics\n\nDas Wohnungseigentumsgesetz (WEG) regelt das Zusammenleben in Eigentümergemeinschaften.\n\n## Teilungserklärung (TE)\n\nDie \"Verfassung\" der WEG:\n- Definiert Sonder- und Gemeinschaftseigentum\n- Legt Miteigentumsanteile (MEA) fest\n- Regelt Stimmrechte\n- Kann Sondernutzungsrechte enthalten\n\n**Prüfpunkte:**\n- Ist die Nutzung als Kapitalanlage erlaubt?\n- Gibt es Vermietungsbeschränkungen?\n- Welche Baulichen Veränderungen sind erlaubt?\n\n---\n\n## Miteigentumsanteil (MEA)\n\nDer MEA bestimmt:\n- Stimmrecht in der Versammlung\n- Anteil an Gemeinschaftskosten\n- Anteil an der Instandhaltungsrücklage\n\nTypisch: Berechnung nach Wohnfläche\n\n---\n\n## Hausgeld\n\nMonatliche Zahlung an die WEG:\n\n```\nHausgeld = Betriebskosten (umlegbar)\n         + Verwaltungskosten\n         + Instandhaltungsrücklage\n         + ggf. Sonderumlage\n```',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.RE.006',
  'real_estate',
  'article',
  'Mietvertrag Basics: Laufzeit, Staffelmiete, Indexmiete',
  'Grundlagen zu Mietvertragsgestaltung bei Kapitalanlagen.',
  E'# Mietvertrag Basics\n\n> **Hinweis:** Diese Information dient nur zur allgemeinen Orientierung und stellt keine Rechtsberatung dar.\n\n---\n\n## Unbefristeter vs. Befristeter Mietvertrag\n\n### Unbefristeter Mietvertrag (Standard)\n- Läuft auf unbestimmte Zeit\n- Vermieter kann nur aus wichtigem Grund kündigen\n- Mieter kann mit 3 Monaten Frist kündigen\n\n### Befristeter Mietvertrag (Zeitmietvertrag)\n- Nur bei sachlichem Grund möglich\n- Gründe: Eigenbedarf, Abriss/Sanierung, Werkswohnung\n- Keine ordentliche Kündigung während der Laufzeit\n\n---\n\n## Mietanpassungsmodelle\n\n### 1. Staffelmiete (§ 557a BGB)\n\nVertragliche Vereinbarung über künftige Mieterhöhungen zu festgelegten Zeitpunkten und in festgelegter Höhe.\n\n### 2. Indexmiete (§ 557b BGB)\n\nMiete wird an den Verbraucherpreisindex gekoppelt. Anpassung erfolgt automatisch bei Indexveränderung.',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.RE.009',
  'real_estate',
  'article',
  'Bewertung: Verkehrswert, Ertragswert, Vergleichswert',
  'Überblick der Bewertungsverfahren für Immobilien.',
  E'# Immobilienbewertung: Die drei Verfahren\n\n## Vergleichswertverfahren\n\n**Prinzip:** Was kosten ähnliche Immobilien in der Gegend?\n\n**Anwendung:**\n- Eigentumswohnungen\n- Standardisierte Objekte\n- Gute Datenlage\n\n---\n\n## Ertragswertverfahren\n\n**Prinzip:** Was ist die Immobilie basierend auf den Mieteinnahmen wert?\n\n**Formel (vereinfacht):**\n```\nErtragswert = Jahresreinertrag × Vervielfältiger + Bodenwert\n```\n\n**Anwendung:**\n- Renditeimmobilien\n- Mehrfamilienhäuser\n- Gewerbeimmobilien\n\n---\n\n## Sachwertverfahren\n\n**Prinzip:** Was würde es kosten, das Gebäude neu zu bauen?\n\n**Formel:**\n```\nSachwert = Bodenwert + Gebäudesachwert (abzgl. Alterswertminderung)\n```',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.RE.010',
  'real_estate',
  'checklist',
  'Energieausweis & Heizung: Was prüfen?',
  'Checkliste zur energetischen Bewertung einer Immobilie.',
  E'# Energieausweis & Heizung\n\n## Energieausweis verstehen\n\n### Arten\n\n| Typ | Basis | Aussagekraft |\n|-----|-------|--------------|\n| **Verbrauchsausweis** | Tatsächlicher Verbrauch | Nutzerabhängig |\n| **Bedarfsausweis** | Berechneter Bedarf | Gebäudebezogen |\n\n**Pflicht:** Bei Verkauf/Vermietung muss Energieausweis vorliegen.\n\n---\n\n## Checkliste Energieausweis\n\n### Grunddaten\n- [ ] Energieeffizienzklasse (A+ bis H)\n- [ ] Endenergiebedarf/-verbrauch (kWh/m²a)\n- [ ] Primärenergiebedarf\n- [ ] Ausstellungsdatum (max. 10 Jahre gültig)\n\n---\n\n## Checkliste Heizungsanlage\n\n### Allgemeine Prüfpunkte\n- [ ] **Heizungstyp:** Gas / Öl / Fernwärme / Wärmepumpe\n- [ ] **Alter der Anlage:** Jahr der Installation\n- [ ] **Austauschpflicht:** Heizungen > 30 Jahre (§ 72 GEG)\n- [ ] **Wartungsprotokoll:** Regelmäßige Wartung?',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.RE.011',
  'real_estate',
  'article',
  'Kaufnebenkosten: Notar, Grundbuch, GrESt, Makler',
  'Vollständige Übersicht aller Kaufnebenkosten in Deutschland.',
  E'# Kaufnebenkosten beim Immobilienkauf\n\nNeben dem Kaufpreis fallen erhebliche Nebenkosten an – typisch 10-15% des Kaufpreises.\n\n## Notar & Grundbuch\n\n### Notarkosten\n- Ca. **1,5-2%** des Kaufpreises\n- Beurkundung des Kaufvertrags\n- Ggf. Finanzierungsgrundschuld\n\n### Grundbuchkosten\n- Ca. **0,5%** des Kaufpreises\n- Eintragung des neuen Eigentümers\n- Eintragung der Grundschuld\n\n---\n\n## Grunderwerbsteuer (GrESt)\n\n**Bundeslandabhängig:**\n\n| Bundesland | Satz |\n|------------|------|\n| Bayern | 3,5% |\n| Baden-Württemberg | 5,0% |\n| Hessen | 6,0% |\n| Berlin | 6,0% |\n| Brandenburg | 6,5% |\n| NRW | 6,5% |\n| Schleswig-Holstein | 6,5% |',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.RE.012',
  'real_estate',
  'article',
  'Notarprozess: Ablauf von Reservierung bis Eintragung',
  'Der komplette Ablauf eines Immobilienkaufs beim Notar.',
  E'# Der Notarprozess: Schritt für Schritt\n\n## Übersicht Timeline\n\n```\nReservierung → Entwurf → Beurkundung → Fälligkeiten → Übergabe → Eintragung\n    |             |           |            |             |           |\n  Tag 0      +7-14 Tage   +14-21 Tage   +4-8 Wochen  +6-12 Wochen  +3-6 Monate\n```\n\n---\n\n## 1. Reservierung (optional)\n\n- Mündliche/schriftliche Kaufabsicht\n- Reservierungsgebühr möglich (auf Kaufpreis anrechenbar)\n- **Nicht rechtsverbindlich!**\n\n---\n\n## 2. Kaufvertragsentwurf\n\n- Notar erstellt Entwurf\n- 14 Tage Prüffrist (gesetzlich bei Verbrauchern)\n- Inhalt prüfen: Kaufpreis, Übergabedatum, Mängelhaftung, Belastungen\n\n---\n\n## 3. Beurkundung\n\n- Persönliche Anwesenheit (oder Vollmacht)\n- Notar liest vor und erklärt\n- Unterschrift aller Parteien',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.RE.013',
  'real_estate',
  'checklist',
  'Risiko-Flags: Leerstand, Instandhaltungsstau, WEG-Konflikte',
  'Warnzeichen bei der Objektprüfung erkennen.',
  E'# Risiko-Flags bei der Objektprüfung\n\n## 🔴 Hohe Priorität (Deal-Breaker prüfen)\n\n### Leerstand\n- [ ] Aktuelle Leerstandsquote > 10%?\n- [ ] Struktureller Leerstand (Lage, Zustand)?\n- [ ] Wie lange schon leer?\n- [ ] Vermietungsversuche dokumentiert?\n\n### Instandhaltungsstau\n- [ ] Dach älter als 30 Jahre ohne Sanierung?\n- [ ] Heizung älter als 20 Jahre?\n- [ ] Fassade/Fenster sanierungsbedürftig?\n- [ ] Feuchtigkeitsschäden sichtbar?\n- [ ] Rücklage < 50 €/m²?\n\n### WEG-Konflikte\n- [ ] Offene Rechtsstreitigkeiten?\n- [ ] Blockade-Situationen in Versammlung?\n- [ ] Verwalterwechsel in letzten 3 Jahren?\n- [ ] Sonderumlagen beschlossen/geplant?',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.RE.014',
  'real_estate',
  'article',
  'Mietrendite vs Gesamtrendite: Wie rechnen?',
  'Unterschied zwischen Mietrendite und tatsächlicher Rendite verstehen.',
  E'# Mietrendite vs Gesamtrendite\n\n## Bruttomietrendite\n\nDie einfachste Kennzahl:\n\n```\nBruttomietrendite = Jahreskaltmiete / Kaufpreis × 100\n```\n\n**Beispiel:**\n- Jahreskaltmiete: 12.000 €\n- Kaufpreis: 200.000 €\n- Rendite: 6,0%\n\n**Problem:** Ignoriert alle Kosten!\n\n---\n\n## Nettomietrendite\n\nBerücksichtigt Bewirtschaftungskosten:\n\n```\nNettomietrendite = (Jahreskaltmiete - Bewirtschaftungskosten) / Gesamtinvestition × 100\n```\n\n---\n\n## Eigenkapitalrendite\n\nDer Hebel durch Fremdfinanzierung:\n\n```\nEK-Rendite = (Jahresüberschuss / Eigenkapital) × 100\n```\n\n---\n\n## Gesamtrendite (IRR)\n\nBerücksichtigt alles: Laufende Cashflows, Wertsteigerung, Exit-Erlös, Zeitwert des Geldes.',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.RE.015',
  'real_estate',
  'playbook',
  'Objekt-Exposé lesen: Red Flags & Nachfragen',
  'Wie man ein Immobilienexposé kritisch analysiert.',
  E'# Exposé-Analyse: Playbook\n\n## Schritt 1: Erste Einordnung (2 Minuten)\n\n### Schnell-Check\n- [ ] Preis und Lage plausibel?\n- [ ] Rendite realistisch (> 8% = kritisch prüfen)?\n- [ ] Baujahr und Zustand passen zusammen?\n- [ ] Fotos wirken aktuell?\n\n### Erste Red Flags\n| Signal | Bedeutung |\n|--------|-----------|\n| \"Renovierungsbedarf\" | Erhebliche Kosten |\n| \"Ideal für Handwerker\" | Schlechter Zustand |\n| \"Kapitalanleger\" | Mieter eventuell problematisch |\n| Keine Innenfotos | Etwas wird versteckt |\n\n---\n\n## Schritt 2: Zahlen prüfen (5 Minuten)\n\n### Flächenangaben\n```\nWohnfläche ≠ Nutzfläche ≠ Grundfläche\n```\n\n- [ ] Wohnfläche nach WoFlV?\n- [ ] Balkone/Terrassen korrekt berechnet (50%)?\n- [ ] Keller/Dachboden separat ausgewiesen?',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.RE.019',
  'real_estate',
  'checklist',
  'Bankunterlagen für Bestandsimmobilien',
  'Was die Bank für die Finanzierung einer Bestandsimmobilie benötigt.',
  E'# Bankunterlagen: Bestandsimmobilie\n\n> Vollständige Checkliste der objektbezogenen Unterlagen für die Finanzierung.\n\n---\n\n## Grundstück\n\n- [ ] Aktueller Grundbuchauszug (nicht älter als 3 Monate)\n- [ ] Flurkarte / Lageplan\n- [ ] Altlastenauskunft (bei Bedarf)\n\n---\n\n## Gebäude\n\n### Baubeschreibung & Pläne\n- [ ] Grundrisse aller Geschosse (maßstabsgetreu)\n- [ ] Schnitt\n- [ ] Ansichten\n- [ ] Wohnflächenberechnung\n- [ ] Baubeschreibung (falls vorhanden)\n\n### Genehmigungen\n- [ ] Baugenehmigung\n- [ ] Fertigstellungsanzeige / Schlussabnahme\n- [ ] Ggf. Nutzungsänderungsgenehmigung\n\n---\n\n## Bei Eigentumswohnung (WEG)\n\n- [ ] Teilungserklärung mit Aufteilungsplan\n- [ ] Gemeinschaftsordnung\n- [ ] Protokolle der letzten 3 Eigentümerversammlungen\n- [ ] Aktueller Wirtschaftsplan\n- [ ] Letzte 2-3 Hausgeldabrechnungen',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.RE.020',
  'real_estate',
  'playbook',
  'Portfolioaufbau Strategie: 1–10 Objekte',
  'Stufenmodell für den systematischen Vermögensaufbau mit Immobilien.',
  E'# Portfolioaufbau: Das Stufenmodell\n\n## Überblick\n\nDer systematische Aufbau eines Immobilienportfolios folgt einer logischen Progression.\n\n---\n\n## Stufe 1: Das erste Objekt (0 → 1)\n\n### Ziel\n- Erfahrung sammeln\n- Prozesse verstehen\n- Cashflow-neutral oder leicht positiv\n\n### Empfehlung\n| Parameter | Wert |\n|-----------|----- |\n| Kaufpreis | 80.000–150.000 € |\n| Eigenkapital | 20–30% |\n| Lage | B-Stadt, gute Lage |\n| Objekt | 2-3 Zimmer, vermietet |\n\n---\n\n## Stufe 2: Konsolidierung (1 → 3)\n\n### Ziel\n- System etablieren\n- Cashflow aufbauen\n- Bonität erhalten\n\n### Strategie\n```\n12–24 Monate zwischen Käufen\nEigenkapital aus Cashflow + Sparrate\nBewährte Finanzierungspartner nutzen\n```',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.RE.024',
  'real_estate',
  'playbook',
  'Dossier Data Quality: Missing Fields schließen',
  'Schritt-für-Schritt zur Vervollständigung des Immobilien-Dossiers.',
  E'# Dossier Data Quality verbessern\n\n## Ziel\n\nEin vollständiges Dossier ermöglicht:\n- Präzise KPI-Berechnung\n- Erfolgreiche Finanzierungsanfrage\n- Fundierte Kaufentscheidung\n\n---\n\n## Schritt 1: Status prüfen\n\nRufe `ARM.MOD04.DATA_QUALITY_CHECK` auf oder nutze die Dossier-Ansicht.\n\n### Typische Missing Fields\n\n**Stammdaten:**\n- [ ] Baujahr\n- [ ] Wohnfläche\n- [ ] Grundstücksfläche\n- [ ] Gebäudetyp\n\n**Finanzen:**\n- [ ] Kaufpreis\n- [ ] Kaufnebenkosten\n- [ ] Renovierungsbudget\n\n---\n\n## Schritt 2: Quellen identifizieren\n\n| Feld | Quelle |\n|------|--------|\n| Baujahr | Grundbuch, Exposé, Energieausweis |\n| Wohnfläche | Wohnflächenberechnung, Grundriss |\n| Kaufpreis | Kaufvertragsentwurf |\n| Miete | Mietvertrag |',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
);

-- ============================================================
-- TAX_LEGAL CATEGORY (4 items)
-- ============================================================

INSERT INTO public.armstrong_knowledge_items (
  item_code, category, content_type, title_de, summary_de, content, 
  version, status, scope, confidence, sources
) VALUES 
(
  'KB.TL.001',
  'tax_legal',
  'article',
  'Standard Disclaimer: Steuer/Recht/Finanzierung',
  'Der Standardhinweis für alle steuerlichen und rechtlichen Inhalte.',
  E'# Standard Disclaimer\n\n> **Wichtiger Hinweis**\n>\n> Die in diesem System bereitgestellten Informationen zu steuerlichen, rechtlichen und finanziellen Themen dienen ausschließlich der allgemeinen Orientierung und Information.\n>\n> Sie ersetzen keine professionelle Beratung durch:\n> - Steuerberater\n> - Rechtsanwälte\n> - Finanzierungsberater\n> - Sachverständige\n>\n> Die Informationen berücksichtigen möglicherweise nicht alle für Ihren individuellen Fall relevanten Umstände. Gesetzliche Regelungen können sich ändern.\n>\n> Für verbindliche Auskünfte und Entscheidungen in steuerlichen, rechtlichen oder finanziellen Angelegenheiten wenden Sie sich bitte an die entsprechenden Fachleute.\n>\n> System of a Town und Armstrong übernehmen keine Haftung für Entscheidungen, die auf Basis dieser Informationen getroffen werden.\n\n---\n\n## Wann wird dieser Disclaimer angezeigt?\n\nDer Disclaimer erscheint automatisch bei:\n- Allen Inhalten der Kategorie `tax_legal`\n- Finanzierungsberechnungen\n- Research Memos zu regulatorischen Themen\n- Jeder Antwort, die steuerliche oder rechtliche Implikationen hat',
  '1.0.0',
  'published',
  'global',
  'verified',
  '[]'::jsonb
),
(
  'KB.TL.002',
  'tax_legal',
  'article',
  'Vermietung & Verpachtung (V+V): Grundidee',
  'Grundlagen der Einkunftsart Vermietung und Verpachtung.',
  E'# Vermietung & Verpachtung (V+V)\n\n> **Hinweis:** Diese Information dient nur zur allgemeinen Orientierung und stellt keine Steuerberatung dar.\n\n---\n\n## Was ist V+V?\n\n**Einkünfte aus Vermietung und Verpachtung (§ 21 EStG)** sind eine der sieben Einkunftsarten im deutschen Steuerrecht.\n\nSie umfassen Einnahmen aus:\n- Vermietung von Immobilien\n- Verpachtung von Grundstücken\n- Überlassung von Rechten (z.B. Erbbaurecht)\n\n---\n\n## Grundprinzip der Besteuerung\n\n```\nMieteinnahmen\n- Werbungskosten\n= Einkünfte aus V+V\n```\n\nDiese Einkünfte werden mit dem persönlichen Steuersatz versteuert.\n\n---\n\n## Typische Werbungskosten\n\n- **AfA:** Abschreibung auf das Gebäude\n- **Zinsen:** Finanzierungskosten\n- **Betriebskosten:** Soweit nicht umgelegt\n- **Instandhaltung:** Reparaturen, Wartung\n- **Verwaltung:** Hausverwaltung, Steuerberater',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.TL.003',
  'tax_legal',
  'article',
  'AfA Basics: Gebäudeabschreibung',
  'Grundlagen der steuerlichen Abschreibung für Immobilien.',
  E'# AfA Basics: Gebäudeabschreibung\n\n> **Hinweis:** Diese Information dient nur zur allgemeinen Orientierung und stellt keine Steuerberatung dar.\n\n---\n\n## Was ist AfA?\n\n**Absetzung für Abnutzung (AfA)** = Steuerliche Abschreibung\n\nDie AfA ermöglicht es, die Anschaffungskosten des Gebäudes über die Nutzungsdauer steuerlich geltend zu machen.\n\n**Wichtig:** Nur das Gebäude wird abgeschrieben, nicht das Grundstück!\n\n---\n\n## AfA-Sätze (Stand 2024)\n\n| Gebäudetyp | Baujahr | AfA-Satz | Dauer |\n|------------|---------|----------|-------|\n| Wohngebäude | bis 1924 | 2,5% | 40 Jahre |\n| Wohngebäude | 1925-2022 | 2,0% | 50 Jahre |\n| Wohngebäude | ab 2023 | 3,0% | 33 Jahre |\n| Nicht-Wohngebäude | beliebig | 3,0% | 33 Jahre |\n\n---\n\n## Berechnung\n\n### Schritt 1: Gebäudeanteil ermitteln\n\n```\nKaufpreis: 200.000 €\n- Grundstückswert: 40.000 € (Bodenrichtwert)\n= Gebäudewert: 160.000 €\n```\n\n### Schritt 2: AfA berechnen\n\n```\nGebäudewert × AfA-Satz = Jährliche AfA\n160.000 € × 2% = 3.200 €/Jahr\n```',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.TL.007',
  'tax_legal',
  'checklist',
  'Wann unbedingt Steuerberater/Anwalt einschalten',
  'Situationen, in denen professionelle Beratung unverzichtbar ist.',
  E'# Wann zum Experten?\n\n> Diese Checkliste hilft einzuschätzen, wann professionelle Beratung unverzichtbar ist.\n\n---\n\n## 🔴 Steuerberater unbedingt einschalten\n\n### Vor dem Kauf\n- [ ] Investition > 100.000 €\n- [ ] Mehrere Immobilien geplant (3-Objekt-Grenze)\n- [ ] Komplexe Finanzierungsstruktur\n- [ ] Kauf in GbR/GmbH geplant\n- [ ] Schenkung/Erbschaft involviert\n\n### Nach dem Kauf\n- [ ] Erste Steuererklärung mit Immobilie\n- [ ] Hohe Verluste (Verlustvortrag)\n- [ ] Gemischte Nutzung (privat + vermietet)\n- [ ] Denkmalschutz-Objekt\n\n---\n\n## 🔴 Rechtsanwalt unbedingt einschalten\n\n### Vor dem Kauf\n- [ ] Unklare Grundbuchsituation\n- [ ] Altlasten/Baumängel vermutet\n- [ ] Komplexe Teilungserklärung\n- [ ] Streitige WEG-Situation\n\n### Mietrecht\n- [ ] Kündigung eines Mieters\n- [ ] Mieterhöhung bei Altvertrag\n- [ ] Mängelstreit mit Mieter\n- [ ] Eigenbedarf anmelden',
  '1.0.0',
  'published',
  'global',
  'verified',
  '[]'::jsonb
);

-- ============================================================
-- FINANCE CATEGORY (10 items)
-- ============================================================

INSERT INTO public.armstrong_knowledge_items (
  item_code, category, content_type, title_de, summary_de, content, 
  version, status, scope, confidence, sources
) VALUES 
(
  'KB.FIN.001',
  'finance',
  'article',
  'Annuitätendarlehen: Begriffe (Zins, Tilgung, Rate)',
  'Grundbegriffe der Immobilienfinanzierung verständlich erklärt.',
  E'# Annuitätendarlehen verstehen\n\n> **Hinweis:** Diese Information dient nur zur allgemeinen Orientierung.\n\n---\n\n## Was ist ein Annuitätendarlehen?\n\nDas häufigste Darlehen für Immobilien. Die **Annuität** (= Rate) bleibt über die Zinsbindung konstant.\n\n```\nAnnuität = Zins + Tilgung\n```\n\n---\n\n## Die Begriffe\n\n### Darlehensbetrag\nDie Summe, die Sie von der Bank erhalten.\n\n### Sollzins (gebundener)\nDer vereinbarte Zinssatz für die Zinsbindungsfrist.\n\n### Effektivzins\nDer \"echte\" Zinssatz inkl. Nebenkosten.\n**Zum Vergleich nutzen!**\n\n### Zinsbindung\nZeitraum, für den der Zins festgeschrieben ist (typisch 10, 15, 20 Jahre).\n\n### Tilgung\nDer Teil der Rate, der das Darlehen reduziert.\n\n### Restschuld\nWas nach Ablauf der Zinsbindung noch zu zahlen ist.',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.FIN.002',
  'finance',
  'article',
  'Beleihung / LTV / Beleihungsauslauf',
  'Verstehen wie Banken den Beleihungsauslauf berechnen.',
  E'# Beleihung und Beleihungsauslauf\n\n> **Hinweis:** Diese Information dient nur zur allgemeinen Orientierung.\n\n---\n\n## Grundbegriffe\n\n### Beleihungswert\nDer Wert, den die Bank der Immobilie beimisst.\n- Konservativer als Kaufpreis\n- Typisch: 80-90% des Verkehrswerts\n- Basis für Kreditentscheidung\n\n### Beleihungsauslauf (LTV)\n\n```\nBeleihungsauslauf = Darlehen / Beleihungswert × 100\n```\n\n**LTV = Loan-to-Value**\n\n---\n\n## Bedeutung des Beleihungsauslaufs\n\n| LTV | Einordnung | Zinsaufschlag |\n|-----|------------|---------------|\n| ≤ 60% | Ausgezeichnet | Keiner |\n| 60-80% | Gut | Gering |\n| 80-90% | Akzeptabel | Moderat |\n| 90-100% | Risikoreich | Deutlich |\n| > 100% | Vollfinanzierung + NK | Hoch |',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.FIN.003',
  'finance',
  'article',
  'Zinsbindung: Chancen und Risiken',
  'Wie die Wahl der Zinsbindungsdauer die Finanzierung beeinflusst.',
  E'# Zinsbindung verstehen\n\n> **Hinweis:** Diese Information dient nur zur allgemeinen Orientierung.\n\n---\n\n## Was ist Zinsbindung?\n\nDie Zinsbindung ist der Zeitraum, in dem der vereinbarte Zinssatz garantiert bleibt. Danach wird der Zins neu verhandelt (Anschlussfinanzierung).\n\n---\n\n## Übliche Zinsbindungsfristen\n\n| Frist | Typischer Aufschlag | Eignung |\n|-------|---------------------|--------|\n| 5 Jahre | Basis | Spekulation auf sinkende Zinsen |\n| 10 Jahre | +0,2–0,4% | Standard in Deutschland |\n| 15 Jahre | +0,4–0,7% | Mehr Sicherheit |\n| 20 Jahre | +0,6–1,0% | Maximale Planbarkeit |\n\n---\n\n## Sonderkündigungsrecht (§ 489 BGB)\n\n```\nNach 10 Jahren Zinsbindung kann der Darlehensnehmer\nmit 6 Monaten Frist ohne Vorfälligkeitsentschädigung kündigen.\n```',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.FIN.004',
  'finance',
  'playbook',
  'Finanzierungsanfrage vorbereiten: Unterlagen + Story',
  'Schritt-für-Schritt-Anleitung zur optimalen Vorbereitung.',
  E'# Finanzierungsanfrage vorbereiten\n\n> **Hinweis:** Diese Information dient nur zur allgemeinen Orientierung.\n\n---\n\n## Schritt 1: Selbstauskunft erstellen\n\n### Persönliche Daten\n- Vollständiger Name, Geburtsdatum\n- Familienstand\n- Staatsangehörigkeit\n- Anschrift\n\n### Berufliche Situation\n- Arbeitgeber, Branche\n- Beschäftigt seit\n- Vertragsart (unbefristet/befristet)\n- Probezeit?\n\n### Einnahmen (monatlich netto)\n- Gehalt\n- Nebeneinkünfte\n- Bestehende Mieteinnahmen\n- Kindergeld etc.\n\n---\n\n## Schritt 2: Unterlagen zusammenstellen\n\n### Einkommensnachweise\n- [ ] Letzte 3 Gehaltsabrechnungen\n- [ ] Letzter Steuerbescheid\n- [ ] Arbeitsvertrag',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.FIN.005',
  'finance',
  'checklist',
  'Finanzierungs-Dokumentpaket: Must-Haves',
  'Die vollständige Checkliste für eine Finanzierungsanfrage.',
  E'# Finanzierungs-Dokumentpaket\n\n> Vollständige Checkliste für die Kreditanfrage bei der Bank.\n\n---\n\n## Persönliche Unterlagen\n\n### Identifikation\n- [ ] Personalausweis/Reisepass (Kopie)\n- [ ] Meldebescheinigung (bei Bedarf)\n\n### Einkommensnachweise (Angestellt)\n- [ ] Letzte 3 Gehaltsabrechnungen\n- [ ] Arbeitsvertrag\n- [ ] Nachweis Probezeit beendet\n\n### Einkommensnachweise (Selbstständig)\n- [ ] Letzte 3 Einkommensteuerbescheide\n- [ ] Letzte 3 Jahresabschlüsse/BWA\n- [ ] Einnahmen-Überschuss-Rechnung\n\n### Vermögensnachweise\n- [ ] Kontoauszüge (Eigenkapitalnachweis)\n- [ ] Depotauszug\n- [ ] Lebensversicherungen (Rückkaufswert)\n- [ ] Bausparverträge',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.FIN.006',
  'finance',
  'article',
  'Haushaltsrechnung: Die Logik der Bank',
  'Wie Banken die Tragfähigkeit einer Finanzierung prüfen.',
  E'# Haushaltsrechnung verstehen\n\n> **Hinweis:** Diese Information dient nur zur allgemeinen Orientierung. Jede Bank rechnet etwas anders.\n\n---\n\n## Was prüft die Bank?\n\nDie Haushaltsrechnung zeigt, ob Sie sich die Kreditrate leisten können.\n\n```\nEinnahmen - Ausgaben - neue Rate ≥ Puffer\n```\n\n---\n\n## Einnahmen (was die Bank anerkennt)\n\n| Position | Anrechnung |\n|----------|------------|\n| Netto-Gehalt | 100% |\n| 13. Gehalt/Bonus | 50-80% |\n| Mieteinnahmen (bestehend) | 70-80% |\n| Mieteinnahmen (neu) | 50-70% |\n| Kindergeld | 100% |\n| Unterhalt (erhalten) | 100% |\n| Nebenjob | 0-50% |\n\n**Vorsichtig:** Banken rechnen konservativ!',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.FIN.007',
  'finance',
  'article',
  'Cashflow-Rechnung: konservativ vs optimistisch',
  'Wie man den Cashflow einer Immobilie realistisch kalkuliert.',
  E'# Cashflow-Rechnung für Kapitalanleger\n\n---\n\n## Was ist Cashflow?\n\nDer **Cashflow** ist der tatsächliche Geldfluss nach allen Zahlungen:\n\n```\nMieteinnahmen\n- Nicht umlegbare Kosten\n- Kreditrate (Zins + Tilgung)\n= Cashflow vor Steuern\n```\n\n**Positiver Cashflow:** Die Immobilie \"trägt sich selbst\" und mehr.\n**Negativer Cashflow:** Sie schießen monatlich zu.\n\n---\n\n## Konservative Kalkulation\n\n### Einnahmen (vorsichtig)\n| Position | Annahme |\n|----------|--------|\n| Kaltmiete | Aktuelle IST-Miete |\n| Mietausfallwagnis | - 5% |\n| **Netto-Mieteinnahme** | **95% der Kaltmiete** |\n\n### Ausgaben (großzügig)\n| Position | Annahme |\n|----------|--------|\n| Nicht umlegbare NK | 15% der Miete |\n| Instandhaltungsrücklage | 10-15 €/m²/Jahr |\n| Sonderumlage-Puffer | 0,5-1% des KP/Jahr |',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.FIN.008',
  'finance',
  'playbook',
  'Refinanzierung: Wann lohnt sich das?',
  'Schritt-für-Schritt Prüfung einer Umschuldung.',
  E'# Refinanzierung Playbook\n\n> **Hinweis:** Diese Information dient nur zur allgemeinen Orientierung.\n\n---\n\n## Wann Refinanzierung prüfen?\n\n### Trigger-Events\n- [ ] Zinsbindung läuft aus (in 6–24 Monaten)\n- [ ] 10 Jahre seit Darlehensbeginn (Sonderkündigungsrecht)\n- [ ] Zinsniveau deutlich gesunken\n- [ ] Wertsteigerung der Immobilie (besserer LTV)\n- [ ] Verbesserte Bonität\n\n---\n\n## Schritt 1: Ist-Situation analysieren\n\n### Aktuelle Konditionen erfassen\n\n| Parameter | Aktuell |\n|-----------|--------|\n| Restschuld | € |\n| Aktueller Zinssatz | % |\n| Restlaufzeit Zinsbindung | Monate |\n| Monatliche Rate | € |\n\n---\n\n## Schritt 2: Kosten einer Ablösung kalkulieren\n\n### Nach 10 Jahren (§ 489 BGB)\n\n```\nKeine VFE!\nNur 6 Monate Kündigungsfrist\n```',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.FIN.009',
  'finance',
  'faq',
  'Was ist DSCR? (Proxy-Erklärung)',
  'Debt Service Coverage Ratio einfach erklärt.',
  E'# FAQ: DSCR (Debt Service Coverage Ratio)\n\n---\n\n## Was bedeutet DSCR?\n\n**DSCR = Debt Service Coverage Ratio**\n\nAuf Deutsch: **Schuldendienstdeckungsgrad**\n\nDie Kennzahl zeigt, wie gut die Einnahmen den Schuldendienst (Zins + Tilgung) decken.\n\n---\n\n## Wie berechnet man DSCR?\n\n```\nDSCR = Netto-Mieteinnahmen / Jährlicher Schuldendienst\n```\n\n**Netto-Mieteinnahmen:** Kaltmiete - Bewirtschaftungskosten\n**Schuldendienst:** Alle Zins- und Tilgungszahlungen\n\n---\n\n## Wie interpretiere ich den DSCR?\n\n| DSCR | Bedeutung |\n|------|----------|\n| < 1,0 | ❌ Mieteinnahmen decken Kredit nicht |\n| 1,0 - 1,1 | ⚠️ Knapp, kein Puffer |\n| 1,1 - 1,3 | ✓ Akzeptabel, kleiner Puffer |\n| 1,3 - 1,5 | ✅ Gut, solider Puffer |\n| > 1,5 | 🌟 Sehr gut, hohe Sicherheit |',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.FIN.010',
  'finance',
  'article',
  'Sondertilgung: Wirkung & Planung',
  'Wie Sondertilgungen funktionieren und wann sie sinnvoll sind.',
  E'# Sondertilgung verstehen\n\n> **Hinweis:** Diese Information dient nur zur allgemeinen Orientierung.\n\n---\n\n## Was ist eine Sondertilgung?\n\nEine **Sondertilgung** ist eine zusätzliche Zahlung auf das Darlehen außerhalb der regulären Rate.\n\n**Effekt:**\n- Reduziert die Restschuld direkt\n- Spart Zinsen\n- Verkürzt die Laufzeit (oder senkt spätere Rate)\n\n---\n\n## Typische Konditionen\n\n| Merkmal | Standard | Premium |\n|---------|----------|--------|\n| Sondertilgung/Jahr | 5% der Darlehenssumme | 10% |\n| Zinsaufschlag | Keiner | 0,05-0,1% |\n| Flexibilität | Jährlich | Monatlich |\n\n**Beispiel:** Bei 200.000 € Darlehen = 10.000 €/Jahr Sondertilgung möglich',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
);

-- ============================================================
-- SALES CATEGORY (8 items)
-- ============================================================

INSERT INTO public.armstrong_knowledge_items (
  item_code, category, content_type, title_de, summary_de, content, 
  version, status, scope, confidence, sources
) VALUES 
(
  'KB.SALES.001',
  'sales',
  'playbook',
  'Erstgespräch Leitfaden (Kapitalanleger)',
  'Strukturierter Ablauf für das erste Beratungsgespräch mit einem Kapitalanleger.',
  E'# Erstgespräch Leitfaden: Kapitalanleger\n\n## Ziel des Erstgesprächs\n\n1. Vertrauen aufbauen\n2. Bedarf verstehen\n3. Qualifizieren\n4. Nächsten Schritt vereinbaren\n\n**Dauer:** 30-45 Minuten\n\n---\n\n## Phasen des Gesprächs\n\n### Phase 1: Einstieg (5 Min)\n\n**Ziele:**\n- Angenehme Atmosphäre schaffen\n- Erwartungen klären\n\n**Gesprächsbausteine:**\n> \"Schön, dass Sie sich die Zeit nehmen. Bevor wir starten – was ist Ihnen heute besonders wichtig?\"\n\n### Phase 2: Bedarfsanalyse (15 Min)\n\n**Kernfragen:**\n\n1. **Motivation**\n> \"Was hat Sie dazu bewogen, sich mit Immobilien als Kapitalanlage zu beschäftigen?\"\n\n2. **Erfahrung**\n> \"Haben Sie bereits Erfahrung mit Immobilien? Welche?\"\n\n3. **Ziel**\n> \"Was möchten Sie mit der Investition erreichen?\"',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.SALES.002',
  'sales',
  'script',
  'Cold Outreach Script (B2C Kapitalanleger)',
  'Drei Varianten für die Kaltakquise per Telefon.',
  E'# Cold Outreach Script: Kapitalanleger\n\n## Variante 1: Der direkte Ansatz\n\n### Einstieg\n> \"Guten Tag, [Name]. Hier ist [Berater] von [Firma]. Ich rufe an, weil Sie sich kürzlich für Immobilien als Kapitalanlage interessiert haben. Stört es Sie, wenn ich 30 Sekunden erkläre, warum ich anrufe?\"\n\n### Pitch\n> \"Wir helfen Kapitalanlegern, renditestarke Immobilien zu finden – ohne dass Sie selbst Stunden mit Suchen verbringen müssen. Aktuell haben wir einige interessante Objekte mit über 5% Rendite.\"\n\n### Qualifizierung\n> \"Darf ich fragen: Haben Sie bereits eine Immobilie als Kapitalanlage oder wäre es Ihr erstes Investment?\"\n\n### Call-to-Action\n> \"Ich schlage vor, wir führen ein kurzes Gespräch – 15 Minuten – um zu sehen, ob wir zueinander passen. Wann hätten Sie Zeit?\"',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.SALES.004',
  'sales',
  'script',
  'Einwandbehandlung: ''Zu teuer'' / ''Warte ab'' / ''Kein Bedarf''',
  'Reaktionen auf die häufigsten Einwände im Verkaufsgespräch.',
  E'# Einwandbehandlung\n\n## Einwand: \"Das ist mir zu teuer\"\n\n### Verstehen\n> \"Verstehe. Wenn Sie sagen ''zu teuer'' – meinen Sie den Kaufpreis, die monatliche Belastung oder etwas anderes?\"\n\n### Reframen\n> \"Lassen Sie uns kurz rechnen: Bei [Preis] und [Miete] liegt die Rendite bei [X%]. Das schlägt die meisten Alternativen.\"\n\n### Kosten des Nichtstuns\n> \"Ich verstehe das Zögern. Aber bedenken Sie: Jedes Jahr, das Sie warten, ist ein Jahr ohne Mieteinnahmen, ohne Wertsteigerung, ohne Steuervorteile.\"\n\n---\n\n## Einwand: \"Ich warte noch ab\"\n\n### Verstehen\n> \"Das höre ich öfter. Worauf warten Sie genau – auf bessere Zinsen, mehr Eigenkapital oder ein besseres Objekt?\"\n\n### Time in market > Timing\n> \"Viele unserer erfolgreichsten Kunden haben nicht auf den ''perfekten'' Moment gewartet. Sie haben angefangen – und ihr Vermögen wächst seitdem.\"',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.SALES.007',
  'sales',
  'playbook',
  'Bedarfsanalyse: 12 Kernfragen',
  'Die wichtigsten Fragen zur Qualifizierung eines Kapitalanleger-Leads.',
  E'# Bedarfsanalyse: 12 Kernfragen\n\n## Ziel\n\nMit diesen 12 Fragen verstehen Sie:\n- Wer ist der Kunde?\n- Was will er?\n- Kann er?\n- Wird er?\n\n---\n\n## Motivation & Ziel\n\n### 1. Auslöser\n> \"Was hat Sie dazu gebracht, sich jetzt mit Immobilien als Investment zu beschäftigen?\"\n\n*Trigger verstehen: Erbschaft? Bonus? Angst vor Inflation? Altersvorsorge?*\n\n### 2. Ziel\n> \"Was möchten Sie mit dem Investment erreichen? Was soll es in 10 Jahren bewirkt haben?\"\n\n### 3. Warum Immobilien?\n> \"Warum Immobilien und nicht Aktien, ETFs oder Festgeld?\"\n\n---\n\n## Finanzen & Möglichkeiten\n\n### 6. Eigenkapital\n> \"Wie viel Eigenkapital könnten Sie für eine Investition einsetzen?\"\n\n### 7. Einkommen\n> \"Wie stabil ist Ihr Einkommen? Angestellt, selbstständig, befristet?\"',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.SALES.008',
  'sales',
  'playbook',
  'Objektpräsentation: Storyline (Lage → Zahlen → Risiko → Lösung)',
  'Strukturierte Präsentation eines Investmentobjekts für Kapitalanleger.',
  E'# Objektpräsentation für Kapitalanleger\n\n## Die Storyline\n\n**Lage → Zahlen → Risiko → Lösung**\n\nDiese Reihenfolge führt den Interessenten logisch zur Kaufentscheidung.\n\n---\n\n## Phase 1: Lage (2-3 Minuten)\n\n### Makrostandort\n> \"Das Objekt liegt in [Stadt/Region], einer wirtschaftlich starken Region mit [X] Einwohnern und stabilem Arbeitsmarkt.\"\n\n**Belegen:**\n- Arbeitslosenquote\n- Größte Arbeitgeber\n- Bevölkerungsentwicklung\n\n### Mikrostandort\n> \"Die konkrete Lage ist [Stadtteil]. Hier sehen Sie [Einkaufsmöglichkeiten, ÖPNV, Schulen] in unmittelbarer Nähe.\"\n\n---\n\n## Phase 2: Zahlen (5-7 Minuten)\n\n### Kaufpreis & Nebenkosten\n| Position | Betrag |\n|----------|--------|\n| Kaufpreis | [X] € |\n| Nebenkosten ([Y]%) | [X] € |\n| Gesamtinvestition | [X] € |',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.SALES.009',
  'sales',
  'script',
  'Maklergespräch: Objektinfos richtig abfragen',
  'Strukturierter Gesprächsleitfaden für die Informationsbeschaffung beim Makler.',
  E'# Maklergespräch Script\n\n## Ziel des Gesprächs\n- Vollständige Objektinformationen beschaffen\n- Verkäufermotivation verstehen\n- Verhandlungsspielraum ausloten\n- Professionellen Eindruck hinterlassen\n\n---\n\n## Phase 1: Eröffnung (2 Minuten)\n\n### Begrüßung\n```\n\"Guten Tag, [Name]. Vielen Dank, dass Sie sich Zeit nehmen.\nIch bin [Name], Kapitalanleger mit Fokus auf [Objekttyp/Region].\nDas Objekt in [Adresse] interessiert mich sehr.\"\n```\n\n---\n\n## Phase 2: Objektinformationen (10 Minuten)\n\n### Grunddaten\n```\n\"Lassen Sie uns mit den Basics starten:\"\n- Wie groß ist die Wohnfläche genau?\n- Welches Baujahr hat das Gebäude?\n- Wie viele Einheiten hat das Haus insgesamt?\n- Wie hoch ist der Miteigentumsanteil?\n```',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.SALES.010',
  'sales',
  'checklist',
  'Deal-Qualifizierung: Lead Score Faktoren',
  'Systematische Bewertung von Leads und Interessenten.',
  E'# Lead-Qualifizierung Checkliste\n\n## Übersicht\n\nEin qualifizierter Lead ist ein potenzieller Käufer mit hoher Abschlusswahrscheinlichkeit.\n\n---\n\n## Scoring-Modell (BANT+)\n\n### B — Budget (0–25 Punkte)\n\n| Kriterium | Punkte |\n|-----------|--------|\n| Eigenkapital vorhanden (> 20% Ziel-KP) | +10 |\n| Finanzierungszusage liegt vor | +10 |\n| Budget passt zu Objektangebot | +5 |\n| Budget unklar/nicht genannt | 0 |\n\n### A — Authority (0–20 Punkte)\n\n| Kriterium | Punkte |\n|-----------|--------|\n| Alleiniger Entscheider | +15 |\n| Partner eingebunden, beide überzeugt | +10 |\n| Partner noch nicht involviert | +5 |\n\n---\n\n## Gesamtbewertung\n\n| Score | Kategorie | Priorität | Aktion |\n|-------|-----------|-----------|--------|\n| 80–100 | A-Lead (Hot) | Höchste | Sofort Termin |\n| 60–79 | B-Lead (Warm) | Hoch | Innerhalb 48h |\n| 40–59 | C-Lead (Lukewarm) | Mittel | Nurturing |\n| < 40 | D-Lead (Cold) | Niedrig | Automatisierung |',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
);

-- Add KB.SALES.009 separately since it was in file reading
-- (Already added above, this is a duplicate removal)

-- ============================================================
-- TEMPLATES CATEGORY (6 items)
-- ============================================================

INSERT INTO public.armstrong_knowledge_items (
  item_code, category, content_type, title_de, summary_de, content, 
  version, status, scope, confidence, sources
) VALUES 
(
  'KB.TPL.001',
  'templates',
  'article',
  'E-Mail-Vorlage: Unterlagen anfordern (Kaufinteresse)',
  'Professionelle E-Mail-Vorlage zur Anforderung von Objektunterlagen.',
  E'# E-Mail-Vorlage: Unterlagen anfordern\n\n## Verwendungszweck\nNach erstem Kontakt oder Objektbesichtigung – Unterlagen beim Verkäufer/Makler anfordern.\n\n---\n\n## Vorlage\n\n**Betreff:** Unterlagen zum Objekt [Adresse] - Kaufinteresse [Name]\n\n---\n\nSehr geehrte/r [Anrede + Name],\n\nvielen Dank für das informative Gespräch / die Besichtigung am [Datum].\n\nDas Objekt [Adresse] hat mein Interesse geweckt. Um meine Kaufentscheidung fundiert treffen zu können, benötige ich noch folgende Unterlagen:\n\n**Grundstück & Gebäude:**\n- [ ] Aktueller Grundbuchauszug\n- [ ] Flurkarte/Lageplan\n- [ ] Grundrisse aller Geschosse\n- [ ] Energieausweis\n\n**Bei Eigentumswohnung (WEG):**\n- [ ] Teilungserklärung mit Gemeinschaftsordnung\n- [ ] Protokolle der letzten 3 Eigentümerversammlungen\n- [ ] Wirtschaftsplan und letzte Hausgeldabrechnung\n- [ ] Höhe der Instandhaltungsrücklage',
  '1.0.0',
  'published',
  'global',
  'verified',
  '[]'::jsonb
),
(
  'KB.TPL.002',
  'templates',
  'article',
  'E-Mail-Vorlage: Bank-Unterlagenliste (Finanzierung)',
  'Vorlage zur Kommunikation mit der Bank bzgl. Finanzierungsunterlagen.',
  E'# E-Mail-Vorlage: Bank-Unterlagenliste\n\n## Verwendungszweck\nErste Anfrage bei der Bank oder Antwort auf Unterlagen-Anforderung.\n\n---\n\n## Vorlage\n\n**Betreff:** Finanzierungsanfrage - [Vorname Nachname] - [Objekt Adresse]\n\n---\n\nSehr geehrte Damen und Herren, / Sehr geehrte/r [Anrede + Name],\n\nich interessiere mich für ein Immobilieninvestment und möchte Sie um ein Finanzierungsangebot bitten.\n\n**Zum Objekt:**\n- Adresse: [Straße, PLZ Ort]\n- Kaufpreis: [X] €\n- Art: [ETW / MFH / EFH]\n- Nutzung: Vermietung als Kapitalanlage\n\n**Zur Finanzierung:**\n- Gewünschter Darlehensbetrag: [X] €\n- Eigenkapitaleinsatz: [X] €\n- Gewünschte Zinsbindung: [X] Jahre\n- Anfängliche Tilgung: [X] %\n- Sondertilgungsoption erwünscht: Ja / Nein',
  '1.0.0',
  'published',
  'global',
  'verified',
  '[]'::jsonb
),
(
  'KB.TPL.003',
  'templates',
  'article',
  'Template: E-Mail Terminbestätigung + Agenda',
  'Vorlage für professionelle Terminbestätigungen mit Agenda.',
  E'# Terminbestätigung mit Agenda\n\n## Anwendungsfall\nBestätigung eines vereinbarten Beratungs- oder Besichtigungstermins mit klarer Agenda und Vorbereitung.\n\n---\n\n## Vorlage: Erstberatung Kapitalanlage\n\n```\nBetreff: Terminbestätigung: Erstgespräch Kapitalanlage | [Datum, Uhrzeit]\n\nSehr geehrte/r Frau/Herr [Name],\n\nvielen Dank für Ihr Interesse an einer Kapitalanlage in Immobilien.\nHiermit bestätige ich unseren Termin:\n\n📅 Datum: [Wochentag, TT.MM.JJJJ]\n🕐 Uhrzeit: [HH:MM] Uhr\n📍 Ort: [Adresse / Videokonferenz-Link]\n⏱️ Dauer: ca. [45–60] Minuten\n\n---\n\nAGENDA\n\n1. Kennenlernen & Ihre aktuelle Situation\n2. Ihre Ziele bei der Kapitalanlage\n3. Vorstellung unseres Ansatzes\n4. Erste Objektempfehlungen (falls passend)\n5. Nächste Schritte\n```',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.TPL.004',
  'templates',
  'article',
  'Template: Besichtigung Checkliste (Fotoliste + Fragen)',
  'Vorlage für strukturierte Immobilienbesichtigungen.',
  E'# Besichtigungs-Checkliste\n\n## Fotoliste (systematisch)\n\n### Außenbereich\n- [ ] Gesamtansicht Gebäude (frontal)\n- [ ] Fassade (alle Seiten)\n- [ ] Dach (soweit sichtbar)\n- [ ] Eingangsbereich/Hausflur\n- [ ] Klingelanlage/Briefkästen\n- [ ] Mülltonnenplatz\n- [ ] Parkplätze/Garage\n- [ ] Garten/Grünflächen\n\n### Treppenhaus/Gemeinschaftsflächen\n- [ ] Treppenhaus (mehrere Etagen)\n- [ ] Aufzug (falls vorhanden)\n- [ ] Kellerflur\n- [ ] Waschküche\n- [ ] Fahrradkeller\n- [ ] Dachboden (falls zugänglich)\n\n### Wohnung/Einheit\n- [ ] Eingangsbereich/Flur\n- [ ] Wohnzimmer (Übersicht + Details)\n- [ ] Küche (inkl. Geräte, Anschlüsse)\n- [ ] Badezimmer (Armaturen, Fliesen)\n- [ ] Schlafzimmer (alle)\n- [ ] Balkon/Terrasse\n- [ ] Fenster (Innenansicht)\n- [ ] Heizkörper/Thermostate',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.TPL.005',
  'templates',
  'article',
  'Template: Gesprächsprotokoll',
  'Vorlage für strukturierte Dokumentation von Kunden- und Beratungsgesprächen.',
  E'# Gesprächsprotokoll\n\n## Grundstruktur\n\n```\n═══════════════════════════════════════════════════════════\nGESPRÄCHSPROTOKOLL\n═══════════════════════════════════════════════════════════\n\nDatum: [TT.MM.JJJJ]\nUhrzeit: [HH:MM – HH:MM]\nDauer: [XX] Minuten\n\nArt: ☐ Telefon  ☐ Video  ☐ Vor Ort\nOrt/Tool: [Ort/Zoom/Teams/...]\n\n───────────────────────────────────────────────────────────\nTEILNEHMER\n───────────────────────────────────────────────────────────\n\nKunde:\n• Name: [Vor- und Nachname]\n• Telefon: [Nummer]\n• E-Mail: [Adresse]\n• Status: [Lead/Interessent/Bestandskunde]\n\n───────────────────────────────────────────────────────────\nGESPRÄCHSINHALT\n───────────────────────────────────────────────────────────\n\nAnlass/Thema:\n[Warum fand das Gespräch statt?]\n\nZusammenfassung:\n[3–5 Sätze: Die wichtigsten Punkte]\n```',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
),
(
  'KB.TPL.006',
  'templates',
  'article',
  'Follow-up Sequenz: 7 Tage (E-Mail/WhatsApp/Call)',
  'Strukturierte Nachfass-Sequenz für Leads nach dem Erstgespräch.',
  E'# Follow-up Sequenz: 7 Tage\n\n## Übersicht\n\n| Tag | Kanal | Ziel |\n|-----|-------|------|\n| 0 | E-Mail | Zusammenfassung + Danke |\n| 2 | WhatsApp | Kurzer Check-in |\n| 4 | E-Mail | Mehrwert liefern |\n| 7 | Call | Nächsten Schritt vereinbaren |\n\n---\n\n## Tag 0: Dankes-E-Mail (direkt nach Gespräch)\n\n**Betreff:** Schön, dass wir gesprochen haben, [Vorname]!\n\n---\n\nHallo [Vorname],\n\nvielen Dank für das offene Gespräch heute.\n\n**Zusammenfassung:**\n- Ihr Ziel: [Ziel des Kunden]\n- Budget-Rahmen: [X] €\n- Nächster Schritt: [Vereinbartes]\n\nWie besprochen sende ich Ihnen [Unterlagen/Link/Infos] in Kürze zu.\n\nFalls Sie Fragen haben, melden Sie sich jederzeit.\n\nBeste Grüße\n[Berater]\n\n---\n\n## Tag 2: WhatsApp Check-in\n\n> Hallo [Vorname] 👋\n> Kurze Frage: Konnten Sie sich die Unterlagen schon anschauen?\n> Falls Fragen aufkommen – ich bin da!\n> Grüße, [Berater]',
  '1.0.0',
  'published',
  'global',
  'high',
  '[]'::jsonb
);

-- ============================================================
-- SUMMARY
-- ============================================================
-- Total items seeded: 49
-- Categories:
--   - system: 6 items
--   - real_estate: 17 items  
--   - tax_legal: 4 items
--   - finance: 10 items
--   - sales: 7 items (including KB.SALES.009)
--   - templates: 6 items
-- ============================================================