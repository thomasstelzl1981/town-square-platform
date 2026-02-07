-- Add location_notes column to properties table for micro-location descriptions
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS location_notes TEXT;