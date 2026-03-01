

## Diagnose

In `supabase/functions/sot-mail-send/index.ts`, Zeile 296-306:

```javascript
const rawMessage = [
  `From: ${account.email_address}`,
  `To: ${email.to.join(', ')}`,
  // ... headers ...
  '',        // ← RFC 2822 Trennzeile (Header/Body)
  body,
].filter(Boolean).join('\r\n');
```

**Der Bug:** `.filter(Boolean)` entfernt die leere Zeile `''` (falsy). In RFC 2822 **muss** zwischen Headers und Body eine leere Zeile stehen (`\r\n\r\n`). Ohne diese Trennzeile interpretiert Gmail den Body als Header-Fortsetzung und der Inhalt geht verloren.

## Fix

In `supabase/functions/sot-mail-send/index.ts`:

1. Die Header-Zeilen mit `.filter(Boolean)` filtern (um optionale Header wie Cc/Bcc zu entfernen)
2. Dann manuell die leere Trennzeile + Body anfuegen

```javascript
const headers = [
  `From: ${account.email_address}`,
  `To: ${email.to.join(', ')}`,
  email.cc?.length ? `Cc: ${email.cc.join(', ')}` : '',
  email.bcc?.length ? `Bcc: ${email.bcc.join(', ')}` : '',
  `Subject: ${email.subject}`,
  `Content-Type: ${contentType}; charset=utf-8`,
  email.replyToMessageId ? `In-Reply-To: ${email.replyToMessageId}` : '',
].filter(Boolean).join('\r\n');

const rawMessage = headers + '\r\n\r\n' + body;
```

### Datei
| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/sot-mail-send/index.ts` | `.filter(Boolean)` nur auf Headers anwenden, Trennzeile manuell einfuegen |

### Freeze-Check
Edge Functions sind nicht eingefroren -- OK.

