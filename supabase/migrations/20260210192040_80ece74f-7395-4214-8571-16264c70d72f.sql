
-- =============================================
-- MOD-15 FORTBILDUNG: Tables + Seed Data + Integration Registry
-- =============================================

-- 1. Create fortbildung_curated_items table
CREATE TABLE public.fortbildung_curated_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tab text NOT NULL CHECK (tab IN ('books','trainings','talks','courses')),
  topic text NOT NULL CHECK (topic IN ('immobilien','finanzen','erfolg','persoenlichkeit')),
  provider text NOT NULL CHECK (provider IN ('amazon','udemy','eventbrite','youtube','impact')),
  title text NOT NULL,
  author_or_channel text,
  image_url text,
  description text,
  price_text text,
  rating_text text,
  duration_text text,
  affiliate_link text NOT NULL,
  external_id text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create fortbildung_search_logs table
CREATE TABLE public.fortbildung_search_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tab text NOT NULL,
  query text NOT NULL,
  results_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.fortbildung_curated_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fortbildung_search_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "fortbildung_curated_select" ON public.fortbildung_curated_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "fortbildung_curated_admin_insert" ON public.fortbildung_curated_items
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY "fortbildung_curated_admin_update" ON public.fortbildung_curated_items
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY "fortbildung_curated_admin_delete" ON public.fortbildung_curated_items
  FOR DELETE USING (is_platform_admin());

CREATE POLICY "fortbildung_logs_insert" ON public.fortbildung_search_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "fortbildung_logs_select" ON public.fortbildung_search_logs
  FOR SELECT USING (is_platform_admin());

-- 5. Indexes
CREATE INDEX idx_fortbildung_curated_tab ON public.fortbildung_curated_items(tab);
CREATE INDEX idx_fortbildung_curated_topic ON public.fortbildung_curated_items(topic);
CREATE INDEX idx_fortbildung_curated_active ON public.fortbildung_curated_items(is_active) WHERE is_active = true;
CREATE INDEX idx_fortbildung_logs_tab ON public.fortbildung_search_logs(tab);

-- 6. Integration Registry entries for MOD-15 (using valid enum: pending_setup)
INSERT INTO public.integration_registry (public_id, code, name, type, status, description, owner, auth_type, base_url)
VALUES
  ('INT-AMZN', 'AMAZON_PAAPI', 'Amazon Product Advertising API', 'integration', 'pending_setup', 'Books Search/Details + Affiliate Deep Links fuer MOD-15 Buecher', 'MOD-15', 'api_key', 'https://webservices.amazon.de/paapi5'),
  ('INT-UDMY', 'UDEMY_AFFILIATE', 'Udemy Affiliate API', 'integration', 'pending_setup', 'Kurs Search/Details + Affiliate fuer MOD-15 Fortbildungen', 'MOD-15', 'api_key', 'https://www.udemy.com/api-2.0'),
  ('INT-EVNT', 'EVENTBRITE_API', 'Eventbrite API', 'integration', 'pending_setup', 'Event Search/Details fuer MOD-15 Vortraege', 'MOD-15', 'oauth', 'https://www.eventbriteapi.com/v3'),
  ('INT-YTDA', 'YOUTUBE_DATA_API', 'YouTube Data API v3', 'integration', 'pending_setup', 'Video/Playlist Search fuer MOD-15 Kurse', 'MOD-15', 'api_key', 'https://www.googleapis.com/youtube/v3'),
  ('INT-IMPC', 'IMPACT_AFFILIATE', 'Impact Affiliate Network', 'integration', 'pending_setup', 'Affiliate Tracking/Deep Links (Coursera/edX) fuer MOD-15', 'MOD-15', 'api_key', 'https://api.impact.com');

-- 7. Seed curated items (68 items: 4 tabs x 4 topics x 4-5 items)

-- BOOKS - Immobilien
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, affiliate_link, sort_order) VALUES
('books','immobilien','amazon','Immobilien-Investment fuer Einsteiger','Florian Roski','Der Bestseller fuer den Einstieg in die Immobilienanlage','24,99 EUR','4.6','https://www.amazon.de/dp/B07EXAMPLE1?tag=sot-21',1),
('books','immobilien','amazon','Rich Dad Poor Dad','Robert T. Kiyosaki','Finanzbildung und Immobilien als Vermoegensaufbau','14,99 EUR','4.7','https://www.amazon.de/dp/B07EXAMPLE2?tag=sot-21',2),
('books','immobilien','amazon','Die Immobilien-Formel','Gerald Hoerhan','Investmentpunk ueber Immobilien-Strategien','19,99 EUR','4.4','https://www.amazon.de/dp/B07EXAMPLE3?tag=sot-21',3),
('books','immobilien','amazon','Der Immobilien-Kompass','Carsten Maschmeyer','Strategien fuer Immobilieninvestments','22,00 EUR','4.3','https://www.amazon.de/dp/B07EXAMPLE4?tag=sot-21',4),
('books','immobilien','amazon','Immobilien kaufen, vermieten und Steuern sparen','Alexander Goldwein','Praxisguide Steueroptimierung bei Immobilien','16,90 EUR','4.5','https://www.amazon.de/dp/B07EXAMPLE5?tag=sot-21',5);

