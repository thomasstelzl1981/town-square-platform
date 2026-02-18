

# Fix: Konto-Zuordnung und Geldeingang-Kontoabgleich

## Probleme (aus Screenshots)

### Problem 1: Demo-Konto Zuordnungs-Select ist nicht klickbar
- In `KontoAkteInline.tsx` Zeile 255: `disabled={isDemo}` blockiert den Select komplett
- Der Demo-Konto hat zwar `owner_type: 'property'` gesetzt, aber der Select zeigt keinen Wert an, weil das UI den Zuordnungs-Wert nicht sichtbar macht (der encoded Value `property::d0000000-...` wird zwar in `currentValue` berechnet, aber das Select ist disabled bevor es rendern kann)
- **Fix**: Fuer Demo-Konten den Select NICHT disablen, sondern stattdessen `readOnly`-artig verhalten — Wert anzeigen, Aenderungen nur lokal (kein DB-Write). Alternativ: Zuordnung als statischen Text anzeigen statt als disabled Select

### Problem 2: Geldeingang — Toggle und Konto-Select funktionslos
- In `GeldeingangTab.tsx` Zeile 352: `value={lease.linked_bank_account_id || ''}` setzt den Select-Value auf leeren String `''` — das ist das bekannte Radix-UI Problem (leere Strings sind ungueltig)
- Es gibt **0 Bank-Accounts** in der DB (`msv_bank_accounts` ist leer), daher ist der Select-Dropdown komplett leer
- Der Toggle (`Switch`) schreibt `auto_match_enabled` in die DB, das funktioniert technisch, aber da kein Konto verknuepft ist, hat es keinen Effekt
- **Fix**: Select-Value `''` durch `undefined` ersetzen, "none"-Wert-Pattern nutzen

### Problem 3: Demo-Konto existiert nicht in der Datenbank
- Die Tabelle `msv_bank_accounts` ist komplett leer
- Daher kann im Geldeingang auch kein Konto gewaehlt werden
- Die Demo-Konten muessen als echte DB-Eintraege existieren oder das Select muss auch Demo-Konten anzeigen

## Aenderungen

### 1. `src/components/finanzanalyse/KontoAkteInline.tsx`
- Den `disabled={isDemo}` vom Zuordnungs-Select entfernen
- Stattdessen fuer Demo-Konten die Zuordnung als lesbaren Text/Badge anzeigen ODER den Select aktiviert lassen (Aenderungen bleiben nur clientseitig, kein DB-Write da `!isDemo`-Guard schon vorhanden in `handleOwnerChange`)

### 2. `src/components/portfolio/GeldeingangTab.tsx`
- Select-Value Fix: `value={lease.linked_bank_account_id || ''}` aendern zu `value={lease.linked_bank_account_id || undefined}`
- `onValueChange`: Wert `"none"` als Null-Reset behandeln
- Ein `SelectItem value="none"` hinzufuegen fuer "Kein Konto"
- Wenn keine Bank-Accounts vorhanden: Info-Text statt leeres Dropdown anzeigen

### 3. Demo-Konto in DB seeden (optional, aber empfohlen)
- Das Demo-Konto (`DEMO_KONTO`) als echten Eintrag in `msv_bank_accounts` anlegen (ueber den Demo-Seeder), damit es im Geldeingang-Tab ausgewaehlt werden kann
- Alternativ: Die `bankAccounts`-Query im GeldeingangTab um Demo-Konto-Daten ergaenzen wenn Demo-Tenant aktiv ist

## Technische Details

| Datei | Aenderung |
|-------|-----------|
| `src/components/finanzanalyse/KontoAkteInline.tsx` | `disabled={isDemo}` entfernen, Zuordnung fuer Demo sichtbar machen |
| `src/components/portfolio/GeldeingangTab.tsx` | Select-Value-Fix (`undefined` statt `''`), "none"-Option, leere-Liste-Handling |
| Demo-Seeder (optional) | Demo-Konto als DB-Eintrag in `msv_bank_accounts` anlegen |

