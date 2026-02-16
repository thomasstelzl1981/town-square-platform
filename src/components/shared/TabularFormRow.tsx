/**
 * TabularFormRow — Wiederverwendbare Label-Value-Zeile im Bank-Stil
 * Verwendet TABULAR_FORM aus dem Design Manifest
 * 
 * Gold-Standard: Selbstauskunft (ApplicantPersonFields)
 * Pattern: Label | Wert1 | Wert2 (optional)
 */
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import type { ReactNode } from 'react';

interface TabularFormRowProps {
  label: string;
  children: ReactNode;
  /** Zweite Spalte (z.B. für Antragsteller 2) */
  secondColumn?: ReactNode;
  className?: string;
}

export const TabularFormRow = memo(function TabularFormRow({ label, children, secondColumn, className }: TabularFormRowProps) {
  return (
    <div className={cn('flex', DESIGN.TABULAR_FORM.ROW_BORDER, className)}>
      <div className={DESIGN.TABULAR_FORM.LABEL_CELL}>
        {label}
      </div>
      <div className={cn(DESIGN.TABULAR_FORM.VALUE_CELL, 'flex-1')}>
        {children}
      </div>
      {secondColumn !== undefined && (
        <div className={cn(DESIGN.TABULAR_FORM.VALUE_CELL, 'flex-1 border-r-0')}>
          {secondColumn}
        </div>
      )}
    </div>
  );
});

interface TabularFormSectionProps {
  title: string;
  colSpan?: number;
  className?: string;
}

export const TabularFormSection = memo(function TabularFormSection({ title, className }: TabularFormSectionProps) {
  return (
    <div className={cn(DESIGN.TABULAR_FORM.SECTION_ROW, className)}>
      {title}
    </div>
  );
});

interface TabularFormWrapperProps {
  children: ReactNode;
  className?: string;
}

export const TabularFormWrapper = memo(function TabularFormWrapper({ children, className }: TabularFormWrapperProps) {
  return (
    <div className={cn(DESIGN.TABULAR_FORM.TABLE_BORDER, className)}>
      {children}
    </div>
  );
});
