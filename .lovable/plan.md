
Ziel
- Du sollst dich auf dem iPhone wieder in der Preview einloggen können, ohne dass es dauerhaft an „Ungültige Anmeldedaten“ hängt.
- Zusätzlich soll der „Passwort vergessen?“-Weg verlässlich nachvollziehbar werden (mindestens mit klarer Diagnose/Feedback), weil aktuell keine Reset-E-Mail ankommt.

Was wir inzwischen sicher wissen (aus Code + Daten)
- Dein App-Account existiert und ist aktiv:
  - Es gibt ein Profil für thomas.stelzl@systemofadown.com.
  - In den letzten Network-Requests sieht man Requests mit einem gültigen Bearer Token für genau diese E-Mail (Desktop ist also wirklich eingeloggt).
- Der Fehler am iPhone passiert auch, wenn du die Preview direkt im Tab öffnest (lovable.app/auth) → kein reines „Safari-Iframe/Cookie“-Problem.
- Wenn Login „Ungültige Anmeldedaten“ sagt, ist es in der Praxis fast immer:
  1) Passwort stimmt nicht (häufigster Fall), oder
  2) Die Reset-/Recovery-Mail kommt nicht an, sodass man das Passwort nicht zurücksetzen kann.

Sofort-Workaround (ohne Code, damit du heute weiterarbeiten kannst)
1) Am MacBook (wo du bereits im /portal eingeloggt bist):
   - Öffne im User-Menü oben rechts „Einstellungen“ → das führt zu:
     /portal/stammdaten/sicherheit
   - Setze dort ein neues Passwort (am besten etwas, das du auf dem iPhone sicher tippen kannst).
   - Speichern.
2) Danach am iPhone:
   - Öffne: /auth
   - Logge dich mit thomas.stelzl@systemofadown.com + dem gerade gesetzten neuen Passwort ein.

Warum das hilft:
- Das Passwort-Ändern im Portal nutzt eine vorhandene, gültige Sitzung (du bist am Desktop eingeloggt) und setzt damit zuverlässig ein neues Passwort, ohne dass eine E-Mail-Zustellung funktionieren muss.

Warum wir trotzdem Code ändern sollten
- Der „Passwort vergessen?“-Flow ist aktuell für dich nicht nutzbar, wenn keine E-Mails ankommen.
- Die Auth-Seite sagt nur „Ungültige Anmeldedaten“, obwohl du in Wirklichkeit eine viel bessere Selbsthilfe-Option hast (Passwort im Portal ändern, wenn du noch irgendwo eingeloggt bist).
- Außerdem fehlt uns Diagnose-Feedback, ob der Reset-Request wirklich beim Backend ankommt oder z. B. im Netzwerk fehlschlägt.

Geplante Änderungen (Code)
A) Auth-Seite (/auth) verständlicher und diagnosefähiger machen
1) Besserer Hilfetext bei „Ungültige Anmeldedaten“
   - Ergänzen: „Wenn du auf einem anderen Gerät noch eingeloggt bist, ändere dein Passwort im Portal unter Stammdaten → Sicherheit und versuche es erneut.“
   - Dazu einen klickbaren Link/CTA anbieten (nur Hinweis; der Link selbst ist nicht geschützt, aber das Portal leitet dich ohne Session ohnehin wieder zur Anmeldung weiter).

2) „Passwort vergessen?“: robustes Error-Handling + sichtbares Ergebnis
   - In handleForgotPassword zusätzlich try/catch um den API-Call.
   - Falls ein Netzwerk-/CORS-Fehler passiert: klare Meldung („Netzwerkfehler – bitte erneut versuchen“).
   - Nach erfolgreichem Request: nicht nur Toast „E-Mail gesendet“, sondern auch Hinweis:
     - „Wenn keine E-Mail ankommt: Spam prüfen; alternativ Passwort im Portal (Stammdaten → Sicherheit) ändern, falls du noch eingeloggt bist.“
   - Optional: Einen kleinen „Diagnose“-Abschnitt (nur in Dev/Preview) einblenden, der die Response-Art zusammenfasst (ohne sensible Inhalte).

