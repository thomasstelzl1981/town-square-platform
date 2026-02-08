

## Zone 1 KI Office: Separate Menuepunkte mit Resend-basiertem E-Mail-System

### Zusammenfassung

Die Sidebar wird umstrukturiert, sodass **E-Mail** und **Kontakte** als separate Menuepunkte im KI Office erscheinen (nicht mehr als Tabs). Das E-Mail-System wird komplett auf **Resend** umgestellt (kein IMAP/SMTP), was fuer transaktionale E-Mails aus dem Admin-Bereich besser geeignet ist. Zusaetzlich wird **Kommunikation** (CommunicationHub) in die KI-Office-Gruppe verschoben.

---

### 1. Neue Sidebar-Struktur

**Aktuelle Struktur:**
```text
KI Office:
  - KI Office (Landing mit Tabs)

System:
  - Kommunikation
```

**Neue Struktur:**
```text
KI Office:
  - E-Mail
  - Kontakte
  - Kommunikation
```

---

### 2. Routen-Aenderungen

**Entfernen:**
- `ki-office` (Landing Page mit Tabs wird nicht mehr benoetigt)
- `ki-office/email` (wird zu `ki-office-email`)
- `ki-office/kontakte` (wird zu `ki-office-kontakte`)

**Neu:**
```text
{ path: "ki-office-email", component: "AdminKiOfficeEmail", title: "E-Mail" }
{ path: "ki-office-kontakte", component: "AdminKiOfficeKontakte", title: "Kontakte" }
```

**Verschieben:**
- `communication` bleibt unter dem Pfad, wird aber zur Gruppe `ki-office` zugeordnet

---

### 3. AdminSidebar.tsx Anpassungen

**getGroupKey Funktion:**
```text
// KI Office Gruppe
if (path === 'ki-office-email' || path === 'ki-office-kontakte' || path === 'communication') {
  return 'ki-office';
}
```

**shouldShowInNav:**
- Die alten `ki-office/` Sub-Routes werden entfernt
- Neue Top-Level-Routes werden angezeigt

**ICON_MAP Erweiterung:**
```text
'AdminKiOfficeEmail': Mail,
'AdminKiOfficeKontakte': Contact,
```

---

### 4. E-Mail-System: Von IMAP zu Resend

**Konzept:**
Das Admin-E-Mail-System arbeitet **nicht** mit einem klassischen Posteingang (IMAP), sondern mit:
- **Ausgehend:** Transaktionale E-Mails ueber Resend API
- **Eingehend:** Resend Inbound Webhook (wie bei Akquise)

**Funktionen:**
| Feature | Beschreibung |
|---------|--------------|
| E-Mail senden | Direkt ueber Resend API mit Template |
| Gesendet-Historie | Alle gesendeten E-Mails in DB-Tabelle |
| Antworten empfangen | Via Inbound-Webhook + Routing |
| Kontaktanreicherung | Bei eingehenden E-Mails → Kontakt enrichen |

**Vorteil gegenueber IMAP:**
- Keine Konto-Konfiguration noetig
- Zuverlaessiger E-Mail-Versand
- Automatisches Tracking (Oeffnungen, Klicks)
- Bereits vorhandene Infrastruktur (RESEND_API_KEY)

---

### 5. Neue/Angepasste Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/routesManifest.ts` | Neue Top-Level-Routes |
| `src/components/admin/AdminSidebar.tsx` | Gruppierung + Icons |
| `src/pages/admin/ki-office/AdminKiOfficeEmail.tsx` | NEU: Resend-basierter E-Mail-Client |
| `src/pages/admin/ki-office/AdminKiOfficeKontakte.tsx` | UMBENENNEN von AdminKontakteTab |
| `src/pages/admin/ki-office/index.tsx` | ENTFERNEN (nicht mehr benoetigt) |
| `src/pages/admin/ki-office/AdminEmailTab.tsx` | ENTFERNEN (ersetzt durch neue Komponente) |

---

### 6. UI-Design: Admin E-Mail (Resend-basiert)

```text
+----------------------------------------------------------+
| E-Mail                                       [+ Neue E-Mail]|
+----------------------------------------------------------+
| Statistiken                                               |
| +------------+ +------------+ +------------+ +------------+|
| | Gesendet   | | Zugestellt | | Geoeffnet  | | Beantwortet||
| | 156        | | 152 (97%)  | | 89 (58%)   | | 23 (15%)   ||
| +------------+ +------------+ +------------+ +------------+|
+----------------------------------------------------------+
| [Gesendet] [Eingang] [Templates]                         |
+----------------------------------------------------------+
| Tabelle mit E-Mail-Historie                              |
| - Empfaenger | Betreff | Status | Datum | Aktionen       |
+----------------------------------------------------------+
```

