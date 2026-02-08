
## Zone 1 Admin: Umstrukturierung Sidebar und KI-Office

**Status: ✅ Implementiert**

### Zusammenfassung

Die Admin-Sidebar wurde reorganisiert. Eine neue Kategorie "KI Office" wurde hinzugefuegt, die einen eigenen E-Mail-Client und Kontakte-Manager fuer Zone 1 enthaelt. Die Daten werden strikt getrennt - jedes Modul/Zone hat seinen eigenen Kontaktpool via `scope` Spalte.

---

### 1. Neue Sidebar-Struktur

**Aktuelle Gruppierung:**
```text
Master Data:
  - Kontakte (MasterContacts)
  - Master-Vorlagen (MasterTemplates)
```

**Neue Gruppierung:**
```text
Masterdata:
  - Immobilienakte Vorlage
  - Selbstauskunft Vorlage

KI Office:
  - E-Mail
  - Kontakte
```

---

### 2. Routen-Aenderungen in routesManifest.ts

**Entfernen:**
- `{ path: "contacts", component: "MasterContacts", title: "Kontakte" }`
- `{ path: "master-templates", component: "MasterTemplates", title: "Master-Vorlagen" }`

**Neu hinzufuegen:**
```text
// Masterdata (direkt, ohne Unterseite)
{ path: "masterdata/immobilienakte", component: "MasterTemplatesImmobilienakte", title: "Immobilienakte Vorlage" }
{ path: "masterdata/selbstauskunft", component: "MasterTemplatesSelbstauskunft", title: "Selbstauskunft Vorlage" }

// KI Office
{ path: "ki-office", component: "AdminKiOffice", title: "KI Office" }
{ path: "ki-office/email", component: "AdminEmailTab", title: "E-Mail" }
{ path: "ki-office/kontakte", component: "AdminKontakteTab", title: "Kontakte" }
```

---

### 3. AdminSidebar.tsx Anpassungen

**Neue Gruppen-Konfiguration:**
```text
GROUP_CONFIG = {
  'foundation': { label: 'Tenants & Access', priority: 1 },
  'masterdata': { label: 'Masterdata', priority: 2 },        // NEU (umbenannt)
  'ki-office': { label: 'KI Office', priority: 3 },          // NEU
  'activation': { label: 'Feature Activation', priority: 4 },
  'backbone': { label: 'Backbone', priority: 5 },
  'desks': { label: 'Operative Desks', priority: 6 },
  'agents': { label: 'AI Agents', priority: 7 },
  'system': { label: 'System', priority: 8 },
  'platformAdmin': { label: 'Platform Admin', priority: 9 },
};
```

**Pfad-zu-Gruppe Mapping:**
```text
// Masterdata
if (path.startsWith('masterdata/')) return 'masterdata';

// KI Office
if (path.startsWith('ki-office')) return 'ki-office';
```

---

### 4. Modulgrenze: Kontakte-Trennung

**Wichtiges Architekturprinzip:** Zone 1 und Zone 2 teilen KEINE Kontaktdaten.

**Aktuelle Struktur:**
- `contacts` Tabelle hat `tenant_id` Spalte
- Zone 2 Kontakte gehoeren zum jeweiligen Mandanten (tenant_id = client org)

**Zone 1 Strategie:**
Option A: Neuer Scope-Marker (empfohlen)
- Neue Spalte: `scope` (TEXT) - Werte: 'zone1_admin', 'zone2_tenant'
- Zone 1 Kontakte: `scope = 'zone1_admin'` UND `tenant_id = NULL`
- Zone 2 Kontakte: `scope = 'zone2_tenant'` UND `tenant_id = <mandant_id>`

**Datenbank-Migration:**
```text
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'zone2_tenant';
UPDATE contacts SET scope = 'zone2_tenant' WHERE scope IS NULL;
```

---

### 5. Neue Dateien erstellen

**5.1. Admin KI Office Landing Page:**
```text
src/pages/admin/ki-office/index.tsx
- Dashboard mit Tabs: E-Mail | Kontakte
- Karten-Uebersicht mit Statistiken
```

**5.2. Admin E-Mail Tab:**
```text
src/pages/admin/ki-office/AdminEmailTab.tsx
- Kopie der Zone 2 EmailTab.tsx
- Angepasst fuer Platform Admin Kontext
- Eigene mail_accounts (admin-scope)
- Kontaktanreicherung aktivierbar
```

