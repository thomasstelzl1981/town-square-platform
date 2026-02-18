

## Zone 3 Auth-Trennung: Eigenstaendiges Login fuer Lennox & Friends

### Das Problem

Aktuell nutzt die Lennox & Friends Website (Zone 3) denselben Login-Mechanismus wie das Portal (Zone 2). Das fuehrt zu zwei kritischen Problemen:

1. **Session-Kopplung**: Wer sich auf der Lennox-Website abmeldet, wird auch aus dem Portal ausgeloggt (und umgekehrt)
2. **Automatische Tenant-Erstellung**: Jeder Website-Besucher, der sich registriert, bekommt einen vollen Zone-2-Account mit eigenem Tenant — das ist nicht gewollt

### Die Loesung

Zone 3 bekommt ein komplett eigenstaendiges, leichtgewichtiges Login-System. Website-Nutzer werden ausschliesslich in der bestehenden Tabelle `pet_z1_customers` verwaltet, die vom Pet Desk (Zone 1) aus administriert wird. Kein Kontakt mit dem Portal-Auth-System.

```text
AKTUELL (gekoppelt):
Zone 3 Login ──> supabase.auth ──> auth.users ──> handle_new_user() ──> Tenant + Profil
                      |
Zone 2 Portal ──> supabase.auth (gleiche Session!)

NEU (getrennt):
Zone 3 Login ──> Edge Function ──> pet_z1_customers (eigene Credentials)
                                   pet_z3_sessions (eigene Sessions)

Zone 2 Portal ──> supabase.auth (voellig unabhaengig)
```

### Technischer Aufbau

**1. Neue DB-Tabelle: `pet_z3_sessions`**

Speichert aktive Website-Sessions mit Token und Ablaufzeit:

```sql
CREATE TABLE pet_z3_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES pet_z1_customers(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now()
);
```

**2. Neue DB-Spalte: `pet_z1_customers.password_hash`**

Website-Nutzer brauchen ein eigenes Passwort, unabhaengig von auth.users:

```sql
ALTER TABLE pet_z1_customers ADD COLUMN password_hash text;
```

**3. Edge Function: `sot-z3-auth`**

Zentrale Auth-Funktion fuer Zone 3 mit drei Aktionen:

| Aktion | Beschreibung |
|--------|-------------|
| `signup` | Erstellt neuen `pet_z1_customers`-Eintrag mit gehashtem Passwort, generiert Session-Token |
| `login` | Prueft E-Mail + Passwort gegen `pet_z1_customers.password_hash`, erstellt Session |
| `logout` | Loescht Session-Token aus `pet_z3_sessions` — beruehrt auth.users NICHT |
| `validate` | Prueft ob ein Session-Token gueltig und nicht abgelaufen ist |

Passwort-Hashing erfolgt ueber Web Crypto API (PBKDF2) in der Edge Function.

**4. Frontend: Neuer Hook `useZ3Auth`**

Ersetzt alle `supabase.auth.*`-Aufrufe in Zone 3 durch einen eigenen Hook:

- Session-Token wird in `localStorage` unter dem Key `lennox_session` gespeichert (getrennt von Supabase-Session)
- Stellt `z3User`, `z3Login()`, `z3Signup()`, `z3Logout()` bereit
- `z3Logout()` loescht NUR den Lennox-Session-Token — Portal-Session bleibt unangetastet

**5. Betroffene Zone-3-Dateien (Umstellung auf `useZ3Auth`)**

| Datei | Aenderung |
|-------|-----------|
| `LennoxAuth.tsx` | `supabase.auth.signUp/signIn` ersetzen durch `z3Signup/z3Login` |
| `LennoxLayout.tsx` | `supabase.auth.onAuthStateChange` ersetzen durch `useZ3Auth` |
| `LennoxMeinBereich.tsx` | `supabase.auth.getUser` + `signOut` ersetzen |
| `LennoxProfil.tsx` | `supabase.auth.getUser` + `signOut` ersetzen |
| `LennoxMeineTiere.tsx` | `supabase.auth.getUser` ersetzen |
| `LennoxBuchen.tsx` | Auth-Check ersetzen |
| `LennoxPartnerProfil.tsx` | Auth-Check ersetzen |

**6. Edge Function `sot-pet-profile-init` anpassen**

Die bisherige Funktion wird nicht mehr benoetigt, da die Registrierung jetzt direkt in `sot-z3-auth` (signup) den `pet_z1_customers`-Eintrag erstellt. Die alte Funktion kann deaktiviert werden.

**7. Zone 1 Pet Desk: Kundenverwaltung**

Die bestehende Kunden-Tabelle im Pet Desk (Tab "Kunden") wird zur zentralen Verwaltung der Website-Nutzer. Von dort aus koennen:
- Accounts gesperrt/aktiviert werden (ueber `pet_z1_customers.status`)
- Passwort-Resets angestossen werden
- Neue Kunden manuell angelegt werden

### Sicherheitskonzept

- Passwoerter werden mit PBKDF2 (100.000 Iterationen, SHA-256) gehasht
- Session-Tokens sind kryptografisch zufaellig (128 Bit)
- Sessions laufen nach 30 Tagen automatisch ab
- RLS auf `pet_z3_sessions`: Nur service_role kann lesen/schreiben (Edge Function nutzt Service Role Key)
- Keine Verbindung zu `auth.users` — Zone 2 ist vollstaendig isoliert

### Dateien

| Datei | Aktion |
|-------|--------|
| Migration SQL | NEU — `pet_z3_sessions` Tabelle + `password_hash` Spalte |
| `supabase/functions/sot-z3-auth/index.ts` | NEU — Login/Signup/Logout/Validate |
| `src/hooks/useZ3Auth.ts` | NEU — Frontend-Hook fuer Zone 3 Auth |
| `src/pages/zone3/lennox/LennoxAuth.tsx` | EDIT — Auf `useZ3Auth` umstellen |
| `src/pages/zone3/lennox/LennoxLayout.tsx` | EDIT — Auf `useZ3Auth` umstellen |
| `src/pages/zone3/lennox/LennoxMeinBereich.tsx` | EDIT — Auf `useZ3Auth` umstellen |
| `src/pages/zone3/lennox/LennoxProfil.tsx` | EDIT — Auf `useZ3Auth` umstellen |
| `src/pages/zone3/lennox/LennoxMeineTiere.tsx` | EDIT — Auf `useZ3Auth` umstellen |
| `src/pages/zone3/lennox/LennoxBuchen.tsx` | EDIT — Auf `useZ3Auth` umstellen |
| `src/pages/zone3/lennox/LennoxPartnerProfil.tsx` | EDIT — Auf `useZ3Auth` umstellen |

### Ergebnis

- Website-Nutzer koennen sich bei Lennox & Friends anmelden, ohne einen Portal-Account zu bekommen
- Abmelden auf der Website hat keinen Einfluss auf eine aktive Portal-Session
- Zone 1 (Pet Desk) hat volle Kontrolle ueber die Website-Nutzer
- Zone 2 Kunden koennen spaeter ueber eine Verknuepfung direkt aus dem Portal buchen (naechster Schritt)

