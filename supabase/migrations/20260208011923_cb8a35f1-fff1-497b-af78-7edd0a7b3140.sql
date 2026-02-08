-- Erweitere contacts-Tabelle um zusätzliche Felder für vollständige Kontaktverwaltung
-- Bestehende Daten bleiben vollständig erhalten

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS salutation TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS phone_mobile TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS category TEXT;

-- Kommentar für Dokumentation
COMMENT ON COLUMN public.contacts.salutation IS 'Anrede (Herr, Frau, Divers, Firma)';
COMMENT ON COLUMN public.contacts.phone_mobile IS 'Mobiltelefon (separat von Festnetz phone)';
COMMENT ON COLUMN public.contacts.street IS 'Straße inkl. Hausnummer';
COMMENT ON COLUMN public.contacts.postal_code IS 'Postleitzahl';
COMMENT ON COLUMN public.contacts.city IS 'Ort';
COMMENT ON COLUMN public.contacts.category IS 'Kategorie (Mieter, Eigentümer, Verwalter, Makler, Bank, Handwerker, Sonstige)';