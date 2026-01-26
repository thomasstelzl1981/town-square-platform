import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { FileText, Eye, Download, Send, Save } from 'lucide-react';

interface TemplateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateCode: string;
  unit?: any;
}

export const TemplateWizard = ({ open, onOpenChange, templateCode, unit }: TemplateWizardProps) => {
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState('');
  const [activeTab, setActiveTab] = useState('edit');
  const queryClient = useQueryClient();

  const { data: template } = useQuery({
    queryKey: ['msv-template', templateCode],
    queryFn: async () => {
      if (!templateCode) return null;
      const { data, error } = await supabase
        .from('msv_templates')
        .select('*')
        .eq('template_code', templateCode)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!templateCode
  });

  // Pre-fill placeholders from unit context
  useEffect(() => {
    if (unit && template) {
      const prefilled: Record<string, string> = {};
      
      if (unit.lease?.contacts) {
        prefilled['mieter_name'] = `${unit.lease.contacts.first_name} ${unit.lease.contacts.last_name}`;
      }
      if (unit.properties?.address) {
        prefilled['adresse'] = unit.properties.address;
      }
      if (unit.unit_number) {
        prefilled['einheit'] = unit.unit_number;
      }
      if (unit.lease?.monthly_rent) {
        prefilled['alte_miete'] = unit.lease.monthly_rent.toString();
      }

      setPlaceholders(prefilled);
    }
  }, [unit, template]);

  // Generate preview
  useEffect(() => {
    if (template?.content) {
      let text = template.content;
      Object.entries(placeholders).forEach(([key, value]) => {
        text = text.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
      });
      setPreview(text);
    }
  }, [template, placeholders]);

  const saveDraft = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('letter_drafts').insert({
        tenant_id: unit?.tenant_id,
        subject: template?.title,
        body: preview,
        status: 'draft',
        channel: 'email'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Entwurf gespeichert');
      queryClient.invalidateQueries({ queryKey: ['letter-drafts'] });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Fehler beim Speichern');
    }
  });

  const placeholderList = template?.placeholders as string[] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {template?.title || 'Schreiben erstellen'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Bearbeiten</TabsTrigger>
            <TabsTrigger value="preview">Vorschau</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4 mt-4">
            <div className="grid gap-4">
              {placeholderList.map((placeholder) => (
                <div key={placeholder} className="grid gap-2">
                  <Label htmlFor={placeholder} className="capitalize">
                    {placeholder.replace(/_/g, ' ')}
                  </Label>
                  {placeholder === 'begruendung' || placeholder === 'dokumente_liste' ? (
                    <Textarea
                      id={placeholder}
                      value={placeholders[placeholder] || ''}
                      onChange={(e) => setPlaceholders(prev => ({
                        ...prev,
                        [placeholder]: e.target.value
                      }))}
                      placeholder={`${placeholder} eingeben...`}
                      rows={3}
                    />
                  ) : (
                    <Input
                      id={placeholder}
                      value={placeholders[placeholder] || ''}
                      onChange={(e) => setPlaceholders(prev => ({
                        ...prev,
                        [placeholder]: e.target.value
                      }))}
                      placeholder={`${placeholder} eingeben...`}
                    />
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="rounded-lg border bg-card p-6 whitespace-pre-wrap font-serif text-sm leading-relaxed">
              {preview}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button variant="secondary" onClick={() => saveDraft.mutate()}>
            <Save className="h-4 w-4 mr-2" />
            Als Entwurf speichern
          </Button>
          <Button variant="secondary" disabled>
            <Download className="h-4 w-4 mr-2" />
            PDF herunterladen
          </Button>
          <Button disabled>
            <Send className="h-4 w-4 mr-2" />
            Versenden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
