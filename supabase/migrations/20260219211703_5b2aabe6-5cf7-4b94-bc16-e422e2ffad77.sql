
-- Extend property_accounting with AfA model fields
ALTER TABLE property_accounting ADD COLUMN IF NOT EXISTS afa_model text DEFAULT '7_4_2b';
ALTER TABLE property_accounting ADD COLUMN IF NOT EXISTS ak_ground numeric DEFAULT 0;
ALTER TABLE property_accounting ADD COLUMN IF NOT EXISTS ak_building numeric DEFAULT 0;
ALTER TABLE property_accounting ADD COLUMN IF NOT EXISTS ak_ancillary numeric DEFAULT 0;
ALTER TABLE property_accounting ADD COLUMN IF NOT EXISTS book_value_date date;
ALTER TABLE property_accounting ADD COLUMN IF NOT EXISTS cumulative_afa numeric DEFAULT 0;
ALTER TABLE property_accounting ADD COLUMN IF NOT EXISTS sonder_afa_annual numeric DEFAULT 0;
ALTER TABLE property_accounting ADD COLUMN IF NOT EXISTS denkmal_afa_annual numeric DEFAULT 0;

COMMENT ON COLUMN property_accounting.afa_model IS 'AfA model key: 7_4_1, 7_4_2a, 7_4_2b, 7_4_2c, 7_5a, 7b, 7h, 7i, rnd';
COMMENT ON COLUMN property_accounting.ak_ground IS 'Anschaffungskosten Grundstueck EUR';
COMMENT ON COLUMN property_accounting.ak_building IS 'Anschaffungskosten Gebaeude EUR';
COMMENT ON COLUMN property_accounting.ak_ancillary IS 'Erwerbsnebenkosten EUR';
COMMENT ON COLUMN property_accounting.book_value_date IS 'Stichtag fuer Buchwert';
COMMENT ON COLUMN property_accounting.cumulative_afa IS 'Bisher kumulierte AfA EUR';
COMMENT ON COLUMN property_accounting.sonder_afa_annual IS 'Sonder-AfA p.a. (§7b) EUR';
COMMENT ON COLUMN property_accounting.denkmal_afa_annual IS 'Denkmal/Sanierungs-AfA p.a. (§7h/7i) EUR';
