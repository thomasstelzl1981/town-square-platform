
Kurzbefund (Tiefenanalyse Login-Flow):
1) Primärer Fehler liegt nicht mehr nur im Portal-Guard, sondern im OAuth-Return-Pfad:
   - `src/components/auth/SocialLoginButtons.tsx` nutzt `redirect_uri: window.location.origin`
   - Nach Google-Login landet der Nutzer auf `/`
   - `src/App.tsx` leitet auf Brand-Domains bei `/` immer auf Zone 3 weiter (`getDomainEntry() ? domainEntry.base : /portal`)
   - Ergebnis: erfolgreicher Login, aber Rückleitung auf Website statt Zone 2.

2) Sekundärer Härtungspunkt:
   - `src/router/ManifestRouter.tsx` prüft im Brand-Domain-Guard aktuell `session`.
   - Für robuste Übergänge sollte die Entscheidung auf konsistentem Auth-State basieren (mind. `user || session`, mit Loading-Gate), damit keine Race-Conditions beim Initialisieren zu Website-Redirects führen.

Betroffene Dateien (direkt):
- `src/components/auth/SocialLoginButtons.tsx`
- `src/App.tsx`
- `src/router/ManifestRouter.tsx`
- `src/pages/Auth.tsx` (nur als Redirect-Referenz, vermutlich ohne Logikänderung)

Betroffene Dateien (prüfen/Regression):
- `src/pages/zone3/futureroom/FutureRoomLogin.tsx` (nutzt dieselben Social Buttons)
- `src/contexts/AuthContext.tsx` (nur Verifikation des State-Timings, keine Strukturänderung geplant)

Umsetzungsplan (konkret):
1) OAuth-Redirect zielgerichtet machen
   - In `SocialLoginButtons` Redirect-Ziel kontextabhängig setzen:
     - Portal-Login (`variant="portal"`): `redirect_uri = ${window.location.origin}/portal`
     - FutureRoom-Login (`variant="futureroom"`): eigener Zielpfad (z. B. aktueller Pfad oder definierter FutureRoom-Flow)
2) Root-Route in `App.tsx` auth-aware machen (Fail-safe)
   - Bei Brand-Domain + aktivem Login nicht pauschal auf Website umleiten.
   - Ziel: eingeloggte Nutzer dürfen von `/` nach `/portal`, anonyme Nutzer weiter auf Brand-Website.
3) Portal-Guard in `ManifestRouter.tsx` robust machen
   - Guard-Entscheidung an stabilen Auth-Status koppeln (Loading beachten, dann `user/session`).
4) Optionales Debug-Instrument (temporär)
   - Kurze, gezielte Debug-Logs im Redirect-Pfad (nur DEV), um final zu bestätigen:
     `origin path -> oauth return -> auth state -> final route`.
5) Regressionstest End-to-End
   - Brand-Domain (`systemofatown.com`): `/auth` -> Google -> erwartetes Ziel `/portal`
   - Otto/ZL-Domain (`zl-wohnbau.de`): gleicher Test
   - Logout + erneuter Login
   - FutureRoom-Social-Login separat prüfen, damit dort kein Redirect-Bruch entsteht.

Codex-Review Empfehlung:
Ja, unbedingt parallel von Codex gegenprüfen lassen, mit Fokus auf:
- Redirect-Kette (OAuth return URI -> `/` route -> domain redirect)
- Auth-State-Race beim App-Start
- Unterschied `user` vs `session` als Guard-Kriterium
- Regression auf Zone 3 Login-Flows

Antwort zu Credits (offizielle Policy):
- Monatscredits werden pro Abrechnungsperiode zurückgesetzt (am monatlichen Verlängerungszeitpunkt deines Plans, nicht zwingend am 1. Kalendertag).
- Tägliche Credits resetten täglich um 00:00 UTC.
- Falls dein Konto heute nicht korrekt zurückgesetzt wurde, ist sehr wahrscheinlich der Billing-Cycle-Zeitpunkt noch nicht erreicht oder es betrifft die Free-Plan-/Monatsgrenze; bitte in Settings → Plans & Credits den exakten Reset-Zeitpunkt prüfen.
