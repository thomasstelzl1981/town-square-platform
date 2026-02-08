-- Neue Rollen zum membership_role Enum hinzufügen
ALTER TYPE membership_role ADD VALUE IF NOT EXISTS 'akquise_manager';
ALTER TYPE membership_role ADD VALUE IF NOT EXISTS 'future_room_web_user_lite';