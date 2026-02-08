
# Analyse & Fix: Verkaufsauftrag-Aktivierung

## 1. Identifizierter Fehler (Kritisch)

### Problem 1: Fehlende `config`-Spalte
Der POST-Request schlägt mit **Status 400** fehl:
```
"Could not find the 'config' column of 'property_features' in the schema cache"
```

**Ursache:** Die Tabelle `property_features` hat keine `config`-Spalte:
```
Aktuelle Spalten: id, tenant_id, property_id, feature_code, status, 
                  activated_at, activated_by, deactivated_at, deactivated_by, 
                  created_at, updated_at
```

**Betroffener Code (VerkaufsauftragTab.tsx):**
- Zeile 227: `config: { commission_rate: agreementState.commissionRate[0] }`
- Zeile 240: `config: { commission_rate: agreementState.commissionRate[0] }`

### Problem 2: UI-Flow nach Aktivierung
Der Switch/Toggle ist nicht das optimale Interaktionsmuster:
- Bei Klick auf Switch → Panel expandiert
- Nach Bestätigung → Panel soll schließen UND Switch soll "an" sein
- Aktuell: Panel schließt nicht weil DB-Fehler

### Problem 3: Deaktivierungs-Flow fehlt
Wenn der User den Verkaufsauftrag wieder deaktiviert:
- `property_features.verkaufsauftrag` → `status: 'inactive'`
- Listing soll auch deaktiviert werden (`listings.status = 'withdrawn'`)
- Objekt soll aus MOD-06, Zone 1, und Katalog verschwinden

---

## 2. Analyse: Downstream-Sichtbarkeit

### MOD-06 Verkauf (ObjekteTab.tsx)
```typescript
// Zeile 94-118: Fetcht ALLE Units mit aktiven Properties
// KEIN Filter auf property_features.verkaufsauftrag!
.eq('properties.status', 'active')
```
**→ Problem:** Objekte erscheinen IMMER, unabhängig vom Verkaufsauftrag

### MOD-09 Vertriebspartner Katalog (KatalogTab.tsx)
```typescript
// Zeile 87-91: Filtert nach listing_publications
.eq('channel', 'partner_network')
.eq('status', 'active');
```
**→ Korrekt:** Nur Objekte mit aktiver Partner-Publikation erscheinen

### Zone 1 Sales Desk (useSalesDeskListings.ts)
```typescript
// Zeile 37-40: Fetcht Listings mit status 'active' oder 'reserved'
.in('status', ['active', 'reserved'])
```
**→ Korrekt:** Nur aktivierte Listings erscheinen

### Zone 3 Website (Kaufy)
Filtert nach `listing_publications.channel = 'kaufy'` mit `status = 'active'`
**→ Korrekt:** Zone 1 steuert die Sichtbarkeit

---

## 3. Lösung

### Phase 1: DB-Migration (config-Spalte hinzufügen)
```sql
-- Spalte 'config' zu property_features hinzufügen
ALTER TABLE public.property_features 
ADD COLUMN config JSONB DEFAULT '{}'::jsonb;

-- Kommentar zur Dokumentation
COMMENT ON COLUMN public.property_features.config IS 
  'Feature-spezifische Konfiguration (z.B. commission_rate für verkaufsauftrag)';
```

### Phase 2: VerkaufsauftragTab.tsx anpassen

#### 2.1 UI-Flow korrigieren
Nach erfolgreicher Aktivierung:
1. Panel schließen (`setExpandedFeature(null)`)
2. Features neu laden (`fetchFeatures()`)
3. Switch zeigt "aktiv" → Automatisch durch State

**Bereits korrekt implementiert in Zeilen 267-272:**
```typescript
setExpandedFeature(null);
resetAgreementState();
await fetchFeatures();
```
→ Problem war nur der DB-Fehler, nicht die UI-Logik

#### 2.2 Deaktivierungs-Flow implementieren
Wenn Switch von "an" auf "aus" geht:
1. `property_features.verkaufsauftrag` → `status: 'inactive'`
2. Zugehöriges Listing → `status: 'withdrawn'`
3. Publications → `status: 'paused'`

