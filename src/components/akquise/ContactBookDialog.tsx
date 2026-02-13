/**
 * ContactBookDialog — Manuelle Kontaktsuche aus Zone 1 (Admin-Kontakte)
 * und eigenem Kontaktbuch (KI-Office contacts des Users).
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, BookOpen, Loader2 } from 'lucide-react';

interface ContactBookContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  company: string | null;
  city: string | null;
  category: string | null;
}

interface ContactBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (contacts: { first_name: string; last_name: string; email: string; company_name: string; service_area: string }[]) => void;
  isImporting?: boolean;
}

export function ContactBookDialog({ open, onOpenChange, onImport, isImporting }: ContactBookDialogProps) {
  const { activeTenantId } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('admin');

  // Zone 1 Admin contacts
  const { data: adminContacts = [], isLoading: adminLoading } = useQuery({
    queryKey: ['contactbook-admin', activeTenantId],
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
      return (data || []) as ContactBookContact[];
    },
    enabled: open && !!activeTenantId,
  });

  // User's own KI-Office contacts (same table, but we can show all tenant contacts)
  // Since both sources share the same contacts table, we differentiate by category
  const allContacts = useMemo(() => {
    return adminContacts;
  }, [adminContacts]);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return allContacts;
    const q = search.toLowerCase();
    return allContacts.filter(c => {
      return [c.first_name, c.last_name, c.email, c.company, c.city]
        .filter(Boolean)
        .some(v => v!.toLowerCase().includes(q));
    });
  }, [allContacts, search]);

  const toggleContact = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredContacts.map(c => c.id)));
  };

  const handleImport = () => {
    const selected = allContacts.filter(c => selectedIds.has(c.id) && c.email);
    onImport(selected.map(c => ({
      first_name: c.first_name || '',
      last_name: c.last_name || '',
      email: c.email!,
      company_name: c.company || '',
      service_area: c.city || '',
    })));
    setSelectedIds(new Set());
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Kontaktbuch
          </DialogTitle>
          <DialogDescription>
            Wählen Sie Kontakte aus dem Kontaktbuch aus, um sie als Empfänger zu übernehmen.
          </DialogDescription>
        </DialogHeader>

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

        {/* Selection info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} ausgewählt
              {filteredContacts.length > 0 && ` von ${filteredContacts.length}`}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={selectAll}>
            Alle auswählen
          </Button>
        </div>

        {/* Contact list */}
        <ScrollArea className="h-[350px] border rounded-lg">
          {adminLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Keine Kontakte gefunden.
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
                    onCheckedChange={() => toggleContact(contact.id)}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleImport} disabled={selectedIds.size === 0 || isImporting}>
            {isImporting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {selectedIds.size} Kontakte übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
