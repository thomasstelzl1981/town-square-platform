
# Konsistente Akten-ID (property.code) über den gesamten Golden Path

## Problemanalyse

### Aktueller Zustand

Beim Anlegen einer neuen Immobilie über `CreatePropertyDialog`:

```typescript
// src/components/portfolio/CreatePropertyDialog.tsx (Zeile 64-72)
const { data, error } = await supabase
  .from('properties')
  .insert({
    tenant_id: activeOrganization.id,
    city: formData.city,
    address: formData.address,
    property_type: formData.property_type,
  })
```

**PROBLEM:** Es wird KEIN `code` übergeben!

### Datenbank-Status

| Feld | Default-Wert | Trigger | Ergebnis |
|------|--------------|---------|----------|
| `id` | `gen_random_uuid()` | — | ✅ Automatisch |
| `public_id` | — | `trg_set_property_public_id` → `SOT-I-XXXXXXXX` | ✅ Automatisch |
| **`code`** | **KEINER** | **KEINER** | ❌ **NULL** |

### Auswirkungen auf den Golden Path

```text
1. CreatePropertyDialog
   └── INSERT properties → code = NULL ❌

2. Trigger: create_property_folder_structure()
   └── prop_label := COALESCE(NEW.code, '') || ' - ' || NEW.address
   └── Ergebnis: " - Musterstraße 42" (fehlerhaft!)

3. ExposeTab
   └── {property.code && ...} → Zeigt nichts an ❌

4. Listings (Verkaufs-/Miet-Exposé)
   └── Kein code-Bezug in der ID ❌

5. Storage-Pfad (geplant)
   └── /Immobilien/{code}/... → /Immobilien/null/... ❌
```

---

## Lösungsplan

### Schritt 1: Automatische Code-Generierung (Datenbank-Trigger)

Neuer Trigger für `properties.code` mit Format: `IMM-{YYYY}-{SEQUENCE}`

```sql
-- Beispiel-Ergebnis: IMM-2026-00001
CREATE OR REPLACE FUNCTION public.generate_property_code()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
  new_code TEXT;
BEGIN
  -- Nur wenn code NULL oder leer ist
  IF NEW.code IS NULL OR NEW.code = '' THEN
    year_str := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Nächste Sequenznummer für dieses Jahr und diesen Tenant
    SELECT COALESCE(MAX(
      NULLIF(REGEXP_REPLACE(code, '^IMM-' || year_str || '-', ''), code)::INTEGER
    ), 0) + 1
    INTO seq_num
    FROM properties 
    WHERE tenant_id = NEW.tenant_id 
      AND code LIKE 'IMM-' || year_str || '-%';
    
    new_code := 'IMM-' || year_str || '-' || LPAD(seq_num::TEXT, 5, '0');
    NEW.code := new_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_property_code
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION generate_property_code();
```

**Format-Ergebnis:**
- Erste Immobilie 2026: `IMM-2026-00001`
- Zweite Immobilie 2026: `IMM-2026-00002`
- Erste Immobilie 2027: `IMM-2027-00001`

### Schritt 2: Storage-Ordner-Trigger aktualisieren

Der `create_property_folder_structure()` Trigger nutzt bereits `NEW.code`, aber der läuft **NACH** dem Insert. Da der Code-Trigger BEFORE INSERT läuft, ist `NEW.code` bereits gesetzt.

**Keine Änderung nötig** — der Trigger verwendet bereits:
```sql
prop_label := COALESCE(NEW.code, '') || CASE WHEN NEW.code IS NOT NULL THEN ' - ' ELSE '' END || NEW.address;
```

### Schritt 3: Listings mit Property-Code verknüpfen

Bei Erstellung eines Listings den `code` als Referenz speichern:

**Datei:** `src/pages/portal/verkauf/ExposeDetail.tsx` (Zeile 216-227)

```typescript
// Vorher:
title: `${property.address || 'Immobilie'}, ${property.city || ''} ...`

// Nachher (optional, für Konsistenz):
title: `${property.code ? property.code + ' – ' : ''}${property.address || 'Immobilie'}, ${property.city || ''} ...`
```

### Schritt 4: Upload-Pfad mit Code

**Datei:** `supabase/functions/sot-dms-upload-url/index.ts`