**Neue E-Mail Dialog:**
- Empfaenger auswaehlen (aus Admin-Kontakten)
- Template auswaehlen oder Freitext
- Absender: noreply@systemofatown.de (Resend-Domain)

---

### 7. Datenbank-Tabelle fuer Admin-E-Mails

**Neue Tabelle: `admin_outbound_emails`**

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | UUID | Primary Key |
| `to_email` | TEXT | Empfaenger-Adresse |
| `to_name` | TEXT | Empfaenger-Name |
| `contact_id` | UUID | Referenz auf contacts (optional) |
| `subject` | TEXT | Betreff |
| `body_html` | TEXT | HTML-Inhalt |
| `body_text` | TEXT | Plain-Text-Inhalt |
| `resend_message_id` | TEXT | Resend-ID fuer Tracking |
| `status` | TEXT | queued/sent/delivered/opened/replied |
| `sent_at` | TIMESTAMP | Sendezeitpunkt |
| `opened_at` | TIMESTAMP | Erstes Oeffnen |
| `replied_at` | TIMESTAMP | Antwort erhalten |
| `created_by` | UUID | Admin-User |
| `created_at` | TIMESTAMP | Erstellungszeitpunkt |

**Neue Tabelle: `admin_inbound_emails`**

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | UUID | Primary Key |
| `resend_inbound_id` | TEXT | Resend-ID |
| `from_email` | TEXT | Absender |
| `from_name` | TEXT | Absender-Name |
| `subject` | TEXT | Betreff |
| `body_text` | TEXT | Inhalt |
| `body_html` | TEXT | HTML-Inhalt |
| `contact_id` | UUID | Referenz auf contacts |
| `in_reply_to_id` | UUID | Referenz auf outbound |
| `is_read` | BOOLEAN | Gelesen-Status |
| `received_at` | TIMESTAMP | Empfangszeitpunkt |

---

### 8. Edge Functions

**Neue Function: `sot-admin-mail-send`**
- Sendet E-Mails ueber Resend API
- Speichert in `admin_outbound_emails`
- Setzt Reply-To mit Routing-Token

**Erweiterte Function: `sot-contact-enrichment`**
- Wird bei eingehenden Admin-E-Mails aufgerufen
- Extrahiert Kontaktdaten aus Signatur
- Erstellt/aktualisiert Kontakt mit `scope = 'zone1_admin'`

---

### 9. Ablauf: E-Mail senden und Antwort erhalten

```text
1. Admin klickt "Neue E-Mail"
        |
        v
2. Waehlt Kontakt + schreibt Nachricht
        |
        v
3. Edge Function sot-admin-mail-send
   - Sendet via Resend
   - Speichert in admin_outbound_emails
   - Setzt Reply-To: admin+{msg_id}@incoming.systemofatown.de
        |
        v
4. Empfaenger antwortet
        |
        v
5. Resend Inbound Webhook
   - Parsed Reply-To Token
   - Speichert in admin_inbound_emails
   - Ruft sot-contact-enrichment auf
        |
        v
6. Admin sieht Antwort im "Eingang"-Tab
```

---

### 10. Sicherheit

- RLS-Policies fuer `admin_outbound_emails` und `admin_inbound_emails`
- Nur `platform_admin` darf zugreifen
- RESEND_API_KEY muss konfiguriert sein (bereits vorhanden im System)

---

### 11. Secret-Pruefung

**Benoetigt:** `RESEND_API_KEY`

**Status:** Das Secret ist laut Dokumentation im System vorgesehen, muss aber noch konfiguriert werden. Falls nicht vorhanden, wird der E-Mail-Versand gequeued aber nicht gesendet.

---

### 12. Zusammenfassung der Aenderungen

1. **Sidebar:** Drei separate Menuepunkte (E-Mail, Kontakte, Kommunikation) unter "KI Office"
2. **E-Mail-System:** Komplett Resend-basiert (kein IMAP/SMTP)
3. **Neue Tabellen:** `admin_outbound_emails`, `admin_inbound_emails`
4. **Kontaktanreicherung:** Funktioniert automatisch bei eingehenden E-Mails
5. **Datentrennung:** Alle Daten strikt in Zone 1 (`scope = 'zone1_admin'`)

