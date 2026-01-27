-- =============================================
-- ZONE 1: Knowledge Base für Armstrong KI-Berater
-- =============================================

-- Knowledge Base Tabelle
CREATE TABLE public.knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('investment', 'tax', 'financing', 'legal', 'faq')),
  title text NOT NULL,
  content text NOT NULL,
  keywords text[] DEFAULT '{}',
  source text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index für Kategorie-Suche
CREATE INDEX idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX idx_knowledge_base_public ON public.knowledge_base(is_public) WHERE is_public = true;

-- RLS aktivieren (read-only für alle, write nur für Admin)
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Public read policy für Zone 3 + Zone 2
CREATE POLICY "Knowledge base is publicly readable"
  ON public.knowledge_base
  FOR SELECT
  USING (is_public = true);

-- Admin write policy (tenant_id IS NULL = platform-weit)
CREATE POLICY "Admins can manage knowledge base"
  ON public.knowledge_base
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated_at Trigger
CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED DATA: 35 Wissenseinträge
-- =============================================

-- INVESTMENT (10 Einträge)
INSERT INTO public.knowledge_base (category, title, content, keywords, source, is_public) VALUES
('investment', 'Bruttomietrendite', 
'Die Bruttomietrendite berechnet sich aus der Jahreskaltmiete geteilt durch den Kaufpreis, multipliziert mit 100. Formel: (Jahreskaltmiete / Kaufpreis) × 100. Beispiel: Bei 12.000€ Jahreskaltmiete und 300.000€ Kaufpreis ergibt sich eine Bruttomietrendite von 4%. Diese Kennzahl eignet sich für einen ersten Vergleich, berücksichtigt aber keine Nebenkosten.',
ARRAY['rendite', 'brutto', 'mietrendite', 'kennzahl'], 'Kaufy-FAQ', true),

('investment', 'Nettomietrendite',
'Die Nettomietrendite berücksichtigt zusätzlich die Bewirtschaftungskosten und Kaufnebenkosten. Formel: ((Jahreskaltmiete - Bewirtschaftungskosten) / (Kaufpreis + Kaufnebenkosten)) × 100. Sie ist aussagekräftiger als die Bruttomietrendite, da sie die tatsächlichen Kosten einbezieht.',
ARRAY['rendite', 'netto', 'mietrendite', 'bewirtschaftung'], 'Kaufy-FAQ', true),

('investment', 'Eigenkapitalrendite',
'Die Eigenkapitalrendite (EK-Rendite) misst, wie viel Rendite auf das eingesetzte Eigenkapital erzielt wird. Bei Fremdfinanzierung kann durch den Leverage-Effekt eine höhere EK-Rendite als die Objektrendite erreicht werden. Formel: (Jahresüberschuss / Eigenkapital) × 100.',
ARRAY['eigenkapital', 'rendite', 'leverage', 'fremdfinanzierung'], 'Kaufy-FAQ', true),

('investment', 'Cashflow vor Steuer',
'Der Cashflow vor Steuer ist die Differenz zwischen den Mieteinnahmen und allen Ausgaben (Zinsen, Tilgung, Verwaltung, Instandhaltung) vor Berücksichtigung steuerlicher Effekte. Ein negativer Cashflow bedeutet, dass monatlich Geld zugeschossen werden muss.',
ARRAY['cashflow', 'liquidität', 'einnahmen', 'ausgaben'], 'Kaufy-FAQ', true),

('investment', 'Cashflow nach Steuer',
'Der Cashflow nach Steuer berücksichtigt die Steuerersparnis durch Abschreibung (AfA) und Werbungskosten. Bei Kapitalanlegern mit hohem Grenzsteuersatz kann ein negativer Cashflow vor Steuer zu einem positiven Cashflow nach Steuer werden.',
ARRAY['cashflow', 'steuer', 'netto', 'steuervorteil'], 'Kaufy-FAQ', true),

