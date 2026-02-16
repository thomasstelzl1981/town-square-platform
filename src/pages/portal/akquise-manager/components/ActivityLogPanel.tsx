/**
 * ActivityLogPanel — Activity log with manual entry
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, Phone, Mail, MessageSquare, Eye, RefreshCw, 
  ThumbsUp, X, Euro, Loader2, Calendar 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

interface ActivityLogPanelProps {
  offerId: string;
}

interface Activity {
  id: string;
  offer_id: string;
  activity_type: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

const ACTIVITY_TYPES = [
  { value: 'call', label: 'Anruf', icon: Phone, color: 'bg-blue-100 text-blue-600' },
  { value: 'email_sent', label: 'E-Mail gesendet', icon: Mail, color: 'bg-green-100 text-green-600' },
  { value: 'note', label: 'Notiz', icon: MessageSquare, color: 'bg-yellow-100 text-yellow-600' },
  { value: 'viewing', label: 'Besichtigung', icon: Eye, color: 'bg-purple-100 text-purple-600' },
  { value: 'status_change', label: 'Status geändert', icon: RefreshCw, color: 'bg-gray-100 text-gray-600' },
  { value: 'interest', label: 'Interesse', icon: ThumbsUp, color: 'bg-green-100 text-green-600' },
  { value: 'rejection', label: 'Absage', icon: X, color: 'bg-red-100 text-red-600' },
  { value: 'price_proposal', label: 'Preisvorschlag', icon: Euro, color: 'bg-orange-100 text-orange-600' },
];

export function ActivityLogPanel({ offerId }: ActivityLogPanelProps) {
  const queryClient = useQueryClient();
  const { user, activeTenantId } = useAuth();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [activityType, setActivityType] = React.useState('note');
  const [description, setDescription] = React.useState('');

  // Fetch activities
  const { data: activities, isLoading } = useQuery({
    queryKey: ['acq-offer-activities', offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acq_offer_activities')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!offerId,
  });

  // Create activity
  const createActivity = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('acq_offer_activities')
        .insert({
          offer_id: offerId,
          activity_type: activityType,
          description,
          created_by: user?.id,
          tenant_id: activeTenantId!,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-offer-activities', offerId] });
      toast.success('Aktivität hinzugefügt');
      setDialogOpen(false);
      setDescription('');
      setActivityType('note');
    },
    onError: (err) => {
      toast.error('Fehler: ' + (err as Error).message);
    },
  });

  const getActivityConfig = (type: string) => {
    return ACTIVITY_TYPES.find((t) => t.value === type) || ACTIVITY_TYPES[2]; // Default to note
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Aktivitäten</CardTitle>
          <CardDescription>Verlauf und Notizen</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Aktivität hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aktivität hinzufügen</DialogTitle>
              <DialogDescription>
                Dokumentieren Sie einen Anruf, eine E-Mail oder eine Notiz
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Art der Aktivität</Label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">📞 Anruf</SelectItem>
                    <SelectItem value="email_sent">📧 E-Mail gesendet</SelectItem>
                    <SelectItem value="note">📝 Notiz</SelectItem>
                    <SelectItem value="viewing">👁️ Besichtigung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Textarea
                  placeholder="Was wurde besprochen oder notiert?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => createActivity.mutate()}
                disabled={!description || createActivity.isPending}
              >
                {createActivity.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Hinzufügen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => {
              const config = getActivityConfig(activity.activity_type);
              const Icon = config.icon;
              
              return (
                <div key={activity.id} className="flex gap-3">
                  <div className={`h-8 w-8 rounded-full ${config.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{config.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { locale: de, addSuffix: true })}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2" />
            <p>Noch keine Aktivitäten</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
