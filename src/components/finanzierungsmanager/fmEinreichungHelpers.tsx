/**
 * Shared inline components for FMEinreichung (R-1 Refactoring)
 */
import { TableRow, TableCell } from '@/components/ui/table';

export function TR({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '' || value === '—') return null;
  const display = typeof value === 'string' ? value.trim() : value;
  if (!display && display !== 0) return null;
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground py-1.5 px-3 w-[180px] border-r">{label}</TableCell>
      <TableCell className="text-sm py-1.5 px-3">{display}</TableCell>
    </TableRow>
  );
}

export function EmptyHint({ text }: { text: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
