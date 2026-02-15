

# NK-Abrechnung: Vollstaendiger Inline-Prozess mit editierbaren Datenfeldern

## Diagnose: Warum aktuell nichts funktioniert

Alle Demo-Daten sind korrekt in der Datenbank vorhanden (3 NK-Perioden, 33 Cost-Items, 6 Dokumente mit Links, 3 Leases). Zwei Code-Bugs blockieren den Flow:

1. **`engine.ts` Zeile 58**: Sucht Lease per `.eq('id', input.leaseId)`, aber `leaseId` ist ein leerer String — findet nichts.
2. **`readinessCheck.ts` Zeile 85**: Fragt `leases.property_id` ab, aber diese Spalte existiert nicht. Leases haengen ueber `unit_id` an Units, die wiederum `property_id` haben.

## Loesung: 3 Code-Fixes + komplett neues UI

### Fix 1: `src/engines/nkAbrechnung/engine.ts`

Zeile 55-60 aendern: Statt `.eq('id', input.leaseId)` wird der Lease ueber `unit_id` + `tenant_id` geladen:
```typescript
const { data: lease } = await supabase
  .from('leases')
  .select('*')
  .eq('unit_id', input.unitId)
  .eq('tenant_id', input.tenantId)
  .limit(1)
  .single();
```

Zusaetzlich: `totalUnits` dynamisch berechnen (Anzahl Units der Property fuer unit_count-Schluessel).

### Fix 2: `src/engines/nkAbrechnung/readinessCheck.ts`

Zeile 85-89: Lease-Query ueber Units joinen statt direkt auf `property_id`:
```typescript
const { data: units } = await supabase
  .from('units')
  .select('id')
  .eq('property_id', propertyId)
  .eq('tenant_id', tenantId);

const unitIds = (units || []).map(u => u.id);
const { data: leases } = await supabase
  .from('leases')
  .select('id, rent_cold_eur, nk_advance_eur')
  .eq('tenant_id', tenantId)
  .in('unit_id', unitIds);
```

### Fix 3: `src/hooks/useNKAbrechnung.ts`

Zeile 57: `leaseId: ''` entfernen — die Engine findet den Lease jetzt selbst.

### Neues UI: `src/components/portfolio/NKAbrechnungTab.tsx`

Komplett neuer Inline-Flow von oben nach unten, mit editierbaren Feldern und strukturierter Darstellung des gesamten Prozesses:

