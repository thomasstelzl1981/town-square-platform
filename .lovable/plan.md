

# Authentifizierungs-Upgrade: Apple + Google Sign-In

## Ueberblick

Beide Login-Einstiegspunkte werden um Apple Sign-In und Google Sign-In erweitert. Apple wird als prominenteste Option dargestellt (Zielgruppe: iPhone-User).

## Betroffene Einstiegspunkte

### 1. Portal Login (`/auth`) -- Zone 1 und 2

Aktuelle Methoden bleiben erhalten:
- E-Mail + Passwort
- E-Mail + 6-stelliger PIN (OTP)
- Passwort vergessen

Neue Methoden oben auf der Seite:
- **Apple Sign-In** (groesster Button, schwarz, Apple-Logo)
- **Google Sign-In** (weisser Button mit Google-Logo)
- Visueller Trenner ("oder mit E-Mail anmelden")
- Darunter das bestehende Formular

### 2. FutureRoom Login (`/website/futureroom/login`) -- Zone 3

Aktuelle Methoden bleiben erhalten:
- E-Mail + Passwort (Registrierung und Login)

Neue Methoden oben auf der Seite:
- **Apple Sign-In**
- **Google Sign-In**
- Visueller Trenner
- Darunter das bestehende Formular

## Visuelles Layout (beide Seiten)

```text
+----------------------------------+
|        [Apple Logo] Mit Apple    |  <-- schwarz, volle Breite
|        anmelden / registrieren   |
+----------------------------------+
+----------------------------------+
|        [G Logo] Mit Google       |  <-- weiss mit Rahmen
|        anmelden / registrieren   |
+----------------------------------+

      ────── oder per E-Mail ──────

        [ Bestehendes Formular ]
```

## Technische Umsetzung

### Schritt 1: Social Login konfigurieren

Das Lovable Cloud Social-Login-Modul wird aktiviert (erstellt `src/integrations/lovable/` automatisch). Dieses Modul stellt die Funktion `lovable.auth.signInWithOAuth()` bereit, die Apple und Google managed -- ohne eigene API-Keys.

### Schritt 2: PWA-Kompatibilitaet

Bereits erledigt: `navigateFallbackDenylist: [/^\/~oauth/]` ist in `vite.config.ts` konfiguriert.

### Schritt 3: AuthContext erweitern

Neue Methode `signInWithSocial(provider: 'apple' | 'google')` im `AuthContext` hinzufuegen, die `lovable.auth.signInWithOAuth()` aufruft mit `redirect_uri: window.location.origin`.

### Schritt 4: Gemeinsame Komponente `SocialLoginButtons`

Neue Komponente `src/components/auth/SocialLoginButtons.tsx`:
- Apple-Button (schwarz, Apple-Icon)
- Google-Button (weiss, Google-Icon)
- Optionaler Trenner-Text
- Wiederverwendbar fuer beide Login-Seiten

### Schritt 5: Portal Login (`/auth`) anpassen

`SocialLoginButtons` oberhalb des bestehenden Formulars einbinden. Keine Aenderung an E-Mail/Passwort oder OTP-Logik.

### Schritt 6: FutureRoom Login anpassen

`SocialLoginButtons` oberhalb des bestehenden Formulars einbinden. Im FutureRoom-Design (eigene CSS-Klassen `fr-btn` etc.).

## Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/integrations/lovable/*` | Automatisch generiert (Social Login Modul) |
| `src/components/auth/SocialLoginButtons.tsx` | Neu: Wiederverwendbare Buttons |
| `src/contexts/AuthContext.tsx` | Erweitert: `signInWithSocial` Methode |
| `src/pages/Auth.tsx` | Erweitert: Social Buttons eingebunden |
| `src/pages/zone3/futureroom/FutureRoomLogin.tsx` | Erweitert: Social Buttons eingebunden |

## Sicherheit

- Keine API-Keys noetig (Lovable Cloud Managed)
- Bestehende Rollen-Logik (`memberships`, `user_roles`) bleibt unveraendert
- OAuth-Nutzer erhalten automatisch ein Profil ueber den bestehenden DB-Trigger
- Kein anonymes Sign-Up

