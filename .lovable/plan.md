
# PLAN: Governance-Dokumentation & MOD-01 bis MOD-05 Audit

## Teil A: DEVELOPMENT_GOVERNANCE.md erstellen

### Datei: `DEVELOPMENT_GOVERNANCE.md` (Projekt-Root)

```markdown
# DEVELOPMENT GOVERNANCE

**Projekt:** System of a Town (SoT)  
**Version:** v1.0 FROZEN  
**Datum:** 2026-01-27

---

## Eiserne Regeln

### Regel 1: Zone 2 ist der Master
Das Entwicklungsportal (`/portal/*`) ist die **einzige Source of Truth** für:
- UI-Komponenten und Layouts
- Feature-Implementierungen
- Datenflüsse und Business-Logik
- Edge Functions und API-Patterns

### Regel 2: Explizite Besprechung
Änderungen am Master-Portal erfolgen **ausschließlich** nach:
1. Expliziter Diskussion im Chat
2. Erstellung eines strukturierten Plans
3. Freigabe durch den Projektverantwortlichen

**Keine autonomen Änderungen. Keine Annahmen. Keine Abkürzungen.**

### Regel 3: Zone 1 = Dokumentation
Zone 1 (Admin-Bereich `/admin/*`) dient als:
- Oversight und Monitoring des Master-Portals
- Dokumentation aller implementierten Patterns
- Registry für Tiles, APIs und Integrationen

**Zone 1 verändert niemals Zone 2. Der Datenfluss ist unidirektional.**

---

## Hierarchie

```
MASTER (Zone 2: /portal/*)
    │
    ▼ [Dokumentation]
OVERSIGHT (Zone 1: /admin/*)
    │
    ▼ [Read-Only]
EXTERNAL (Zone 3: Websites)
```

---

## Prüfpflichten

Bei jeder Feature-Implementierung:

| Schritt | Beschreibung | Verantwortlich |
|---------|--------------|----------------|
| 1 | Feature in Zone 2 implementieren | Nach Freigabe |
| 2 | Tile Catalog in Zone 1 aktualisieren | Automatisch |
| 3 | Integration Registry prüfen | Bei API-Nutzung |
| 4 | Dokumentation synchronisieren | Nach Abschluss |

---

## Verbotene Aktionen

- ❌ Autonome Änderungen ohne Chat-Diskussion
- ❌ Zone 1 als Entwicklungsumgebung nutzen
- ❌ Hardcoded Daten in Zone 1 statt DB-Anbindung
- ❌ Dokumentation ohne Master-Implementierung
- ❌ API-Registrierung ohne Edge Function

---

*Dieses Dokument ist verbindlich für alle Entwicklungsaktivitäten.*
```

---

## Teil B: Audit MOD-01 bis MOD-05

### Phase 1: Tile Catalog Synchronisation

**Aktion:** Datenbank-Query zur Prüfung des aktuellen Tile-Status

```sql
SELECT module_id, title, route, parent_id, is_active 
FROM tile_catalog 
WHERE module_id IN ('MOD-01', 'MOD-02', 'MOD-03', 'MOD-04', 'MOD-05')
ORDER BY module_id, sort_order;
```

**Erwartete Korrekturen:**
| module_id | Feld | IST | SOLL |
|-----------|------|-----|------|
| MOD-01 | Sub-Tile "Firma" | Fehlt oder falsch benannt | "Firma" hinzufügen |
| MOD-02 | route | `/portal/ki-office` | `/portal/office` |

### Phase 2: Integration Registry bereinigen

**Aktion 1:** Fehlende Integrationen hinzufügen

```sql
INSERT INTO integration_registry (api_id, name, category, status, auth_type)
VALUES 
  ('LOVABLE_AI', 'Lovable AI', 'AI_SERVICE', 'ACTIVE', 'INTERNAL'),
  ('UNSTRUCTURED', 'Unstructured.io', 'DOCUMENT_PROCESSING', 'PLANNED', 'API_KEY'),
  ('FINAPI', 'FinAPI', 'BANKING', 'PLANNED', 'OAUTH2')
ON CONFLICT (api_id) DO NOTHING;
```

**Aktion 2:** Duplikate entfernen

```sql
DELETE FROM integration_registry 
WHERE id NOT IN (
  SELECT MIN(id) FROM integration_registry GROUP BY api_id
);
```

### Phase 3: Admin Integrations.tsx DB-Anbindung

**Datei:** `src/pages/admin/Integrations.tsx`

**Aktuelle Situation:** Hardcoded Array mit Integrations-Daten
**Änderung:** Umstellung auf `useQuery` mit Supabase-Fetch

```typescript
// NEU: DB-gestützte Integration
const { data: integrations } = useQuery({
  queryKey: ['integration-registry'],
  queryFn: async () => {
    const { data } = await supabase
      .from('integration_registry')
      .select('*')
      .order('category', { ascending: true });
    return data || [];
  },
});
```

### Phase 4: API Catalog Dokumentation

**Datei:** `docs/architecture/API_NUMBERING_CATALOG.md`

**Ergänzungen:**

| API-ID | Edge Function | Modul | Bereich |
|--------|---------------|-------|---------|
| API-701 | sot-property-crud | MOD-04 | Immobilien CRUD |
| API-801 | sot-msv-reminder-check | MOD-05 | Mahnwesen |
| API-802 | sot-msv-rent-report | MOD-05 | Mietreports |
| API-803 | sot-listing-publish | MOD-05 | Exposé Publishing |
| INTERNAL-001 | sot-letter-generate | MOD-02 | KI-Briefgenerator |
| INTERNAL-002 | sot-expose-description | MOD-04 | KI-Beschreibungen |
| INTERNAL-003 | sot-dms-upload-url | MOD-03 | DMS Upload |
| INTERNAL-004 | sot-dms-download-url | MOD-03 | DMS Download |

### Phase 5: Route-Konsistenz prüfen

**Dokumentation vs. Implementation:**

| Modul | Doku-Route | Impl-Route | Status |
|-------|------------|------------|--------|
| MOD-01 | `/portal/stammdaten` | `/portal/stammdaten` | ✓ OK |
| MOD-02 | `/portal/ki-office` | `/portal/office` | ⚠ Anpassen |
| MOD-03 | `/portal/dms` | `/portal/dms` | ✓ OK |
| MOD-04 | `/portal/immobilien` | `/portal/immobilien` | ✓ OK |
| MOD-05 | `/portal/msv` | `/portal/msv` | ✓ OK |

**Korrektur:** Dokumentation auf `/portal/office` aktualisieren (Implementation ist Master)

---

## Implementierungs-Reihenfolge

1. **DEVELOPMENT_GOVERNANCE.md** erstellen (Projekt-Root)
2. **Tile Catalog** DB-Einträge korrigieren
3. **Integration Registry** bereinigen (Duplikate + fehlende)
4. **Integrations.tsx** auf DB-Anbindung umstellen
5. **API_NUMBERING_CATALOG.md** mit Edge Functions ergänzen
6. **SOFTWARE_FOUNDATION.md** Route MOD-02 korrigieren

---

## Akzeptanzkriterien

| AC | Beschreibung |
|----|--------------|
| AC1 | DEVELOPMENT_GOVERNANCE.md existiert im Projekt-Root |
| AC2 | Tile Catalog hat korrekte 4-Tile-Struktur für MOD-01 bis MOD-05 |
| AC3 | Integration Registry ohne Duplikate |
| AC4 | LOVABLE_AI, UNSTRUCTURED, FINAPI in Registry |
| AC5 | Integrations.tsx zeigt DB-Daten statt Hardcoded |
| AC6 | Alle Edge Functions im API_NUMBERING_CATALOG dokumentiert |
| AC7 | MOD-02 Route einheitlich `/portal/office` |
