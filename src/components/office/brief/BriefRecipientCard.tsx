/**
 * R-9: Recipient selection card (Step 1)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { User, ChevronsUpDown, Check } from 'lucide-react';
import type { BriefContact, ManualRecipientFields } from './briefTypes';

interface BriefRecipientCardProps {
  contacts: BriefContact[];
  selectedContact: BriefContact | null;
  setSelectedContact: (c: BriefContact | null) => void;
  contactOpen: boolean;
  setContactOpen: (open: boolean) => void;
  manualRecipient: boolean;
  setManualRecipient: (v: boolean) => void;
  manualFields: ManualRecipientFields;
  setManualFields: React.Dispatch<React.SetStateAction<ManualRecipientFields>>;
}

export function BriefRecipientCard({
  contacts, selectedContact, setSelectedContact,
  contactOpen, setContactOpen,
  manualRecipient, setManualRecipient,
  manualFields, setManualFields,
}: BriefRecipientCardProps) {
  return (
    <Card className="glass-card">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">1</Badge>
            Empfänger
          </Label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setManualRecipient(false); setSelectedContact(null); }}
              className={cn("text-xs px-2.5 py-1 rounded-md transition-colors", !manualRecipient ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
              Aus Kontakten
            </button>
            <button type="button" onClick={() => { setManualRecipient(true); setSelectedContact(null); }}
              className={cn("text-xs px-2.5 py-1 rounded-md transition-colors", manualRecipient ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
              Manuell eingeben
            </button>
          </div>
        </div>

        {!manualRecipient ? (
          <Popover open={contactOpen} onOpenChange={setContactOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={contactOpen} className="w-full justify-between">
                {selectedContact ? (
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {selectedContact.first_name} {selectedContact.last_name}
                    {selectedContact.company && <span className="text-muted-foreground">• {selectedContact.company}</span>}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Kontakt suchen...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput placeholder="Kontakt suchen..." />
                <CommandList>
                  <CommandEmpty>Kein Kontakt gefunden.</CommandEmpty>
                  <CommandGroup>
                    {contacts.map((contact) => (
                      <CommandItem key={contact.id} value={`${contact.first_name} ${contact.last_name}`}
                        onSelect={() => { setSelectedContact(contact); setContactOpen(false); }}>
                        <Check className={cn('mr-2 h-4 w-4', selectedContact?.id === contact.id ? 'opacity-100' : 'opacity-0')} />
                        <div className="flex flex-col">
                          <span>{contact.first_name} {contact.last_name}</span>
                          <span className="text-xs text-muted-foreground">{contact.company || contact.email || 'Keine Details'}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Select value={manualFields.salutation} onValueChange={(v) => setManualFields(f => ({ ...f, salutation: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Anrede" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Herr">Herr</SelectItem>
                  <SelectItem value="Frau">Frau</SelectItem>
                  <SelectItem value="Firma">Firma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Vorname" value={manualFields.first_name} onChange={(e) => setManualFields(f => ({ ...f, first_name: e.target.value }))} className="h-9 text-sm" />
            <Input placeholder="Nachname *" value={manualFields.last_name} onChange={(e) => setManualFields(f => ({ ...f, last_name: e.target.value }))} className="h-9 text-sm" />
            <Input placeholder="Firma (optional)" value={manualFields.company} onChange={(e) => setManualFields(f => ({ ...f, company: e.target.value }))} className="col-span-2 h-9 text-sm" />
            <Input placeholder="Straße + Nr." value={manualFields.street} onChange={(e) => setManualFields(f => ({ ...f, street: e.target.value }))} className="col-span-2 h-9 text-sm" />
            <Input placeholder="PLZ" value={manualFields.postal_code} onChange={(e) => setManualFields(f => ({ ...f, postal_code: e.target.value }))} className="h-9 text-sm" />
            <Input placeholder="Ort" value={manualFields.city} onChange={(e) => setManualFields(f => ({ ...f, city: e.target.value }))} className="h-9 text-sm" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
