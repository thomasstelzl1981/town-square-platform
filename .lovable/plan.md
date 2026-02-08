
# E-Mail-System Analyse & Reparaturplan

## Identifizierte Probleme

### Problem 1: IMAP-Synchronisation — NICHT IMPLEMENTIERT

**Log-Beweis:**
```
ERROR Sync error: Error: IMAP sync requires external worker service - coming soon
```

**Code-Stelle:** `supabase/functions/sot-mail-sync/index.ts` Zeile 305
```typescript
throw new Error('IMAP sync requires external worker service - coming soon');
```

Die `syncImapMail()` Funktion ist nur ein Platzhalter, der einen Fehler wirft. Es gibt keine echte IMAP-Verbindung.

**Status in Datenbank:**
| Feld | Wert |
|------|------|
| email_address | thomas.stelzl@systemofatown.com |
| provider | imap |
| sync_status | **error** |
| sync_error | IMAP sync requires external worker service - coming soon |

---

### Problem 2: SMTP-Versand — NICHT IMPLEMENTIERT

**Code-Stelle:** `supabase/functions/sot-mail-send/index.ts` Zeile 266
```typescript
return { 
  success: false, 
  error: 'SMTP sending requires external relay service - coming soon' 
};
```

Die `sendImapMail()` Funktion für SMTP ist ebenfalls nur ein Platzhalter.

---

### Problem 3: "Neue E-Mail" Button — KEINE COMPOSE-UI

**Code-Stelle:** `EmailTab.tsx` Zeile 480-482
```typescript
<Button className="w-full gap-2" size="sm" disabled={!hasConnectedAccount}>
  <Plus className="h-4 w-4" />
  Neue E-Mail
</Button>
```

Der Button ist vorhanden, aber es gibt **keine onClick-Handler** und **keine Compose-Dialog-Komponente**. Der Button macht nichts.

---

## Lösung: Deno-IMAP Library

Es existiert eine produktionsreife IMAP-Library für Deno:

**`jsr:@workingdevshero/deno-imap`**

- ✅ Funktioniert mit Cloudflare Workers und Deno
- ✅ TLS/SSL Support
- ✅ PLAIN/LOGIN Authentication
- ✅ Message operations (search, fetch, move, copy, delete)
- ✅ Promise-based API
- ✅ TypeScript Types

---

## Reparaturplan

### Phase 1: IMAP-Synchronisation implementieren

**Datei:** `supabase/functions/sot-mail-sync/index.ts`

Ersetze den Platzhalter `syncImapMail()` mit echter IMAP-Verbindung:

```typescript
import { ImapClient } from 'jsr:@workingdevshero/deno-imap';

async function syncImapMail(
  supabase: any, 
  account: any, 
  folder: string, 
  limit: number
): Promise<number> {
  // Passwort aus Base64-encoded credentials_vault_key dekodieren
  const credentials = JSON.parse(atob(account.credentials_vault_key));
  
  const client = new ImapClient({
    host: account.imap_host,
    port: account.imap_port,
    tls: true,
    username: account.email_address,
    password: credentials.password,
  });

  await client.connect();
  await client.selectMailbox(folder);
  
  // Letzte N Nachrichten abrufen
  const messages = await client.fetch(`1:${limit}`, {
    envelope: true,
    bodyStructure: true,
    flags: true,
  });

  let synced = 0;
  for (const msg of messages) {
    await supabase.from('mail_messages').upsert({
      account_id: account.id,
      message_id: msg.uid.toString(),
      folder: folder.toUpperCase(),
      subject: msg.envelope?.subject || '(Kein Betreff)',
      from_address: msg.envelope?.from?.[0]?.address || '',
      from_name: msg.envelope?.from?.[0]?.name || '',
      to_addresses: msg.envelope?.to?.map(t => t.address) || [],
      is_read: msg.flags?.includes('\\Seen'),
      is_starred: msg.flags?.includes('\\Flagged'),
      received_at: msg.envelope?.date,
    }, { onConflict: 'account_id,message_id' });
    synced++;
  }

  client.disconnect();
  return synced;
}
```

---

### Phase 2: SMTP-Versand via Resend

