# Beta Testing Guide - Armstrong Immo-Wallet

## Willkommen zur Beta-Testphase! 🚀

Vielen Dank, dass Sie an der Beta-Testphase von Armstrong teilnehmen. Ihre Rückmeldungen sind entscheidend für die Verbesserung der Plattform.

## Was ist Armstrong?

Armstrong ist eine umfassende Immobilien- und Finanzmanagement-Plattform für den deutschsprachigen Markt. Die Plattform bietet:

- **Immobilienverwaltung**: Portfolio-Management, Dokumentation, Vermietung
- **Finanzierung**: Anfragen, Selbstauskünfte, Partner-Integration (Europace)
- **Akquise & Projekt-Management**: CRM, Mandate, Projekte
- **Communication Pro**: Outbound-Kampagnen, E-Mail-Serien, Recherche
- **Office Tools**: Video-Meetings (LiveKit), Dokumente (DMS), KI-Assistent
- **Asset Management**: Fahrzeuge, Photovoltaik-Anlagen, Haustiere

## Technische Anforderungen

### Browser-Unterstützung
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile Browser (iOS Safari, Chrome Mobile)

### Empfohlene Konfiguration
- Bildschirmauflösung: mindestens 1280x720
- Internetverbindung: mindestens 2 Mbps
- JavaScript aktiviert
- Cookies und LocalStorage aktiviert

### Progressive Web App (PWA)
Die Plattform kann als Desktop-/Mobile-App installiert werden:
1. Öffnen Sie die URL im Browser
2. Klicken Sie auf "Installieren" (Browser-Prompt)
3. Die App erscheint in Ihrem App-Menü

## Zugang zur Beta-Version

1. **URL**: [Beta-URL einfügen]
2. **Anmeldung**: 
   - Email/Passwort-Authentifizierung
   - OTP-Unterstützung verfügbar
3. **Demo-Tenant**: Entwicklungs-Tenant für Tests verfügbar

### Erste Schritte

1. **Registrierung/Anmeldung**
   - Erstellen Sie ein Konto mit Ihrer E-Mail-Adresse
   - Bestätigen Sie Ihre E-Mail (Check Spam-Ordner)
   - Vervollständigen Sie Ihr Profil

2. **Dashboard erkunden**
   - Das Dashboard ist Ihr Startpunkt
   - Navigation über Seitenleiste (Desktop) oder Bottom-Bar (Mobile)
   - Module sind nach Themenbereichen organisiert

3. **Demo-Daten**
   - Demo-Daten sind vorinstalliert (gekennzeichnet mit 🎯)
   - Sie können eigene Daten hinzufügen
   - Demo-Daten können ein-/ausgeblendet werden

## Test-Szenarien

### Priorität 1: Kernfunktionen

#### Szenario 1: Immobilie anlegen
1. Navigieren Sie zu **MOD-04 (Immobilien)** → **Portfolio**
2. Klicken Sie auf **"Neue Immobilie"**
3. Füllen Sie die Pflichtfelder aus:
   - Adresse
   - Objekttyp (z.B. Wohnung, Haus)
   - Kaufpreis/Verkehrswert
4. Speichern Sie die Immobilie
5. **Zu testen**:
   - [ ] Formular-Validierung funktioniert
   - [ ] Immobilie wird in Liste angezeigt
   - [ ] Detailansicht öffnet sich
   - [ ] Daten können bearbeitet werden

#### Szenario 2: Finanzierungsanfrage
1. Navigieren Sie zu **MOD-07 (Finanzierung)** → **Anfrage**
2. Erstellen Sie eine neue Finanzierungsanfrage
3. Wählen Sie eine Immobilie aus (oder erstellen Sie eine neue)
4. Füllen Sie die Selbstauskunft aus
5. **Zu testen**:
   - [ ] Formular ist übersichtlich
   - [ ] Berechnungen sind korrekt
   - [ ] Speichern funktioniert
   - [ ] Export als PDF funktioniert

#### Szenario 3: Dokumente hochladen (DMS)
1. Navigieren Sie zu **MOD-03 (DMS)** → **Dokumente**
2. Laden Sie ein Dokument hoch (PDF, Bild, Excel)
3. Ordnen Sie das Dokument einer Immobilie zu
4. **Zu testen**:
   - [ ] Upload funktioniert
   - [ ] Vorschau wird angezeigt
   - [ ] Download funktioniert
   - [ ] Löschen funktioniert

#### Szenario 4: KI-Assistent nutzen
1. Öffnen Sie den Chat (💬-Icon)
2. Stellen Sie eine Frage zum Thema Immobilien
3. **Zu testen**:
   - [ ] Antwort ist relevant
   - [ ] Chat-Historie wird gespeichert
   - [ ] Spracheingabe funktioniert (wenn aktiviert)

### Priorität 2: Erweiterte Funktionen

#### Szenario 5: Projekt-Management
1. Navigieren Sie zu **MOD-13 (Projektmanager)**
2. Erstellen Sie ein neues Bauprojekt
3. Fügen Sie Einheiten hinzu
4. Verwalten Sie Reservierungen
5. **Zu testen**:
   - [ ] Projektübersicht ist klar
   - [ ] Einheiten können angelegt werden
   - [ ] Status-Workflow funktioniert
   - [ ] Preisliste wird korrekt berechnet

#### Szenario 6: Communication Pro
1. Navigieren Sie zu **MOD-14 (Communication Pro)**
2. Erstellen Sie eine E-Mail-Kampagne
3. Wählen Sie Empfänger aus
4. **Zu testen**:
   - [ ] Template-Editor funktioniert
   - [ ] Vorschau ist korrekt
   - [ ] Versand funktioniert
   - [ ] Tracking ist aktiv