**5.3. Admin Kontakte Tab:**
```text
src/pages/admin/ki-office/AdminKontakteTab.tsx
- Basiert auf Zone 2 KontakteTab.tsx
- Filter: scope = 'zone1_admin'
- KEINE Mandanten-Auswahl (ist platform-weit)
- Alle erweiterten Felder (Anrede, Mobil, Adresse, Kategorie)
- Auto-Enrichment Schalter (E-Mail/Post)
```

---

### 6. Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/routesManifest.ts` | Routen anpassen |
| `src/components/admin/AdminSidebar.tsx` | Gruppen und Mapping anpassen |
| `src/pages/admin/ki-office/index.tsx` | NEU: Landing Page |
| `src/pages/admin/ki-office/AdminEmailTab.tsx` | NEU: E-Mail Client |
| `src/pages/admin/ki-office/AdminKontakteTab.tsx` | NEU: Kontakte |
| `supabase/migrations/xxx_add_contact_scope.sql` | NEU: scope Spalte |
| `src/pages/admin/MasterContacts.tsx` | ENTFERNEN (ersetzt) |
| `src/pages/admin/MasterTemplates.tsx` | ENTFERNEN (nur Redirect) |

---

### 7. Feature: Kontaktanreicherung in Zone 1

Die bestehende Edge Function `sot-contact-enrichment` wird erweitert:

**Neuer Parameter:**
```text
{
  source: 'email' | 'post',
  scope: 'zone1_admin' | 'zone2_tenant',  // NEU
  tenant_id: string | null,
  data: { ... }
}
```

**Logik:**
- Bei `scope = 'zone1_admin'`: Kontakt ohne tenant_id anlegen/anreichern
- Bei `scope = 'zone2_tenant'`: Bestehendes Verhalten (mit tenant_id)

---

### 8. UI-Wireframe Admin KI Office

```text
+----------------------------------------------------------+
| KI Office                                                |
+----------------------------------------------------------+
| [E-Mail]  [Kontakte]                                     |
+----------------------------------------------------------+
|                                                          |
|  +------------------+  +------------------+               |
|  | Verbundene       |  | Kontakte         |               |
|  | E-Mail-Konten: 2 |  | Gesamt: 156      |               |
|  +------------------+  +------------------+               |
|                                                          |
|  +------------------+  +------------------+               |
|  | Ungelesene       |  | Kategorie        |               |
|  | Nachrichten: 12  |  | "Offen": 23      |               |
|  +------------------+  +------------------+               |
|                                                          |
+----------------------------------------------------------+
```

---

### 9. Sicherheit und RLS

**Neue RLS-Regeln fuer Zone 1 Kontakte:**
```text
CREATE POLICY "Zone 1 admins can manage admin contacts"
ON contacts
FOR ALL
USING (
  scope = 'zone1_admin' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'platform_admin'
  )
);
```

---

### Technische Details

**Icon Mapping Erweiterungen:**
```text
ICON_MAP = {
  // Masterdata
  'MasterTemplatesImmobilienakte': Building2,
  'MasterTemplatesSelbstauskunft': FileText,
  // KI Office
  'AdminKiOffice': Sparkles,
  'AdminEmailTab': Mail,
  'AdminKontakteTab': Contact,
}
```

**shouldShowInNav Anpassung:**
```text
// KI Office Sub-Items ausblenden (werden ueber Tab-Navigation erreicht)
if (path.startsWith('ki-office/')) return false;
// Masterdata Sub-Items anzeigen (sind eigenstaendige Seiten)
if (path.startsWith('masterdata/')) return true;
```

---

### Zusammenfassung der Aenderungen

1. **Sidebar-Reorganisation:** Neue Kategorien "Masterdata" und "KI Office"
2. **Strikte Datentrennung:** `scope` Spalte in `contacts` Tabelle
3. **Admin KI Office:** Eigener E-Mail-Client und Kontakte (nicht synchronisiert mit Zone 2)
4. **Kontaktanreicherung:** Funktioniert auch fuer Zone 1 Kontakte
5. **Alte Seiten entfernen:** MasterContacts und MasterTemplates Landing werden ersetzt

