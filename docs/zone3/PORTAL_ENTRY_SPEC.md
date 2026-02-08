# KAUFY Portal-Eröffnung — Spezifikation

**Version:** 1.0.0  
**Status:** Konzept (Umsetzung folgt in späteren Phasen)  
**Datum:** 2026-02-08

---

## 1. Übersicht

Diese Spezifikation definiert die Self-Service Portal-Registrierung für KAUFY-Besucher. Ziel ist ein nahtloser Übergang von der öffentlichen Website (Zone 3) zum persönlichen Portal (Zone 2).

---

## 2. Entry Points nach Zielgruppe

| Zielgruppe | CTA-Button | Ziel-Route | Org-Typ | Module |
|------------|------------|------------|---------|--------|
| Vermieter | "Kostenlos starten" | `/auth?mode=register&source=kaufy&role=landlord` | client | 01, 03, 04, 05 |
| Verkäufer | "Objekt anmelden" | `/auth?mode=register&source=kaufy&role=seller` | client | 01, 03, 04, 06 |
| Partner | "Partnerantrag stellen" | `/auth?mode=register&source=kaufy&role=partner` | partner | 01, 03, 08, 09, 10 |
| Bauträger | "Projekt-Demo anfragen" | `/kontakt?type=developer` | Lead → Zone 1 | (manuell) |

---

## 3. Registrierungs-Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Zone 3 Website                                              │
│  [CTA-Button "Kostenlos starten"]                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  /auth?mode=register&source=kaufy&role={role}               │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  E-Mail                                              │    │
│  │  Passwort                                            │    │
│  │  Passwort bestätigen                                 │    │
│  │  [x] AGB akzeptieren                                 │    │
│  │  [Registrieren]                                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  E-Mail-Verifizierung                                        │
│                                                              │
│  "Bitte bestätigen Sie Ihre E-Mail-Adresse."                │
│  [Link in E-Mail klicken]                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Org-Wizard (nach E-Mail-Bestätigung)                       │
│                                                              │
│  Schritt 1: Persönliche Daten                               │
│  - Vorname, Nachname                                         │
│  - Telefon (optional)                                        │
│                                                              │
│  Schritt 2: Organisation                                     │
│  - Organisationsname (z.B. "Familie Müller")                │
│  - Typ: Privat / Unternehmen                                 │
│  - Adresse (optional)                                        │
│                                                              │
│  [Weiter zum Portal]                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Zone 2 Portal — Dashboard                                   │
│                                                              │
│  "Willkommen bei KAUFY!"                                    │
│  Module basierend auf Rolle freigeschaltet                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Rollen-basierte Modul-Freischaltung

### 4.1 Vermieter (landlord)

**Fokus:** Bestandsverwaltung

| Modul | Bereich | Beschreibung |
|-------|---------|--------------|
| MOD-01 | Base | Stammdaten & Kontakte |
| MOD-03 | Base | Dokumentenmanagement |
| MOD-04 | Base | Immobilienverwaltung |
| MOD-05 | Operations | Mietmanagement (MSV) |

### 4.2 Verkäufer (seller)

**Fokus:** Objektvermarktung

| Modul | Bereich | Beschreibung |
|-------|---------|--------------|
| MOD-01 | Base | Stammdaten & Kontakte |
| MOD-03 | Base | Dokumentenmanagement |
| MOD-04 | Base | Immobilienverwaltung |
| MOD-06 | Missions | Verkauf & Marketing |

### 4.3 Partner (partner)

**Fokus:** Vertrieb & Beratung

| Modul | Bereich | Beschreibung |
|-------|---------|--------------|
| MOD-01 | Base | Stammdaten & Kontakte |
| MOD-03 | Base | Dokumentenmanagement |
| MOD-08 | Services | Investment-Suche |
| MOD-09 | Services | Vertriebspartner-Netzwerk |
| MOD-10 | Services | Leadgenerierung |

**Zusätzliche Anforderungen für Partner:**
- Upload: §34c GewO Nachweis
- Upload: Vermögensschadenhaftpflicht
- Manuelle Freischaltung durch Zone 1 Admin

### 4.4 Bauträger (developer)

**Fokus:** Projektvertrieb (manueller Prozess)

1. Lead wird über `/kontakt?type=developer` erfasst
2. Zone 1 Admin kontaktiert Interessenten
3. Manuelle Org-Erstellung mit erweiterten Modulen:
   - MOD-01, 03, 04, 06
   - MOD-13 (Projekte)
   - MOD-14 (Website-Builder)

---

## 5. Datenbank-Auswirkungen

### 5.1 Neue Felder/Tabellen (Konzept)

```sql
-- Erweiterung: profiles Tabelle
ALTER TABLE profiles ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN registration_source TEXT; -- 'kaufy', 'miety', etc.
ALTER TABLE profiles ADD COLUMN registration_role TEXT;   -- 'landlord', 'seller', 'partner'

-- Erweiterung: organizations Tabelle
ALTER TABLE organizations ADD COLUMN onboarding_step INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN partner_verification_status TEXT; -- 'pending', 'approved', 'rejected'
```

