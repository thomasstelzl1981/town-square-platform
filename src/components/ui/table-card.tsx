import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react";

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface TableCardProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  columns: TableColumn<T>[];
  data: T[];
  actions?: React.ReactNode;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onRowAction?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

function TableCard<T extends Record<string, unknown>>({
  className,
  title,
  description,
  columns,
  data,
  actions,
  onSort,
  sortKey,
  sortDirection,
  onRowAction,
  emptyMessage = "Keine Daten vorhanden",
  loading = false,
  ...props
}: TableCardProps<T>) {
  const handleSort = (key: string) => {
    if (onSort) {
      const newDirection = sortKey === key && sortDirection === "asc" ? "desc" : "asc";
      onSort(key, newDirection);
    }
  };

  const getValue = (row: T, key: string): unknown => {
    if (key.includes(".")) {
      const keys = key.split(".");
      let value: unknown = row;
      for (const k of keys) {
        value = (value as Record<string, unknown>)?.[k];
      }
      return value;
    }
    return row[key as keyof T];
  };

  return (
    <Card className={cn("shadow-card", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-y bg-muted/50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
                      column.sortable && "cursor-pointer hover:text-foreground select-none",
                      column.className
                    )}
                    onClick={() => column.sortable && handleSort(String(column.key))}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {column.sortable && sortKey === column.key && (
                        sortDirection === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )
                      )}
                    </div>
                  </th>
                ))}
                {onRowAction && <th className="w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((column, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                    {onRowAction && <td className="px-4 py-3" />}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (onRowAction ? 1 : 0)}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    {columns.map((column) => {
                      const value = getValue(row, String(column.key));
                      return (
                        <td
                          key={String(column.key)}
                          className={cn(
                            "px-4 py-3 text-sm",
                            column.className
                          )}
                        >
                          {column.render
                            ? column.render(value as T[keyof T], row)
                            : String(value ?? "")}
                        </td>
                      );
                    })}
                    {onRowAction && (
                      <td className="px-2 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onRowAction(row)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export { TableCard };
