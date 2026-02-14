import React, { useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Eye, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PropertyTableColumn<T = any> {
  key: string;
  header: string;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'right' | 'center';
  render?: (value: any, row: T) => ReactNode;
}

export interface PropertyTableEmptyState {
  message: string;
  actionLabel: string;
  actionRoute: string;
}

export interface PropertyTableProps<T = any> {
  data: T[];
  columns: PropertyTableColumn<T>[];
  isLoading?: boolean;
  emptyState?: PropertyTableEmptyState;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  getRowId?: (row: T) => string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (row: T, search: string) => boolean;
  headerActions?: ReactNode;
}

export function PropertyTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  emptyState,
  onRowClick,
  rowActions,
  getRowId = (row) => row.id,
  showSearch = false,
  searchPlaceholder = 'Suchen...',
  searchFilter,
  headerActions,
}: PropertyTableProps<T>) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Filter data based on search
  const filteredData = search && searchFilter
    ? data.filter(row => searchFilter(row, search.toLowerCase()))
    : data;

  const handleRowClick = (row: T) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  const handleEmptyClick = () => {
    if (emptyState?.actionRoute) {
      navigate(emptyState.actionRoute);
    }
  };

  const hasData = filteredData.length > 0;

  return (
    <div className="space-y-4">
      {/* Header with Search and Actions */}
      {(showSearch || headerActions) && (
        <div className="flex items-center justify-between gap-4">
          {showSearch ? (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          ) : (
            <div />
          )}
          {headerActions}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.width && `w-[${col.width}]`,
                    col.minWidth && `min-w-[${col.minWidth}]`,
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center'
                  )}
                  style={{ 
                    width: col.width, 
                    minWidth: col.minWidth || '80px' 
                  }}
                >
                  {col.header}
                </TableHead>
              ))}
              {rowActions && <TableHead className="w-[60px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (rowActions ? 1 : 0)} 
                  className="h-24 text-center"
                >
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : !hasData ? (
              <>
                {/* Empty placeholder row - consistent with MOD-04 pattern */}
                <TableRow
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={handleEmptyClick}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        'text-muted-foreground',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center'
                      )}
                    >
                      –
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
                {/* Info row with action button */}
                {emptyState && (
                  <TableRow>
                    <TableCell 
                      colSpan={columns.length + (rowActions ? 1 : 0)} 
                      className="text-center py-6"
                    >
                      <p className="text-muted-foreground mb-4">
                        {emptyState.message}
                      </p>
                      <Button onClick={() => navigate(emptyState.actionRoute)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {emptyState.actionLabel}
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              filteredData.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  className={cn(
                    onRowClick && 'cursor-pointer hover:bg-muted/50'
                  )}
                  onClick={() => handleRowClick(row)}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center'
                      )}
                    >
                      {col.render 
                        ? col.render(row[col.key], row)
                        : row[col.key] ?? '–'}
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {rowActions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Utility components for consistent cell rendering
export function PropertyCodeCell({ code, fallback }: { code: string | null; fallback?: string }) {
  return (
    <span className="font-mono text-sm">
      {code || fallback || '–'}
    </span>
  );
}

export function PropertyAddressCell({ 
  address, 
  subtitle 
}: { 
  address: string | null; 
  subtitle?: string;
}) {
  return (
    <div>
      <p className="font-medium">{address || '–'}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function PropertyCurrencyCell({ 
  value, 
  variant = 'default' 
}: { 
  value: number | null; 
  variant?: 'default' | 'muted' | 'bold' | 'destructive';
}) {
  if (value == null || value === 0) {
    return <span className="text-muted-foreground">–</span>;
  }
  
  const formatted = value.toLocaleString('de-DE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) + ' €';
  
  return (
    <span className={cn(
      variant === 'muted' && 'text-muted-foreground',
      variant === 'bold' && 'font-semibold',
      variant === 'destructive' && 'text-destructive'
    )}>
      {formatted}
    </span>
  );
}

export function PropertyStatusCell({ 
  status, 
  labels 
}: { 
  status: string; 
  labels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }>;
}) {
  const config = labels[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
