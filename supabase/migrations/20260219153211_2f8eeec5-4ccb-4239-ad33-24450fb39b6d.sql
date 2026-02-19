-- Bereinigung: Berliner Demo-Home und verwaiste Demo-Contracts entfernen

-- 1. Verwaiste Demo-Contracts am Muenchner Auto-Create Home loeschen
DELETE FROM public.miety_contracts 
WHERE id IN (
  'e0000000-0000-4000-a000-000000000601',
  'e0000000-0000-4000-a000-000000000602',
  'e0000000-0000-4000-a000-000000000603'
);

-- 2. Berliner Demo-Home Contracts loeschen (falls CASCADE nicht greift)
DELETE FROM public.miety_contracts 
WHERE home_id = 'e0000000-0000-4000-a000-000000000801';

-- 3. Berliner Demo-Home loeschen
DELETE FROM public.miety_homes 
WHERE id = 'e0000000-0000-4000-a000-000000000801';
