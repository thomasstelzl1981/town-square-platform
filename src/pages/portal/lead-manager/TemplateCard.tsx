/**
 * TemplateCard — Reusable template card for brand content workshops
 * 4:5 aspect ratio with image support, editable fields, save/toggle
 */
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateFields {
  caption: string;
  cta: string;
  description?: string;
}

interface TemplateCardProps {
  id: string;
  name: string;
  code: string;
  brandGradient: string;
  fields: TemplateFields;
  active: boolean;
  isSaving?: boolean;
  onSave: (id: string, fields: TemplateFields) => void;
  onToggleActive: (id: string, active: boolean) => void;
  /** Selection mode for campaign wizard */
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  /** Pre-generated template image URL */
  imageUrl?: string;
}

export function TemplateCard({
  id, name, code, brandGradient, fields: initialFields, active,
  isSaving, onSave, onToggleActive, selectable, selected, onSelect, imageUrl,
}: TemplateCardProps) {
  const [fields, setFields] = useState<TemplateFields>(initialFields);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setFields(initialFields);
    setDirty(false);
  }, [initialFields]);

  const updateField = (key: keyof TemplateFields, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    onSave(id, fields);
    setDirty(false);
  };

  // Image or gradient header
  const ImageHeader = ({ className }: { className?: string }) => (
    imageUrl ? (
      <div className={cn('relative overflow-hidden', className)}>
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    ) : (
      <div className={cn(`bg-gradient-to-br ${brandGradient} flex flex-col items-center justify-center gap-3 p-6`, className)}>
        <ImagePlus className="h-10 w-10 text-white/50" />
        <p className="text-white/60 text-sm">Bild-Upload kommt bald</p>
      </div>
    )
  );

  if (selectable) {
    return (
      <Card
        className={cn(
          'cursor-pointer transition-all overflow-hidden',
          selected ? 'ring-2 ring-primary shadow-md' : 'hover:border-primary/30',
        )}
        onClick={() => onSelect?.(id)}
      >
        <ImageHeader className="aspect-[4/5]" />
        <CardContent className="p-3 space-y-1">
          <p className="text-xs text-muted-foreground line-clamp-2">{fields.caption || '—'}</p>
          <Badge variant="outline" className="text-[10px]">{fields.cta || '—'}</Badge>
          {!active && <Badge variant="secondary" className="text-[10px] ml-1">Inaktiv</Badge>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <ImageHeader className="aspect-[4/5]" />

      <CardContent className="p-5 space-y-4">
        {/* Name & Code */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">{code}</p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`active-${id}`} className="text-xs text-muted-foreground">Aktiv</Label>
            <Switch
              id={`active-${id}`}
              checked={active}
              onCheckedChange={(v) => onToggleActive(id, v)}
            />
          </div>
        </div>

        {/* Description */}
        {fields.description && (
          <p className="text-sm text-muted-foreground">{fields.description}</p>
        )}

        {/* Editable fields */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Anzeigentext</Label>
            <Textarea
              value={fields.caption}
              onChange={(e) => updateField('caption', e.target.value)}
              rows={3}
              className="mt-1"
              placeholder="Anzeigentext eingeben..."
            />
          </div>
          <div>
            <Label className="text-xs">Call-to-Action</Label>
            <Input
              value={fields.cta}
              onChange={(e) => updateField('cta', e.target.value)}
              className="mt-1"
              placeholder="z.B. Jetzt entdecken"
            />
          </div>
        </div>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={!dirty || isSaving}
          className="w-full gap-2"
          variant={dirty ? 'default' : 'outline'}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {dirty ? 'Änderungen speichern' : 'Gespeichert'}
        </Button>
      </CardContent>
    </Card>
  );
}
