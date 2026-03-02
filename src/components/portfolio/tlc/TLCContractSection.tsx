/**
 * TLC Contract Generator Section — Vertragsgenerator Preview
 */
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useMemo } from 'react';
import { FileSignature, ChevronDown, Copy, FileText } from 'lucide-react';
import { useLeaseContractGenerator, type LeaseContractData } from '@/hooks/useLeaseContractGenerator';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Props {
  leaseData?: Partial<LeaseContractData>;
  contactId?: string;
}

export function TLCContractSection({ leaseData, contactId }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { generateSections, generateFullText } = useLeaseContractGenerator();

  const sections = useMemo(() => {
    if (!leaseData?.landlordName || !leaseData?.tenantName || !leaseData?.rentColdEur) return null;
    try {
      return generateSections(leaseData as LeaseContractData);
    } catch {
      return null;
    }
  }, [leaseData, generateSections]);

  const handleCopyToClipboard = () => {
    if (!leaseData?.landlordName) return;
    try {
      const text = generateFullText(leaseData as LeaseContractData);
      navigator.clipboard.writeText(text);
      toast.success('Vertrag in Zwischenablage kopiert');
    } catch {
      toast.error('Vertragsdaten unvollständig');
    }
  };

  const handleSendToBrief = () => {
    if (!leaseData?.landlordName) return;
    try {
      const text = generateFullText(leaseData as LeaseContractData);
      const params = new URLSearchParams({
        subject: 'Mietvertrag',
        prompt: text,
        ...(contactId ? { contactId } : {}),
      });
      navigate(`/portal/office/brief?${params.toString()}`);
    } catch {
      toast.error('Vertragsdaten unvollständig');
    }
  };

  const hasData = leaseData?.landlordName && leaseData?.tenantName && leaseData?.rentColdEur;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-8 text-xs">
          <span className="flex items-center gap-2">
            <FileSignature className="h-3.5 w-3.5" />
            Vertragsgenerator
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-1">
        {!hasData ? (
          <p className="text-xs text-muted-foreground p-2">
            Vertragsdaten unvollständig. Bitte zuerst Vermieter, Mieter und Kaltmiete pflegen.
          </p>
        ) : (
          <>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-3 p-2">
                {sections?.map((s, i) => (
                  <div key={i} className="text-xs">
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-muted-foreground whitespace-pre-line mt-0.5 text-[11px] leading-relaxed">
                      {s.content}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleCopyToClipboard}>
                <Copy className="mr-1 h-3 w-3" />Kopieren
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleSendToBrief}>
                <FileText className="mr-1 h-3 w-3" />An Briefgenerator
              </Button>
            </div>
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