Der Storage-Pfad soll den `code` nutzen:
```typescript
// Neuer Pfad:
tenant-documents/{tenant_id}/Immobilien/{property_code}/{subfolder}/{timestamp}_{filename}

// Beispiel:
tenant-documents/abc123/Immobilien/IMM-2026-00001/07_Kaufvertrag/1738949123_Kaufvertrag.pdf
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| **Neue Migration** | Trigger `trg_generate_property_code` erstellen |
| `supabase/functions/sot-dms-upload-url/index.ts` | `property_code` Parameter akzeptieren |
| `src/components/portfolio/DatenraumTab.tsx` | `property.code` an Upload übergeben |
| `src/components/immobilienakte/EditableUnitDossierView.tsx` | Upload-Zone entfernen |
| `src/pages/portal/verkauf/ExposeDetail.tsx` | Code in Listing-Titel (optional) |

---

## Golden Path nach Implementierung

```text
┌─────────────────────────────────────────────────────────────────────┐
│ 1. ANLAGE (CreatePropertyDialog)                                    │
│    INSERT properties (city, address, property_type)                 │
│    ↓                                                                │
│    TRIGGER: trg_generate_property_code                             │
│    └── code = "IMM-2026-00001" ✅                                   │
│    ↓                                                                │
│    TRIGGER: trg_set_property_public_id                             │
│    └── public_id = "SOT-I-ABC12345" ✅                              │
│    ↓                                                                │
│    TRIGGER: create_property_folder_structure                        │
│    └── storage_node.name = "IMM-2026-00001 - Musterstraße 42" ✅    │
├─────────────────────────────────────────────────────────────────────┤
│ 2. IMMOBILIENAKTE                                                   │
│    property.code = "IMM-2026-00001" → Anzeige im Header ✅          │
├─────────────────────────────────────────────────────────────────────┤
│ 3. DATENRAUM                                                        │
│    Upload → Storage-Pfad:                                           │
│    /Immobilien/IMM-2026-00001/07_Kaufvertrag/123_Vertrag.pdf ✅     │
├─────────────────────────────────────────────────────────────────────┤
│ 4. EXPOSÉ (Verkauf/Vermietung)                                      │
│    listing.title inkl. code                                         │
│    "IMM-2026-00001 – Musterstraße 42, Berlin" ✅                    │
├─────────────────────────────────────────────────────────────────────┤
│ 5. PORTFOLIO-LISTE                                                  │
│    Spalte "Akten-ID" zeigt property.code ✅                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ID-Struktur Übersicht

| Entität | Interne ID (UUID) | Lesbare ID (code) | System-ID (public_id) |
|---------|-------------------|-------------------|----------------------|
| Property | `00000000-...` | `IMM-2026-00001` | `SOT-I-ABC12345` |
| Unit | `00000000-...` | `WE 42` (manuell) | `SOT-E-XYZ67890` |
| Contact | `00000000-...` | — | `SOT-K-DEF11111` |
| Document | `00000000-...` | — | `SOT-D-GHI22222` |

---

## Testplan

### Test 1: Neue Immobilie anlegen
1. `/portal/immobilien/portfolio` öffnen
2. "Neu" klicken → Dialog ausfüllen (Berlin, Teststraße 1, ETW)
3. **Prüfen:** Nach Weiterleitung zur Akte:
   - Header zeigt `IMM-2026-XXXXX – Teststraße 1`
   - Code ist **nicht NULL**

### Test 2: Storage-Ordner prüfen
1. Datenraum-Tab öffnen
2. **Prüfen:** Root-Ordner heißt `IMM-2026-XXXXX - Teststraße 1`

### Test 3: Dokument hochladen
1. Im Datenraum einen Ordner wählen (z.B. `07_Kaufvertrag`)
2. Datei hochladen
3. **Prüfen:** Storage-Pfad enthält `/Immobilien/IMM-2026-XXXXX/07_Kaufvertrag/...`

### Test 4: Exposé erstellen
1. Exposé-Tab öffnen
2. Wechseln zu "Verkauf" → Objekte → Exposé erstellen
3. **Prüfen:** Listing-Titel enthält den Code

### Test 5: Portfolio-Liste
1. `/portal/immobilien/portfolio` öffnen
2. **Prüfen:** Neue Spalte oder bestehende Anzeige zeigt `IMM-2026-XXXXX`

---

## Risikominimierung

1. **Bestehende Daten:** DEMO-001 bleibt erhalten (Trigger nur bei NULL)
2. **Keine Breaking Changes:** Format ist abwärtskompatibel
3. **Schrittweise:** Migration → Frontend → Edge Function
4. **Rollback:** Trigger kann entfernt werden ohne Datenverlust