-- BOOKS - Finanzen
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, affiliate_link, sort_order) VALUES
('books','finanzen','amazon','Der reichste Mann von Babylon','George S. Clason','Zeitlose Finanzmaximen in Parabelform','9,99 EUR','4.7','https://www.amazon.de/dp/B07EXAMPLEF1?tag=sot-21',1),
('books','finanzen','amazon','Souveraen investieren mit Indexfonds und ETFs','Gerd Kommer','Das Standardwerk fuer passive Geldanlage','32,00 EUR','4.8','https://www.amazon.de/dp/B07EXAMPLEF2?tag=sot-21',2),
('books','finanzen','amazon','Die Psychologie des Geldes','Morgan Housel','Warum Finanzentscheidungen emotional sind','16,00 EUR','4.6','https://www.amazon.de/dp/B07EXAMPLEF3?tag=sot-21',3),
('books','finanzen','amazon','Denke nach und werde reich','Napoleon Hill','Der Klassiker des Erfolgs-Denkens','12,99 EUR','4.5','https://www.amazon.de/dp/B07EXAMPLEF4?tag=sot-21',4);

-- BOOKS - Erfolg
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, affiliate_link, sort_order) VALUES
('books','erfolg','amazon','Die 7 Wege zur Effektivitaet','Stephen R. Covey','Prinzipien fuer persoenliche und berufliche Effektivitaet','26,00 EUR','4.7','https://www.amazon.de/dp/B07EXAMPLEE1?tag=sot-21',1),
('books','erfolg','amazon','Atomic Habits','James Clear','Kleine Gewohnheiten, grosse Wirkung','15,00 EUR','4.8','https://www.amazon.de/dp/B07EXAMPLEE2?tag=sot-21',2),
('books','erfolg','amazon','Das Cafe am Rande der Welt','John Strelecky','Sinnfragen und Lebensausrichtung','8,99 EUR','4.5','https://www.amazon.de/dp/B07EXAMPLEE3?tag=sot-21',3),
('books','erfolg','amazon','Tools der Titanen','Tim Ferriss','Taktiken und Routinen der Erfolgreichsten','14,99 EUR','4.4','https://www.amazon.de/dp/B07EXAMPLEE4?tag=sot-21',4);

-- BOOKS - Persoenlichkeit
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, affiliate_link, sort_order) VALUES
('books','persoenlichkeit','amazon','Das Kind in dir muss Heimat finden','Stefanie Stahl','Bestseller zu inneren Glaubenssaetzen','14,99 EUR','4.7','https://www.amazon.de/dp/B07EXAMPLEP1?tag=sot-21',1),
('books','persoenlichkeit','amazon','Jetzt! Die Kraft der Gegenwart','Eckhart Tolle','Achtsamkeit und Gegenwaertigkeit','10,99 EUR','4.6','https://www.amazon.de/dp/B07EXAMPLEP2?tag=sot-21',2),
('books','persoenlichkeit','amazon','Die Gesetze der Gewinner','Bodo Schaefer','30 Strategien fuer Erfolg und Motivation','9,99 EUR','4.5','https://www.amazon.de/dp/B07EXAMPLEP3?tag=sot-21',3),
('books','persoenlichkeit','amazon','Wie man Freunde gewinnt','Dale Carnegie','Der Klassiker der Menschenfuehrung','12,00 EUR','4.7','https://www.amazon.de/dp/B07EXAMPLEP4?tag=sot-21',4);

