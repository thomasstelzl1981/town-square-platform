
# Bereinigung: Zwei Workspace-Artefakt-Accounts loeschen

## Geschuetzter Account (DARF NICHT GELOESCHT WERDEN)

| Feld | Wert |
|------|------|
| E-Mail | `thomas.stelzl@systemofadown.com` |
| User-ID | `d028bc99-6e29-4fa4-b038-d03015faf222` |
| Tenant-ID | `a0000000-0000-4000-a000-000000000001` |
| Tenant | System of a Town (sandbox) |
| Rollen | `platform_admin`, `akquise_manager` |

Dieser Account wird im Code **explizit per User-ID hardcoded ausgeschlossen** -- selbst bei Fehlbedienung ist eine Loeschung unmoeglich.

---

## Zu loeschende Accounts

### Account 1: Schmidt

| Feld | Wert |
|------|------|
| E-Mail | `schmidt@softwareschmidt.com` |
| User-ID | `3dd05cb7-d334-49b0-b539-04208e8b1508` |
| Tenant-ID | `7222e6e5-491b-43ed-a15c-d9218277a74b` |
| Artefakte | 26 Storage Nodes, 14 Tile Activations, 1 Mailbox |
| Geschaeftsdaten | Keine |

### Account 2: Ncore

| Feld | Wert |
|------|------|
| E-Mail | `thomas.stelzl@ncore.online` |
| User-ID | `59215241-7f53-4592-919d-6c350dafa7a6` |
| Tenant-ID | `6904326e-ed6a-48e4-a392-582e89f8f705` |
| Artefakte | 26 Storage Nodes, 14 Tile Activations, 1 Mailbox |
| Geschaeftsdaten | Keine |

---

## Umsetzung: Edge Function `sot-cleanup-orphan-accounts`

### Sicherheits-Gates (3-fach)

1. **JWT + platform_admin**: Nur authentifizierte Admins koennen die Funktion aufrufen
2. **Hardcoded Protect-List**: Die User-ID `d028bc99-6e29-4fa4-b038-d03015faf222` wird im Code als unveraenderbare Konstante geschuetzt -- jeder Versuch, diesen Account zu loeschen, wird sofort mit Fehler 403 abgewiesen
3. **Geschaeftsdaten-Pruefung**: Vor dem Loeschen wird geprueft, ob der Account Daten in `properties`, `contacts`, `documents`, `finance_requests` hat -- falls ja, wird abgebrochen

### Loesch-Reihenfolge (FK-sicher, pro Account)

```text
Schritt 1: widget_preferences    (WHERE user_id = ...)
Schritt 2: inbound_mailboxes     (WHERE tenant_id = ...)
Schritt 3: storage_nodes         (WHERE tenant_id = ...)
Schritt 4: tenant_tile_activation (WHERE tenant_id = ...)
Schritt 5: memberships           (WHERE user_id = ...)
Schritt 6: user_roles            (WHERE user_id = ...)  -- nur zur Sicherheit
Schritt 7: profiles              (WHERE id = user_id)
Schritt 8: organizations         (WHERE id = tenant_id)
Schritt 9: auth.admin.deleteUser (user_id)  -- Supabase Admin API
```

### Aufruf

Die Funktion wird mit einem festen Array der zwei E-Mail-Adressen aufgerufen:

```text
POST sot-cleanup-orphan-accounts
Body: {
  "emails": [
    "schmidt@softwareschmidt.com",
    "thomas.stelzl@ncore.online"
  ]
}
```

### Rueckgabe

Ein detaillierter Bericht pro Account:
- Welche Tabellen wurden bereinigt
- Wie viele Zeilen pro Tabelle geloescht
- Bestaetigung, dass auth.users-Eintrag entfernt wurde

### Verifikation

Nach Ausfuehrung: Datenbankabfrage zur Bestaetigung, dass nur noch der geschuetzte Account (`thomas.stelzl@systemofadown.com`) existiert.

---

## Technische Details

### Neue Datei

`supabase/functions/sot-cleanup-orphan-accounts/index.ts`

- CORS-Headers fuer Browser-Aufrufe
- Service Role Key fuer Admin-Operationen (auth.admin.deleteUser)
- DSGVO-Ledger-Eintrag via `logDataEvent` fuer jede Loeschung
- Kein Eintrag in `supabase/config.toml` noetig (verify_jwt wird im Code gehandhabt)