('investment', 'Netto-Belastung',
'Die Netto-Belastung ist der tatsächliche monatliche Betrag, den ein Investor aus eigener Tasche zahlen muss. Sie berechnet sich aus: Cashflow vor Steuer + Steuerersparnis. Eine negative Netto-Belastung bedeutet, dass die Immobilie sich selbst trägt.',
ARRAY['netto', 'belastung', 'monatlich', 'tragfähigkeit'], 'Kaufy-FAQ', true),

('investment', 'Mietmultiplikator (Kaufpreisfaktor)',
'Der Mietmultiplikator gibt an, wie viele Jahresmieten der Kaufpreis entspricht. Formel: Kaufpreis / Jahreskaltmiete. Ein Faktor von 20 bedeutet, dass der Kaufpreis 20 Jahresmieten entspricht. Niedrigere Faktoren deuten auf günstigere Objekte hin.',
ARRAY['multiplikator', 'kaufpreis', 'faktor', 'jahresmiete'], 'Kaufy-FAQ', true),

('investment', 'Leverage-Effekt',
'Der Leverage-Effekt (Hebeleffekt) beschreibt die Steigerung der Eigenkapitalrendite durch Fremdfinanzierung. Voraussetzung: Die Gesamtkapitalrendite muss höher sein als der Fremdkapitalzins. Bei niedrigen Zinsen kann dieser Effekt die EK-Rendite erheblich steigern.',
ARRAY['leverage', 'hebel', 'fremdkapital', 'eigenkapitalrendite'], 'Kaufy-FAQ', true),

('investment', 'Vermögensaufbau durch Tilgung',
'Auch bei negativem Cashflow baut der Investor durch die Tilgung Vermögen auf. Die monatliche Tilgung reduziert die Restschuld und erhöht das Eigenkapital in der Immobilie. Nach 20-30 Jahren kann die Immobilie schuldenfrei sein.',
ARRAY['tilgung', 'vermögen', 'eigenkapital', 'restschuld'], 'Kaufy-FAQ', true),

('investment', 'Wertsteigerung (Appreciation)',
'Die Wertsteigerung einer Immobilie hängt von Lage, Zustand und Marktentwicklung ab. Historisch sind Immobilien in Deutschland im Schnitt um 2-3% p.a. gestiegen. In Ballungsräumen kann die Wertsteigerung deutlich höher ausfallen.',
ARRAY['wertsteigerung', 'appreciation', 'wertentwicklung', 'immobilienpreise'], 'Kaufy-FAQ', true),

-- TAX (8 Einträge)
('tax', 'Abschreibung (AfA)',
'Die Absetzung für Abnutzung (AfA) ermöglicht es, den Gebäudeanteil einer Immobilie steuerlich abzuschreiben. Die lineare AfA beträgt 2% p.a. über 50 Jahre für Gebäude ab 1925. Nur der Gebäudeanteil (nicht das Grundstück) kann abgeschrieben werden.',
ARRAY['afa', 'abschreibung', 'steuer', 'gebäude'], '§7 EStG', true),

('tax', 'AfA nach §7i EStG (Denkmal)',
'Für Baudenkmäler können erhöhte Abschreibungen nach §7i EStG geltend gemacht werden: 9% p.a. in den ersten 8 Jahren, dann 7% p.a. für weitere 4 Jahre. Dies gilt für Sanierungskosten, die mit der Denkmalbehörde abgestimmt wurden.',
ARRAY['afa', 'denkmal', '7i', 'sanierung'], '§7i EStG', true),

('tax', 'AfA nach §7h EStG (Sanierungsgebiet)',
'In städtebaulichen Sanierungsgebieten können Modernisierungskosten nach §7h EStG erhöht abgeschrieben werden: 9% p.a. in den ersten 8 Jahren, dann 7% p.a. für weitere 4 Jahre. Die Bescheinigung der Gemeinde ist erforderlich.',
ARRAY['afa', 'sanierungsgebiet', '7h', 'modernisierung'], '§7h EStG', true),

