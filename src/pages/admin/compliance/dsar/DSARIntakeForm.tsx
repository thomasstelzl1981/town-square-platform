/**
 * DSAR Intake Form — Manuelles Erfassen einer Art. 15 Anfrage
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

interface DSARIntakeFormProps {
  onSubmit: (data: {
    requester_email: string;
    requester_name?: string;
    request_channel: string;
    request_received_at: string;
  }) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function DSARIntakeForm({ onSubmit, onCancel, isPending }: DSARIntakeFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('EMAIL');
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSubmit({
      requester_email: email.trim(),
      requester_name: name.trim() || undefined,
      request_channel: channel,
      request_received_at: receivedAt,
    });
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="h-4 w-4" /> Neue DSAR-Anfrage erfassen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="dsar-email">E-Mail des Anfragenden *</Label>
            <Input id="dsar-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="anfrage@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dsar-name">Name (optional)</Label>
            <Input id="dsar-name" value={name} onChange={e => setName(e.target.value)} placeholder="Max Mustermann" />
          </div>
          <div className="space-y-1.5">
            <Label>Kanal</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL">E-Mail</SelectItem>
                <SelectItem value="WEBFORM">Webformular</SelectItem>
                <SelectItem value="PORTAL">Portal</SelectItem>
                <SelectItem value="POSTAL">Post</SelectItem>
                <SelectItem value="OTHER">Sonstige</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dsar-received">Eingangsdatum *</Label>
            <Input id="dsar-received" type="date" required value={receivedAt} onChange={e => setReceivedAt(e.target.value)} />
          </div>
          <div className="col-span-full flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}><X className="h-3 w-3 mr-1" /> Abbrechen</Button>
            <Button type="submit" size="sm" disabled={isPending || !email.trim()}>
              <Plus className="h-3 w-3 mr-1" /> Anfrage anlegen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
