/**
 * ContextPanel — Right column: Active entity, sources, memory (editable), recent actions
 * Phase 3: Memory snippets are now add/edit/delete capable
 */
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useArmstrongContext } from '@/hooks/useArmstrongContext';
import { useArmstrongProjects, type ArmstrongProject, type MemorySnippet } from '@/hooks/useArmstrongProjects';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Users,
  FileText,
  Brain,
  Activity,
  ExternalLink,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

interface ContextPanelProps {
  activeProject: ArmstrongProject | null;
}

const SNIPPET_TYPE_LABELS: Record<string, string> = {
  decision: 'Entscheidung',
  assumption: 'Annahme',
  preference: 'Präferenz',
  note: 'Notiz',
};

export function ContextPanel({ activeProject }: ContextPanelProps) {
  const armstrongContext = useArmstrongContext();
  const { updateProject } = useArmstrongProjects();
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<MemorySnippet['type']>('note');

  const context = useMemo(() => {
    if (armstrongContext.zone === 'Z2') return armstrongContext;
    return null;
  }, [armstrongContext]);

  const linkedEntities = activeProject?.linked_entities || {};
  const memorySnippets = (activeProject?.memory_snippets || []) as MemorySnippet[];
  const hasLinkedEntities = Object.values(linkedEntities).some(arr => Array.isArray(arr) && arr.length > 0);

  const snippetIcon = (type: string) => {
    switch (type) {
      case 'decision': return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
      case 'assumption': return <AlertCircle className="h-3 w-3 text-amber-500" />;
      case 'preference': return <Lightbulb className="h-3 w-3 text-primary" />;
      default: return <FileText className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const handleAddSnippet = () => {
    if (!activeProject || !newContent.trim()) return;
    const snippet: MemorySnippet = {
      id: crypto.randomUUID(),
      type: newType,
      content: newContent.trim(),
      created_at: new Date().toISOString(),
    };
    updateProject.mutate({
      id: activeProject.id,
      memory_snippets: [...memorySnippets, snippet],
    });
    setNewContent('');
    setIsAdding(false);
  };

  const handleDeleteSnippet = (snippetId: string) => {
    if (!activeProject) return;
    updateProject.mutate({
      id: activeProject.id,
      memory_snippets: memorySnippets.filter(s => s.id !== snippetId),
    });
  };

  return (
    <div className="flex flex-col h-full border-l border-border/30 bg-muted/10">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border/20">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kontext</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Active Context */}
          {context && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Aktiver Kontext</span>
              </div>
              <div className="space-y-1">
                {context.current_module && (
                  <div className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-md bg-muted/30">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {context.current_module}
                    </Badge>
                    <span className="text-muted-foreground truncate">{context.current_area || ''}</span>
                  </div>
                )}
                {context.entity_type && context.entity_id && (
                  <div className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-md bg-primary/5 border border-primary/10">
                    <Building2 className="h-3 w-3 text-primary shrink-0" />
                    <span className="truncate">{context.entity_type}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 ml-auto" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Project Info */}
          {activeProject && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Projekt</span>
              </div>
              <div className="px-2 py-2 rounded-md bg-muted/30 space-y-1">
                <p className="text-xs font-medium">{activeProject.title}</p>
                {activeProject.goal && (
                  <p className="text-[11px] text-muted-foreground">{activeProject.goal}</p>
                )}
                <Badge variant="outline" className="text-[10px] mt-1">
                  {activeProject.status === 'active' ? 'Aktiv' : activeProject.status === 'completed' ? 'Abgeschlossen' : 'Archiviert'}
                </Badge>
              </div>
            </div>
          )}

          {/* Linked Entities */}
          {hasLinkedEntities && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Building2 className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Verknüpfte Objekte</span>
              </div>
              <div className="space-y-1">
                {Object.entries(linkedEntities).map(([type, ids]) => {
                  if (!Array.isArray(ids) || ids.length === 0) return null;
                  return (
                    <div key={type} className="px-2 py-1.5 rounded-md bg-muted/30 text-xs flex items-center gap-2">
                      {type === 'properties' ? <Building2 className="h-3 w-3" /> :
                       type === 'contacts' ? <Users className="h-3 w-3" /> :
                       <FileText className="h-3 w-3" />}
                      <span className="capitalize">{type}</span>
                      <Badge variant="secondary" className="text-[10px] ml-auto">{ids.length}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Memory Snippets (editable) */}
          {activeProject && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Brain className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Memory</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => setIsAdding(!isAdding)}
                >
                  {isAdding ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                </Button>
              </div>

              {/* Add snippet form */}
              {isAdding && (
                <div className="mb-2 p-2 rounded-md bg-primary/5 border border-primary/10 space-y-1.5">
                  <Select value={newType} onValueChange={(v) => setNewType(v as MemorySnippet['type'])}>
                    <SelectTrigger className="h-6 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SNIPPET_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSnippet(); }}
                    placeholder="Inhalt..."
                    className="h-7 text-xs"
                    autoFocus
                  />
                  <Button size="sm" className="h-6 text-[10px] w-full" onClick={handleAddSnippet} disabled={!newContent.trim()}>
                    Hinzufügen
                  </Button>
                </div>
              )}

              {memorySnippets.length === 0 && !isAdding ? (
                <p className="text-[11px] text-muted-foreground px-2">Keine Einträge. Nutze + um Entscheidungen oder Notizen zu speichern.</p>
              ) : (
                <div className="space-y-1">
                  {memorySnippets.map(snippet => (
                    <div key={snippet.id} className="group px-2 py-1.5 rounded-md bg-muted/30 text-xs flex items-start gap-2">
                      {snippetIcon(snippet.type)}
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] leading-relaxed">{snippet.content}</span>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {SNIPPET_TYPE_LABELS[snippet.type] || snippet.type}
                        </p>
                      </div>
                      <button
                        className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 text-muted-foreground hover:text-destructive transition-opacity"
                        onClick={() => handleDeleteSnippet(snippet.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!activeProject && !context?.entity_id && (
            <div className="text-center py-8">
              <Brain className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Kontext wird automatisch erkannt oder durch Projektwahl aktiviert.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
