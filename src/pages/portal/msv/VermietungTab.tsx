import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp, Mail, AlertTriangle, Send } from 'lucide-react';
import { TemplateWizard } from '@/components/msv/TemplateWizard';

const VermietungTab = () => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const { data: templates } = useQuery({
    queryKey: ['msv-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('msv_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_code');
      
      if (error) throw error;
      return data || [];
    }
  });

  const templateCategories = [
    {
      title: 'Vertragsmanagement',
      templates: ['KUENDIGUNG'],
      icon: <FileText className="h-5 w-5" />,
      color: 'text-blue-500'
    },
    {
      title: 'Mietanpassung',
      templates: ['MIETERHOEHUNG'],
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-green-500'
    },
    {
      title: 'Kommunikation',
      templates: ['DATENANFORDERUNG'],
      icon: <Mail className="h-5 w-5" />,
      color: 'text-purple-500'
    },
    {
      title: 'Mahnwesen',
      templates: ['MAHNUNG_1', 'MAHNUNG_2', 'MAHNUNG_3'],
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'text-orange-500',
      premium: true
    }
  ];

  const handleTemplateSelect = (code: string) => {
    setSelectedTemplate(code);
    setWizardOpen(true);
  };

  const getTemplate = (code: string) => templates?.find(t => t.template_code === code);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Schreiben erstellen</h2>
        <p className="text-sm text-muted-foreground">
          Wählen Sie eine Vorlage, um ein Schreiben zu erstellen. Die Vorlagen stammen aus Zone 1 Master-Vorlagen.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {templateCategories.map((category) => (
          <Card key={category.title} className={category.premium ? 'border-accent/30' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className={category.color}>{category.icon}</span>
                {category.title}
                {category.premium && (
                  <Badge variant="outline" className="ml-auto text-xs">Premium</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {category.templates.map((code) => {
                const template = getTemplate(code);
                return (
                  <Button
                    key={code}
                    variant="ghost"
                    className="w-full justify-start h-auto py-2"
                    onClick={() => handleTemplateSelect(code)}
                    disabled={category.premium}
                  >
                    <div className="text-left">
                      <p className="font-medium text-sm">{template?.title || code}</p>
                      <p className="text-xs text-muted-foreground">
                        {code === 'KUENDIGUNG' && 'Mietvertrag ordentlich kündigen'}
                        {code === 'MIETERHOEHUNG' && 'Miete anpassen mit Begründung'}
                        {code === 'DATENANFORDERUNG' && 'Unterlagen vom Mieter anfordern'}
                        {code === 'MAHNUNG_1' && 'Freundliche Zahlungserinnerung'}
                        {code === 'MAHNUNG_2' && 'Erste formelle Mahnung'}
                        {code === 'MAHNUNG_3' && 'Letzte Mahnung vor Klage'}
                      </p>
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Drafts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Send className="h-4 w-4" />
            Letzte Entwürfe
          </CardTitle>
          <CardDescription>
            Ihre zuletzt erstellten Schreiben
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Noch keine Entwürfe vorhanden
          </p>
        </CardContent>
      </Card>

      <TemplateWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        templateCode={selectedTemplate}
      />
    </div>
  );
};

export default VermietungTab;
