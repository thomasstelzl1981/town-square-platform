-- ============================================================
-- PHASE A: Trigger deaktivieren (keine neuen Orgs bei Signup)
-- ============================================================

-- Trigger auf auth.users deaktivieren
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================
-- PHASE B: Datenbereinigung - Nur "System of a Town" behalten
-- ============================================================

-- 1. Lösche alle Memberships außer für die interne Org
DELETE FROM public.memberships 
WHERE tenant_id != 'a0000000-0000-4000-a000-000000000001';

-- 2. Lösche überflüssige Memberships für User die nicht mehr existieren sollen
-- Behalte nur thomas.stelzl@systemofadown.com als Platform Admin
DELETE FROM public.memberships 
WHERE user_id NOT IN ('d028bc99-6e29-4fa4-b038-d03015faf222');

-- 3. Lösche alle Profiles außer thomas.stelzl
DELETE FROM public.profiles 
WHERE id != 'd028bc99-6e29-4fa4-b038-d03015faf222';

-- 4. Lösche alle Client-Organisationen (behalte nur internal)
DELETE FROM public.organizations 
WHERE id != 'a0000000-0000-4000-a000-000000000001';

-- 5. Stelle sicher, dass thomas.stelzl auf SoT zeigt
UPDATE public.profiles 
SET active_tenant_id = 'a0000000-0000-4000-a000-000000000001'
WHERE id = 'd028bc99-6e29-4fa4-b038-d03015faf222';

-- 6. Stelle sicher, dass thomas.stelzl platform_admin in SoT ist
INSERT INTO public.memberships (id, user_id, tenant_id, role)
VALUES (
  'b0000000-0000-4000-b000-000000000001',
  'd028bc99-6e29-4fa4-b038-d03015faf222',
  'a0000000-0000-4000-a000-000000000001',
  'platform_admin'
)
ON CONFLICT (id) DO UPDATE SET role = 'platform_admin';