-- TRAININGS - Immobilien
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, duration_text, affiliate_link, sort_order) VALUES
('trainings','immobilien','udemy','Immobilienmakler Masterclass','Immobilien-Akademie','Kompletter Kurs fuer angehende Immobilienmakler','89,99 EUR','4.6','12h','https://www.udemy.com/course/immobilienmakler-masterclass/',1),
('trainings','immobilien','udemy','34c GewO Sachkundepruefung Vorbereitung','IHK Online','Vorbereitung auf die Sachkundepruefung','49,99 EUR','4.5','8h','https://www.udemy.com/course/34c-gewo-vorbereitung/',2),
('trainings','immobilien','udemy','Immobilienbewertung Praxis','Bewertungs-Profi','Verkehrswertermittlung Schritt fuer Schritt','69,99 EUR','4.4','10h','https://www.udemy.com/course/immobilienbewertung/',3),
('trainings','immobilien','udemy','Mietrecht fuer Vermieter und Makler','Rechtsanwalt Schmidt','Aktuelle Mietrechts-Grundlagen','39,99 EUR','4.3','6h','https://www.udemy.com/course/mietrecht-grundlagen/',4);

-- TRAININGS - Finanzen
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, duration_text, affiliate_link, sort_order) VALUES
('trainings','finanzen','udemy','Finanzplanung und Vermoegensaufbau','Finanz-Coach','Von der Budgetplanung bis zum Portfolio','59,99 EUR','4.7','14h','https://www.udemy.com/course/finanzplanung-komplett/',1),
('trainings','finanzen','udemy','ETF und Indexfonds Masterclass','Geld-Akademie','Passives Investieren fuer Einsteiger','44,99 EUR','4.6','8h','https://www.udemy.com/course/etf-masterclass/',2),
('trainings','finanzen','udemy','Steuern optimieren fuer Selbststaendige','Steuer-Profi','Steuererklaerung und Optimierung','34,99 EUR','4.4','6h','https://www.udemy.com/course/steuern-selbststaendige/',3),
('trainings','finanzen','udemy','Baufinanzierung verstehen und beraten','Finanzierung24','Baufi-Beratung Schritt fuer Schritt','74,99 EUR','4.5','10h','https://www.udemy.com/course/baufinanzierung-beraten/',4);

-- TRAININGS - Erfolg
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, duration_text, affiliate_link, sort_order) VALUES
('trainings','erfolg','udemy','Verkaufstraining fuer Profis','Sales-Akademie','Abschlusstechniken und Einwandbehandlung','49,99 EUR','4.7','9h','https://www.udemy.com/course/verkaufstraining-profis/',1),
('trainings','erfolg','udemy','Verhandeln wie ein Profi','Negotiation Master','Harvard-Methode in der Praxis','54,99 EUR','4.6','7h','https://www.udemy.com/course/verhandeln-profi/',2),
('trainings','erfolg','udemy','Zeitmanagement und Produktivitaet','Produktiv-Coach','GTD, Pomodoro und digitale Tools','29,99 EUR','4.5','5h','https://www.udemy.com/course/zeitmanagement-produktivitaet/',3),
('trainings','erfolg','udemy','Praesentieren und Ueberzeugen','Rhetorik-Institut','Vom Lampenfieber zum Buehnen-Erfolg','39,99 EUR','4.4','6h','https://www.udemy.com/course/praesentieren-ueberzeugen/',4);

-- TRAININGS - Persoenlichkeit
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, duration_text, affiliate_link, sort_order) VALUES
('trainings','persoenlichkeit','udemy','Emotionale Intelligenz entwickeln','EQ-Academy','Selbstwahrnehmung und Empathie staerken','44,99 EUR','4.6','8h','https://www.udemy.com/course/emotionale-intelligenz/',1),
('trainings','persoenlichkeit','udemy','Resilienz und Stressmanagement','Mindful-Coach','Mentale Staerke im Berufsalltag','34,99 EUR','4.5','6h','https://www.udemy.com/course/resilienz-stressmanagement/',2),
('trainings','persoenlichkeit','udemy','Kommunikation und Koerpersprache','Koerpersprache-Experte','Nonverbale Signale erkennen und nutzen','29,99 EUR','4.4','5h','https://www.udemy.com/course/kommunikation-koerpersprache/',3),
('trainings','persoenlichkeit','udemy','Achtsamkeit im Business','Mindfulness-Institut','MBSR-Techniken fuer den Geschaeftsalltag','39,99 EUR','4.3','7h','https://www.udemy.com/course/achtsamkeit-business/',4);