('tax', 'Sonder-AfA nach §7b EStG',
'Für neue Mietwohnungen kann eine Sonder-AfA nach §7b EStG von 5% p.a. über 4 Jahre zusätzlich zur linearen AfA genutzt werden. Voraussetzung: Bauantrag zwischen 09/2018 und 12/2026, Baukostenobergrenze beachten.',
ARRAY['afa', 'sonder', '7b', 'neubau', 'mietwohnung'], '§7b EStG', true),

('tax', 'Werbungskosten bei Vermietung',
'Alle Kosten, die im Zusammenhang mit der Vermietung entstehen, sind als Werbungskosten absetzbar: Zinsen, Verwaltung, Instandhaltung, Fahrtkosten, Versicherungen, Grundsteuer. Diese mindern das zu versteuernde Einkommen.',
ARRAY['werbungskosten', 'steuer', 'absetzbar', 'vermietung'], '§9 EStG', true),

('tax', 'Grenzsteuersatz',
'Der Grenzsteuersatz gibt an, mit welchem Prozentsatz der nächste verdiente Euro besteuert wird. Er steigt progressiv mit dem Einkommen. Bei einem zvE von 60.000€ (ledig) liegt der Grenzsteuersatz bei ca. 42%. Je höher der Grenzsteuersatz, desto mehr profitiert man von Werbungskosten.',
ARRAY['grenzsteuersatz', 'progression', 'einkommensteuer'], 'Kaufy-FAQ', true),

('tax', 'Steuerersparnis berechnen',
'Die jährliche Steuerersparnis berechnet sich aus: (AfA + Werbungskosten - Mieteinnahmen) × Grenzsteuersatz. Bei negativen Einkünften aus Vermietung entsteht ein steuerlicher Verlust, der mit anderen Einkunftsarten verrechnet werden kann.',
ARRAY['steuerersparnis', 'berechnung', 'verlust', 'verrechnung'], 'Kaufy-FAQ', true),

('tax', 'Spekulationsfrist',
'Immobilien können nach 10 Jahren Haltedauer steuerfrei verkauft werden (§23 EStG). Bei Verkauf innerhalb der Spekulationsfrist wird der Gewinn mit dem persönlichen Steuersatz versteuert. Ausnahme: Selbstnutzung in den letzten 3 Jahren.',
ARRAY['spekulationsfrist', 'verkauf', 'steuerfrei', 'haltedauer'], '§23 EStG', true),

-- FINANCING (9 Einträge)
('financing', 'Zinsbindung',
'Die Zinsbindung ist der Zeitraum, für den der Zinssatz festgeschrieben wird. Übliche Laufzeiten sind 5, 10, 15 oder 20 Jahre. Längere Zinsbindungen bieten mehr Planungssicherheit, haben aber oft höhere Zinssätze.',
ARRAY['zinsbindung', 'zinssatz', 'festschreibung', 'laufzeit'], 'Kaufy-FAQ', true),

('financing', 'Tilgungsrate',
'Die Tilgungsrate gibt an, wie viel Prozent des Darlehens jährlich zurückgezahlt wird. Mindestens 1%, empfohlen 2-3%. Höhere Tilgung = schnellere Entschuldung, aber höhere monatliche Rate. Bei 2% Tilgung ist das Darlehen in ca. 30 Jahren abbezahlt.',
ARRAY['tilgung', 'rate', 'rückzahlung', 'entschuldung'], 'Kaufy-FAQ', true),

('financing', 'Annuität',
'Die Annuität ist die gleichbleibende Jahresrate aus Zins und Tilgung. Formel: Darlehenssumme × (Zinssatz + Tilgungssatz). Die monatliche Rate ergibt sich aus Annuität ÷ 12. Im Zeitverlauf steigt der Tilgungsanteil, während der Zinsanteil sinkt.',
ARRAY['annuität', 'rate', 'zins', 'tilgung'], 'Kaufy-FAQ', true),

