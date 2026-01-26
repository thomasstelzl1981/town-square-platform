import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, SkipForward, FileText, Building, User } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface InboundItem {
  id: string;
  source: string;
  status: string;
  file_name: string | null;
  file_path: string | null;
  sender_info: Record<string, unknown>;
  created_at: string;
  notes: string | null;
}

export function SortierenTab() {
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Fetch pending items
  const { data: pendingItems = [], isLoading } = useQuery({
    queryKey: ['inbound-items-pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbound_items')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1);
      
      if (error) throw error;
      return data as InboundItem[];
    },
  });

  // Fetch properties for assignment
  const { data: properties = [] } = useQuery({
    queryKey: ['properties-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, public_id, address, city')
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch contacts for assignment
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  // Process item mutation
  const processMutation = useMutation({
    mutationFn: async ({ itemId, action }: { itemId: string; action: 'accept' | 'reject' | 'skip' }) => {
      const updates: Record<string, unknown> = {
        status: action === 'accept' ? 'processed' : action === 'reject' ? 'rejected' : 'skipped',
        processed_at: new Date().toISOString(),
        notes: notes || null,
      };

      if (action === 'accept') {
        if (selectedProperty) updates.assigned_property_id = selectedProperty;
        if (selectedContact) updates.assigned_contact_id = selectedContact;
      }

      const { error } = await supabase
        .from('inbound_items')
        .update(updates)
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['inbound-items-pending'] });
      queryClient.invalidateQueries({ queryKey: ['inbound-items'] });
      toast.success(
        action === 'accept' ? 'Dokument zugeordnet' :
        action === 'reject' ? 'Dokument abgelehnt' : 'Übersprungen'
      );
      // Reset form
      setSelectedProperty('');
      setSelectedContact('');
      setNotes('');
    },
    onError: () => {
      toast.error('Aktion fehlgeschlagen');
    },
  });

  const currentItem = pendingItems[0];

  if (isLoading) {
    return <div className="flex items-center justify-center p-12">Laden...</div>;
  }

  if (!currentItem) {
    return (
      <EmptyState
        icon={Check}
        title="Alles sortiert!"
        description="Es gibt keine ausstehenden Dokumente zum Sortieren"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Document Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {currentItem.file_name || 'Unbenanntes Dokument'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center mb-4">
            <FileText className="h-16 w-16 text-muted-foreground" />
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quelle:</span>
              <span className="capitalize">{currentItem.source}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Eingegangen:</span>
              <span>{formatDistanceToNow(new Date(currentItem.created_at), { addSuffix: true, locale: de })}</span>
            </div>
            {currentItem.sender_info && Object.keys(currentItem.sender_info).length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Absender:</span>
                <span>{JSON.stringify(currentItem.sender_info)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right: Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Zuordnung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Property Assignment */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Immobilie zuordnen
            </label>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger>
                <SelectValue placeholder="Immobilie auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {properties.map((prop) => (
                  <SelectItem key={prop.id} value={prop.id}>
                    {prop.address}, {prop.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact Assignment */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Kontakt zuordnen
            </label>
            <Select value={selectedContact} onValueChange={setSelectedContact}>
              <SelectTrigger>
                <SelectValue placeholder="Kontakt auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notizen</label>
            <Textarea 
              placeholder="Optionale Notizen..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => processMutation.mutate({ itemId: currentItem.id, action: 'reject' })}
              disabled={processMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Ablehnen
            </Button>
            <Button
              variant="outline"
              onClick={() => processMutation.mutate({ itemId: currentItem.id, action: 'skip' })}
              disabled={processMutation.isPending}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button
              className="flex-1"
              onClick={() => processMutation.mutate({ itemId: currentItem.id, action: 'accept' })}
              disabled={processMutation.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              Zuordnen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
