
# Umsetzungsplan: Mietverhältnis-Tab Fix & Konsistente Akten-ID

## Status: ✅ ERLEDIGT

## Analyse der Probleme

### Problem 1: Mietverhältnis-Tab zeigt keine Daten

**Ursache:** Der `TenancyTab.tsx` verwendete eine falsche Join-Syntax:

```typescript
// VORHER (falsch)
tenant_contact:contacts!tenant_contact_id(...)

// NACHHER (korrekt)  
tenant_contact:contacts!leases_contact_fk(...)
```

Die FK-Beziehung zwischen `leases` und `contacts` heisst `leases_contact_fk` (composite FK auf `tenant_id, tenant_contact_id`), NICHT `tenant_contact_id`.

### Problem 2: Korrekte FK-Struktur

Die `leases`-Tabelle hat einen **Composite Foreign Key**:
```sql
FOREIGN KEY (tenant_id, tenant_contact_id) 
  REFERENCES contacts(tenant_id, id) ON DELETE RESTRICT
```

### Problem 3: Akten-ID DEMO-001 bleibt unveraendert

Die bestehende Musterimmobilie (`DEMO-001`) behaelt ihre ID. Der Code-Trigger `trg_generate_property_code` greift nur bei `NEW.code IS NULL`. Da `DEMO-001` bereits gesetzt ist, passiert nichts - das ist das gewuenschte Verhalten.

---

## Durchgefuehrte Aenderungen

### 1. TenancyTab.tsx - Query korrigiert ✅

**Zeile 142:** FK-Hint von `!tenant_contact_id` zu `!leases_contact_fk` geaendert.

### 2. Schnell-Kontakt-Dialog hinzugefuegt ✅

- Neuer State: `quickContactDialogOpen`, `creatingContact`, `newContactForm`
- Neue Funktion: `handleCreateQuickContact()` - erstellt Kontakt und waehlt ihn automatisch aus
- UI: Plus-Button neben der Kontakt-Auswahl
- Dialog: Formular fuer Vorname, Nachname, E-Mail, Telefon

### 3. useUnitDossier.ts - Bereits korrekt ✅

Die Query verwendet bereits den korrekten FK-Hint `!leases_contact_fk`.

---

## Verifizierung

Die Datenbank enthaelt:
- **Unit:** `00000000-0000-4000-a000-000000000002` (DEMO-001)
- **Lease:** Thomas Bergmann, Warmmiete 837.00 EUR, Status "active", seit 01.06.2022
- **Contact:** Thomas Bergmann mit Email `t.bergmann@email.de`

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
5. "Anlegen & Auswaehlen" klicken
6. **Erwartung:** "Test Mieter" erscheint sofort in der Kontakt-Auswahl und ist ausgewaehlt

### Test 3: Akten-ID unveraendert
1. Route `/portal/immobilien/00000000-0000-4000-a000-000000000001` oeffnen
2. **Pruefen:** Header zeigt "DEMO-001 - Leipziger Strasse 42"
