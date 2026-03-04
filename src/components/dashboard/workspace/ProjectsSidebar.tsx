/**
 * ProjectsSidebar — Left column: Projects & Threads list
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useArmstrongProjects, type ArmstrongProject } from '@/hooks/useArmstrongProjects';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FolderOpen,
  Plus,
  MessageSquare,
  Search,
  Archive,
  CheckCircle2,
  MoreHorizontal,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectsSidebarProps {
  activeProjectId: string | null;
  onSelectProject: (project: ArmstrongProject | null) => void;
  onNewChat: () => void;
}

export function ProjectsSidebar({ activeProjectId, onSelectProject, onNewChat }: ProjectsSidebarProps) {
  const { activeProjects, projects, createProject, updateProject, deleteProject } = useArmstrongProjects();
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const filteredProjects = search
    ? projects.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    : activeProjects;

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createProject.mutate({ title: newTitle.trim() });
    setNewTitle('');
    setIsCreating(false);
  };

  const statusIcon = (status: string) => {
    if (status === 'archived') return <Archive className="h-3 w-3 text-muted-foreground" />;
    if (status === 'completed') return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    return <FolderOpen className="h-3 w-3 text-primary/70" />;
  };

  return (
    <div className="flex flex-col h-full border-r border-border/30 bg-muted/10">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workspace</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onNewChat} title="Neuer Chat">
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsCreating(true)} title="Neues Projekt">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="h-7 text-xs pl-7 bg-muted/30 border-border/20"
          />
        </div>
      </div>

      {/* New project inline form */}
      {isCreating && (
        <div className="px-3 py-2 border-b border-border/20 bg-primary/5">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setIsCreating(false);
            }}
            placeholder="Projektname..."
            className="h-7 text-xs mb-1.5"
            autoFocus
          />
          <div className="flex gap-1">
            <Button size="sm" className="h-6 text-[10px] flex-1" onClick={handleCreate} disabled={!newTitle.trim()}>
              Erstellen
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsCreating(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Project list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {/* Ad-hoc chat button */}
          <button
            className={cn(
              'w-full text-left px-2.5 py-2 rounded-lg transition-colors text-xs flex items-center gap-2 group',
              !activeProjectId ? 'bg-primary/10 text-primary' : 'hover:bg-muted/40'
            )}
            onClick={() => onSelectProject(null)}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate font-medium">Freier Chat</span>
          </button>

          {/* Projects */}
          {filteredProjects.length > 0 && (
            <>
              <div className="px-2.5 pt-3 pb-1">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Projekte</span>
              </div>
              {filteredProjects.map(project => (
                <div
                  key={project.id}
                  className={cn(
                    'w-full text-left px-2.5 py-2 rounded-lg transition-colors text-xs flex items-center gap-2 group cursor-pointer',
                    activeProjectId === project.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/40'
                  )}
                  onClick={() => onSelectProject(project)}
                >
                  {statusIcon(project.status)}
                  <span className="truncate flex-1">{project.title}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded hover:bg-muted/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        onClick={() => updateProject.mutate({ id: project.id, status: 'archived' })}
                        className="text-xs"
                      >
                        <Archive className="h-3 w-3 mr-2" /> Archivieren
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateProject.mutate({ id: project.id, status: 'completed' })}
                        className="text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-2" /> Abschließen
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteProject.mutate(project.id)}
                        className="text-xs text-destructive"
                      >
                        <X className="h-3 w-3 mr-2" /> Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </>
          )}

          {filteredProjects.length === 0 && search && (
            <p className="text-[11px] text-muted-foreground text-center py-4">Keine Treffer</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
