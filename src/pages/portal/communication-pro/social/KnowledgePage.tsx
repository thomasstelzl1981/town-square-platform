/**
 * Social Knowledge Base — Editorial Focus Topics
 * Phase 4: Topic chips (max 10), priority drag/drop, AI briefing generation
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Sparkles, Trash2, GripVertical, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Helper to get user id (dev mode fallback)
function useUserId() {
  const { user } = useAuth();
  return user?.id || 'dev-user';
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Topic {
  id: string;
  topic_label: string;
  priority: number;
  topic_briefing: Record<string, unknown> | null;
}

function SortableTopicItem({
  topic,
  onDelete,
  onGenerateBriefing,
  isGenerating,
}: {
  topic: Topic;
  onDelete: (id: string) => void;
  onGenerateBriefing: (id: string) => void;
  isGenerating: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card border rounded-lg group">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      <Badge variant="outline" className="shrink-0 text-xs">{topic.priority}</Badge>
      <span className="flex-1 font-medium text-sm">{topic.topic_label}</span>
      {topic.topic_briefing ? (
        <Badge variant="secondary" className="text-xs">Briefing ✓</Badge>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1 opacity-0 group-hover:opacity-100"
          onClick={() => onGenerateBriefing(topic.id)}
          disabled={isGenerating}
        >
          {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Briefing
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100"
        onClick={() => onDelete(topic.id)}
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
}

export function KnowledgePage() {
  const { activeOrganization } = useAuth();
  const queryClient = useQueryClient();
  const [newTopic, setNewTopic] = useState('');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const userId = useUserId();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['social-topics', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      const { data } = await supabase
        .from('social_topics')
        .select('*')
        .eq('tenant_id', activeOrganization.id)
        .order('priority', { ascending: true });
      return (data || []) as Topic[];
    },
    enabled: !!activeOrganization?.id,
  });

  const addTopicMutation = useMutation({
    mutationFn: async (label: string) => {
      if (!activeOrganization?.id) throw new Error('No org');
      const nextPriority = topics.length + 1;
      const { error } = await supabase.from('social_topics').insert({
        tenant_id: activeOrganization.id,
        owner_user_id: userId,
        topic_label: label,
        priority: nextPriority,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-topics'] });
      setNewTopic('');
    },
    onError: () => toast({ title: 'Fehler', description: 'Thema konnte nicht hinzugefügt werden.', variant: 'destructive' }),
  });

  const deleteTopicMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_topics').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-topics'] }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (reordered: Topic[]) => {
      const updates = reordered.map((t, i) =>
        supabase.from('social_topics').update({ priority: i + 1 }).eq('id', t.id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-topics'] }),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = topics.findIndex((t) => t.id === active.id);
    const newIndex = topics.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(topics, oldIndex, newIndex);
    queryClient.setQueryData(['social-topics', activeOrganization?.id], reordered);
    reorderMutation.mutate(reordered);
  };

  const handleAddTopic = () => {
    const label = newTopic.trim();
    if (!label) return;
    if (topics.length >= 10) {
      toast({ title: 'Maximum erreicht', description: 'Maximal 10 Themen erlaubt.', variant: 'destructive' });
      return;
    }
    addTopicMutation.mutate(label);
  };

  const handleGenerateBriefing = async (topicId: string) => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic || !activeOrganization?.id) return;

    setGeneratingId(topicId);
    try {
      const { data, error } = await supabase.functions.invoke('sot-social-generate-briefing', {
        body: { topic_id: topicId, topic_label: topic.topic_label, tenant_id: activeOrganization.id },
      });
      if (error) throw error;
      toast({ title: 'Briefing generiert', description: `Briefing für "${topic.topic_label}" erstellt.` });
      queryClient.invalidateQueries({ queryKey: ['social-topics'] });
    } catch {
      toast({ title: 'Fehler', description: 'Briefing konnte nicht generiert werden.', variant: 'destructive' });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleGenerateAll = async () => {
    const missing = topics.filter((t) => !t.topic_briefing);
    if (missing.length === 0) {
      toast({ title: 'Fertig', description: 'Alle Themen haben bereits Briefings.' });
      return;
    }
    for (const t of missing) {
      await handleGenerateBriefing(t.id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Laden…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">
            Definiere bis zu 10 Themen. Die KI erstellt Briefings mit Hook-Mustern, Argumentationslinien und CTAs.
          </p>
        </div>
        {topics.length > 0 && (
          <Badge variant="outline">{topics.length}/10</Badge>
        )}
      </div>

      {/* Add topic */}
      {topics.length < 10 && (
        <div className="flex gap-2">
          <Input
            placeholder="Neues Thema, z.B. 'Kapitalanlage Basics'"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
            className="flex-1"
          />
          <Button onClick={handleAddTopic} disabled={!newTopic.trim() || addTopicMutation.isPending} className="gap-1">
            <Plus className="h-4 w-4" />
            Hinzufügen
          </Button>
        </div>
      )}

      {/* Topic list */}
      {topics.length > 0 ? (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={topics.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {topics.map((topic) => (
                  <SortableTopicItem
                    key={topic.id}
                    topic={topic}
                    onDelete={(id) => deleteTopicMutation.mutate(id)}
                    onGenerateBriefing={handleGenerateBriefing}
                    isGenerating={generatingId === topic.id}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button variant="outline" className="gap-2" onClick={handleGenerateAll} disabled={!!generatingId}>
            <Sparkles className="h-4 w-4" />
            Alle Briefings generieren
          </Button>
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Keine Themen definiert</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Füge oben dein erstes Thema hinzu — z.B. "Immobilien als Kapitalanlage".
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
