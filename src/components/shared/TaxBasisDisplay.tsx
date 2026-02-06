/**
 * TaxBasisDisplay - Zeigt berechnete Steuerwerte an
 * Wird in CreateContextDialog und KontexteTab verwendet
 */
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calculator, Info } from 'lucide-react';
import { calculateTax, TaxAssessmentType } from '@/lib/taxCalculator';

interface TaxBasisDisplayProps {
  taxableIncome: number;
  assessmentType: TaxAssessmentType;
  churchTax: boolean;
  childrenCount: number;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export function TaxBasisDisplay({
  taxableIncome,
  assessmentType,
  churchTax,
  childrenCount,
  variant = 'compact',
  className,
}: TaxBasisDisplayProps) {
  const taxResult = useMemo(() => {
    if (!taxableIncome || taxableIncome <= 0) return null;
    return calculateTax({
      taxableIncome,
      assessmentType,
      churchTax,
      childrenCount,
    });
  }, [taxableIncome, assessmentType, churchTax, childrenCount]);

  if (!taxResult) {
    return (
      <span className="text-xs text-muted-foreground">
        zVE fehlt
      </span>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-1 text-xs ${className}`}>
              <Calculator className="h-3 w-3 text-primary" />
              <span className="font-medium">{taxResult.marginalTaxRate}%</span>
              <span className="text-muted-foreground">
                · zVE {formatCurrency(taxableIncome)}
                · {assessmentType === 'SPLITTING' ? 'Splitting' : 'Einzel'}
              </span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <p><strong>Grenzsteuersatz:</strong> {taxResult.marginalTaxRate}%</p>
              <p><strong>Effektiver Steuersatz:</strong> {taxResult.effectiveTaxRate}%</p>
              <p><strong>ESt:</strong> {formatCurrency(taxResult.incomeTax)}</p>
              {taxResult.solidaritySurcharge > 0 && (
                <p><strong>Soli:</strong> {formatCurrency(taxResult.solidaritySurcharge)}</p>
              )}
              {taxResult.churchTax > 0 && (
                <p><strong>KiSt:</strong> {formatCurrency(taxResult.churchTax)}</p>
              )}
              {childrenCount > 0 && (
                <p><strong>Kinder:</strong> {childrenCount} (Freibetrag {taxResult.childAllowanceUsed ? 'genutzt' : 'nicht genutzt'})</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed variant
  return (
    <div className={`space-y-2 text-sm ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Grenzsteuersatz:</span>
        <Badge variant="secondary" className="font-mono">
          {taxResult.marginalTaxRate}%
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Effektiver Steuersatz:</span>
        <span className="font-medium">{taxResult.effectiveTaxRate}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Einkommensteuer:</span>
        <span>{formatCurrency(taxResult.incomeTax)}</span>
      </div>
      {taxResult.solidaritySurcharge > 0 && (
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Solidaritätszuschlag:</span>
          <span>{formatCurrency(taxResult.solidaritySurcharge)}</span>
        </div>
      )}
      {taxResult.churchTax > 0 && (
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Kirchensteuer:</span>
          <span>{formatCurrency(taxResult.churchTax)}</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="font-medium">Gesamtsteuer:</span>
        <span className="font-bold">{formatCurrency(taxResult.totalTax)}</span>
      </div>
    </div>
  );
}
