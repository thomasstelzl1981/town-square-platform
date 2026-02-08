---
item_code: KB.SYSTEM.005
category: system
content_type: article
title_de: "Rollenmodell: platform_admin, org_admin, org_member, agent roles"
summary_de: "Übersicht aller Rollen im System und ihrer Berechtigungen."
version: "1.0.0"
status: "published"
scope: "global"
confidence: "verified"
valid_until: null
sources: []
---

# Rollenmodell im System of a Town

## Hierarchie der Rollen

```
platform_admin
    └── org_admin
            └── org_member
                    └── (agent_roles)
```

---

## platform_admin

**Scope:** Systemweit (Zone 1)

**Berechtigungen:**
- Zugriff auf Armstrong Console
- Globale Action-Overrides
- Knowledge Base: Alle Items publishen
- Policies erstellen und aktivieren
- Alle Organisationen einsehen (Governance)
- Billing-Übersicht gesamt

**Kann NICHT:**
- Auf Kundendaten zugreifen (RLS)
- Im Namen von Nutzern handeln

---

## org_admin

**Scope:** Eigene Organisation (Zone 2)

**Berechtigungen:**
- Vollzugriff auf alle Org-Daten
- Nutzer einladen und verwalten
- Immobilien anlegen/bearbeiten
- Finanzierungen verwalten
- Dokumente hochladen/verknüpfen
- KB Items für Org publishen

**Armstrong:** Alle Actions der Org

---

## org_member

**Scope:** Eigene Organisation, eingeschränkt (Zone 2)

**Berechtigungen:**
- Eigenes Profil verwalten
- Dokumente hochladen
- Favoriten verwalten
- Finanzierung vorbereiten
- Dashboard nutzen

**Kann NICHT:**
- Andere Nutzer verwalten
- Immobilien-Stammdaten ändern
- Mandanten-weite Einstellungen

---

## Agent Roles (Spezialisiert)

| Rolle | Beschreibung |
|-------|--------------|
| acq_manager | Akquise-Manager für Mandate |
| finance_advisor | Finanzierungsberater |
| property_manager | Objektverwalter |
| support_agent | Support-Mitarbeiter |

Diese Rollen ergänzen die Basisrollen um modulspezifische Berechtigungen.

---

## Rollenzuweisung

Rollen werden zugewiesen über:
1. `organization_members.role` (Basis)
2. `profile_roles` Junction-Table (Spezialisiert)

Armstrong prüft bei jeder Action: `roles_allowed` vs. User-Rollen
