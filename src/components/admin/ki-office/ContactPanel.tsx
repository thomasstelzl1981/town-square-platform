/**
 * ContactPanel — Contact Details & Quick Actions
 * Right panel in the 3-column email layout
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Tag, 
  Plus, 
  X,
  Send,
  Sparkles,
  ListPlus,
  ExternalLink,
  User
} from 'lucide-react';
import { useAdminContactTags } from '@/hooks/useAdminEmailThreads';
import { useAdminSequences, useAdminEnrollments } from '@/hooks/useAdminSequences';
import type { EmailThread } from '@/hooks/useAdminEmailThreads';
import { toast } from 'sonner';

interface ContactPanelProps {
  thread: EmailThread | null;
  onComposeEmail?: () => void;
  onGenerateAIReply?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Partner': 'bg-indigo-100 text-indigo-800',
  'Makler': 'bg-orange-100 text-orange-800',
  'Eigentümer': 'bg-green-100 text-green-800',
  'Bank': 'bg-gray-100 text-gray-800',
  'Handwerker': 'bg-yellow-100 text-yellow-800',
  'Mieter': 'bg-blue-100 text-blue-800',
};

export function ContactPanel({ thread, onComposeEmail, onGenerateAIReply }: ContactPanelProps) {
  const [newTag, setNewTag] = useState('');
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);

  const { tags, addTag, removeTag } = useAdminContactTags(thread?.contact?.id || null);
  const { sequences } = useAdminSequences();
  const { enrollContact, enrollments } = useAdminEnrollments();

  // Check if contact is already enrolled in any sequence
  const activeEnrollments = enrollments.filter(
    e => e.contact_id === thread?.contact?.id && e.status === 'active'
  );

  const handleAddTag = () => {
    if (!newTag.trim() || !thread?.contact?.id) return;
    addTag.mutate(
      { contactId: thread.contact.id, tag: newTag.trim() },
      {
        onSuccess: () => {
          setNewTag('');
          toast.success('Tag hinzugefügt');
        },
      }
    );
  };

  const handleEnroll = (sequenceId: string) => {
    if (!thread?.contact?.id) return;
    enrollContact.mutate(
      { sequenceId, contactId: thread.contact.id },
      {
        onSuccess: () => {
          toast.success('Kontakt in Sequenz eingeschrieben');
          setShowEnrollDialog(false);
        },
        onError: (error) => {
          toast.error('Fehler: ' + error.message);
        },
      }
    );
  };

  if (!thread) {
    return (
      <div className="w-80 border-l bg-muted/30 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Kein Kontakt ausgewählt</p>
      </div>
    );
  }

  const contact = thread.contact;

  return (
    <div className="w-80 border-l bg-muted/30 flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Contact Header */}
          <div className="text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold">
              {contact?.first_name} {contact?.last_name}
            </h3>
            {contact?.category && (
              <Badge 
                variant="outline" 
                className={CATEGORY_COLORS[contact.category] || 'bg-muted'}
              >
                {contact.category}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Kontaktdaten</h4>
            
            {contact?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${contact.email}`} className="hover:underline truncate">
                  {contact.email}
                </a>
              </div>
            )}
            
            {contact?.company && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{contact.company}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Aktionen</h4>
            
            <div className="grid gap-2">
              <Button variant="outline" size="sm" onClick={onComposeEmail}>
                <Send className="h-4 w-4 mr-2" />
                Neue E-Mail
              </Button>
              
              <Button variant="outline" size="sm" onClick={onGenerateAIReply}>
                <Sparkles className="h-4 w-4 mr-2" />
                KI-Antwort
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowEnrollDialog(!showEnrollDialog)}
              >
                <ListPlus className="h-4 w-4 mr-2" />
                In Sequenz
              </Button>
            </div>

            {/* Enroll in Sequence */}
            {showEnrollDialog && (
              <div className="p-3 bg-background rounded-lg border space-y-2">
                <p className="text-xs text-muted-foreground">Sequenz auswählen:</p>
                <Select onValueChange={handleEnroll}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Sequenz wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sequences
                      .filter(s => s.status === 'active')
                      .map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Active Enrollments */}
            {activeEnrollments.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Aktive Sequenzen:</p>
                {activeEnrollments.map(e => (
                  <Badge key={e.id} variant="secondary" className="text-xs">
                    {e.sequence?.name} (Schritt {e.current_step + 1})
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Tag className="h-4 w-4" />
              Tags
            </h4>
            
            <div className="flex flex-wrap gap-1">
              {tags.map(t => (
                <Badge 
                  key={t.id} 
                  variant="secondary" 
                  className="gap-1 pr-1"
                >
                  #{t.tag}
                  <button
                    onClick={() => removeTag.mutate({ contactId: thread.contact!.id, tag: t.tag })}
                    className="hover:bg-destructive/20 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {tags.length === 0 && (
                <p className="text-xs text-muted-foreground">Keine Tags</p>
              )}
            </div>

            {/* Add Tag */}
            <div className="flex gap-1">
              <Input
                placeholder="Tag hinzufügen..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="h-8 text-sm"
              />
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
