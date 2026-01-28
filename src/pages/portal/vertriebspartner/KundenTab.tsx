import { useState } from 'react';
import { Search, UserPlus, Calculator, Handshake, Archive, MoreHorizontal, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { HowItWorks } from '@/components/vertriebspartner';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type CustomerStatus = 'active' | 'running' | 'archived';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  propertyInterests: string[];
  lastActivity: Date;
  notes: string;
  history: { date: Date; action: string }[];
}

const mockCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'Max Mustermann',
    email: 'max@example.com',
    phone: '+49 171 1234567',
    status: 'active',
    propertyInterests: ['MFH Leipzig-Connewitz', 'Zinshaus Chemnitz'],
    lastActivity: new Date(),
    notes: 'Interessiert an Objekten in Sachsen, Budget bis 500k',
    history: [
      { date: new Date(), action: 'Simulation ZL001 (50k EK, 2% Tilgung)' },
      { date: new Date(Date.now() - 86400000), action: 'Erstgespräch, Profil erstellt' },
    ],
  },
  {
    id: 'c2',
    name: 'Erika Muster',
    email: 'erika@example.com',
    phone: '+49 172 9876543',
    status: 'running',
    propertyInterests: ['ETW Dresden-Neustadt'],
    lastActivity: new Date(Date.now() - 86400000),
    notes: 'Finanzierung läuft bei der Sparkasse',
    history: [
      { date: new Date(Date.now() - 86400000), action: 'Finanzierungsanfrage gestellt' },
      { date: new Date(Date.now() - 172800000), action: 'Beratungsgespräch' },
    ],
  },
  {
    id: 'c3',
    name: 'Hans Schmidt',
    email: 'hans@example.com',
    phone: '+49 173 5555555',
    status: 'archived',
    propertyInterests: [],
    lastActivity: new Date(Date.now() - 864000000),
    notes: 'Kein Interesse mehr, möchte später nochmal kontaktiert werden',
    history: [
      { date: new Date(Date.now() - 864000000), action: 'Archiviert - kein Interesse' },
    ],
  },
];

const statusConfig: Record<CustomerStatus, { label: string; color: string; icon: string }> = {
  active: { label: 'Aktiv', color: 'bg-green-500', icon: '🟢' },
  running: { label: 'Laufend', color: 'bg-yellow-500', icon: '🟡' },
  archived: { label: 'Archiv', color: 'bg-gray-500', icon: '⚫' },
};

const KundenTab = () => {
  const [customers, setCustomers] = useState(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCustomerDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDrawerOpen(true);
  };

  const updateStatus = (id: string, newStatus: CustomerStatus) => {
    setCustomers(prev => prev.map(c => 
      c.id === id ? { ...c, status: newStatus } : c
    ));
  };

  return (
    <div className="space-y-6">
      <HowItWorks variant="kunden" />

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Kunden durchsuchen..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">🟢 Aktiv</SelectItem>
                <SelectItem value="running">🟡 Laufend</SelectItem>
                <SelectItem value="archived">⚫ Archiv</SelectItem>
              </SelectContent>
            </Select>

            <Button className="ml-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              Neuer Kunde
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Kundenakte</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Objekt-Interesse</TableHead>
                <TableHead className="w-[150px]">Letzte Aktivität</TableHead>
                <TableHead className="text-right w-[100px]">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Keine Kunden gefunden.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow 
                    key={customer.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openCustomerDetail(customer)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Circle className={`h-2 w-2 fill-current ${
                          customer.status === 'active' ? 'text-green-500' :
                          customer.status === 'running' ? 'text-yellow-500' : 'text-gray-500'
                        }`} />
                        {statusConfig[customer.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {customer.propertyInterests.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {customer.propertyInterests.slice(0, 2).map((prop, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {prop}
                            </Badge>
                          ))}
                          {customer.propertyInterests.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{customer.propertyInterests.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(customer.lastActivity, 'dd.MM.yyyy', { locale: de })}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openCustomerDetail(customer)}>
                            Details anzeigen
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calculator className="mr-2 h-4 w-4" />
                            In Beratung öffnen
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Handshake className="mr-2 h-4 w-4" />
                            Deal starten
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateStatus(customer.id, 'archived')}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archivieren
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedCustomer && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedCustomer.name}
                  <Badge variant="outline" className="ml-2">
                    {statusConfig[selectedCustomer.status].icon} {statusConfig[selectedCustomer.status].label}
                  </Badge>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Contact Data */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">Kontaktdaten</Label>
                  <div className="space-y-1 text-sm">
                    <div>📧 {selectedCustomer.email}</div>
                    <div>📱 {selectedCustomer.phone}</div>
                  </div>
                </div>

                {/* Property Interests */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">Objekt-Interesse</Label>
                  {selectedCustomer.propertyInterests.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCustomer.propertyInterests.map((prop, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                          <span className="text-sm">♥ {prop}</span>
                          <Button variant="ghost" size="sm">
                            → Beratung öffnen
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine Objekte ausgewählt</p>
                  )}
                </div>

                {/* History */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">Beratungs-Historie</Label>
                  <div className="space-y-2">
                    {selectedCustomer.history.map((item, idx) => (
                      <div key={idx} className="flex gap-3 text-sm">
                        <span className="text-muted-foreground whitespace-nowrap">
                          {format(item.date, 'dd.MM.yyyy HH:mm', { locale: de })}
                        </span>
                        <span>{item.action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">Notizen</Label>
                  <Textarea 
                    value={selectedCustomer.notes}
                    placeholder="Interne Notizen zum Kunden..."
                    className="min-h-[100px]"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1">
                    <Calculator className="mr-2 h-4 w-4" />
                    In Beratung
                  </Button>
                  <Button className="flex-1">
                    <Handshake className="mr-2 h-4 w-4" />
                    Deal starten
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default KundenTab;
