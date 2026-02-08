import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Send, X, Paperclip, ChevronDown, ChevronUp } from 'lucide-react';

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  accountEmail: string;
  onSent: () => void;
}

export function ComposeEmailDialog({
  open,
  onOpenChange,
  accountId,
  accountEmail,
  onSent,
}: ComposeEmailDialogProps) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);

  const resetForm = () => {
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setBody('');
    setShowCcBcc(false);
  };

  const handleClose = () => {
    if (isSending) return;
    resetForm();
    onOpenChange(false);
  };

  const handleSend = async () => {
    // Validate
    if (!to.trim()) {
      toast.error('Bitte geben Sie einen Empfänger an');
      return;
    }
    if (!subject.trim()) {
      toast.error('Bitte geben Sie einen Betreff an');
      return;
    }

    setIsSending(true);
    try {
      // Parse email addresses (comma or semicolon separated)
      const parseEmails = (input: string) => 
        input.split(/[,;]/)
          .map(e => e.trim())
          .filter(e => e.length > 0 && e.includes('@'));

      const toAddresses = parseEmails(to);
      const ccAddresses = cc ? parseEmails(cc) : undefined;
      const bccAddresses = bcc ? parseEmails(bcc) : undefined;

      if (toAddresses.length === 0) {
        throw new Error('Ungültige E-Mail-Adresse');
      }

      const { data, error } = await supabase.functions.invoke('sot-mail-send', {
        body: {
          accountId,
          to: toAddresses,
          cc: ccAddresses,
          bcc: bccAddresses,
          subject: subject.trim(),
          bodyText: body,
          bodyHtml: body ? `<pre style="font-family: inherit; white-space: pre-wrap;">${body}</pre>` : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('E-Mail wurde gesendet');
      resetForm();
      onSent();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Send email error:', error);
      toast.error('Senden fehlgeschlagen: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Neue E-Mail
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto py-4">
          {/* From (read-only) */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Von</Label>
            <div className="text-sm px-3 py-2 bg-muted/50 rounded-md">
              {accountEmail}
            </div>
          </div>

          {/* To */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-to">An</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground"
                onClick={() => setShowCcBcc(!showCcBcc)}
              >
                {showCcBcc ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                CC/BCC
              </Button>
            </div>
            <Input
              id="email-to"
              placeholder="empfaenger@email.de"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={isSending}
            />
            <p className="text-xs text-muted-foreground">
              Mehrere Empfänger mit Komma trennen
            </p>
          </div>

          {/* CC & BCC */}
          {showCcBcc && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email-cc">CC</Label>
                <Input
                  id="email-cc"
                  placeholder="cc@email.de"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  disabled={isSending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-bcc">BCC</Label>
                <Input
                  id="email-bcc"
                  placeholder="bcc@email.de"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  disabled={isSending}
                />
              </div>
            </>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="email-subject">Betreff</Label>
            <Input
              id="email-subject"
              placeholder="Betreff eingeben..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="email-body">Nachricht</Label>
            <Textarea
              id="email-body"
              placeholder="Ihre Nachricht..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isSending}
              rows={12}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSending}
          >
            <X className="h-4 w-4 mr-2" />
            Abbrechen
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !to.trim() || !subject.trim()}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Senden
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
