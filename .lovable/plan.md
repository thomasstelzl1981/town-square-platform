

# Portalzugang mit 6-stelligem PIN-Code (Bank-Feeling)

## Analyse

### IST-Zustand

- Login erfolgt ueber klassisches E-Mail + Passwort (`Auth.tsx`, `AuthContext.signIn`)
- `SicherheitTab` existiert unter `/portal/stammdaten/sicherheit` mit Passwort-Aenderung, Sessions-Tabelle und Security-Log
- Die Sicherheits-Kachel ist im Manifest registriert aber nur ueber direkte Navigation erreichbar
- Es gibt KEINE OTP/PIN-basierte Authentifizierung im System

### Technische Moeglichkeit: Supabase Email OTP

Supabase unterstuetzt nativ **Email OTP** (6-stelliger Code per E-Mail):

```typescript
// Schritt 1: Code senden
await supabase.auth.signInWithOtp({
  email: 'user@example.de',
  options: { shouldCreateUser: false }
});

// Schritt 2: Code verifizieren
await supabase.auth.verifyOtp({
  email: 'user@example.de',
  token: '123456',
  type: 'email'
});
```

- Kein Passwort noetig
- 6-stelliger numerischer Code
- Standardmaessig 60 Sekunden Cooldown, 1 Stunde Gueltigkeit
- Passt perfekt zum gewuenschten "Bank-PIN-Feeling"

---

## SOLL-Zustand

### 1. Login-Umstellung: E-Mail + 6-stelliger PIN

Die `/auth`-Seite wird auf einen 2-Schritt-Flow umgestellt:

**Schritt 1: E-Mail eingeben**
- Nutzer gibt E-Mail ein
- System sendet 6-stelligen Code per E-Mail
- `shouldCreateUser: false` — nur bestehende Nutzer koennen sich anmelden

**Schritt 2: PIN eingeben (Bank-Feeling)**
- 6 einzelne Eingabefelder (`InputOTP`-Komponente ist bereits installiert)
- Automatische Verifizierung nach Eingabe der 6. Ziffer
- Bei Erfolg: Redirect zum Portal

Das Passwort-Formular in der Auth-Seite wird komplett entfernt.

### 2. SicherheitTab als RecordCard-Widget

Die `SicherheitTab` wird zur **Zugangs-Verwaltungskachel** umgebaut:

**Geschlossene Kachel (quadratisch, halbe Breite):**
```
+----------------------------+
|  [Badge: Aktiv]   [Shield] |
|                            |
|       [Shield-Icon]        |
|        60x60               |
|                            |
|    Portalzugang            |
|    max@example.de          |
|                            |
|  Letzte Anmeldung:         |
|  14.02.2026, 15:30         |
|                            |
+----------------------------+
```

**Geoeffnete Kachel (volle Breite):**
- Login-E-Mail (read-only, da Identitaet)
- Letzte Anmeldung (Datum + Geraet)
- Aktive Sitzungen (Tabelle)
- Sicherheits-Log (letzte Events)
- Button: "Alle anderen Sitzungen beenden"
- Kein Passwort-Bereich mehr (da OTP-only)

### 3. AuthContext-Erweiterung

Neue Methoden im `AuthContext`:

```typescript
signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
```

Die alten `signIn` und `signUp` Methoden bleiben vorerst erhalten (Abwaertskompatibilitaet fuer Admin-Bereich), werden aber auf der User-Auth-Seite nicht mehr verwendet.

---

## Umsetzungsschritte

| Schritt | Beschreibung |
|---------|-------------|
| 1 | **`AuthContext.tsx`** erweitern: `signInWithOtp()` und `verifyOtp()` Methoden hinzufuegen |
| 2 | **`Auth.tsx`** umbauen: 2-Schritt-Flow (E-Mail-Eingabe, dann 6-stellige PIN-Eingabe mit `InputOTP`) |
| 3 | **`SicherheitTab.tsx`** komplett umbauen: Passwort-Formular entfernen, RecordCard-Widget fuer Portalzugang (quadratisch geschlossen, volle Breite geoeffnet), Login-E-Mail read-only, Sessions + Security-Log |
| 4 | **Auth-Einstellungen**: E-Mail OTP aktivieren (ist standardmaessig aktiv bei Supabase) |

### Was sich NICHT aendert

- Registrierung bleibt bestehen (neuer Nutzer wird weiterhin ueber Signup angelegt — danach Login nur noch via OTP)
- Admin-Bereich kann weiterhin Passwort-Login nutzen (Fallback)
- `onAuthStateChange` Listener und Session-Handling bleiben identisch
- Routing bleibt unveraendert
- Alle anderen Stammdaten-Tabs bleiben unberuehrt

### Hinweis

Der 6-stellige Code wird per E-Mail zugestellt (nicht per SMS). Das ist kostenlos und erfordert keine zusaetzliche Infrastruktur. Die `InputOTP`-Komponente (`input-otp` Package) ist bereits im Projekt installiert und einsatzbereit.

