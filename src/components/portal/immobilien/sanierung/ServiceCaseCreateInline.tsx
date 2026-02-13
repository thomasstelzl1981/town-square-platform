import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DictationButton } from '@/components/shared/DictationButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles } from 'lucide-react';
import { useCreateServiceCase } from '@/hooks/useServiceCases';

interface ServiceCaseCreateInlineProps {
  onCancel: () => void;
  onSuccess?: (caseId: string) => void;
}

interface PropertyOption {
  id: string;
  address: string;
  city: string;
  code: string | null;
}

interface UnitOption {
  id: string;
  unit_number: string;
  code: string | null;
}

export function ServiceCaseCreateInline({ onCancel, onSuccess }: ServiceCaseCreateInlineProps) {
  const { activeTenantId } = useAuth();
  const createMutation = useCreateServiceCase();

  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('__whole__');
  const [description, setDescription] = useState('');

  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties_for_sanierung', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, city, code')
        .eq('tenant_id', activeTenantId)
        .eq('status', 'active')
        .order('address');
      if (error) throw error;
      return data as PropertyOption[];
    },
    enabled: !!activeTenantId,
  });

  const { data: units } = useQuery({
    queryKey: ['units_for_sanierung', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('units')
        .select('id, unit_number, code')
        .eq('property_id', propertyId)
        .order('unit_number');
      if (error) throw error;
      return data as UnitOption[];
    },
    enabled: !!propertyId,
  });

  const handleSubmit = async () => {
    if (!propertyId || !description.trim()) return;

    const autoTitle = description.trim().length > 60
      ? description.trim().substring(0, 57) + '...'
      : description.trim();

    const result = await createMutation.mutateAsync({
      property_id: propertyId,
      unit_id: unitId === '__whole__' ? null : unitId || null,
      category: 'sonstige' as const,
      title: autoTitle,
      description: description.trim(),
    });

    if (onSuccess && result?.id) {
      onSuccess(result.id);
    }
  };

  const isValid = propertyId && description.trim().length > 0;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Sanierung erfassen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Property */}
          <div className="space-y-1.5">
            <Label htmlFor="inline-property">Objekt</Label>
            <Select value={propertyId} onValueChange={(val) => { setPropertyId(val); setUnitId('__whole__'); }}>
              <SelectTrigger id="inline-property">
                <SelectValue placeholder="Objekt auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {propertiesLoading ? (
                  <SelectItem value="_loading" disabled>Laden...</SelectItem>
                ) : properties?.length === 0 ? (
                  <SelectItem value="_empty" disabled>Keine Objekte vorhanden</SelectItem>
                ) : (
                  properties?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code ? `${p.code} — ` : ''}{p.address}, {p.city}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Unit */}
          {propertyId && (
            <div className="space-y-1.5">
              <Label>Einheit</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__whole__">Gesamtes Objekt</SelectItem>
                  {units?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.code || u.unit_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="inline-description">Was soll gemacht werden?</Label>
            <DictationButton onTranscript={(text) => setDescription(prev => prev + (prev ? ' ' : '') + text)} />
          </div>
          <Textarea
            id="inline-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreiben Sie, was saniert werden soll. z.B.: Komplettes Bad erneuern, neue Fliesen, Dusche statt Badewanne, neue Armaturen."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* AI Hint */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
          <span>Die KI erstellt aus Ihrer Beschreibung ein strukturiertes Leistungsverzeichnis mit Kostenschätzung.</span>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
        <Button onClick={handleSubmit} disabled={!isValid || createMutation.isPending}>
          {createMutation.isPending ? 'Wird angelegt...' : 'Weiter →'}
        </Button>
      </CardFooter>
    </Card>
  );
}
