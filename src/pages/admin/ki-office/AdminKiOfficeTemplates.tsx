/**
 * AdminKiOfficeTemplates — Email Template Management
 * Create, edit, and manage reusable email templates
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminTemplates } from '@/hooks/useAdminSequences';
import { toast } from 'sonner';
import {
  Plus,
  FileText,
  Pencil,
  Trash2,
  Copy,
  Eye,
  Code,
  Loader2,
  Variable,
  Mail
} from 'lucide-react';

const CATEGORIES = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'sales', label: 'Sales' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'partner', label: 'Partner' },
  { value: 'eigentuemer', label: 'Eigentümer' },
];

const VARIABLES = [
  { name: 'VORNAME', description: 'Vorname des Kontakts' },
  { name: 'NACHNAME', description: 'Nachname des Kontakts' },
  { name: 'FIRMA', description: 'Firmenname' },
  { name: 'EMAIL', description: 'E-Mail-Adresse' },
  { name: 'KATEGORIE', description: 'Kontakt-Kategorie' },
  { name: 'STADT', description: 'Stadt/Ort' },
];

interface TemplateForm {
  id?: string;
  name: string;
  subject: string;
  body_text: string;
  body_html: string;
  category: string;
  is_active: boolean;
}

const emptyForm: TemplateForm = {
  name: '',
  subject: '',
  body_text: '',
  body_html: '',
  category: '',
  is_active: true,
};

export default function AdminKiOfficeTemplates() {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useAdminTemplates();
  
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [previewMode, setPreviewMode] = useState<'text' | 'html'>('text');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleEdit = (template: any) => {
    setForm({
      id: template.id,
      name: template.name,
      subject: template.subject,
      body_text: template.body_text || '',
      body_html: template.body_html || '',
      category: template.category || '',
      is_active: template.is_active ?? true,
    });
    setEditOpen(true);
  };

  const handleCreate = () => {
    setForm(emptyForm);
    setEditOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.subject.trim()) {
      toast.error('Name und Betreff sind erforderlich');
      return;
    }

    const data = {
      name: form.name,
      subject: form.subject,
      body_text: form.body_text || null,
      body_html: form.body_html || null,
      category: form.category || null,
      is_active: form.is_active,
    };

    if (form.id) {
      updateTemplate.mutate({ id: form.id, ...data }, {
        onSuccess: () => {
          toast.success('Template aktualisiert');
          setEditOpen(false);
        },
        onError: (error) => toast.error('Fehler: ' + error.message),
      });
    } else {
      createTemplate.mutate(data, {
        onSuccess: () => {
          toast.success('Template erstellt');
          setEditOpen(false);
        },
        onError: (error) => toast.error('Fehler: ' + error.message),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Template wirklich löschen?')) {
      deleteTemplate.mutate(id, {
        onSuccess: () => toast.success('Template gelöscht'),
      });
    }
  };

  const handleClone = (template: any) => {
    setForm({
      name: `${template.name} (Kopie)`,
      subject: template.subject,
      body_text: template.body_text || '',
      body_html: template.body_html || '',
      category: template.category || '',
      is_active: true,
    });
    setEditOpen(true);
  };

  const insertVariable = (variable: string) => {
    const tag = `{{${variable}}}`;
    setForm({
      ...form,
      body_text: form.body_text + tag,
    });
  };

  // Preview with sample data
  const getPreview = (text: string) => {
    return text
      .replace(/\{\{VORNAME\}\}/g, 'Max')
      .replace(/\{\{NACHNAME\}\}/g, 'Mustermann')
      .replace(/\{\{FIRMA\}\}/g, 'Musterfirma GmbH')
      .replace(/\{\{EMAIL\}\}/g, 'max@musterfirma.de')
      .replace(/\{\{KATEGORIE\}\}/g, 'Partner')
      .replace(/\{\{STADT\}\}/g, 'Hamburg');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">E-Mail-Templates</h1>
          <p className="text-muted-foreground">
            Wiederverwendbare E-Mail-Vorlagen erstellen und verwalten
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Template
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Keine Templates</h3>
            <p className="text-muted-foreground mb-4">
              Erstellen Sie Ihr erstes E-Mail-Template.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Erstes Template erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all ${
                selectedTemplate === template.id ? 'ring-2 ring-primary' : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedTemplate(
                selectedTemplate === template.id ? null : template.id
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{template.name}</CardTitle>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {template.subject}
                    </p>
                  </div>
                  {!template.is_active && (
                    <Badge variant="secondary" className="ml-2">Inaktiv</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {template.category && (
                    <Badge variant="outline">
                      {CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                    </Badge>
                  )}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(template);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClone(template);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(template.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {form.id ? 'Template bearbeiten' : 'Neues Template'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-2 gap-6 h-full">
              {/* Editor */}
              <div className="space-y-4 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="z.B. Partner Willkommen"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kategorie</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm({ ...form, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Betreff *</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="E-Mail-Betreffzeile..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Inhalt (Text)</Label>
                    <div className="flex gap-1">
                      {VARIABLES.slice(0, 4).map((v) => (
                        <Button
                          key={v.name}
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={() => insertVariable(v.name)}
                        >
                          {`{{${v.name}}}`}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    value={form.body_text}
                    onChange={(e) => setForm({ ...form, body_text: e.target.value })}
                    placeholder="E-Mail-Inhalt..."
                    rows={10}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                    />
                    <Label>Template aktiv</Label>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="border rounded-lg overflow-hidden flex flex-col bg-muted/30">
                <div className="p-3 border-b bg-background flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Vorschau
                  </span>
                  <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'text' | 'html')}>
                    <TabsList className="h-7">
                      <TabsTrigger value="text" className="text-xs h-6">Text</TabsTrigger>
                      <TabsTrigger value="html" className="text-xs h-6">HTML</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Betreff:</span>
                      <p className="font-medium">{getPreview(form.subject) || '(Kein Betreff)'}</p>
                    </div>
                    <div className="border-t pt-3">
                      {previewMode === 'text' ? (
                        <pre className="text-sm whitespace-pre-wrap font-sans">
                          {getPreview(form.body_text) || '(Kein Inhalt)'}
                        </pre>
                      ) : (
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ 
                            __html: getPreview(form.body_html || form.body_text.replace(/\n/g, '<br>')) 
                          }}
                        />
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createTemplate.isPending || updateTemplate.isPending}
            >
              {(createTemplate.isPending || updateTemplate.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
