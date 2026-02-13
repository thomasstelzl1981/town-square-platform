

# Unified KI-Office Integration: Multi-Account E-Mail, Kalender & Kontakte

## Bestandsaufnahme

Die Backend-Infrastruktur ist bereits solide vorhanden:

- **mail_accounts** Tabelle: Speichert Credentials fuer Google, Microsoft und IMAP (OAuth-Tokens, IMAP-Credentials via Vault)
- **sot-mail-connect**: Verbindet Konten (Google OAuth, Microsoft OAuth, IMAP)
- **sot-mail-sync**: Synchronisiert E-Mails
- **sot-calendar-sync**: Bidirektionale Kalender-Sync (Google Calendar API, Microsoft Graph)
- **sot-contacts-sync**: Kontakte-Sync (Google People API, Microsoft Graph Contacts)
- **EmailTab.tsx**: Hat bereits den ConnectionDialog mit Google/Microsoft/IMAP-Tabs und Multi-Account-Anzeige

Was fehlt, ist die **zentrale Verknuepfung** — ein Ort, an dem der Nutzer sieht: "Dieses Konto synchronisiert E-Mail, Kalender UND Kontakte" und das Ganze steuern kann.

## Architektur-Entscheidung

Statt in jedem Tab (E-Mail, Kalender, Kontakte) eigene Sync-Einstellungen zu pflegen, wird ein **zentraler Einstellungen-Dialog** geschaffen, der von allen Tabs aus erreichbar ist. Die `mail_accounts`-Tabelle wird um Sync-Flags erweitert, damit der Nutzer pro Konto steuern kann, was synchronisiert wird.

## 1. DB-Migration: Sync-Steuerung pro Konto

Neue Spalten in `mail_accounts`:

```sql
ALTER TABLE mail_accounts
  ADD COLUMN IF NOT EXISTS sync_mail boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS sync_calendar boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sync_contacts boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_calendar_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_contacts_sync_at timestamptz;
```

Damit kann der Nutzer pro verbundenem Konto steuern: "Nur E-Mail" oder "E-Mail + Kalender + Kontakte".

## 2. Neue Komponente: AccountIntegrationDialog

**Datei:** `src/components/portal/office/AccountIntegrationDialog.tsx`

Ein zentraler Dialog, der von E-Mail, Kalender und Kontakte-Tabs aus geoeffnet werden kann. Inhalt:

### Panel 1: Verbundene Konten
- Liste aller `mail_accounts` mit Provider-Icon, E-Mail, Status
- Pro Konto drei Switches: "E-Mail", "Kalender", "Kontakte"
- "Jetzt synchronisieren"-Button pro Konto (ruft alle aktiven Syncs auf)
- "Konto entfernen"-Button

### Panel 2: Neues Konto verbinden
- Die bestehende Google/Microsoft/IMAP-Tab-Logik aus EmailTab.tsx wird hierher extrahiert
- Beim Verbinden kann der Nutzer direkt waehlen, was synchronisiert werden soll
- iCloud CardDAV als vierter Tab (nur fuer Kontakte)

### Panel 3: System-Konto
- Zeigt die automatisch zugewiesene System-E-Mail-Adresse (z.B. thomas.stelzl@systemoftown.app)
- Nur lesend, kann nicht geaendert werden

## 3. Aenderungen an bestehenden Tabs

### EmailTab.tsx
- Der bestehende ConnectionDialog wird durch den neuen AccountIntegrationDialog ersetzt
- Die Konto-Liste in der Sidebar bleibt, zeigt aber jetzt den Sync-Status (Mail/Kalender/Kontakte Icons)

### KalenderTab.tsx
- Neuer Settings-Button in der Toolbar
- Oeffnet den AccountIntegrationDialog
- "Kalender synchronisieren"-Button ruft `sot-calendar-sync` fuer alle Konten mit `sync_calendar = true`

### KontakteTab.tsx
- Neuer Settings-Button in der Toolbar (wie zuvor geplant)
- Oeffnet den AccountIntegrationDialog
- "Kontakte synchronisieren"-Button ruft `sot-contacts-sync` fuer alle Konten mit `sync_contacts = true`

## 4. Edge Function: sot-contacts-sync um iCloud CardDAV erweitern

Neuer Provider-Zweig in `sot-contacts-sync/index.ts`:

- Provider `icloud_carddav`
- CardDAV PROPFIND/REPORT-Requests an `https://contacts.icloud.com`
- Basic Auth mit Apple-ID + App-spezifischem Passwort
- vCard-Parsing fuer Name, E-Mail, Telefon, Firma
- Upsert in contacts-Tabelle

## 5. Zusammenfassung der Dateien

| Datei | Aenderung |
|-------|-----------|
| Migration SQL | sync_mail, sync_calendar, sync_contacts Spalten |
| `src/components/portal/office/AccountIntegrationDialog.tsx` | **NEU** — Zentraler Dialog fuer alle Konto-Verbindungen |
| `src/pages/portal/office/EmailTab.tsx` | ConnectionDialog durch AccountIntegrationDialog ersetzen |
| `src/pages/portal/office/KalenderTab.tsx` | Settings-Button + Sync-Button hinzufuegen |
| `src/pages/portal/office/KontakteTab.tsx` | Settings-Button + Sync-Button hinzufuegen |
| `supabase/functions/sot-contacts-sync/index.ts` | iCloud CardDAV-Provider hinzufuegen |

## 6. Reihenfolge der Umsetzung

1. DB-Migration (Sync-Flags)
2. AccountIntegrationDialog erstellen (zentrale Komponente)
3. EmailTab.tsx umbauen (alten Dialog ersetzen)
4. KalenderTab.tsx erweitern (Settings-Button, Sync-Trigger)
5. KontakteTab.tsx erweitern (Settings-Button, Sync-Trigger)
6. sot-contacts-sync um iCloud erweitern + deployen

## Machbarkeit

**Ja, das ist realistisch in einem Schritt umsetzbar.** Die gesamte Backend-Infrastruktur (Edge Functions fuer Mail, Kalender, Kontakte-Sync) existiert bereits. Die Kernarbeit ist Frontend: ein zentraler Dialog und die Verknuepfung der bestehenden Sync-Funktionen mit Steuer-Flags. Die iCloud-CardDAV-Erweiterung ist technisch ueberschaubar (HTTP Basic Auth + vCard-Parsing).

