
# Umsetzungsplan: Mietverhältnis-Tab Fix & Konsistente Akten-ID

## Analyse der Probleme

### Problem 1: Mietverhältnis-Tab zeigt keine Daten

**Ursache:** Der `TenancyTab.tsx` verwendet eine falsche Join-Syntax:

```typescript
// Zeile 138-142 im TenancyTab.tsx
.select(`
  *,
  tenant_contact:contacts!tenant_contact_id(id, first_name, last_name, email)
`)
```

Die FK-Beziehung zwischen `leases` und `contacts` heisst aber `leases_contact_fk` (composite FK auf `tenant_id, tenant_contact_id`), NICHT `tenant_contact_id`. Der Fehler im Network Request bestaetigt:

```
"Could not find a relationship between 'leases' and 'contacts' in the schema cache"
```

### Problem 2: Korrekte FK-Struktur

Die `leases`-Tabelle hat einen **Composite Foreign Key**:
```sql
FOREIGN KEY (tenant_id, tenant_contact_id) 
  REFERENCES contacts(tenant_id, id) ON DELETE RESTRICT
```

Der korrekte Hint-Name ist `leases_contact_fk`.

### Problem 3: Akten-ID DEMO-001 bleibt unveraendert

Die bestehende Musterimmobilie (`DEMO-001`) behaelt ihre ID. Der Code-Trigger `trg_generate_property_code` greift nur bei `NEW.code IS NULL`. Da `DEMO-001` bereits gesetzt ist, passiert nichts - das ist das gewuenschte Verhalten.

---

## Loesungsplan

### Schritt 1: TenancyTab.tsx - Query korrigieren

**Datei:** `src/components/portfolio/TenancyTab.tsx`

**Zeile 137-146 aendern:**

Von:
```typescript
const { data: leasesData } = await supabase
  .from('leases')
  .select(`
    *,
    tenant_contact:contacts!tenant_contact_id(id, first_name, last_name, email)
  `)
  .eq('unit_id', unitId)
  .eq('tenant_id', tenantId)
  .order('start_date', { ascending: false });
```

Zu:
```typescript
const { data: leasesData } = await supabase
  .from('leases')
  .select(`
    *,
    tenant_contact:contacts!leases_contact_fk(id, first_name, last_name, email)
  `)
  .eq('unit_id', unitId)
  .eq('tenant_id', tenantId)
  .order('start_date', { ascending: false });
```

Der Unterschied: `!leases_contact_fk` statt `!tenant_contact_id`.

---

### Schritt 2: "Neuen Mieter anlegen"-Button hinzufuegen

**Datei:** `src/components/portfolio/TenancyTab.tsx`

Im Kontakt-Auswahl-Bereich (Zeile 609-630) einen "Neuen Kontakt anlegen"-Button und Dialog hinzufuegen:

```typescript
// Nach dem Select fuer tenant_contact_id
<div className="flex gap-2">
  <Select ... className="flex-1">
    ...
  </Select>
  <Button variant="outline" onClick={() => setQuickContactDialogOpen(true)}>
    <Plus className="h-4 w-4" />
  </Button>
</div>
```

Neuer State und Dialog:
```typescript
const [quickContactDialogOpen, setQuickContactDialogOpen] = useState(false);
const [newContactForm, setNewContactForm] = useState({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
});
```

Nach erfolgreicher Kontakt-Erstellung:
1. Kontakt-Liste neu laden (`fetchData()`)
2. Neuen Kontakt automatisch im Formular auswaehlen

---

### Schritt 3: useUnitDossier.ts - Query korrigieren

**Datei:** `src/hooks/useUnitDossier.ts`

**Zeile 78-92 aendern:**

Von:
```typescript
const { data: leasesData } = await supabase
  .from('leases')
  .select(`
    *,
    contacts!leases_contact_fk (
      first_name,
      last_name,
      company
    )
  `)
```

Hier ist der FK-Hint bereits korrekt (`leases_contact_fk`), aber das Feld heisst `contacts` statt `tenant_contact`. Das muss konsistent sein mit dem TenancyTab.

---

## Technische Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/components/portfolio/TenancyTab.tsx` | FK-Hint korrigieren: `!leases_contact_fk` |
| `src/components/portfolio/TenancyTab.tsx` | Schnell-Kontakt-Dialog hinzufuegen |
| `src/hooks/useUnitDossier.ts` | Keine Aenderung noetig (bereits korrekt) |

---

## Testplan

### Test 1: Mietverhaeltnis wird angezeigt
1. Route `/portal/immobilien/00000000-0000-4000-a000-000000000001` oeffnen
2. Tab "Mietverhaeltnis" klicken
3. **Erwartung:** Mietvertrag mit "Bergmann, Thomas" erscheint
4. **Pruefen:** Warmmiete 837.00 EUR, Beginn 01.06.2022, Status "Aktiv"

### Test 2: Neuen Mieter anlegen (Schnellanlage)
1. Tab "Mietverhaeltnis" oeffnen
2. "Neuen Mietvertrag anlegen" klicken
3. Neben Kontakt-Auswahl auf "+" klicken
4. Name eingeben: "Test", "Mieter", email: "test@example.com"
5. "Erstellen" klicken
6. **Erwartung:** "Test Mieter" erscheint sofort in der Kontakt-Auswahl und ist ausgewaehlt
7. Restliche Felder ausfuellen, Vertrag speichern
8. **Erwartung:** Zweiter Vertrag erscheint in Liste (Mehrere aktiv erlaubt)

### Test 3: Akten-ID unveraendert
1. Route `/portal/immobilien/00000000-0000-4000-a000-000000000001` oeffnen
2. **Pruefen:** Header zeigt "DEMO-001 - Leipziger Strasse 42"
3. Neue Immobilie anlegen (Portfolio -> Neu)
4. **Pruefen:** Neue Immobilie erhaelt ID im Format "IMM-2026-00001"

---

## Zusammenfassung

- **Hauptproblem:** Falscher FK-Hint in der Supabase-Query (`!tenant_contact_id` statt `!leases_contact_fk`)
- **Loesung:** Eine Zeile aendern im TenancyTab.tsx
- **Zusatzfeature:** Schnellanlage von Kontakten direkt im Mietverhaeltnis-Dialog
- **Akten-ID:** DEMO-001 bleibt unveraendert; nur neue Immobilien erhalten IMM-YYYY-xxxxx

