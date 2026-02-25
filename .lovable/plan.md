

## Systemprüfung: Zone 1 Sales Desk ↔ Zone 2/Zone 3 Governance-Flow

### Analyse-Ergebnis

Ich habe den kompletten Datenfluss geprüft: DB-Daten, RLS-Policies, Sales Desk Hook, VeroeffentlichungenTab, ImmobilienVertriebsauftraegeCard, KatalogTab (MOD-09), SucheTab (MOD-08) und Kaufy2026Home (Zone 3).

---

### DB-Status (verifiziert)

- **3 aktive Listings** im Demo-Tenant (BER-01, MUC-01, HH-01)
- **6 aktive Publikationen** (3× partner_network + 3× kaufy)
- **1 Tenant** mit Listings (Demo-Tenant) — korrekt
- **Keine Datenreste** in anderen Tenants

---

### Befunde

#### BUG-004 (Prio 1) — VeroeffentlichungenTab: Dedup nutzt `title` statt `property_id`

**Datei:** `src/pages/admin/sales-desk/VeroeffentlichungenTab.tsx`, Zeile 28-32

```typescript
// IST (fehlerhaft):
const listings = useMemo(() => deduplicateByField(
  demoListings, dbListings || [], (item: any) => item.title
), ...);
```

**Problem:** Alle anderen Module (Kaufy2026Home, SucheTab, KatalogTab) nutzen bereits `property_id` als Dedup-Key. Die VeroeffentlichungenTab in Zone 1 nutzt noch `title`. Bei abweichenden Titeln zwischen Demo-Hook und DB entstehen Duplikate.

**Fix:** Key-Funktion auf `item.property?.id || item.id` umstellen.

---

#### BUG-005 (Prio 1) — ImmobilienVertriebsauftraegeCard: Dedup nutzt `address|city` statt `property_id`

**Datei:** `src/pages/admin/sales-desk/ImmobilienVertriebsauftraegeCard.tsx`, Zeile 36-39

```typescript
// IST (fehlerhaft):
const allMandates = deduplicateByField(
  demoMandates, mandateListings || [],
  (item: any) => `${item.properties?.address}|${item.properties?.city}`
);
```

**Problem:** Gleiche Inkonsistenz. Bei abweichenden Adressen zwischen Demo-Hook-Shape (`properties.address`) und DB-Shape entstehen Duplikate oder fehlende Matches.

**Fix:** Dedup-Key auf Property-ID umstellen. Die Demo-Mandates haben `id` als `demo-listing-{propertyId}`, DB-Mandates haben `id` als UUID. Da die Shapes unterschiedlich sind (Demo hat kein `property_id`-Feld), muss das Demo-Shape `DemoMandateListing` um `property_id` erweitert werden.

---

#### BUG-006 (Prio 2) — KatalogTab: Image-Fetch nutzt `listing.id` statt `property_id`

**Datei:** `src/pages/portal/vertriebspartner/KatalogTab.tsx`, Zeile 161

```typescript
// IST (fehlerhaft):
const propertyIds = listings.map(l => l.id).filter(Boolean);
```

**Problem:** `fetchPropertyImages` erwartet Property-IDs, aber hier werden Listing-IDs übergeben. Bilder werden nie gefunden, weil die `document_links.object_id` auf Properties zeigt, nicht auf Listings.

**Fix:** `l.property_id` statt `l.id` verwenden.

---

#### BUG-007 (Prio 3) — useSalesDeskListings: Kein `tenant_id`-Feld im Query-Result

**Datei:** `src/hooks/useSalesDeskListings.ts`

**Problem:** Der Sales Desk Query gibt `tenant: organizations(id, name)` zurück, aber das VeroeffentlichungenTab braucht die `tenant_id` für die Distribution-Mutation. Aktuell wird `listing.tenant?.id` verwendet, was funktioniert, aber die Kopplung ist fragil.

**Status:** Funktioniert, kein aktuter Bug — aber potenzieller Bruch bei Schema-Änderungen.

---

#### Governance-Befund: Zone 1 Backbone-Regel eingehalten

Der Architektur-Contract `CONTRACT_LISTING_PUBLISH` (Z2→Z1) und `CONTRACT_LISTING_DISTRIBUTE` (Z1→Z2/Z3) wird korrekt umgesetzt:

```text
Z2 (Owner-Tenant)     Zone 1 (Sales Desk)      Z2/Z3 (Consumer)
     │                       │                        │
     │  listing INSERT       │                        │
     │  ──────────────►      │                        │
     │                       │  VeroeffentlichungenTab │
     │                       │  (Toggle Switches)      │
     │                       │  ───────────────────►   │
     │                       │  listing_publications   │
     │                       │  INSERT/UPDATE          │
     │                       │                        │
     │                       │                   MOD-09 KatalogTab
     │                       │                   MOD-08 SucheTab
     │                       │                   Zone 3 Kaufy
```

- Sales Desk sieht **alle 3 Listings** cross-tenant (platform_admin bypassed RESTRICTIVE RLS) ✅
- Distribution-Toggles (Partner/Kaufy) schreiben in `listing_publications` ✅
- Consumer lesen via PERMISSIVE RLS Policies ✅
- **Kein direkter Z2↔Z2 Datenzugriff** — alles geht über `listing_publications` (Z1 gesteuert) ✅

---

### Reparaturplan

| Ticket | Prio | Aufwand | Beschreibung | Datei |
|--------|------|---------|--------------|-------|
| BUG-004 | 1 | 5 min | VeroeffentlichungenTab: Dedup-Key von `title` auf `property_id` | `VeroeffentlichungenTab.tsx` |
| BUG-005 | 1 | 10 min | ImmobilienVertriebsauftraegeCard: Dedup-Key auf `property_id`, DemoMandateListing erweitern | `ImmobilienVertriebsauftraegeCard.tsx`, `useDemoListings.ts` |
| BUG-006 | 2 | 5 min | KatalogTab: Image-Fetch `l.id` → `l.property_id` | `KatalogTab.tsx` |

**Gesamtaufwand:** ~20 Minuten

### Soll ich diese 3 Fixes jetzt implementieren?

