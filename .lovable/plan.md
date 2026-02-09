
# Posteingang UI-Ueberarbeitung + User-ID Mailbox Fix

## Problem 1: Leere Seite ohne Struktur

Aktuell zeigt der Posteingang bei 0 E-Mails nur einen EmptyState-Platzhalter. Der User sieht keine Tabelle, keine Spalten, kein Gefuehl fuer die Funktion.

### Loesung:
- Tabelle wird IMMER angezeigt — auch bei 0 Eintraegen
- Bei leerem Zustand: 10 leere Zeilen (Skeleton-Rows) mit dezenten Strichen als Platzhalter
- Spaltenkoepfe klar sichtbar: **Datum | Von | Betreff | PDFs | Status | Aktionen**
- Unter der Tabelle: dezenter Hinweis "Noch keine E-Mails eingegangen — sende PDFs an deine Upload-Adresse"

## Problem 2: Mailbox-Adresse nutzt Org-Slug statt User-ID

Laut Architekturvorgabe (User-ID-Invariante und Posteingang-Spec) soll die Adresse die User-ID enthalten, nicht den Org-Slug. Aktuell: `sot-internal@inbound.systemofatown.com`.

### Loesung:
- Migration: `address_local_part` des bestehenden Mailbox-Records auf die User-ID des Entwicklers setzen
- Auto-Provisioning-Trigger anpassen: bei neuen Mailboxen die User-ID des erstellenden Users verwenden (statt org.slug)
- Ergebnis: `d028bc99@inbound.systemofatown.com`

## Problem 3: Mehr visuelle Struktur auf der Seite

### Zusaetzliche Verbesserungen:
- Upload-E-Mail Card bekommt einen visuellen Rahmen mit Mail-Icon und Statusanzeige (aktiv/inaktiv)
- Stats-Kacheln werden immer gezeigt (auch mit 0-Werten) — nicht nur bei vorhandenen Fehlern
- Resend-Webhook-URL als Info-Hinweis fuer Admins andeuten (ohne technische Details)

---

## Technische Umsetzung

### Datei: `src/pages/portal/dms/PosteingangTab.tsx`
- EmptyState-Fallback entfernen
- Tabelle immer rendern mit `columns` Header
- Bei `emails.length === 0`: 10 Skeleton-Rows rendern (leere Zellen mit `h-4 bg-muted/30 rounded` Platzhaltern)
- Stats-Kacheln: Fehler-Kachel immer zeigen (auch bei 0)
- Hinweistext unter Tabelle bei leerem Zustand

### Migration: Mailbox User-ID Fix
```sql
UPDATE inbound_mailboxes
SET address_local_part = 'd028bc99'
WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001';
```

### Trigger-Anpassung
Der Auto-Provisioning-Trigger `auto_create_mailbox` muss angepasst werden, sodass er die User-ID des aufrufenden Users nutzt statt `NEW.slug`. Da Trigger auf `organizations` keinen direkten Zugriff auf `auth.uid()` haben, wird die Adresse stattdessen beim ersten Login/Profilzugriff erstellt — als Lazy-Provisioning in der Edge Function.

### Dateien die geaendert werden:
1. `src/pages/portal/dms/PosteingangTab.tsx` — Tabelle immer sichtbar, Skeleton-Rows, bessere Stats
2. SQL-Migration — Mailbox-Adresse auf User-ID umstellen
3. `supabase/functions/sot-inbound-receive/index.ts` — Lazy-Provisioning: wenn kein Mailbox fuer User existiert, automatisch erstellen bei GET ?action=mailbox
