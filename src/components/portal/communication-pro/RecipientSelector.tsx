/**
 * RecipientSelector — Search + filter contacts for Serien-E-Mail
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SelectedRecipient {
  contact_id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string | null;
  city: string | null;
}

interface RecipientSelectorProps {
  selected: SelectedRecipient[];
  onChange: (recipients: SelectedRecipient[]) => void;
}

export function RecipientSelector({ selected, onChange }: RecipientSelectorProps) {
  const { activeTenantId } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Load contacts with email
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts-for-campaign', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, company, city, category')
        .eq('tenant_id', activeTenantId)
        .not('email', 'is', null)
        .is('deleted_at', null)
        .order('last_name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // Load tags
  const { data: tags = [] } = useQuery({
    queryKey: ['contact-tags-for-campaign', activeTenantId],
    queryFn: async () => {
      const contactIds = contacts.map(c => c.id);
      if (contactIds.length === 0) return [];
      const { data } = await supabase
        .from('admin_contact_tags')
        .select('tag, contact_id')
        .in('contact_id', contactIds);
      return data || [];
    },
    enabled: contacts.length > 0,
  });

  const uniqueTags = useMemo(() => {
    const s = new Set(tags.map(t => t.tag));
    return Array.from(s).sort();
  }, [tags]);

  const categories = useMemo(() => {
    const s = new Set(contacts.map(c => c.category).filter(Boolean));
    return Array.from(s).sort() as string[];
  }, [contacts]);

  const taggedContactIds = useMemo(() => {
    if (!tagFilter) return null;
    return new Set(tags.filter(t => t.tag === tagFilter).map(t => t.contact_id));
  }, [tagFilter, tags]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const match = [c.first_name, c.last_name, c.email, c.company, c.city]
          .filter(Boolean)
          .some(v => v!.toLowerCase().includes(q));
        if (!match) return false;
      }
      // Category
      if (categoryFilter && c.category !== categoryFilter) return false;
      // Tag
      if (taggedContactIds && !taggedContactIds.has(c.id)) return false;
      return true;
    });
  }, [contacts, search, categoryFilter, taggedContactIds]);

  const selectedIds = new Set(selected.map(s => s.contact_id));

  const toggleContact = (contact: typeof contacts[0]) => {
    if (selectedIds.has(contact.id)) {
      onChange(selected.filter(s => s.contact_id !== contact.id));
    } else {
      // Dedupe by email
      if (selected.some(s => s.email === contact.email)) return;
      onChange([...selected, {
        contact_id: contact.id,
        email: contact.email!,
        first_name: contact.first_name,
        last_name: contact.last_name,
        company: contact.company,
        city: contact.city,
      }]);
    }
  };

  const selectAll = () => {
    const existing = new Map(selected.map(s => [s.email, s]));
    for (const c of filteredContacts) {
      if (!existing.has(c.email!)) {
        existing.set(c.email!, {
          contact_id: c.id,
          email: c.email!,
          first_name: c.first_name,
          last_name: c.last_name,
          company: c.company,
          city: c.city,
        });
      }
    }
    onChange(Array.from(existing.values()));
  };

  const deselectAll = () => {
    const filteredIds = new Set(filteredContacts.map(c => c.id));
    onChange(selected.filter(s => !filteredIds.has(s.contact_id)));
  };

  return (
    <div className="space-y-4">
      {/* Selected count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{selected.length} Empfänger ausgewählt</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>Alle auswählen</Button>
          {selected.length > 0 && (
            <Button variant="ghost" size="sm" onClick={deselectAll}>Auswahl aufheben</Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Name, E-Mail oder Firma suchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Badge
            key={cat}
            variant={categoryFilter === cat ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
          >
            {cat}
          </Badge>
        ))}
        {uniqueTags.map(tag => (
          <Badge
            key={tag}
            variant={tagFilter === tag ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
          >
            <Tag className="h-3 w-3 mr-1" />
            {tag}
          </Badge>
        ))}
        {(categoryFilter || tagFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setCategoryFilter(null); setTagFilter(null); }}>
            <X className="h-3 w-3 mr-1" /> Filter zurücksetzen
          </Button>
        )}
      </div>

      {/* Contact list */}
      <ScrollArea className="h-[300px] border rounded-lg">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Kontakte werden geladen…</div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            Keine Kontakte mit E-Mail-Adresse gefunden.
          </div>
        ) : (
          <div className="divide-y">
            {filteredContacts.map(contact => (
              <label
                key={contact.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox
                  checked={selectedIds.has(contact.id)}
                  onCheckedChange={() => toggleContact(contact)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {contact.first_name} {contact.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {contact.email}
                    {contact.company && ` · ${contact.company}`}
                    {contact.city && ` · ${contact.city}`}
                  </p>
                </div>
                {contact.category && (
                  <Badge variant="outline" className="text-xs shrink-0">{contact.category}</Badge>
                )}
              </label>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