-- TALKS - Immobilien
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, duration_text, affiliate_link, sort_order) VALUES
('talks','immobilien','eventbrite','Immobilien-Investment Summit 2026','IVD Deutschland','Jahreskonferenz fuer Immobilieninvestoren','299 EUR','Highlight','2 Tage','https://www.eventbrite.de/e/immobilien-summit-2026',1),
('talks','immobilien','eventbrite','PropTech Innovation Day','PropTech Germany','Digitale Transformation der Immobilienbranche','149 EUR','Neu','1 Tag','https://www.eventbrite.de/e/proptech-innovation-day',2),
('talks','immobilien','eventbrite','Makler-Erfolgstag','Makler-Netzwerk','Networking und Best Practices fuer Makler','89 EUR','Beliebt','1 Tag','https://www.eventbrite.de/e/makler-erfolgstag',3),
('talks','immobilien','eventbrite','Webinar: Marktanalyse 2026','Immo-Research','Live-Webinar zu aktuellen Marktdaten','kostenlos','4.8','90 Min','https://www.eventbrite.de/e/marktanalyse-webinar',4);

-- TALKS - Finanzen
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, duration_text, affiliate_link, sort_order) VALUES
('talks','finanzen','eventbrite','FinanzForum Deutschland','Finanzkongress GmbH','Deutschlands groesstes Finanz-Event','199 EUR','Top-Event','2 Tage','https://www.eventbrite.de/e/finanzforum-deutschland',1),
('talks','finanzen','eventbrite','ETF-Konferenz Muenchen','ExtraETF','Alles rund um passive Geldanlage','79 EUR','4.7','1 Tag','https://www.eventbrite.de/e/etf-konferenz-muenchen',2),
('talks','finanzen','eventbrite','Webinar: Baufinanzierung aktuell','Interhyp','Zinsentwicklung und Strategien','kostenlos','4.6','60 Min','https://www.eventbrite.de/e/baufi-webinar',3),
('talks','finanzen','eventbrite','Kapitalanlage-Symposium','Vermoegens-Akademie','Strategien fuer nachhaltigen Vermoegensaufbau','129 EUR','4.5','1 Tag','https://www.eventbrite.de/e/kapitalanlage-symposium',4);

-- TALKS - Erfolg
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, duration_text, affiliate_link, sort_order) VALUES
('talks','erfolg','eventbrite','Sales Excellence Conference','Vertrieb24','Top-Speaker zu Verkauf und Abschluss','179 EUR','Bestseller','1 Tag','https://www.eventbrite.de/e/sales-excellence-conference',1),
('talks','erfolg','eventbrite','Leadership Summit','Fuehrungs-Akademie','Moderne Fuehrung und Team-Management','249 EUR','Highlight','2 Tage','https://www.eventbrite.de/e/leadership-summit',2),
('talks','erfolg','eventbrite','Webinar: Kaltakquise meistern','Akquise-Profi','Live-Training fuer Kaltakquise','kostenlos','4.5','90 Min','https://www.eventbrite.de/e/kaltakquise-webinar',3),
('talks','erfolg','eventbrite','Unternehmer-Tag','Gruender-Netzwerk','Strategien fuer Wachstum und Skalierung','99 EUR','4.4','1 Tag','https://www.eventbrite.de/e/unternehmer-tag',4);

-- TALKS - Persoenlichkeit
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, duration_text, affiliate_link, sort_order) VALUES
('talks','persoenlichkeit','eventbrite','Mindset Festival','Growth-Academy','2 Tage Persoenlichkeitsentwicklung','199 EUR','Top-Event','2 Tage','https://www.eventbrite.de/e/mindset-festival',1),
('talks','persoenlichkeit','eventbrite','TEDx Salon Muenchen','TEDx','Inspirierende Kurzvortraege','49 EUR','4.8','3h','https://www.eventbrite.de/e/tedx-salon-muenchen',2),
('talks','persoenlichkeit','eventbrite','Webinar: Burnout-Praevention','Gesundheits-Coach','Strategien gegen Burnout','kostenlos','4.6','60 Min','https://www.eventbrite.de/e/burnout-praevention',3),
('talks','persoenlichkeit','eventbrite','Coaching-Kongress','ICF Deutschland','Neueste Coaching-Methoden und Trends','159 EUR','4.5','1 Tag','https://www.eventbrite.de/e/coaching-kongress',4);

