
-- CB-001: NK-Engine Personenzahlen — neue Spalten für Bewohnerzahlen

-- Leases: Anzahl Bewohner pro Mietvertrag (Default 2)
ALTER TABLE public.leases 
ADD COLUMN IF NOT EXISTS number_of_occupants integer NOT NULL DEFAULT 2;

-- Properties: Gesamtbewohner der Immobilie (nullable, wird bei Bedarf berechnet)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS total_occupants integer;

COMMENT ON COLUMN public.leases.number_of_occupants IS 'Anzahl Bewohner in der Einheit (für NK-Verteilerschlüssel nach Personen)';
COMMENT ON COLUMN public.properties.total_occupants IS 'Gesamtanzahl Bewohner im Objekt (für NK-Verteilerschlüssel). NULL = wird aus Summe der Leases berechnet.';
