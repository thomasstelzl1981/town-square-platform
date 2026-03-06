/**
 * PdfConsentGateDialog — Consent/Role gate for sensitive PDF exports
 * Checks requiredScopes from registry before allowing generation.
 */
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, XCircle, FileText, Loader2 } from 'lucide-react';

interface ScopeCheck {
  scope: string;
  label: string;
  granted: boolean;
}

interface PdfConsentGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateLabel: string;
  scopeChecks: ScopeCheck[];
  onConfirm: () => void;
  onGrantConsent?: (scope: string) => void;
  isGenerating?: boolean;
}

export function PdfConsentGateDialog({
  open, onOpenChange, templateLabel, scopeChecks, onConfirm, onGrantConsent, isGenerating,
}: PdfConsentGateDialogProps) {
  const allGranted = scopeChecks.every(s => s.granted);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {templateLabel} exportieren
          </DialogTitle>
          <DialogDescription>
            Dieser Report enthält sensible Finanzdaten. Bitte bestätigen Sie die erforderlichen Berechtigungen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {scopeChecks.map(check => (
            <div key={check.scope} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2">
                {check.granted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="text-sm font-medium">{check.label}</span>
              </div>
              {check.granted ? (
                <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">Erteilt</Badge>
              ) : (
                onGrantConsent ? (
                  <Button variant="outline" size="sm" onClick={() => onGrantConsent(check.scope)}>
                    <Shield className="h-3 w-3 mr-1" />Erteilen
                  </Button>
                ) : (
                  <Badge variant="destructive" className="text-xs">Fehlt</Badge>
                )
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Abbrechen
          </Button>
          <Button onClick={onConfirm} disabled={!allGranted || isGenerating}>
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generiert…</>
            ) : (
              <><FileText className="h-4 w-4 mr-2" />PDF generieren</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
