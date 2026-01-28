-- Enable RLS on catalog tables (they already have public SELECT policies)
ALTER TABLE dp_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_type_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_categories ENABLE ROW LEVEL SECURITY;