### 5.2 Modul-Aktivierung

Die Modul-Freischaltung erfolgt über die bestehende `org_module_activations` Tabelle:

```sql
-- Beispiel: Vermieter-Module aktivieren
INSERT INTO org_module_activations (org_id, module_code, is_active, activated_at)
VALUES 
  ('org-uuid', 'MOD-01', true, NOW()),
  ('org-uuid', 'MOD-03', true, NOW()),
  ('org-uuid', 'MOD-04', true, NOW()),
  ('org-uuid', 'MOD-05', true, NOW());
```

---

## 6. E-Mail-Templates (Konzept)

### 6.1 Willkommens-E-Mail

**Betreff:** Willkommen bei KAUFY — Ihr Portal ist bereit

```
Hallo {firstName},

vielen Dank für Ihre Registrierung bei KAUFY!

Ihr persönliches Portal ist jetzt eingerichtet. Als {roleLabel} haben Sie
Zugang zu folgenden Funktionen:

{moduleList}

Jetzt einloggen: {loginUrl}

Bei Fragen steht Ihnen unser Support-Team zur Verfügung.

Beste Grüße
Ihr KAUFY-Team
```

### 6.2 Partner-Verifizierung

**Betreff:** Partnerantrag erhalten — Nächste Schritte

```
Hallo {firstName},

vielen Dank für Ihren Partnerantrag bei KAUFY!

Um Ihren Zugang freizuschalten, benötigen wir noch folgende Unterlagen:

☐ Gewerbeanmeldung nach §34c GewO
☐ Vermögensschadenhaftpflicht-Nachweis

Bitte laden Sie diese Dokumente in Ihrem Portal hoch.

Hochladen: {uploadUrl}

Nach Prüfung Ihrer Unterlagen schalten wir Ihren Partner-Zugang frei.
Dies dauert in der Regel 2-3 Werktage.

Beste Grüße
Ihr KAUFY-Team
```

---

## 7. UI/UX-Anforderungen

### 7.1 Auth-Seite Erweiterungen

Die bestehende `/auth` Seite muss folgende Query-Parameter unterstützen:

| Parameter | Werte | Auswirkung |
|-----------|-------|------------|
| `mode` | register, login | Formular-Modus |
| `source` | kaufy, miety, sot | Branding & Redirect |
| `role` | landlord, seller, partner | Modul-Freischaltung |

### 7.2 Org-Wizard

Ein mehrstufiger Wizard nach erfolgreicher Registrierung:

1. **Persönliche Daten** (erforderlich)
   - Vorname, Nachname
   - Telefon (optional)

2. **Organisation** (erforderlich)
   - Organisationsname
   - Typ: Privat / Unternehmen
   - Adresse (optional)

3. **Partner-Verifizierung** (nur für role=partner)
   - §34c Upload
   - VSH Upload
   - Hinweis auf manuelle Prüfung

### 7.3 Dashboard-Personalisierung

Das Dashboard zeigt rollenspezifische Inhalte:

| Rolle | Dashboard-Fokus |
|-------|-----------------|
| landlord | Portfolio-Übersicht, Mieteinnahmen |
| seller | Verkaufs-Status, Exposé-Erstellung |
| partner | Objektkatalog, Lead-Pipeline |

---

## 8. Sicherheitsanforderungen

### 8.1 Validierung

- E-Mail-Format via Zod-Schema
- Passwort: Min. 8 Zeichen, 1 Großbuchstabe, 1 Zahl
- Rate-Limiting: Max. 5 Registrierungen pro IP/Stunde

### 8.2 E-Mail-Verifizierung

- E-Mail-Bestätigung ist PFLICHT (kein auto_confirm)
- Token-Gültigkeit: 24 Stunden
- Re-Send-Option nach 60 Sekunden

### 8.3 Partner-Verifizierung

- Dokument-Upload nur in sichere Storage-Bucket
- Manuelle Prüfung durch Zone 1 Admin erforderlich
- Partner-Module erst nach Freischaltung sichtbar

---

## 9. Noch NICHT umsetzen

Folgende Punkte sind Teil dieser Spezifikation, werden aber erst in späteren Phasen implementiert:

- [ ] Auth-Seite Query-Parameter-Handling
- [ ] Org-Wizard Komponente
- [ ] Partner-Verifizierungs-Upload
- [ ] Rollen-basierte Modul-Aktivierung
- [ ] E-Mail-Templates in Resend
- [ ] Dashboard-Personalisierung nach Rolle
- [ ] Zone 1 Partner-Approval-Workflow

---

## 10. Nächste Schritte

1. **Genehmigung** dieser Spezifikation
2. **Priorisierung** der Implementierungs-Reihenfolge
3. **Phase 6** (nicht definiert): Technische Umsetzung

---

*Diese Spezifikation ist die Grundlage für die Self-Service Portal-Eröffnung und dient als Referenz für die spätere Implementierung.*