('financing', 'Beleihungswert (LTV)',
'Der Loan-to-Value (LTV) gibt das Verhältnis von Darlehenssumme zu Immobilienwert an. Banken finanzieren meist 60-80% des Kaufpreises. Je niedriger der LTV, desto besser die Zinskonditionen. Bei über 100% LTV spricht man von Vollfinanzierung.',
ARRAY['ltv', 'beleihung', 'finanzierung', 'eigenkapital'], 'Kaufy-FAQ', true),

('financing', 'Kaufnebenkosten',
'Kaufnebenkosten betragen je nach Bundesland 10-15% des Kaufpreises: Grunderwerbsteuer (3,5-6,5%), Notar (ca. 1,5%), Grundbuch (ca. 0,5%), ggf. Makler (3-6%). Diese Kosten müssen in der Regel aus Eigenkapital finanziert werden.',
ARRAY['nebenkosten', 'grunderwerbsteuer', 'notar', 'makler'], 'Kaufy-FAQ', true),

('financing', 'Eigenkapitalanforderung',
'Banken erwarten üblicherweise 20-30% Eigenkapital. Minimum: Kaufnebenkosten + 10%. Mehr Eigenkapital = bessere Zinskonditionen. Vollfinanzierung (110%) ist möglich, aber mit höheren Zinsen und strengeren Bonitätsanforderungen verbunden.',
ARRAY['eigenkapital', 'finanzierung', 'bank', 'bonität'], 'Kaufy-FAQ', true),

('financing', 'Forward-Darlehen',
'Ein Forward-Darlehen sichert den heutigen Zinssatz für eine Anschlussfinanzierung in 1-5 Jahren. Sinnvoll bei steigenden Zinsen. Aufschlag: ca. 0,01-0,02% pro Monat Vorlaufzeit. Risiko: Zinsen könnten auch fallen.',
ARRAY['forward', 'anschlussfinanzierung', 'zinssicherung'], 'Kaufy-FAQ', true),

('financing', 'Sondertilgung',
'Sondertilgungsrechte erlauben zusätzliche Tilgungen außerhalb der regulären Rate, meist 5-10% p.a. Beschleunigt die Entschuldung und spart Zinsen. Bei Kapitalanlagen oft weniger sinnvoll, da Steuervorteil durch Zinsabzug entfällt.',
ARRAY['sondertilgung', 'tilgung', 'flexibilität', 'entschuldung'], 'Kaufy-FAQ', true),

('financing', 'Restschuld',
'Die Restschuld ist der noch offene Darlehensbetrag nach Ablauf der Zinsbindung. Berechnung: Ursprünglicher Darlehensbetrag - Summe aller Tilgungen. Bei Zinsbindungsende muss die Restschuld refinanziert oder getilgt werden.',
ARRAY['restschuld', 'anschlussfinanzierung', 'darlehen'], 'Kaufy-FAQ', true),

-- LEGAL (4 Einträge)
('legal', 'Grunderwerbsteuer',
'Die Grunderwerbsteuer ist beim Immobilienkauf fällig und variiert nach Bundesland zwischen 3,5% (Bayern, Sachsen) und 6,5% (Brandenburg, NRW, Schleswig-Holstein). Sie fällt auf den Kaufpreis inkl. übernommener Inventar an.',
ARRAY['grunderwerbsteuer', 'nebenkosten', 'bundesland'], 'Kaufy-FAQ', true),

('legal', 'Notar und Grundbuch',
'Der Notar beurkundet den Kaufvertrag und wickelt die Eigentumsübertragung ab. Kosten: ca. 1,5% des Kaufpreises. Grundbuchkosten: ca. 0,5%. Der Notar ist neutral und berät beide Parteien. Ohne Notar ist ein Immobilienkauf in Deutschland nicht möglich.',
ARRAY['notar', 'grundbuch', 'beurkundung', 'kosten'], 'Kaufy-FAQ', true),

('legal', 'Teilungserklärung (WEG)',
'Bei Eigentumswohnungen regelt die Teilungserklärung die Aufteilung des Gemeinschaftseigentums und Sondereigentums. Sie definiert Stimmrechte, Kostenverteilung und Nutzungsrechte. Vor dem Kauf sollte die Teilungserklärung geprüft werden.',
ARRAY['teilungserklärung', 'weg', 'eigentumswohnung', 'gemeinschaft'], 'Kaufy-FAQ', true),

