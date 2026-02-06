# Vollständiger Korrektur- und Erweiterungsplan

## ✅ STATUS: IMPLEMENTIERT (2026-02-06)

Alle Änderungen wurden erfolgreich umgesetzt.

---

## Zusammenfassung der Änderungen

### 1. Datenbank-Migration ✅
- `landlord_contexts`: `tax_rate_percent` (Default 30%) + `managing_director` hinzugefügt
- `context_members`: `birth_name`, `birth_date`, `street`, `house_number`, `postal_code`, `city`, `country`, `email`, `phone` hinzugefügt
- Seed-Daten für Familie Mustermann aktualisiert

### 2. KontexteTab → Vermietereinheiten ✅
- "Standard-Kontext"-Card entfernt
- Label umbenannt zu "Vermietereinheiten"
- Eigentümer werden jetzt mit Geburtsdaten angezeigt
- BUSINESS-Kontexte zeigen GF, HRB, Steuersatz

### 3. CreateContextDialog als 2-Schritt-Wizard ✅
- Schritt 1: Grunddaten + Steuersatz (Default 30%)
- Schritt 2a (PRIVATE): Eigentümer nebeneinander erfassen
- Schritt 2b (BUSINESS): Geschäftsführer, HRB, USt-ID

### 4. PortfolioTab ✅
- `AreaChart` → `ComposedChart` (Restschuld-Linie liegt jetzt ÜBER den Areas)
- Kontext-Dropdown immer sichtbar (ersetzt SubTabNav)
- projectionData für 10-Jahres-Tabelle vorbereitet

### 5. MOD-05/MOD-06 Kontext-Filterung ✅
- Kontext-Dropdown im Header hinzugefügt
- Filterung nach `context_property_assignment` implementiert

### 6. tile_catalog.yaml ✅
- MOD-04 Tile 1: "Kontexte" → "Vermietereinheiten"

---

## Betroffene Dateien

| Datei | Status |
|-------|--------|
| `supabase/migrations/` | ✅ Migration ausgeführt |
| `manifests/tile_catalog.yaml` | ✅ Label geändert |
| `src/pages/portal/immobilien/KontexteTab.tsx` | ✅ Komplett refactored |
| `src/components/shared/CreateContextDialog.tsx` | ✅ 2-Schritt-Wizard |
| `src/pages/portal/immobilien/PortfolioTab.tsx` | ✅ ComposedChart + Dropdown |
| `src/pages/portal/msv/ObjekteTab.tsx` | ✅ Kontext-Filterung |
| `src/pages/portal/verkauf/ObjekteTab.tsx` | ✅ Kontext-Filterung |
