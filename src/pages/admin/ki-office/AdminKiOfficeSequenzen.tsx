/**
 * AdminKiOfficeSequenzen — Sequence Builder for Drip Campaigns
 * Create and manage automated email sequences
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAdminSequences, useAdminTemplates, useAdminEnrollments } from '@/hooks/useAdminSequences';
import { toast } from 'sonner';
import {
  Plus,
  Play,
  Pause,
  Trash2,
  ArrowRight,
  Clock,
  Mail,
  Users,
  Settings,
  Loader2,
  ChevronDown,
  ChevronUp,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const TRIGGER_TYPES = [
  { value: 'manual', label: 'Manuell', desc: 'Kontakte manuell einschreiben' },
  { value: 'contact_created', label: 'Neuer Kontakt', desc: 'Automatisch bei Kontakt-Erstellung' },
  { value: 'tag_added', label: 'Tag hinzugefügt', desc: 'Automatisch wenn Tag gesetzt wird' },
];

const CATEGORIES = ['Partner', 'Makler', 'Eigentümer', 'Bank', 'Handwerker', 'Mieter', 'Sonstige'];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Entwurf', className: 'bg-gray-100 text-gray-800' },
  active: { label: 'Aktiv', className: 'bg-green-100 text-green-800' },
  paused: { label: 'Pausiert', className: 'bg-amber-100 text-amber-800' },
  completed: { label: 'Abgeschlossen', className: 'bg-blue-100 text-blue-800' },
};

interface CreateSequenceForm {
  name: string;
  description: string;
  trigger_type: string;
  target_categories: string[];
}

const emptyForm: CreateSequenceForm = {
  name: '',
  description: '',
  trigger_type: 'manual',
  target_categories: [],
};

export default function AdminKiOfficeSequenzen() {
  const { sequences, isLoading, createSequence, updateSequence, deleteSequence, addStep, deleteStep } = useAdminSequences();
  const { templates } = useAdminTemplates();
  const { enrollments } = useAdminEnrollments();
  
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateSequenceForm>(emptyForm);
  const [expandedSequence, setExpandedSequence] = useState<string | null>(null);

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast.error('Name ist erforderlich');
      return;
    }

    createSequence.mutate(form, {
      onSuccess: () => {
        toast.success('Sequenz erstellt');
        setCreateOpen(false);
        setForm(emptyForm);
      },
      onError: (error) => {
        toast.error('Fehler: ' + error.message);
      },
    });
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    updateSequence.mutate({ id, status: newStatus }, {
      onSuccess: () => {
        toast.success(`Sequenz ${newStatus === 'active' ? 'aktiviert' : 'pausiert'}`);
      },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Sequenz wirklich löschen? Alle Einschreibungen werden ebenfalls gelöscht.')) {
      deleteSequence.mutate(id, {
        onSuccess: () => toast.success('Sequenz gelöscht'),
      });
    }
  };

  const handleAddStep = (sequenceId: string, stepOrder: number) => {
    addStep.mutate({
      sequence_id: sequenceId,
      step_order: stepOrder,
      delay_days: stepOrder === 0 ? 0 : 3,
      send_condition: 'always',
    }, {
      onSuccess: () => toast.success('Schritt hinzugefügt'),
    });
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
          <h1 className="text-2xl font-bold tracking-tight">E-Mail-Sequenzen</h1>
          <p className="text-muted-foreground">
            Automatisierte Drip-Kampagnen erstellen und verwalten
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neue Sequenz
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Sequenz erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="z.B. Partner Onboarding"
                />
              </div>
              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optionale Beschreibung..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select
                  value={form.trigger_type}
                  onValueChange={(v) => setForm({ ...form, trigger_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div>
                          <div>{t.label}</div>
                          <div className="text-xs text-muted-foreground">{t.desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zielgruppen</Label>
                <div className="flex flex-wrap gap-1">
                  {CATEGORIES.map((cat) => (
                    <Badge
                      key={cat}
                      variant={form.target_categories.includes(cat) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const cats = form.target_categories.includes(cat)
                          ? form.target_categories.filter(c => c !== cat)
                          : [...form.target_categories, cat];
                        setForm({ ...form, target_categories: cats });
                      }}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreate} disabled={createSequence.isPending}>
                {createSequence.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sequences List */}
      {sequences.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Keine Sequenzen</h3>
            <p className="text-muted-foreground mb-4">
              Erstellen Sie Ihre erste E-Mail-Sequenz für automatisierte Kampagnen.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Erste Sequenz erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sequences.map((seq) => {
            const isExpanded = expandedSequence === seq.id;
            const seqEnrollments = enrollments.filter(e => e.sequence_id === seq.id);
            const activeEnrollments = seqEnrollments.filter(e => e.status === 'active').length;
            const statusConfig = STATUS_CONFIG[seq.status || 'draft'] || STATUS_CONFIG.draft;
            const steps = (seq as any).steps || [];

            return (
              <Card key={seq.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedSequence(isExpanded ? null : seq.id)}
                        className="p-1 hover:bg-muted rounded"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                      <div>
                        <CardTitle className="text-lg">{seq.name}</CardTitle>
                        {seq.description && (
                          <p className="text-sm text-muted-foreground">{seq.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusConfig.className}>
                        {statusConfig.label}
                      </Badge>
                      {seq.status === 'draft' || seq.status === 'paused' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(seq.id, 'active')}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Aktivieren
                        </Button>
                      ) : seq.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(seq.id, 'paused')}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pausieren
                        </Button>
                      ) : null}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDelete(seq.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {activeEnrollments} aktiv
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {steps.length} Schritte
                    </span>
                    <span>
                      Trigger: {TRIGGER_TYPES.find(t => t.value === seq.trigger_type)?.label || seq.trigger_type}
                    </span>
                  </div>
                </CardHeader>

                {/* Expanded: Steps */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Sequenz-Schritte</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddStep(seq.id, steps.length)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Schritt hinzufügen
                        </Button>
                      </div>

                      {steps.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          Keine Schritte definiert. Fügen Sie den ersten Schritt hinzu.
                        </p>
                      ) : (
                        <div className="flex items-start gap-2 overflow-x-auto pb-2">
                          {steps.map((step: any, index: number) => (
                            <div key={step.id} className="flex items-center gap-2">
                              <Card className="min-w-[200px] p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline">Schritt {index + 1}</Badge>
                                  <button
                                    onClick={() => deleteStep.mutate(step.id)}
                                    className="p-1 hover:bg-destructive/10 rounded text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                <div className="text-sm space-y-1">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {index === 0 ? 'Sofort' : `+${step.delay_days || 0} Tage`}
                                  </div>
                                  <div className="truncate">
                                    {step.template?.name || 'Kein Template'}
                                  </div>
                                  <Select
                                    value={step.template_id || ''}
                                    onValueChange={(v) => {
                                      // Would need updateStep mutation
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue placeholder="Template wählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {templates.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                          {t.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </Card>
                              {index < steps.length - 1 && (
                                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
