

# Kaufy Login-Überarbeitung: Registrierung entfernen

## Befund

In `Kaufy2026Layout.tsx` gibt es aktuell **zwei Buttons** im Header:
- **Desktop** (Zeilen 117-126): "Anmelden" + "Registrieren" — beide verlinken auf `/auth`
- **Mobile** (Zeilen 158-164): "Anmelden" + "Registrieren" — beide verlinken auf `/auth`

Beide führen zur Portal-Auth-Seite, wo man sich sowohl einloggen als auch registrieren kann.

## Plan

### Datei: `src/pages/zone3/kaufy2026/Kaufy2026Layout.tsx`

1. **"Registrieren"-Button entfernen** — sowohl Desktop (Zeilen 122-126) als auch Mobile (Zeilen 162-164)
2. **"Anmelden"-Button beibehalten** — weiterhin Link auf `/auth`, aber als einziger Auth-Button
3. **Desktop**: Den verbleibenden "Anmelden"-Button als primären Button stylen (ausgefüllt statt ghost), damit er sichtbar bleibt
4. **Mobile**: Nur einen "Anmelden"-Button im Mobile-Menü belassen

### Kein weiterer Änderungsbedarf
- Die `/auth`-Seite selbst ist die Portal-Login-Seite — dort kann man sich bereits anmelden. Ob dort auch ein Registrierungs-Tab existiert, ist eine separate Frage. Auf der Kaufy-Seite selbst wird der Registrierungs-Einstiegspunkt aber entfernt.

