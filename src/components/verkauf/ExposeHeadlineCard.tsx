/**
 * ExposeHeadlineCard - Editierbare Überschriften für Verkaufs-/Vermietungsexposé
 * Speichert in units.expose_headline und units.expose_subline
 */
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface ExposeHeadlineCardProps {
  unitId: string;
  headline: string | null;
  subline: string | null;
  propertyAddress?: string;
  propertyCity?: string;
}

const ExposeHeadlineCard = ({ 
  unitId, 
  headline, 
  subline,
  propertyAddress,
  propertyCity 
}: ExposeHeadlineCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editHeadline, setEditHeadline] = useState(headline || '');
  const [editSubline, setEditSubline] = useState(subline || '');
  const queryClient = useQueryClient();

  // Sync state when props change
  useEffect(() => {
    setEditHeadline(headline || '');
    setEditSubline(subline || '');
  }, [headline, subline]);

  const updateMutation = useMutation({
    mutationFn: async ({ newHeadline, newSubline }: { newHeadline: string; newSubline: string }) => {
      const { error } = await supabase
        .from('units')
        .update({ 
          expose_headline: newHeadline || null,
          expose_subline: newSubline || null
        })
        .eq('id', unitId);

      if (error) throw error;
      return { newHeadline, newSubline };
    },
    onSuccess: (data) => {
      // Optimistisches Update - kein vollständiger Reload
      setEditHeadline(data.newHeadline);
      setEditSubline(data.newSubline);
      toast.success('Exposé-Überschrift gespeichert');
      setIsEditing(false);
      // Delayed invalidation to sync with server
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['property'] });
        queryClient.invalidateQueries({ queryKey: ['unit'] });
      }, 500);
    },
    onError: () => {
      toast.error('Fehler beim Speichern');
    }
  });

  const handleSave = () => {
    updateMutation.mutate({ 
      newHeadline: editHeadline.trim(), 
      newSubline: editSubline.trim() 
    });
  };

  const handleCancel = () => {
    setEditHeadline(headline || '');
    setEditSubline(subline || '');
    setIsEditing(false);
  };

  // Generate placeholder from property data
  const placeholderHeadline = propertyAddress && propertyCity 
    ? `Immobilie in ${propertyCity}` 
    : 'Überschrift für Ihr Exposé';
  const placeholderSubline = 'Kurze Beschreibung oder Slogan';

  // Display values (use actual or placeholder)
  const displayHeadline = headline || placeholderHeadline;
  const displaySubline = subline || placeholderSubline;
  const hasContent = headline || subline;

  if (isEditing) {
    return (
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Input
            value={editHeadline}
            onChange={(e) => setEditHeadline(e.target.value)}
            placeholder={placeholderHeadline}
            className="text-xl font-semibold h-12"
            maxLength={150}
          />
          <Input
            value={editSubline}
            onChange={(e) => setEditSubline(e.target.value)}
            placeholder={placeholderSubline}
            className="text-sm text-muted-foreground"
            maxLength={200}
          />
          <div className="flex gap-2 justify-end">
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="group cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
      onClick={() => setIsEditing(true)}
    >
      <CardContent className="pt-4 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        
        <h1 className={`text-2xl font-bold ${!hasContent ? 'text-muted-foreground' : ''}`}>
          {displayHeadline}
        </h1>
        <p className={`text-sm mt-2 ${!hasContent ? 'text-muted-foreground/70 italic' : 'text-muted-foreground'}`}>
          {displaySubline}
        </p>
        
        {!hasContent && (
          <p className="text-xs text-muted-foreground/50 mt-2">
            Klicken zum Bearbeiten
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ExposeHeadlineCard;