Datei: src/pages/Auth.tsx

B) Portal-Sicherheitstab verbessern (damit Passwort-Reset am Desktop noch zuverlässiger ist)
1) Klarer Hinweis „Du bist eingeloggt als: <E-Mail>“
   - Damit du sicher weißt, welches Konto du gerade änderst.
   - (In der SystemBar wird zwar profile.email gezeigt, aber im Sicherheitstab ist es noch eindeutiger.)

2) Entfernen oder nutzen von currentPassword-State
   - Aktuell existiert currentPassword im State, wird aber nicht genutzt.
   - Entweder entfernen (Aufräumen) oder bewusst anzeigen (wenn du es möchtest).
   - Für den schnellen Fix: eher entfernen/aufräumen, damit keine Verwirrung entsteht.

Datei: src/pages/portal/stammdaten/SicherheitTab.tsx

C) Optional (wenn du maximale Mobile-Sicherheit willst): „Login-Hilfe“-Bereich
- Auf /auth einen kleinen „Probleme beim Login?“ Akkordeon-Bereich:
  - „Passwort im Portal ändern (wenn noch eingeloggt)“
  - „E-Mail korrekt? (wird automatisch normalisiert)“
  - „Passwort anzeigen (Toggle ist schon da)“

Datei: src/pages/Auth.tsx

Was wir nicht sofort machen (nur falls später nötig)
- Ein komplett eigener Passwort-Reset per externem Maildienst (z. B. Resend) + Recovery-Link-Generierung ist deutlich aufwendiger und benötigt zusätzliche Secrets/Keys. Das lohnt sich erst, wenn klar ist, dass Auth-Reset-Mails in deinem Backend grundsätzlich nicht zugestellt werden können.
- OAuth Login (Apple/Google) wäre eine Alternative für Mobile, ist aber ein eigener Setup-Block und ändert dein Login-Verständnis (Account-Verknüpfung etc.).

Testplan (End-to-End)
1) Desktop (MacBook)
- Im Portal auf /portal/stammdaten/sicherheit neues Passwort setzen.
- Danach im privaten Fenster (Inkognito) auf /auth mit E-Mail + neuem Passwort einloggen (verifiziert, dass du das Passwort wirklich kennst).

2) iPhone
- /auth öffnen, E-Mail + neues Passwort eingeben, Login prüfen.
- Danach /portal laden und prüfen, dass du drin bleibst (Session persistiert).

3) Passwort vergessen?
- /auth → „Passwort vergessen?“ auslösen
- Prüfen: UI zeigt entweder
  - „E-Mail gesendet“ inkl. Hinweis/Alternativen, oder
  - eine konkrete Fehlermeldung (z. B. Netzwerkfehler), nicht nur „es passiert nichts“.

Akzeptanzkriterien
- Du kannst dich am iPhone in der Preview mit dem Account thomas.stelzl@systemofadown.com anmelden.
- Wenn Reset-Mail nicht ankommt, wirst du in der UI so geführt, dass du trotzdem eine praktikable Lösung hast (Passwort über Portal ändern).
- Fehlerfälle sind klar verständlich (keine stillen Fehlschläge).

Umsetzungsschritte (Reihenfolge)
1) Auth.tsx: verbessertes Messaging + try/catch + hilfreiche Hinweise bei invalid credentials.
2) SicherheitTab.tsx: „eingeloggt als“-Hinweis + Aufräumen currentPassword State.
3) End-to-end Tests wie oben.

Technischer Anhang (kurz, zur Orientierung)
- Login erfolgt über supabase.auth.signInWithPassword.
- Passwort ändern im Portal erfolgt bereits über supabase.auth.updateUser({ password: ... }) und ist der schnellste Weg, ohne E-Mail-Zustellung das Passwort zu „synchronisieren“.
