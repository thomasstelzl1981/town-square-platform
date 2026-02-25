

## Audit-Ergebnis und Implementierungsplan

### 1. Golden Tenant — 4 Datenreste gefunden

| Tabelle | Anzahl | Details |
|---|---|---|
| `household_persons` | **4** | Max Mustermann (hauptperson), Lisa (partner), Felix + Emma (kind) — alles Demo-Range-IDs |

Alle anderen 16 geprüften operativen Tabellen: **0 Records**. Diese 4 Records müssen per SQL gelöscht werden.

### 2. Echte Nutzer-Accounts — Clean State bestätigt

| Account | Tenant-ID | household_persons | Alles andere | Status |
|---|---|---|---|---|
| `rr@unitys.com` | `406f5f7a-f61b-...` | **1** (eigenes Profil) | **0** überall | Sauber |
| `bernhard.marchner@...` | `80746f1a-6072-...` | **1** (eigenes Profil) | **0** überall | Sauber |

Die je 1 `household_persons`-Einträge sind die auto-erstellten Hauptperson-Profile vom Onboarding — korrekt, keine Datenreste.

### 3. Lennox Pet-Daten — Intakt

| Tabelle | Anzahl | Status |
|---|---|---|
| `pet_customers` | 3 | Intakt |
| `pets` | 3 | Intakt |
| `pet_bookings` | 5 | Intakt |
| `pet_providers` | 1 | Intakt |
| `pet_services` | 4 | Intakt |

### 4. WelcomeBanner — Veralteter Demohinweis

Der `WelcomeBanner` in `PortalLayout.tsx` (Zeilen 64-72 State/Logic, Zeilen 211-241 JSX) zeigt:

> *"Aktivieren Sie Demo-Daten unter Stammdaten → Demo-Daten"*

Das ist veraltet — im neuen Persistent-Showcase-Modell gibt es keine nutzergesteuerte Demo-Aktivierung mehr.

---

### Implementierungsplan

**Schritt 1 — DB: Golden Tenant bereinigen**

```sql
DELETE FROM household_persons 
WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001';
```

Löscht die 4 verwaisten Demo-Mustermann-Records (IDs: `d028bc99-...`, `e0000000-...101/102/103`).

**Schritt 2 — Code: WelcomeBanner aus PortalLayout.tsx entfernen**

Folgende Bereiche werden entfernt:
- **Zeilen 64-72:** `WELCOME_KEY` Konstante, `showWelcome` State, `dismissWelcome` Callback
- **Zeilen 211-241:** Kompletter `WelcomeBanner` JSX-Block
- **Zeile 253:** `{WelcomeBanner}` Rendering (Mobile Layout)
- **Zeile 297:** `{WelcomeBanner}` Rendering (Desktop Layout)
- **Zeile 27:** `Sparkles` aus dem lucide-Import entfernen (wird nur vom Banner verwendet); `X` prüfen ob anderweitig genutzt

**Schritt 3 — Verifizierung**

- Golden Tenant: Alle Tabellen = 0
- RR + Marchner: Nur je 1 household_persons (auto-Profil)
- Lennox: Pet-Daten unverändert (3+3+5+1+4)
- Kein WelcomeBanner mehr sichtbar

