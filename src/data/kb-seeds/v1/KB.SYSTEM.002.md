---
item_code: KB.SYSTEM.002
category: system
content_type: article
title_de: "Zonen-Architektur: Zone 1/2/3 Rollen und Grenzen"
summary_de: "Erklärt die drei Zonen des Systems und ihre unterschiedlichen Zugriffsebenen."
version: "1.0.0"
status: "published"
scope: "global"
confidence: "verified"
valid_until: null
sources: []
---

# Zonen-Architektur: Zone 1/2/3

System of a Town verwendet eine strikte Zonen-Trennung für Sicherheit und klare Verantwortlichkeiten.

## Zone 1 — Admin/Governance

**Zugang:** Nur platform_admin und autorisierte Operatoren

**Funktionen:**
- Armstrong Console (Konfiguration)
- Action-Overrides und Policies
- Knowledge Base Administration
- Billing-Übersicht
- Audit Logs

**Armstrong:** Keine Chat-Funktion, nur Governance-UI

---

## Zone 2 — Portal (Authentifiziert)

**Zugang:** Alle authentifizierten Nutzer (org_member, org_admin)

**Funktionen:**
- Vollständiges Musterportal
- Armstrong FULL (Chat + Actions)
- MOD-00 bis MOD-10
- Persönliche Daten und Dokumente
- Mandantenfähig (Org-Isolation)

**Armstrong:** 
- Voller Funktionsumfang
- Schreibende Actions (mit Bestätigung)
- Web-Recherche (Opt-in)
- RAG über eigene Daten

---

## Zone 3 — Websites (Öffentlich)

**Zugang:** Alle Besucher (anonym oder authentifiziert)

**Funktionen:**
- KAUFY, MIETY, SOT, Futureroom Websites
- Öffentliche Rechner
- Lead-Erfassung
- Publizierte Inserate

**Armstrong LITE:**
- Nur readonly Actions
- Keine Mandantendaten
- FAQs und Erklärungen
- Lead-Weiterleitung

---

## Wichtige Regeln

1. **Daten fließen nie von Zone 2 nach Zone 3** (außer explizit publiziert)
2. **Zone 1 hat keinen direkten DB-Zugriff** auf Kundendaten
3. **RLS isoliert Mandanten** in Zone 2 vollständig
4. **Armstrong respektiert Zonengrenzen** automatisch
