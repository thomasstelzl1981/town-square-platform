
# Armstrong × WhatsApp Business Integration — MVP

## Status: Phase 1 IMPLEMENTIERT ✅

---

## Was wurde gebaut

### Datenbank (6 Tabellen)
| Tabelle | RLS | Realtime | Status |
|---------|-----|----------|--------|
| whatsapp_accounts | ✅ Tenant-Isolation | — | ✅ |
| whatsapp_user_settings | ✅ User+Tenant | — | ✅ |
| whatsapp_conversations | ✅ Tenant-Isolation | — | ✅ |
| whatsapp_messages | ✅ Tenant-Isolation | ✅ | ✅ |
| whatsapp_attachments | ✅ Tenant-Isolation | — | ✅ |
| armstrong_command_events | ✅ Tenant-Isolation | — | ✅ |

### Edge Functions (3 deployed)
| Function | Zweck | Status |
|----------|-------|--------|
| sot-whatsapp-webhook | Meta WABA Webhook (Verify + Receive + Owner-Control Gate + Auto-Reply) | ✅ |
| sot-whatsapp-send | Outbound Messages via Meta API | ✅ |
| sot-whatsapp-media | Media Download + DMS Storage (WhatsApp Eingang/YYYY-MM-DD/) | ✅ |

### UI
| Screen | Ort | Status |
|--------|-----|--------|
| WhatsApp Messenger | MOD-02 KI Office → Tile 6 "WhatsApp" | ✅ |
| WhatsApp Settings | MOD-01 Stammdaten → Profil → WhatsApp Business | ✅ |

### Manifest
| Eintrag | Status |
|---------|--------|
| routesManifest.ts: MOD-02 Tile "whatsapp" | ✅ |
| armstrongManifest.ts: ARM.MOD02.WA_SEND_REPLY | ✅ |
| armstrongManifest.ts: ARM.MOD02.WA_COMMAND_EXECUTE | ✅ |

---

## Noch nicht implementiert (Phase 2+3)

### Phase 2: Armstrong Command Pipeline
- Intent-Erkennung via LLM fuer Owner-Control Nachrichten
- Widget-/Draft-Erstellung aus WhatsApp-Befehlen
- Armstrong-Feedback im Owner-Control Chat (Links zu Widgets)

### Phase 3: Verfeinerung
- Kontakt-Matching (WhatsApp-Nummer → contacts Tabelle)
- Message Templates (fuer proaktive Nachrichten nach 24h)
- Geschaeftszeiten-Logik fuer Auto-Reply
- Read Receipts Synchronisation

---

## Secrets (noch einzutragen)

| Secret | Beschreibung | Status |
|--------|-------------|--------|
| WHATSAPP_ACCESS_TOKEN | Meta WABA API Token | ⏳ Warten auf Verifizierung |
| WHATSAPP_VERIFY_TOKEN | Webhook Verify Token | ⏳ Frei waehlbar bei Setup |
| WHATSAPP_PHONE_NUMBER_ID | Phone Number ID | ⏳ Aus Meta Dashboard |

Sobald die Meta Business Verifizierung abgeschlossen ist, koennen die Secrets
ueber Lovable Cloud eingetragen werden.