-- COURSES - Immobilien
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, duration_text, affiliate_link, external_id, sort_order) VALUES
('courses','immobilien','youtube','Immobilien kaufen - Schritt fuer Schritt','Immocation','Kompletter Guide zum ersten Investment','kostenlos','4.8','45 Min','https://www.youtube.com/watch?v=immo_step1','immo_step1',1),
('courses','immobilien','youtube','Renditeberechnung fuer Immobilien','Finanzfluss','Cashflow, Rendite und Kalkulation erklaert','kostenlos','4.7','25 Min','https://www.youtube.com/watch?v=immo_rendite','immo_rendite',2),
('courses','immobilien','youtube','Immobilien-Steuern: Was du wissen musst','Steuer mit Kopf','AfA, Werbungskosten und Steuertricks','kostenlos','4.6','35 Min','https://www.youtube.com/watch?v=immo_steuer','immo_steuer',3),
('courses','immobilien','youtube','Besichtigungstermine wie ein Profi','Makler-Coach TV','Tipps fuer ueberzeugende Objektpraesentationen','kostenlos','4.5','20 Min','https://www.youtube.com/watch?v=immo_besicht','immo_besicht',4),
('courses','immobilien','youtube','WEG-Verwaltung erklaert','Hausverwaltung Digital','Grundlagen der Wohnungseigentumsverwaltung','kostenlos','4.4','30 Min','https://www.youtube.com/watch?v=immo_weg','immo_weg',5);

-- COURSES - Finanzen
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, duration_text, affiliate_link, external_id, sort_order) VALUES
('courses','finanzen','youtube','ETFs erklaert in 10 Minuten','Finanzfluss','Alles was du ueber ETFs wissen musst','kostenlos','4.9','12 Min','https://www.youtube.com/watch?v=etf_erklaert','etf_erklaert',1),
('courses','finanzen','youtube','Aktien fuer Anfaenger','Aktien mit Kopf','Grundlagen des Aktienmarkts','kostenlos','4.7','40 Min','https://www.youtube.com/watch?v=aktien_start','aktien_start',2),
('courses','finanzen','youtube','Altersvorsorge richtig planen','Finanztip','Rente, Riester, ETF-Sparplan im Vergleich','kostenlos','4.6','30 Min','https://www.youtube.com/watch?v=altersvorsorge','altersvorsorge',3),
('courses','finanzen','youtube','Kryptowaehrungen verstehen','Bitcoin2Go','Bitcoin, Ethereum und DeFi erklaert','kostenlos','4.4','50 Min','https://www.youtube.com/watch?v=krypto_start','krypto_start',4);

-- COURSES - Erfolg
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, duration_text, affiliate_link, external_id, sort_order) VALUES
('courses','erfolg','youtube','Verkaufen lernen: Die 5 Phasen','Dirk Kreuter','Verkaufsprozess von Kontakt bis Abschluss','kostenlos','4.8','35 Min','https://www.youtube.com/watch?v=verkauf_5phasen','verkauf_5phasen',1),
('courses','erfolg','youtube','Kaltakquise Masterclass','Lars Kraak','Telefonakquise Techniken und Skripte','kostenlos','4.6','45 Min','https://www.youtube.com/watch?v=kaltakquise_mc','kaltakquise_mc',2),
('courses','erfolg','youtube','LinkedIn Marketing fuer B2B','Social Selling Expert','Lead-Generierung ueber LinkedIn','kostenlos','4.5','30 Min','https://www.youtube.com/watch?v=linkedin_b2b','linkedin_b2b',3),
('courses','erfolg','youtube','Einwandbehandlung: Nie wieder sprachlos','Vertriebscoach TV','Techniken gegen die haeufigsten Einwaende','kostenlos','4.7','25 Min','https://www.youtube.com/watch?v=einwand_tech','einwand_tech',4);

-- COURSES - Persoenlichkeit
INSERT INTO public.fortbildung_curated_items (tab, topic, provider, title, author_or_channel, description, price_text, rating_text, duration_text, affiliate_link, external_id, sort_order) VALUES
('courses','persoenlichkeit','youtube','Selbstdisziplin aufbauen','Motivations-Coach','Gewohnheiten aendern und durchhalten','kostenlos','4.7','20 Min','https://www.youtube.com/watch?v=selbstdisziplin','selbstdisziplin',1),
('courses','persoenlichkeit','youtube','Koerpersprache lesen und einsetzen','Kommunikations-Profi','Nonverbale Signale im Business','kostenlos','4.6','30 Min','https://www.youtube.com/watch?v=koerpersprache','koerpersprache',2),
('courses','persoenlichkeit','youtube','Meditation fuer Unternehmer','Mindful Business','10-Minuten-Routine fuer den Alltag','kostenlos','4.5','15 Min','https://www.youtube.com/watch?v=meditation_biz','meditation_biz',3),
('courses','persoenlichkeit','youtube','Rhetorik: Ueberzeugend sprechen','Rhetorik-Akademie','Stimme, Gestik und Struktur meistern','kostenlos','4.8','40 Min','https://www.youtube.com/watch?v=rhetorik_master','rhetorik_master',4);
