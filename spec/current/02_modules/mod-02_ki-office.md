# MOD-02 — KI OFFICE

> **Version**: 2.1.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-07  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/office`  
> **SSOT-Rolle**: Source of Truth für KI Office Modul

---

## 1. Executive Summary

MOD-02 "KI Office" bietet KI-gestützte Bürofunktionen für Kommunikation, Kontakte und Terminplanung.
Das Modul nutzt Armstrong für automatisierte Workflows.

---

## 2. Sub-Tiles (5 Tabs — Sonderregelung)

> **Hinweis**: Dieses Modul bricht die 4-Tab-Regel aufgrund des neuen Widgets-Archivs.

| # | Titel | Route | Icon | Beschreibung |
|---|-------|-------|------|--------------|
| 1 | E-Mail | `/portal/office/email` | Mail | IMAP/OAuth E-Mail Integration |
| 2 | Brief | `/portal/office/brief` | FileText | KI-gestützter 5-Schritt-Assistent |
| 3 | Kontakte | `/portal/office/kontakte` | Users | Zentrales CRUD-Management |
| 4 | Kalender | `/portal/office/kalender` | Calendar | Mandantenspezifische Termine |
| 5 | **Widgets** | `/portal/office/widgets` | Layers | Erledigte Widgets & Aufgaben-Archiv |

---

## 3. Widgets Tab Spezifikation

### 3.1 Zweck

Zeigt alle erledigten/archivierten Widgets in kompakter Listenform.
Dient als Archiv für abgeschlossene Armstrong-Aktionen.

### 3.2 Funktionen

- **Filter nach Widget-Typ**: Dropdown mit allen Widget-Typen
- **Filter nach Status**: completed, cancelled
- **Zeitstempel**: Erstellungs- und Erledigungsdatum
- **Wiederholung**: "Wiederholen"-Button für wiederkehrende Aktionen

### 3.3 Layout

```
+------------------------------------------------------------------+
|  Erledigte Widgets                            [Filter ▼] [Status ▼]|
+------------------------------------------------------------------+
| 📬 Brief an Max Müller        | Erledigt | 07.02.2026 14:32       |
| 🔔 Mieterhöhung prüfen        | Erledigt | 07.02.2026 10:15       |
| 💡 Balkonsanierung            | Abgebr.  | 06.02.2026 16:45       |
+------------------------------------------------------------------+
```

---

## 4. Armstrong Actions (MOD-02)

| Action Code | Titel | Risk | Cost |
|-------------|-------|------|------|
| `ARM.MOD02.SEND_LETTER` | Brief absenden | medium | free |
| `ARM.MOD02.SEND_EMAIL` | E-Mail senden | medium | free |
| `ARM.MOD02.CREATE_CONTACT` | Kontakt anlegen | low | free |
| `ARM.MOD02.SCHEDULE_EVENT` | Termin erstellen | low | free |

---

## 5. Tile-Catalog Eintrag

```yaml
MOD-02:
  code: "MOD-02"
  title: "KI Office"
  icon: "Sparkles"
  main_route: "/portal/office"
  display_order: 2
  is_active: true
  
  sub_tiles:
    - title: "E-Mail"
      route: "/portal/office/email"
      icon: "Mail"
      
    - title: "Brief"
      route: "/portal/office/brief"
      icon: "FileText"
      
    - title: "Kontakte"
      route: "/portal/office/kontakte"
      icon: "Users"
      
    - title: "Kalender"
      route: "/portal/office/kalender"
      icon: "Calendar"
    
    - title: "Widgets"
      route: "/portal/office/widgets"
      icon: "Layers"
      description: "Erledigte Widgets & Aufgaben-Archiv"
```

---

## 6. Datenbank-Tabellen

### 6.1 Bestehend

- `contacts` — Kontakte
- `calendar_events` — Termine
- `letter_drafts` — Briefentwürfe

### 6.2 Geplant

- `letter_sent` — Versendete Briefe
- `mail_accounts` — E-Mail-Konten (IMAP/OAuth)
- `calendar_reminders` — Erinnerungen

---

## 7. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 2.0.0 | 2026-02-01 | Initiale v2 Spezifikation |
| 2.1.0 | 2026-02-07 | Widgets Tab hinzugefügt (5. Sub-Tile) |
