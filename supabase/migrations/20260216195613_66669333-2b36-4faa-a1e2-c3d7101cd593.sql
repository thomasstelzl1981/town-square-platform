-- Set demo dog photos (Unsplash, public domain)
UPDATE public.pets
SET photo_url = 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400&h=500&fit=crop&crop=face'
WHERE id = 'd0000000-0000-4000-a000-000000000010';

UPDATE public.pets
SET photo_url = 'https://images.unsplash.com/photo-1612195583950-b8fd34c87093?w=400&h=500&fit=crop&crop=face'
WHERE id = 'd0000000-0000-4000-a000-000000000011';