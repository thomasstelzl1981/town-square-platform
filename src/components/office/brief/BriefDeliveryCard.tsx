/**
 * R-9: Delivery channel selection + send/save (Step 6)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, Phone, FileOutput, Save, Send, Loader2 } from 'lucide-react';
import type { BriefContact, DeliveryChannel } from './briefTypes';

interface BriefDeliveryCardProps {
  channel: DeliveryChannel;
  setChannel: (c: DeliveryChannel) => void;
  faxNumber: string;
  setFaxNumber: (v: string) => void;
  recipient: BriefContact | null;
  generatedBody: string;
  isSending: boolean;
  isSaving: boolean;
  onSend: () => void;
  onSave: () => void;
}

export function BriefDeliveryCard({
  channel, setChannel, faxNumber, setFaxNumber,
  recipient, generatedBody,
  isSending, isSaving, onSend, onSave,
}: BriefDeliveryCardProps) {
  const channelHint = (() => {
    if (channel === 'email' && recipient?.email) return `An: ${recipient.email}`;
    if (channel === 'email') return 'Empfänger hat keine E-Mail-Adresse';
    return channel === 'fax' ? 'PDF wird als Fax gesendet' : 'PDF wird als Brief versendet';
  })();

  return (
    <Card className="glass-card">
      <CardContent className="p-5 space-y-4">
        <Label className="flex items-center gap-2">
          <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">6</Badge>
          Versand
        </Label>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Versandkanal</Label>
          <RadioGroup value={channel} onValueChange={(v) => setChannel(v as DeliveryChannel)} className="flex gap-4">
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="email" id="ch-email" />
              <Label htmlFor="ch-email" className="flex items-center gap-1 cursor-pointer text-sm"><Mail className="h-4 w-4" /> E-Mail</Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="fax" id="ch-fax" />
              <Label htmlFor="ch-fax" className="flex items-center gap-1 cursor-pointer text-sm"><Phone className="h-4 w-4" /> Fax</Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="post" id="ch-post" />
              <Label htmlFor="ch-post" className="flex items-center gap-1 cursor-pointer text-sm"><FileOutput className="h-4 w-4" /> Brief</Label>
            </div>
          </RadioGroup>
        </div>

        {channel === 'fax' && (
          <div className="space-y-1">
            <Label className="text-xs">Faxnummer</Label>
            <Input placeholder="z.B. +49 30 12345678" value={faxNumber} onChange={(e) => setFaxNumber(e.target.value)} />
          </div>
        )}

        <p className="text-xs text-muted-foreground">{channelHint}</p>

        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 flex-1" onClick={onSave} disabled={!generatedBody || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Entwurf speichern
          </Button>
          <Button className="gap-2 flex-1" disabled={!generatedBody || isSending} onClick={onSend}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Jetzt senden
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