```text
NK-Abrechnung                                    [Jahr: 2025 v]
================================================================

SEKTION 1 — EINGEHENDE WEG-ABRECHNUNG
(Daten aus dem Posteingang / Dokument-Extraktion)
┌──────────────────────────────────────────────────────────────┐
│  Dokument: WEG-Jahresabrechnung 2025         Status: ✅     │
│  Abrechnungszeitraum: 01.01.2025 - 31.12.2025              │
│                                                              │
│  Kostenart              │ Schluessel │ Haus ges. │ Ihr Anteil│
│  ─────────────────────────────────────────────────────────── │
│  Wasserversorgung       │ Personen   │  3.200,00 │   360,00 │ ← editierbar
│  Entwaesserung          │ Personen   │  1.800,00 │   202,50 │
│  Muellbeseitigung       │ Personen   │  1.600,00 │   180,00 │
│  Strassenreinigung      │ Flaeche    │    950,00 │    85,00 │
│  Gebaeudereinigung      │ Flaeche    │  2.400,00 │   204,00 │
│  Gebaeudeversicherung   │ MEA        │  3.000,00 │   255,00 │
│  Schornsteinfeger       │ Einheiten  │  1.100,00 │    95,00 │
│  Allgemeinstrom         │ MEA        │  1.200,00 │   102,00 │
│  ────────────────────────────────────────────────────────── │
│  Verwaltungskosten      │ MEA        │  3.600,00 │   306,00 │ nicht umlagef.
│  Instandhaltungsrueckl. │ MEA        │  4.800,00 │   408,00 │ nicht umlagef.
│  ════════════════════════════════════════════════════════════│
│  Summe umlagefaehig (ohne Grundsteuer):          1.483,50   │
│  Summe nicht umlagefaehig:                         714,00   │
│                                            [Speichern]      │
└──────────────────────────────────────────────────────────────┘

SEKTION 2 — GRUNDSTEUERBESCHEID
┌──────────────────────────────────────────────────────────────┐
│  Dokument: Grundsteuerbescheid               Status: ✅     │
│                                                              │
│  Jaehrlicher Betrag (Haus gesamt):  [  2.400,00 ] EUR       │ ← editierbar
│  Verteilerschluessel:               [  MEA      ]           │
│  Ihr Anteil (berechnet):              205,20 EUR             │
│                                            [Speichern]      │
└──────────────────────────────────────────────────────────────┘

SEKTION 3 — MIETEINNAHMEN UND VORAUSZAHLUNGEN
(Kumuliert aus Mietvertrag / Geldeingang)
┌──────────────────────────────────────────────────────────────┐
│  Mieter: Bergmann, Thomas                                    │
│  Mietvertrag: seit 01.03.2021 (laufend)                     │
│  Kaltmiete: 850,00 EUR/Monat                                │
│                                                              │
│  NK-Vorauszahlung:     180,00 EUR/Monat  x 12 = 2.160,00   │
│  Heizkosten-VZ:        120,00 EUR/Monat  x 12 = 1.440,00   │
│  ────────────────────────────────────────────────────────── │
│  Gesamt Vorauszahlungen 2025:              3.600,00 EUR     │
└──────────────────────────────────────────────────────────────┘

SEKTION 4 — BERECHNUNG UND SALDO
┌──────────────────────────────────────────────────────────────┐
│  Umlagefaehige Kosten (WEG):               1.483,50 EUR     │
│  + Grundsteuer (Direktzahlung):              205,20 EUR     │
│  ════════════════════════════════════════════════════════════│
│  Gesamtkosten Mieter:                      1.688,70 EUR     │
│                                                              │
│  ./. NK-Vorauszahlungen:                   2.160,00 EUR     │
│  ./. Heizkosten-VZ:                        1.440,00 EUR     │
│  ════════════════════════════════════════════════════════════│
│  GUTHABEN MIETER:                         -1.911,30 EUR     │
│                                                              │
│            [Berechnung starten]                              │
└──────────────────────────────────────────────────────────────┘

SEKTION 5 — EXPORT UND VERSAND
┌──────────────────────────────────────────────────────────────┐
│  [PDF erzeugen]   [Im DMS ablegen]   [An Briefgenerator]    │
└──────────────────────────────────────────────────────────────┘
```

Jede Sektion ist eine eigene Card-Komponente. Die Datenfelder in Sektion 1 und 2 sind editierbar (Input-Felder), damit der Nutzer Werte korrigieren kann, bevor er die Berechnung startet. Sektion 3 zeigt die kumulierten Mietdaten read-only aus dem Lease. Sektion 4 fuehrt alles zusammen.

## Technische Details

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/engines/nkAbrechnung/engine.ts` | Fix: Lease ueber unit_id laden statt leerer leaseId |
| `src/engines/nkAbrechnung/readinessCheck.ts` | Fix: Lease-Query ueber Units joinen |
| `src/hooks/useNKAbrechnung.ts` | Fix: leaseId entfernen, Lease-Daten + Cost-Items laden |
| `src/components/portfolio/NKAbrechnungTab.tsx` | Komplett neu: 5-Sektionen Inline-Flow mit editierbaren Feldern |

### Implementierungsreihenfolge

| Schritt | Was |
|---------|-----|
| 1 | Fix engine.ts (Lease-Lookup ueber unit_id) |
| 2 | Fix readinessCheck.ts (Units-Subquery) |
| 3 | Erweitere useNKAbrechnung Hook (Lease-Daten + Cost-Items als State) |
| 4 | Neues NKAbrechnungTab.tsx mit 5 Sektionen, editierbaren Feldern, Speichern-Buttons |
| 5 | Funktionstest auf BER-01 |

