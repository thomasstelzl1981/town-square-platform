/**
 * ZONE-1: FutureRoom Bank Contacts Page
 * Manages the central bank directory for financing
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DESIGN } from '@/config/designManifest';
import { 
  Building2, Plus, Phone, Mail, Globe, 
  Search, Edit, Trash2, CheckCircle, XCircle 
} from 'lucide-react';
import { useFinanceBankContacts } from '@/hooks/useFinanceMandate';
import { AddBankAccountDialog } from '@/components/shared/AddBankAccountDialog';

export default function FutureRoomBanks() {
  const { data: banks, isLoading } = useFinanceBankContacts();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredBanks = banks?.filter(bank => 
    bank.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bankkontakte</h2>
          <p className="text-muted-foreground">
            Zentrales Verzeichnis für Finanzierungspartner
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Neue Bank
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Banken durchsuchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Bank List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Lade Bankkontakte...
        </div>
      ) : filteredBanks.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            {searchTerm ? 'Keine Banken gefunden' : 'Noch keine Bankkontakte angelegt'}
          </p>
          {!searchTerm && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setShowAddDialog(true)}
            >
              Erste Bank anlegen
            </Button>
          )}
        </div>
      ) : (
        <div className={DESIGN.WIDGET_GRID.FULL}>
          {filteredBanks.map(bank => (
            <Card key={bank.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{bank.bank_name}</CardTitle>
                  <Badge variant={bank.is_active ? 'default' : 'secondary'}>
                    {bank.is_active ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Aktiv</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" /> Inaktiv</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {bank.contact_name && (
                  <div className="text-sm">
                    <span className="font-medium">Ansprechpartner:</span>{' '}
                    {bank.contact_name}
                  </div>
                )}
                
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {bank.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <a href={`mailto:${bank.contact_email}`} className="hover:underline">
                        {bank.contact_email}
                      </a>
                    </div>
                  )}
                  {bank.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <a href={`tel:${bank.contact_phone}`} className="hover:underline">
                        {bank.contact_phone}
                      </a>
                    </div>
                  )}
                  {bank.portal_url && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      <a 
                        href={bank.portal_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline truncate"
                      >
                        Portal öffnen
                      </a>
                    </div>
                  )}
                </div>

                {bank.preferred_loan_types && bank.preferred_loan_types.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {bank.preferred_loan_types.map((type, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog - reuse existing component or create simple one */}
      {showAddDialog && (
        <AddBankAccountDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog}
        />
      )}
    </div>
  );
}
