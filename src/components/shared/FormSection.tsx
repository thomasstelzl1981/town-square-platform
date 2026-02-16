import * as React from 'react';
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection = memo(function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn(DESIGN.SPACING.SECTION, className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>{title}</h3>}
          {description && <p className={DESIGN.TYPOGRAPHY.MUTED}>{description}</p>}
        </div>
      )}
      <div className={DESIGN.SPACING.SECTION}>{children}</div>
    </div>
  );
});

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField = memo(function FormField({
  label,
  htmlFor,
  error,
  required,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor} className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className={DESIGN.TYPOGRAPHY.HINT}>{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
});

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormInput = memo(function FormInput({ label, error, hint, required, ...props }: FormInputProps) {
  const id = props.id || props.name;
  return (
    <FormField label={label} htmlFor={id} error={error} required={required} hint={hint}>
      <Input
        id={id}
        className={cn(error && 'border-destructive')}
        aria-invalid={!!error}
        {...props}
      />
    </FormField>
  );
});

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormTextarea = memo(function FormTextarea({ label, error, hint, required, ...props }: FormTextareaProps) {
  const id = props.id || props.name;
  return (
    <FormField label={label} htmlFor={id} error={error} required={required} hint={hint}>
      <Textarea
        id={id}
        className={cn(error && 'border-destructive')}
        aria-invalid={!!error}
        {...props}
      />
    </FormField>
  );
});

interface FormRowProps {
  children: React.ReactNode;
  className?: string;
}

export const FormRow = memo(function FormRow({ children, className }: FormRowProps) {
  return (
    <div className={cn(DESIGN.FORM_GRID.FULL, className)}>
      {children}
    </div>
  );
});