#### Szenario 7: Mobile Nutzung
1. Öffnen Sie die Plattform auf dem Smartphone
2. Testen Sie Navigation und Bedienung
3. **Zu testen**:
   - [ ] Layout passt sich an
   - [ ] Bottom-Navigation funktioniert
   - [ ] Touch-Gesten funktionieren
   - [ ] Formulare sind nutzbar

### Priorität 3: Edge Cases

#### Szenario 8: Offline-Modus (PWA)
1. Installieren Sie die PWA
2. Deaktivieren Sie Internet
3. Öffnen Sie die App
4. **Zu testen**:
   - [ ] Offline-Modus wird erkannt
   - [ ] Cached Seiten sind verfügbar
   - [ ] Sinnvolle Fehlermeldung bei fehlender Verbindung

#### Szenario 9: Multi-Tenant
1. Erstellen Sie mehrere Tenants (Organisationen)
2. Wechseln Sie zwischen Tenants
3. **Zu testen**:
   - [ ] Daten bleiben isoliert
   - [ ] Wechsel funktioniert reibungslos
   - [ ] Keine Datenlecks zwischen Tenants

## Was sollten Sie testen?

### Funktionalität
- ✅ Alle Buttons und Links funktionieren
- ✅ Formulare können ausgefüllt und gespeichert werden
- ✅ Daten werden korrekt angezeigt
- ✅ Berechnungen sind korrekt
- ✅ Dateien können hoch- und heruntergeladen werden

### Benutzerfreundlichkeit (UX)
- 👤 Ist die Navigation intuitiv?
- 👤 Sind Beschriftungen klar und verständlich?
- 👤 Gibt es hilfreiche Fehlermeldungen?
- 👤 Ist das Design ansprechend?
- 👤 Funktioniert alles auch auf Mobile?

### Performance
- ⚡ Wie schnell laden Seiten?
- ⚡ Gibt es Verzögerungen bei Interaktionen?
- ⚡ Funktioniert Scrollen smooth?
- ⚡ Bleiben große Listen performant?

### Sicherheit
- 🔒 Können Sie auf Daten anderer Nutzer zugreifen?
- 🔒 Funktioniert Logout korrekt?
- 🔒 Bleiben Sie angemeldet nach Browser-Neustart?
- 🔒 Werden sensible Daten geschützt?

## Feedback geben

### Wie melden Sie Fehler?

1. **Bug Report erstellen**
   - Was haben Sie getan?
   - Was haben Sie erwartet?
   - Was ist tatsächlich passiert?
   - Browser und Gerät?
   - Screenshots/Videos (wenn möglich)

2. **Wo melden?**
   - GitHub Issues: [Link einfügen]
   - Email: [Email einfügen]
   - Feedback-Formular in der App (geplant)

### Vorlage für Bug Reports

```markdown
**Beschreibung**: [Kurze Beschreibung des Problems]

**Schritte zum Reproduzieren**:
1. Gehe zu...
2. Klicke auf...
3. Scrolle nach...
4. Sieh Fehler bei...

**Erwartetes Verhalten**: [Was sollte passieren]
**Tatsächliches Verhalten**: [Was passiert wirklich]

**Screenshots**: [Falls vorhanden]

**Umgebung**:
- Browser: [z.B. Chrome 120]
- Betriebssystem: [z.B. Windows 11]
- Bildschirmgröße: [z.B. 1920x1080]
- Mobile/Desktop: [z.B. Desktop]

**Zusätzliche Informationen**: [Weitere Details]
```

### Verbesserungsvorschläge

Haben Sie Ideen zur Verbesserung?
- Welche Features fehlen?
- Was könnte einfacher sein?
- Welche Workflows könnten optimiert werden?

## Bekannte Einschränkungen

### Aktuell in Arbeit
- Einige Berechnungen werden noch optimiert
- Performance-Optimierungen laufen
- Mobile Ansicht wird noch verfeinert
- Offline-Funktionalität ist limitiert

### Nicht verfügbar in Beta
- Mehrsprachigkeit (nur Deutsch)
- Erweiterte Export-Optionen
- Vollständige API-Dokumentation
- White-Label-Funktionen

## Zeitplan

- **Beta-Start**: [Datum einfügen]
- **Beta-Dauer**: 4-6 Wochen
- **Feedback-Deadline**: [Datum einfügen]
- **Release-Ziel**: [Datum einfügen]

## Häufige Fragen (FAQ)

**Q: Sind meine Daten sicher?**
A: Ja, alle Daten sind verschlüsselt und durch Row-Level Security geschützt. Siehe SECURITY.md für Details.

**Q: Kann ich echte Kundendaten verwenden?**
A: In der Beta-Phase empfehlen wir Testdaten. Echte Daten nur mit Vorsicht und Backup.

**Q: Was passiert mit meinen Daten nach der Beta?**
A: Beta-Daten werden migriert (Details folgen). Sie können auch jederzeit exportieren.

**Q: Wie oft wird die Beta aktualisiert?**
A: Updates erfolgen mehrmals pro Woche. Sie werden über größere Änderungen informiert.

**Q: Bekomme ich Support während der Beta?**
A: Ja, Support per Email und GitHub Issues. Antwortzeit: 24-48 Stunden.

## Kontakt

- **Projekt**: Armstrong — Immo-Wallet
- **Repository**: https://github.com/thomasstelzl1981/town-square-platform
- **Dokumentation**: Siehe README.md und weitere Docs im Repo
- **Support**: [Email einfügen]

## Danke!

Ihre Teilnahme an der Beta macht Armstrong besser. Jedes Feedback zählt! 🙏

**Viel Erfolg beim Testen!**
