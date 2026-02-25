/**
 * ProjectAfaFields — Inline-editable AfA & Grund-und-Boden fields
 * Saves to dev_projects: afa_rate_percent, afa_model, land_share_percent
 */
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Building2, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ProjectAfaFieldsProps {
  projectId: string;
  afaRatePercent: number;
  afaModel: string;
  landSharePercent: number;
  isDemo?: boolean;
}

const AFA_MODELS = [
  { value: 'linear', label: 'Linear (§7 Abs. 4)' },
  { value: '7i', label: '§7i Denkmal' },
  { value: '7h', label: '§7h Sanierung' },
  { value: '7b', label: '§7b Neubau' },
];

export function ProjectAfaFields({
  projectId,
  afaRatePercent,
  afaModel,
  landSharePercent,
  isDemo,
}: ProjectAfaFieldsProps) {
  const queryClient = useQueryClient();
  const [afa, setAfa] = useState(afaRatePercent);
  const [model, setModel] = useState(afaModel);
  const [land, setLand] = useState(landSharePercent);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setAfa(afaRatePercent);
    setModel(afaModel);
    setLand(landSharePercent);
    setDirty(false);
  }, [projectId, afaRatePercent, afaModel, landSharePercent]);

  const handleSave = async () => {
    if (isDemo) return;
    setSaving(true);
    const { error } = await supabase
      .from('dev_projects')
      .update({
        afa_rate_percent: afa,
        afa_model: model,
        land_share_percent: land,
      } as any)
      .eq('id', projectId);

    if (error) {
      toast.error('Fehler beim Speichern', { description: error.message });
    } else {
      toast.success('Projektparameter gespeichert');
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['dev-projects'] });
    }
    setSaving(false);
  };

  const updateField = (setter: (v: number) => void, value: number) => {
    setter(value);
    setDirty(true);
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-4 rounded-lg border bg-muted/20">
      <div className="col-span-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Building2 className="h-4 w-4" />
        Steuerliche Parameter
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">AfA-Satz (%)</Label>
        <div className="relative">
          <Input
            type="number"
            step="0.5"
            min="0"
            max="20"
            value={afa}
            onChange={(e) => updateField(setAfa, parseFloat(e.target.value) || 0)}
            className="pr-7 h-8 text-sm"
            disabled={isDemo}
          />
          <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">AfA-Modell</Label>
        <Select
          value={model}
          onValueChange={(v) => { setModel(v); setDirty(true); }}
          disabled={isDemo}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AFA_MODELS.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Grundanteil (%)</Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type="number"
              step="1"
              min="0"
              max="100"
              value={land}
              onChange={(e) => updateField(setLand, parseFloat(e.target.value) || 0)}
              className="pr-7 h-8 text-sm"
              disabled={isDemo}
            />
            <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          </div>
          {dirty && (
            <Button
              size="sm"
              variant="default"
              className="h-8 gap-1.5"
              onClick={handleSave}
              disabled={saving || isDemo}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Speichern
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