```typescript
// Neue Funktion: deactivateVerkaufsauftrag()
async function deactivateVerkaufsauftrag() {
  const feature = getFeature('verkaufsauftrag');
  if (!feature) return;

  // 1. Feature deaktivieren
  await supabase
    .from('property_features')
    .update({
      status: 'inactive',
      deactivated_at: new Date().toISOString(),
      deactivated_by: user?.id
    })
    .eq('id', feature.id);

  // 2. Listing zurückziehen
  await supabase
    .from('listings')
    .update({ status: 'withdrawn' })
    .eq('property_id', propertyId)
    .in('status', ['draft', 'active', 'reserved']);

  // 3. Publications pausieren
  const { data: listings } = await supabase
    .from('listings')
    .select('id')
    .eq('property_id', propertyId);
  
  if (listings?.length) {
    await supabase
      .from('listing_publications')
      .update({ status: 'paused', removed_at: new Date().toISOString() })
      .in('listing_id', listings.map(l => l.id));
  }

  toast.success('Verkaufsauftrag widerrufen');
  await fetchFeatures();
}
```

#### 2.3 handleFeatureToggle anpassen
```typescript
function handleFeatureToggle(code: string, isActive: boolean) {
  const config = FEATURE_CONFIG[code];
  if (!config) return;

  if (code === 'verkaufsauftrag') {
    if (isActive) {
      // Deaktivieren
      deactivateVerkaufsauftrag();
    } else {
      // Aktivieren → Agreement-Panel öffnen
      setExpandedFeature(code);
      resetAgreementState();
    }
  } else if (isActive || !config.requiresAgreement) {
    toggleSimpleFeature(code, isActive);
  }
}
```

### Phase 3: MOD-06 Filter hinzufügen (Optional)

**Option A (Empfohlen):** Alle Units zeigen, aber Status-Badge
```typescript
// Badge für nicht-aktivierte Objekte
{!hasVerkaufsauftrag && (
  <Badge variant="outline" className="text-muted-foreground">
    Nicht aktiviert
  </Badge>
)}
```

**Option B:** Nur aktivierte Units anzeigen
```typescript
// Property Features laden und filtern
const aktiviertePropertyIds = new Set(
  propertyFeatures
    ?.filter(f => f.feature_code === 'verkaufsauftrag' && f.status === 'active')
    ?.map(f => f.property_id)
);

const filteredUnits = units.filter(u => aktiviertePropertyIds.has(u.property_id));
```

---

## 4. Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| DB Migration | `config` JSONB Spalte hinzufügen |
| `VerkaufsauftragTab.tsx` | Deaktivierungs-Flow, handleFeatureToggle |
| `verkauf/ObjekteTab.tsx` | (Optional) Filter/Badge für aktivierte Objekte |

---

## 5. Flow nach Implementierung

### Aktivierung (User klickt Switch → Panel öffnet):
```
User klickt Switch (aus→an)
    ↓
Panel expandiert mit Agreement
    ↓
User füllt Checkboxen aus
    ↓
User klickt "Vermarktung aktivieren"
    ↓
DB: property_features.verkaufsauftrag = 'active'
DB: listings.status = 'active'
DB: user_consents (3 Einträge)
    ↓
Panel schließt, Switch zeigt "an"
    ↓
Objekt erscheint in:
  - MOD-06 Verkauf (Exposé bearbeiten)
  - Zone 1 Sales Desk (zur Freigabe)
```

### Deaktivierung (User klickt Switch → direkt deaktivieren):
```
User klickt Switch (an→aus)
    ↓
DB: property_features.verkaufsauftrag = 'inactive'
DB: listings.status = 'withdrawn'
DB: listing_publications.status = 'paused'
    ↓
Switch zeigt "aus"
    ↓
Objekt verschwindet aus:
  - MOD-06 (oder zeigt "Nicht aktiviert" Badge)
  - Zone 1 Sales Desk
  - MOD-09 Partner-Katalog
  - Zone 3 Website
```

---

## 6. Implementierungsreihenfolge

1. **DB-Migration:** `config` JSONB Spalte zu `property_features` hinzufügen
2. **VerkaufsauftragTab.tsx:** 
   - `deactivateVerkaufsauftrag()` Funktion implementieren
   - `handleFeatureToggle()` anpassen
3. **(Optional) verkauf/ObjekteTab.tsx:** Filter oder Badge für nicht-aktivierte Objekte
4. **Testen:** 
   - Aktivierung → Objekt erscheint in MOD-06, Zone 1
   - Deaktivierung → Objekt verschwindet
   - Kaufy-Sichtbarkeit nur wenn Vermarktung aktiv