Da SMTP über TCP in Edge Functions komplex ist, nutzen wir Resend als Relay:

**Datei:** `supabase/functions/sot-mail-send/index.ts`

```typescript
import { Resend } from 'npm:resend@4.0.0';

async function sendImapMail(account, email) {
  // Option A: Resend als SMTP-Relay
  const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
  
  const { data, error } = await resend.emails.send({
    from: `${account.display_name} <${account.email_address}>`,
    to: email.to,
    cc: email.cc,
    bcc: email.bcc,
    subject: email.subject,
    html: email.bodyHtml || email.bodyText,
    reply_to: account.email_address,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, messageId: data.id };
}
```

**Hinweis:** Für Resend muss die Domain verifiziert werden (systemofatown.com).

---

### Phase 3: Compose-Dialog erstellen

**Datei:** `EmailTab.tsx` — Neue Komponente

```typescript
// ComposeEmailDialog Component
function ComposeEmailDialog({ 
  open, 
  onOpenChange, 
  accountId,
  onSent 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  onSent: () => void;
}) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-mail-send', {
        body: {
          accountId,
          to: to.split(',').map(e => e.trim()),
          subject,
          bodyText: body,
        },
      });
      
      if (error || data?.error) throw new Error(data?.error || error.message);
      
      toast.success('E-Mail gesendet');
      onSent();
      onOpenChange(false);
    } catch (error) {
      toast.error('Senden fehlgeschlagen: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue E-Mail</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input 
            placeholder="An: empfaenger@domain.de" 
            value={to} 
            onChange={e => setTo(e.target.value)} 
          />
          <Input 
            placeholder="Betreff" 
            value={subject} 
            onChange={e => setSubject(e.target.value)} 
          />
          <Textarea 
            placeholder="Nachricht..." 
            value={body} 
            onChange={e => setBody(e.target.value)}
            rows={10}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSend} disabled={isSending || !to || !subject}>
            {isSending ? <Loader2 className="animate-spin" /> : <Send />}
            Senden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Phase 4: Button mit Dialog verbinden

```typescript
// In EmailTab:
const [showComposeDialog, setShowComposeDialog] = useState(false);

// Button aktualisieren:
<Button 
  className="w-full gap-2" 
  size="sm" 
  disabled={!hasConnectedAccount}
  onClick={() => setShowComposeDialog(true)}
>
  <Plus className="h-4 w-4" />
  Neue E-Mail
</Button>

// Dialog einbinden:
<ComposeEmailDialog
  open={showComposeDialog}
  onOpenChange={setShowComposeDialog}
  accountId={activeAccount?.id || ''}
  onSent={() => refetchMessages()}
/>
```

---

## Zusammenfassung der Änderungen

| Datei | Änderung |
|-------|----------|
| `supabase/functions/sot-mail-sync/index.ts` | IMAP-Sync mit `deno-imap` Library |
| `supabase/functions/sot-mail-send/index.ts` | SMTP via Resend-Relay |
| `src/pages/portal/office/EmailTab.tsx` | ComposeEmailDialog + Button-Handler |

---

## Voraussetzungen

| Requirement | Status |
|-------------|--------|
| IONOS IMAP-Account | ✅ Vorhanden in DB |
| RESEND_API_KEY | ⚠️ Muss hinzugefügt werden (für SMTP-Relay) |
| Domain-Verifizierung | ⚠️ systemofatown.com bei Resend verifizieren |

---

## Erwartetes Ergebnis

Nach Implementierung:

1. **Synchronisation:** E-Mails werden aus IONOS-Postfach abgerufen und in `mail_messages` gespeichert
2. **Compose:** Klick auf "Neue E-Mail" öffnet Dialog
3. **Senden:** E-Mails werden über Resend-Relay versendet (erscheint als `ihre@systemofatown.com`)
4. **Sync-Status:** `connected` statt `error`

---

## Technischer Hinweis

Die `deno-imap` Library öffnet TCP-Verbindungen. Dies funktioniert in Supabase Edge Functions, kann aber bei hoher Last zu Timeouts führen. Für Production-Scale wäre ein dedizierter IMAP-Sync-Worker (z.B. via Cron) empfehlenswert.
