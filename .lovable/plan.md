

## Analyse: Name- & E-Mail-Chaos bei Robyn Gebhard (und systemisch)

### Was ist passiert — die Fehlerkette

Das Problem ist **systemisch**, nicht hardcoded. Es betrifft jeden Manager-Account, der über `sot-manager-activate` angelegt wird. Hier die Kette:

#### Schritt 1: Manager-Aktivierung setzt kein `first_name`/`last_name` in auth.users metadata

`sot-manager-activate` (Zeile 118-127) erstellt den User so:
```
user_metadata: {
  display_name: "Robyn Gebhard",   // ✅ Voller Name
  source: 'manager_application',
  source_brand: 'lennox',
}
// ❌ KEIN first_name, KEIN last_name
```

#### Schritt 2: `handle_new_user` Trigger fällt auf E-Mail-Fallback zurück

Der Trigger macht:
```sql
v_first_name := COALESCE(meta->>'first_name', split_part(email, '@', 1));
-- → 'robyn' (aus robyn@lennoxandfriends.app)
v_last_name := COALESCE(meta->>'last_name', '');
-- → '' (leer!)
```

**Ergebnis im Profil:**
- first_name = `'robyn'` (Kleinbuchstabe, aus E-Mail)
- last_name = `''` (leer)
- display_name = `'robyn'` (aus E-Mail, nicht "Robyn Gebhard")

#### Schritt 3: sot_email korrekt, aber Armstrong-Email doppelt

- sot_email = `robyn@systemofatown.com` ← korrekt (kein Nachname → nur Vorname)
- armstrong_email = `robyn.robyn@neilarmstrong.space` ← **BUG** — zeigt dass irgendwann sowohl first als auch last als 'robyn' interpretiert wurden (wahrscheinlich bei einem späteren Profile-Update, der den Trigger erneut auslöste)

#### Schritt 4: Outbound-Identity auto-provisioniert mit falschen Daten

Die `OutboundIdentityWidget` Auto-Provision nutzt Profildaten:
- from_email = `generateFromEmail('SOT', 'robyn', 'Robyn')` → `robyn.robyn@systemofatown.com`
- display_name = `'robyn Robyn'`

Das zeigt: Irgendwann wurde `last_name` auf 'Robyn' (= display_name) gesetzt, aber first_name blieb 'robyn' (lowercase).

### DB-Ist-Zustand Robyn Gebhard

| Feld | Wert | Soll |
|------|------|------|
| auth.users.email | robyn@lennoxandfriends.app | ✅ |
| auth.users.meta.display_name | Robyn Gebhard | ✅ |
| auth.users.meta.first_name | NULL | ❌ fehlt |
| auth.users.meta.last_name | NULL | ❌ fehlt |
| profiles.first_name | Robyn | ✅ (manuell korrigiert) |
| profiles.last_name | Gebhard | ✅ (manuell korrigiert) |
| profiles.display_name | Robyn | ❌ sollte "Robyn Gebhard" sein |
| profiles.sot_email | robyn@systemofatown.com | ⚠️ akzeptabel, aber sollte robyn.gebhard@ sein |
| profiles.armstrong_email | robyn.robyn@neilarmstrong.space | ❌ falsch, sollte robyn.gebhard@ sein |
| outbound.from_email | robyn.robyn@systemofatown.com | ❌ falsch |
| outbound.display_name | robyn Robyn | ❌ falsch |
| pet_providers.email | info@lennoxandfriends.app | ✅ Firmen-E-Mail korrekt |

### 3 systemische Bugs (betrifft JEDEN Manager-Account)

**BUG 1 — `sot-manager-activate` setzt kein `first_name`/`last_name` in user_metadata**
- Fix: `applicantName` splitten und als `first_name` + `last_name` in metadata übergeben
- Auch `display_name` korrekt zusammensetzen

**BUG 2 — `handle_new_user` Trigger ignoriert `display_name` aus metadata**
- Wenn kein `first_name`/`last_name` vorhanden → sollte `display_name` gesplittet werden als Fallback VOR dem E-Mail-Fallback
- Fix: `COALESCE(meta->>'first_name', split_part(meta->>'display_name', ' ', 1), split_part(email, '@', 1))`

**BUG 3 — Armstrong-Email-Trigger hat kein Re-Generierungs-Schutz bei Namensänderung**
- Der Trigger feuert nur wenn `armstrong_email IS NULL`
- Aber: Wenn der Name nachträglich korrigiert wird, bleibt die falsche Armstrong-Email bestehen
- Vorschlag: Entweder expliziter "Regenerate"-Mechanismus oder Trigger auch bei Namensänderung

### Repair-Plan (minimal-invasiv)

**1. `sot-manager-activate` fixen** (Edge Function)
- `applicantName` in first/last splitten
- In `user_metadata` als `first_name` + `last_name` übergeben

**2. `handle_new_user` DB-Trigger härten**
- `display_name` als Fallback vor E-Mail-Local-Part einbauen

**3. Robyn-Account DB-Repair** (einmalige SQL-Korrektur)
- `profiles.display_name` → 'Robyn Gebhard'
- `profiles.sot_email` → regenerieren als 'robyn.gebhard@systemofatown.com'
- `profiles.armstrong_email` → regenerieren als 'robyn.gebhard@neilarmstrong.space'
- `user_outbound_identities` → from_email + display_name korrigieren

**4. Alle bestehenden Manager-Accounts prüfen und ggf. batch-reparieren**
- SQL-Query: Alle Profile wo `sot_email` oder `armstrong_email` ein `vorname.vorname@` Pattern haben

### Betroffene Dateien
- `supabase/functions/sot-manager-activate/index.ts` — first_name/last_name in metadata
- DB-Trigger `handle_new_user` — display_name Fallback
- DB-Trigger `set_armstrong_email` — ggf. Regenerierung bei Namensänderung
- Einmalige SQL-Migration für Robyn-Datenkorrektur

