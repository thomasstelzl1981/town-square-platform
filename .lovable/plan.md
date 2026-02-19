
# Fix: Lennox Login -- Session wird nicht gespeichert

## Ursache

Die Tabelle `pet_z3_sessions` hat eine Spalte `tenant_id` mit `NOT NULL`-Constraint. Die Edge Function `sot-z3-auth` setzt beim Erstellen einer Session aber KEIN `tenant_id`:

```ts
// Zeile 124-127 (Signup) und 168-171 (Login)
await supabase.from('pet_z3_sessions').insert({
  customer_id: customerId,
  session_token: sessionToken,
  // tenant_id FEHLT!
})
```

Das fuehrt dazu, dass das INSERT **still fehlschlaegt** (der Fehler wird nicht geprueft). Die Session existiert nie in der Datenbank. Wenn "Mein Bereich" dann `validate` aufruft, findet es keine Session und gibt `{valid: false}` zurueck -- der User wird zurueck zum Login geschickt.

## Loesung

Die Edge Function `sot-z3-auth` muss bei jedem Session-INSERT die `tenant_id` des Kunden mitgeben. Da die `tenant_id` aus der `pet_z1_customers`-Tabelle kommt, muss sie vor dem INSERT abgefragt werden.

### Aenderungen in `supabase/functions/sot-z3-auth/index.ts`

**Signup (Zeilen 122-127):**
- Die `tenant_id` ist bereits bekannt (entweder vom bestehenden Kunden oder vom neuen Insert mit Hardcoded-Wert `a0000000-0000-4000-a000-000000000001`)
- Fuege `tenant_id` zum Session-INSERT hinzu

**Login (Zeilen 166-171):**
- Nach dem Laden des Kunden wird dessen `tenant_id` mit abgefragt (SELECT erweitern)
- Fuege `tenant_id` zum Session-INSERT hinzu

**Zusaetzlich:** Error-Handling fuer die Session-INSERT-Aufrufe hinzufuegen, damit Fehler nicht mehr still verschluckt werden.

### Konkrete Code-Aenderungen

1. **Login-Query (Zeile 146-151):** `tenant_id` zur SELECT-Liste hinzufuegen
2. **Login Session-INSERT (Zeile 168-171):** `tenant_id: customer.tenant_id` ergaenzen
3. **Signup Session-INSERT (Zeile 124-127):** `tenant_id` ergaenzen (Wert ist bereits in Variable verfuegbar)
4. **Error-Handling:** Beide INSERTs mit `const { error }` pruefen und bei Fehler loggen

### Geaenderte Datei
- `supabase/functions/sot-z3-auth/index.ts`
