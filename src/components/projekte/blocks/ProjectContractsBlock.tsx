/**
 * Project Contracts Block (Block I)
 * Purchase Contract Status & Drafts
 * MOD-13 PROJEKTE
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileSignature, FileText, Download, Eye, 
  Upload, CheckCircle, Clock, AlertCircle,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { DevProjectReservation, DevProjectDocument } from '@/types/projekte';

interface ContractStatus {
  unitNumber: string;
  buyerName: string;
  reservationStatus: string;
  notaryDate: string | null;
  contractUploaded: boolean;
  contractDocument: DevProjectDocument | null;
}

interface ProjectContractsBlockProps {
  projectId: string;
  reservations: DevProjectReservation[];
  documents: DevProjectDocument[];
}

export function ProjectContractsBlock({ 
  projectId, 
  reservations, 
  documents 
}: ProjectContractsBlockProps) {
  // Filter reservations that are at notary stage or completed
  const relevantReservations = reservations.filter(r => 
    ['notary_scheduled', 'completed'].includes(r.status)
  );

  // Build contract status list
  const contracts: ContractStatus[] = relevantReservations.map(res => {
    // Find contract document for this unit
    const contractDoc = documents.find(d => 
      d.unit_id === res.unit_id && 
      d.doc_type === 'purchase_contract'
    );

    return {
      unitNumber: res.unit?.unit_number || 'N/A',
      buyerName: res.buyer_contact 
        ? `${res.buyer_contact.first_name} ${res.buyer_contact.last_name}`
        : 'Unbekannt',
      reservationStatus: res.status,
      notaryDate: res.notary_date,
      contractUploaded: !!contractDoc,
      contractDocument: contractDoc || null,
    };
  });

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return format(new Date(date), 'dd.MM.yyyy', { locale: de });
  };

  const getStatusBadge = (status: string, hasContract: boolean) => {
    if (status === 'completed' && hasContract) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Abgeschlossen
        </Badge>
      );
    }
    if (status === 'notary_scheduled') {
      return (
        <Badge variant="secondary">
          <Calendar className="h-3 w-3 mr-1" />
          Notartermin
        </Badge>
      );
    }
    if (status === 'completed' && !hasContract) {
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-300">
          <AlertCircle className="h-3 w-3 mr-1" />
          Vertrag fehlt
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-primary" />
          <CardTitle>I. Verträge</CardTitle>
          <Badge variant="secondary">{contracts.length}</Badge>
        </div>
        <Button size="sm">
          <Upload className="h-4 w-4 mr-1" />
          Vertrag hochladen
        </Button>
      </CardHeader>
      <CardContent>
        {contracts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileSignature className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Kaufverträge vorhanden</p>
            <p className="text-sm">
              Verträge erscheinen hier, sobald ein Notartermin vereinbart wurde.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Einheit</th>
                  <th className="text-left py-2 px-2">Käufer</th>
                  <th className="text-left py-2 px-2">Notartermin</th>
                  <th className="text-center py-2 px-2">Status</th>
                  <th className="text-center py-2 px-2">Dokument</th>
                  <th className="text-right py-2 px-2">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 font-medium">{contract.unitNumber}</td>
                    <td className="py-3 px-2">{contract.buyerName}</td>
                    <td className="py-3 px-2">{formatDate(contract.notaryDate)}</td>
                    <td className="py-3 px-2 text-center">
                      {getStatusBadge(contract.reservationStatus, contract.contractUploaded)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {contract.contractUploaded ? (
                        <div className="flex items-center justify-center gap-1">
                          <FileText className="h-4 w-4 text-green-600" />
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <Clock className="h-3 w-3 text-yellow-500" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-end gap-1">
                        {contract.contractUploaded ? (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" size="sm">
                            <Upload className="h-3 w-3 mr-1" />
                            Hochladen
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {contracts.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <div className="font-bold text-green-700">
                {contracts.filter(c => c.reservationStatus === 'completed' && c.contractUploaded).length}
              </div>
              <div className="text-green-600">Vollständig</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg text-center">
              <div className="font-bold text-yellow-700">
                {contracts.filter(c => c.reservationStatus === 'notary_scheduled').length}
              </div>
              <div className="text-yellow-600">Notartermin</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <div className="font-bold text-red-700">
                {contracts.filter(c => !c.contractUploaded).length}
              </div>
              <div className="text-red-600">Vertrag fehlt</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
