

# Plan: Stimme, Geschwindigkeit & Begrüßung für alle 7 Brands aktualisieren

## Aktuelle Lage (aus DB)

| Brand | Voice | Speed | Begrüßung |
|-------|-------|-------|-----------|
| Kaufy | Daniel ✓ | 71 | alte Version |
| FutureRoom | Daniel ✓ | 73 | alte Version |
| Acquiary | keine | 50 | alte Version |
| SoT | Daniel | 50 | alte Version |
| Lennox | keine | 50 | alte Version |
| Ncore | Daniel | 84 | bereits neue Version (aber mit "Company Name" Platzhalter) |
| Otto² | Daniel | 50 | alte Version |

## Änderungen

**Ein einziges SQL-Update** für alle 7 Brands:

1. **Voice**: Daniel (`onwK4e9ZLuTAKqWW03F9`) für alle — ist die deutsch-optimierte Stimme
2. **Speed**: 70 für alle
3. **Begrüßung** (first_message) je Brand:
   - Kaufy: „Herzlich Willkommen bei Kaufy. Ich bin Armstrong, die KI und das digitale Herz unseres Unternehmens. Wie kann ich Ihnen behilflich sein?"
   - FutureRoom: „...bei FutureRoom..."
   - Acquiary: „...bei Acquiary..."
   - SoT: „...bei System of a Town..."
   - Lennox: „...bei Lennox..."
   - Ncore: „...bei Ncore..." (Platzhalter "Company Name" ersetzen)
   - Otto²: „...bei Otto² Advisory..."

## Umsetzung

- 7 einzelne UPDATE-Statements auf `commpro_phone_assistants` (voice_settings JSONB + first_message)
- Kein Code-Change nötig — reine Datenbank-Anpassung
- Danach muss im CommPro Desk **"Alle synchronisieren"** geklickt werden, damit ElevenLabs die Änderungen übernimmt

