import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { TAB_CONFIG, TOPIC_LABELS, type FortbildungTab, type FortbildungTopic, type FortbildungProvider } from '@/services/fortbildung/types';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Record<string, any> | null;
  onSave: (data: Record<string, any>) => void;
  loading?: boolean;
}

const PROVIDERS: { value: FortbildungProvider; label: string }[] = [
  { value: 'amazon', label: 'Amazon' },
  { value: 'udemy', label: 'Udemy' },
  { value: 'eventbrite', label: 'Eventbrite' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'impact', label: 'Impact' },
];

const emptyForm = {
  tab: 'books' as FortbildungTab,
  topic: 'immobilien' as FortbildungTopic,
  provider: 'amazon' as FortbildungProvider,
  title: '',
  author_or_channel: '',
  description: '',
  affiliate_link: '',
  price_text: '',
  rating_text: '',
  duration_text: '',
  image_url: '',
  external_id: '',
  sort_order: 0,
  is_active: true,
};

export default function AdminFortbildungDrawer({ open, onOpenChange, item, onSave, loading }: DrawerProps) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = !!item;

  useEffect(() => {
    if (item) {
      setForm({ ...emptyForm, ...item });
    } else {
      setForm(emptyForm);
    }
  }, [item, open]);

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = { ...form };
    // Clean empty strings to null
    for (const k of ['author_or_channel', 'description', 'price_text', 'rating_text', 'duration_text', 'image_url', 'external_id']) {
      if (!payload[k]) payload[k] = null;
    }
    if (isEdit && item?.id) payload.id = item.id;
    onSave(payload);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Eintrag bearbeiten' : 'Neuen Eintrag anlegen'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tab</Label>
              <Select value={form.tab} onValueChange={(v) => set('tab', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TAB_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Topic</Label>
              <Select value={form.topic} onValueChange={(v) => set('topic', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TOPIC_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Provider</Label>
            <Select value={form.provider} onValueChange={(v) => set('provider', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Titel *</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </div>
          <div>
            <Label>Autor / Kanal</Label>
            <Input value={form.author_or_channel || ''} onChange={(e) => set('author_or_channel', e.target.value)} />
          </div>
          <div>
            <Label>Beschreibung</Label>
            <Textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} rows={3} />
          </div>
          <div>
            <Label>Affiliate-Link *</Label>
            <Input value={form.affiliate_link} onChange={(e) => set('affiliate_link', e.target.value)} required type="url" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Preis</Label>
              <Input value={form.price_text || ''} onChange={(e) => set('price_text', e.target.value)} placeholder="z.B. 14,99 €" />
            </div>
            <div>
              <Label>Bewertung</Label>
              <Input value={form.rating_text || ''} onChange={(e) => set('rating_text', e.target.value)} placeholder="z.B. 4.5/5" />
            </div>
            <div>
              <Label>Dauer</Label>
              <Input value={form.duration_text || ''} onChange={(e) => set('duration_text', e.target.value)} placeholder="z.B. 2h" />
            </div>
          </div>
          <div>
            <Label>Bild-URL</Label>
            <Input value={form.image_url || ''} onChange={(e) => set('image_url', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Externe ID</Label>
              <Input value={form.external_id || ''} onChange={(e) => set('external_id', e.target.value)} />
            </div>
            <div>
              <Label>Sortierung</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => set('sort_order', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.is_active} onCheckedChange={(v) => set('is_active', !!v)} id="is_active" />
            <Label htmlFor="is_active">Aktiv</Label>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {isEdit ? 'Speichern' : 'Anlegen'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
