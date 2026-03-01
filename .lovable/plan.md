

# Testergebnis & UX-Analyse: Zone 2 KI-Telefonassistent

## Testergebnis (Funktional)

### Was funktioniert

| Test | Ergebnis |
|------|----------|
| Seite lädt korrekt unter `/portal/communication-pro/ki-telefon` | OK |
| Assistenten-Config wird geladen (Auto-Create bei Erstbesuch) | OK |
| Status & Telefonnummer: Nummer angezeigt, Kopieren, Freigeben | OK |
| Tier-Badge "Premium (ElevenLabs)" sichtbar | OK |
| Rufweiterleitung: Collapsible mit GSM-Codes | OK |
| Verbrauch & Kosten: Preisinfo-Banner (15 Cr/Monat, 2 Cr/Min) | OK |
| Verbrauch: 3-Spalten-Grid (Anrufe, Minuten, Credits) | OK |
| Stimmprofil-Auswahl (6 Presets mit Slider) | OK |
| Begruessung & Verhalten editierbar mit Auto-Save | OK |
| Reaktionslogik: Checkboxen + Max-Dauer Dropdown | OK |
| Dokumentation & Benachrichtigung: Switches funktional | OK |
| Test-Anrufereignis erzeugen | OK |
| Anrufprotokoll: Eintrag mit Datum, Status, Dauer | OK |
| Call-Detail-Drawer: Transkript, Zusammenfassung, Aufgaben | OK |
| Testdaten loeschen | OK |
| DB-Tabellen: `phone_usage_log`, `phone_subscription_log` existieren | OK |
| RLS: Tenant-isolierte Policies aktiv | OK |
| View `phone_usage_monthly` existiert | OK |
| `tenant_id` auf Assistant gesetzt | OK |

### Probleme gefunden

| # | Problem | Schwere | Details |
|---|---------|---------|---------|
| 1 | **Verbrauch zeigt 0/0/0** obwohl Nummer aktiv | Mittel | `phone_usage_log` und `phone_subscription_log` sind leer. Das Test-Event schreibt nur in `commpro_phone_call_sessions`, nicht in `phone_usage_log`. Es gibt keinen Cron-Job fuer die monatliche Grundgebuehr. |
| 2 | **Call-Log nicht nach Assistant gefiltert** | Hoch | `usePhoneAssistant` laed ALLE Call-Sessions des Users (`select * ... limit 50`), nicht nur die des eigenen Assistenten. Bei Usern mit mehreren Assistenten (oder wenn Brand-Sessions sichtbar waeren) wuerden fremde Calls angezeigt. |
| 3 | **Voice Provider "spaeter"** wird angezeigt | Niedrig | Das Dropdown "Voice Provider (spaeter)" ist deaktiviert mit "Connect folgt..." -- das sieht unfertig aus und verwirrt User. |
| 4 | **Kein `billed_credits` bei Test-Events** | Niedrig | Test-Events haben `billed_credits: null`. Im Anrufprotokoll wird daher kein Credit-Badge angezeigt. |
| 5 | **Header-Text uninspirierend** | UX | "Konfiguriere Begruessung, Stimme und Dokumentation" klingt technisch und trocken. Kein Hinweis auf ElevenLabs/Twilio-Qualitaet. |

---

## UX-Analyse & Verbesserungsvorschlaege

### 1. Header & Positionierung -- "State of the Art" muss rueberommen

**Aktuell**: Generischer Titel "Telefonassistent" mit technischer Beschreibung.

**Vorschlag**: Der Header sollte klar kommunizieren, dass der User ein Premium-Produkt bekommt:
- Titel: "KI-Telefonassistent" (bleibt)
- Subtitle: "Ihr persoenlicher Sprachassistent mit modernster KI-Technologie. Deutsche Festnetznummer, natuerliche Sprachsynthese, automatische Dokumentation -- direkt aus Ihrem System."
- Ein kleines Feature-Highlight-Banner unter dem Header: 3 Icons nebeneinander (Twilio-Nummer / ElevenLabs-Stimme / Auto-Dokumentation)

### 2. Verbrauch & Kosten -- Tracking aktivieren

Das Billing-Card zeigt 0/0/0 weil:
- `sot-phone-postcall` schreibt in die `phone_usage_log` Tabelle, aber nur bei echten Calls (nicht Test-Events)
- Es gibt keinen Cron fuer die monatliche 15-Cr-Grundgebuehr
- Test-Events sollten optional auch den Usage-Flow simulieren

**Aenderungen**:
- Cron-Edge-Function `sot-phone-billing-cron` erstellen die monatlich 15 Credits pro aktiver Nummer abbucht
- Test-Event-Erstellung sollte auch einen `phone_usage_log` Eintrag erzeugen (mit `provider: 'test'`)
- Billing Card: Wenn noch kein Billing-Eintrag existiert aber eine Nummer aktiv ist, Hinweis anzeigen "Grundgebuehr wird zum Monatsende abgerechnet"

### 3. Call-Log: Assistant-Filter einbauen

```text
Aktuell:  .select('*').order('started_at', ...)
Korrekt:  .select('*').eq('assistant_id', assistant.id).order('started_at', ...)
```

### 4. Voice Provider -- "spaeter" entfernen

Das deaktivierte Dropdown mit "Connect folgt..." wirkt unfertig. Stattdessen:
- ElevenLabs als aktiven Provider anzeigen (nicht als Dropdown)
- Badge: "ElevenLabs Conversational AI" mit einem Info-Tooltip
- Der User muss keinen Provider waehlen -- das System ist ElevenLabs-only

### 5. Stimmprofil -- moderneres Wording

Die Presets sind gut. Vorschlag:
- Unter der Ueberschrift "Stimme" einen Satz: "Powered by ElevenLabs -- natuerlichste KI-Stimmen weltweit."

### 6. Fehlende Elemente fuer "Premium-Feeling"

- **Kein Sync-Button**: Zone 1 hat "Agent synchronisieren". Zone 2 sollte ebenfalls einen diskreten "Aenderungen uebernehmen"-Button haben, der `sot-phone-agent-sync` aufruft.
- **Kein Onboarding fuer neue User**: Wenn ein User die Seite zum ersten Mal besucht (kein Nummer, leere Config), fehlt ein Mini-Wizard oder zumindest ein ausfuehrlicherer Willkommens-Text.

---

## Zusammenfassung der geplanten Aenderungen

| # | Aenderung | Dateien |
|---|-----------|---------|
| 1 | Header-Text Premium-Positionierung | `KiTelefonPage.tsx` |
| 2 | Call-Log nach `assistant_id` filtern | `usePhoneAssistant.ts` |
| 3 | Voice Provider: ElevenLabs-Badge statt Placeholder | `VoiceSettingsCard.tsx` |
| 4 | "Powered by ElevenLabs" Hinweis bei Stimme | `VoiceSettingsCard.tsx` |
| 5 | Test-Events: auch `phone_usage_log` Eintrag erzeugen | `usePhoneAssistant.ts` |
| 6 | Billing-Hinweis wenn Nummer aktiv aber noch kein Verbrauch | `PhoneBillingCard.tsx` |
| 7 | Sync-Button fuer Zone 2 (Agent-Sync) | `KiTelefonPage.tsx` oder `StatusForwardingCard.tsx` |

### Nicht in diesem Sprint (spaeter)

- Cron-Function `sot-phone-billing-cron` fuer monatliche Grundgebuehr (benoetigt Cron-Setup)
- Onboarding-Flow fuer Erstbesucher
- Audio-Vorschau der Stimme (benoetigt ElevenLabs TTS API)

