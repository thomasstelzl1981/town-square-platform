/**
 * ContextPanel — Right column: Active entity, sources, memory (editable), tasks, entity linker, Datenraum
 * v3: Added Armstrong Workspace Datenraum via EntityStorageTree
 */
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useArmstrongContext } from '@/hooks/useArmstrongContext';
import { useArmstrongProjects, type ArmstrongProject, type MemorySnippet, type ProjectTask } from '@/hooks/useArmstrongProjects';
import { useAuth } from '@/contexts/AuthContext';
import { EntityLinker } from '@/components/dashboard/workspace/EntityLinker';
import { EntityStorageTree } from '@/components/shared/EntityStorageTree';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  ListChecks,
  BarChart3,
  FolderOpen,
  Zap,
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
  const { activeTenantId } = useAuth();
  const { updateProject, activeProjects } = useArmstrongProjects();
  const [showDataRoom, setShowDataRoom] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<MemorySnippet['type']>('note');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const context = useMemo(() => {
    if (armstrongContext.zone === 'Z2') return armstrongContext;
    return null;
  }, [armstrongContext]);

  const memorySnippets = (activeProject?.memory_snippets || []) as MemorySnippet[];
  const taskList = (activeProject?.task_list || []) as ProjectTask[];

  const snippetIcon = (type: string) => {
    switch (type) {
      case 'decision': return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
      case 'assumption': return <AlertCircle className="h-3 w-3 text-amber-500" />;
      case 'preference': return <Lightbulb className="h-3 w-3 text-primary" />;
      default: return <FileText className="h-3 w-3 text-muted-foreground" />;
    }
  };

  // ── Memory Snippets CRUD ──
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

  // ── Task List CRUD ──
  const handleAddTask = () => {
    if (!activeProject || !newTaskTitle.trim()) return;
    const task: ProjectTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      done: false,
      created_at: new Date().toISOString(),
    };
    updateProject.mutate({
      id: activeProject.id,
      task_list: [...taskList, task],
    });
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const handleToggleTask = (taskId: string) => {
    if (!activeProject) return;
    updateProject.mutate({
      id: activeProject.id,
      task_list: taskList.map(t => t.id === taskId ? { ...t, done: !t.done } : t),
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!activeProject) return;
    updateProject.mutate({
      id: activeProject.id,
      task_list: taskList.filter(t => t.id !== taskId),
    });
  };

  // ── Entity linking ──
  const handleEntitiesChange = (entities: Record<string, string[]>) => {
    if (!activeProject) return;
    updateProject.mutate({
      id: activeProject.id,
      linked_entities: entities,
    });
  };

  // ── Dashboard stats ──
  const totalTasks = activeProjects.reduce((sum, p) => sum + ((p.task_list as ProjectTask[]) || []).length, 0);
  const openTasks = activeProjects.reduce((sum, p) => sum + ((p.task_list as ProjectTask[]) || []).filter(t => !t.done).length, 0);
  const totalMemory = activeProjects.reduce((sum, p) => sum + ((p.memory_snippets as MemorySnippet[]) || []).length, 0);

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

          {/* Entity Linker */}
          {activeProject && (
            <EntityLinker
              linkedEntities={activeProject.linked_entities || {}}
              onEntitiesChange={handleEntitiesChange}
            />
          )}

          {/* Task List */}
          {activeProject && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <ListChecks className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Aufgaben</span>
                  {taskList.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-1">
                      {taskList.filter(t => !t.done).length}/{taskList.length}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => setIsAddingTask(!isAddingTask)}
                >
                  {isAddingTask ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                </Button>
              </div>

              {isAddingTask && (
                <div className="mb-2">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(); }}
                    placeholder="Neue Aufgabe..."
                    className="h-7 text-xs"
                    autoFocus
                  />
                </div>
              )}

              {taskList.length === 0 && !isAddingTask ? (
                <p className="text-[11px] text-muted-foreground px-2">Keine Aufgaben. Nutze + zum Erstellen.</p>
              ) : (
                <div className="space-y-0.5">
                  {taskList.map(task => (
                    <div key={task.id} className="group flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/30 text-xs">
                      <Checkbox
                        checked={task.done}
                        onCheckedChange={() => handleToggleTask(task.id)}
                        className="h-3.5 w-3.5"
                      />
                      <span className={cn('flex-1 text-[11px] leading-relaxed', task.done && 'line-through text-muted-foreground')}>
                        {task.title}
                      </span>
                      <button
                        className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 text-muted-foreground hover:text-destructive transition-opacity"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

          {/* Armstrong Datenraum */}
          {activeProject && activeTenantId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <FolderOpen className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Datenraum</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => setShowDataRoom(!showDataRoom)}
                >
                  {showDataRoom ? <X className="h-3 w-3" /> : <FolderOpen className="h-3 w-3" />}
                </Button>
              </div>

              {showDataRoom ? (
                <div className="rounded-md border border-border/30 overflow-hidden" style={{ height: '300px' }}>
                  <EntityStorageTree
                    tenantId={activeTenantId}
                    entityType="armstrong_project"
                    entityId={activeProject.id}
                    moduleCode="MOD_00"
                  />
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground px-2">
                  Dateien dieses Projekts. Klicke auf den Ordner um den Datenraum zu öffnen.
                </p>
              )}
            </div>
          )}

          {/* Dashboard Fallback — when no project selected */}
          {!activeProject && !context?.entity_id && (
            <div className="space-y-4">
              {/* Quick Stats */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart3 className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Übersicht</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="px-2 py-2 rounded-md bg-muted/30 text-center">
                    <p className="text-lg font-bold text-foreground">{activeProjects.length}</p>
                    <p className="text-[9px] text-muted-foreground">Projekte</p>
                  </div>
                  <div className="px-2 py-2 rounded-md bg-muted/30 text-center">
                    <p className="text-lg font-bold text-foreground">{openTasks}</p>
                    <p className="text-[9px] text-muted-foreground">Offene Tasks</p>
                  </div>
                  <div className="px-2 py-2 rounded-md bg-muted/30 text-center">
                    <p className="text-lg font-bold text-foreground">{totalMemory}</p>
                    <p className="text-[9px] text-muted-foreground">Memory</p>
                  </div>
                  <div className="px-2 py-2 rounded-md bg-muted/30 text-center">
                    <p className="text-lg font-bold text-foreground">{totalTasks}</p>
                    <p className="text-[9px] text-muted-foreground">Gesamt-Tasks</p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Schnellzugriff</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-md bg-muted/30 cursor-default">
                    <FolderOpen className="h-3 w-3 text-muted-foreground" />
                    <span>Wähle ein Projekt links, um den Kontext zu laden</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