('legal', 'Mietvertrag und Mietrecht',
'Bei vermieteten Objekten geht der bestehende Mietvertrag auf den Käufer über (Kauf bricht nicht Miete, §566 BGB). Mieterhöhungen sind an die ortsübliche Vergleichsmiete und Mietpreisbremse gebunden. Eigenbedarfskündigung hat strenge Voraussetzungen.',
ARRAY['mietvertrag', 'mietrecht', 'mieter', 'eigenbedarf'], '§566 BGB', true),

-- FAQ (4 Einträge)
('faq', 'Wie viel Eigenkapital brauche ich?',
'Empfohlen sind mindestens die Kaufnebenkosten (10-15%) plus 10% des Kaufpreises, also insgesamt 20-25%. Beispiel: Bei 300.000€ Kaufpreis sollten 60.000-75.000€ Eigenkapital vorhanden sein. Mehr Eigenkapital bedeutet bessere Zinskonditionen und geringere monatliche Belastung.',
ARRAY['eigenkapital', 'finanzierung', 'anfänger'], 'Kaufy-FAQ', true),

('faq', 'Was ist eine gute Rendite?',
'Eine "gute" Rendite hängt von Lage und Risiko ab. Richtwerte: Bruttomietrendite 4-6% in guten Lagen, 6-8% in B-Lagen. Die Nettomietrendite liegt ca. 1-2% darunter. Wichtiger als die Rendite allein ist das Verhältnis von Rendite zu Risiko und die Wertentwicklungsprognose.',
ARRAY['rendite', 'gut', 'richtwert', 'anfänger'], 'Kaufy-FAQ', true),

('faq', 'Lohnt sich eine Kapitalanlage-Immobilie noch?',
'Ja, Immobilien bleiben eine solide Kapitalanlage. Vorteile: Inflationsschutz, Steuervorteile, Hebeleffekt, Vermögensaufbau durch Tilgung. Herausforderungen: Gestiegene Zinsen und Preise erfordern sorgfältigere Objektauswahl. Kaufy hilft bei der transparenten Bewertung.',
ARRAY['kapitalanlage', 'lohnenswert', 'anfänger', 'einstieg'], 'Kaufy-FAQ', true),

('faq', 'Wie berechnet Kaufy die Netto-Belastung?',
'Kaufy berechnet die Netto-Belastung mit dem sot-investment-engine Service. Einbezogen werden: Mieteinnahmen, Zins und Tilgung, Verwaltungskosten, Instandhaltung, AfA-Modell, persönlicher Grenzsteuersatz (basierend auf zvE und Familienstand), ggf. Kirchensteuer. Das Ergebnis zeigt die tatsächliche monatliche Belastung nach Steuervorteil.',
ARRAY['berechnung', 'netto-belastung', 'engine', 'methodik'], 'Kaufy-FAQ', true);

-- =============================================
-- Integration Registry: Armstrong Service registrieren
-- =============================================

INSERT INTO public.integration_registry (
  public_id, code, name, type, status, description, version, tenant_id
) VALUES (
  'INT-ARMSTRONG-001',
  'ARMSTRONG_ADVISOR',
  'Armstrong KI-Immobilienberater',
  'edge_function',
  'active',
  'Zentraler KI-Beratungsservice für Investment-Immobilien. Wird von Zone 2 (Portal) und Zone 3 (Website) gleichermaßen genutzt. Ruft sot-investment-engine für Berechnungen auf.',
  '1.0.0',
  NULL
);

-- =============================================
-- View für öffentliche Knowledge Base (Zone 3)
-- =============================================

CREATE OR REPLACE VIEW public.v_public_knowledge AS
SELECT 
  id,
  category,
  title,
  content,
  keywords,
  source
FROM public.knowledge_base
WHERE is_public = true;