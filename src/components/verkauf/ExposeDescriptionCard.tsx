/**
 * ExposeDescriptionCard - Editierbare Objektbeschreibung für Exposé
 * Speichert in properties.description mit KI-Generierung
 */
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExposeDescriptionCardProps {
  propertyId: string;
  description: string | null;
}

const ExposeDescriptionCard = ({ 
  propertyId, 
  description 
}: ExposeDescriptionCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(description || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  // Sync state when props change
  useEffect(() => {
    if (!isEditing) {
      setEditDescription(description || '');
    }
  }, [description, isEditing]);

  const updateMutation = useMutation({
    mutationFn: async (newDescription: string) => {
      const { error } = await supabase
        .from('properties')
        .update({ description: newDescription || null })
        .eq('id', propertyId);

      if (error) throw error;
      return newDescription;
    },
    onSuccess: (newDescription) => {
      setEditDescription(newDescription);
      toast.success('Objektbeschreibung gespeichert');
      setIsEditing(false);
      // Delayed invalidation
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['property'] });
        queryClient.invalidateQueries({ queryKey: ['unit-dossier'] });
      }, 500);
    },
    onError: () => {
      toast.error('Fehler beim Speichern');
    }
  });

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-expose-description', {
        body: { propertyId }
      });

      if (error) throw error;

      if (data?.description) {
        setEditDescription(data.description);
        toast.success('KI-Beschreibung generiert');
      } else {
        toast.error('Keine Beschreibung generiert');
      }
    } catch (err: any) {
      console.error('AI generation error:', err);
      toast.error('Fehler bei der KI-Generierung');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(editDescription.trim());
  };

  const handleCancel = () => {
    setEditDescription(description || '');
    setIsEditing(false);
  };

  const hasContent = !!description;
  const placeholderText = 'Klicken Sie hier, um eine Objektbeschreibung zu verfassen oder per KI generieren zu lassen.';

  if (isEditing) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Objektbeschreibung</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAI}
              disabled={isGenerating || updateMutation.isPending}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              KI-Generierung
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Beschreiben Sie die Immobilie..."
            className="min-h-[200px] resize-none"
            maxLength={2000}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {editDescription.length}/2000 Zeichen
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Abbrechen
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                Speichern
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="group cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all h-full"
      onClick={() => setIsEditing(true)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Objektbeschreibung</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {hasContent ? (
          <p className="text-sm whitespace-pre-wrap line-clamp-[12]">{description}</p>
        ) : (
          <p className="text-sm text-muted-foreground/70 italic">
            {placeholderText}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ExposeDescriptionCard;
