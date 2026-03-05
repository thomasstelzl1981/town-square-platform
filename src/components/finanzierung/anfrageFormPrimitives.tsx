/**
 * R-5: Shared form primitives for AnfrageFormV2
 */
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SectionHeader({ 
  icon: Icon, title, description, sectionLetter 
}: { 
  icon: React.ElementType; title: string; description: string; sectionLetter: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
        <span className="font-bold text-sm">{sectionLetter}</span>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function FormField({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CurrencyInput({ value, onChange, placeholder, disabled }: {
  value: number | null; onChange: (value: number | null) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className="relative">
      <Input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} placeholder={placeholder || '0,00'} className="pr-8" disabled={disabled} />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
    </div>
  );
}

export function PercentInput({ value, onChange, placeholder, disabled }: {
  value: number | null; onChange: (value: number | null) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className="relative">
      <Input type="number" step="0.1" value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} placeholder={placeholder || '0,0'} className="pr-8" disabled={disabled} />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
    </div>
  );
}
