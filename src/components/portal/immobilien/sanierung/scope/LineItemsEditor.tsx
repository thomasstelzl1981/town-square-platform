import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Sparkles } from 'lucide-react';
import { ServiceCaseCategory } from '@/hooks/useServiceCases';
import { formatCurrency } from '@/lib/formatters';

export interface LineItem {
  id: string;
  position: string;
  description: string;
  quantity: number;
  unit: 'm2' | 'lfm' | 'stk' | 'psch' | 'std' | 'kg' | 'm3';
  estimatedUnitPrice?: number; // cents
  estimatedTotal?: number; // cents
  isOptional?: boolean;
  isAiGenerated?: boolean;
  notes?: string;
}

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  category?: ServiceCaseCategory;
  readOnly?: boolean;
}

const UNITS = [
  { value: 'm2', label: 'm²' },
  { value: 'lfm', label: 'lfm' },
  { value: 'stk', label: 'Stk' },
  { value: 'psch', label: 'psch' },
  { value: 'std', label: 'Std' },
  { value: 'kg', label: 'kg' },
  { value: 'm3', label: 'm³' },
] as const;

export function LineItemsEditor({ items, onChange, category, readOnly = false }: LineItemsEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Generate next position number
  const getNextPosition = () => {
    if (items.length === 0) return '1.1';
    
    const positions = items.map(item => {
      const parts = item.position.split('.');
      return {
        major: parseInt(parts[0]) || 1,
        minor: parseInt(parts[1]) || 0,
      };
    });
    
    const lastPos = positions[positions.length - 1];
    return `${lastPos.major}.${lastPos.minor + 1}`;
  };
  
  // Add new item
  const handleAddItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      position: getNextPosition(),
      description: '',
      quantity: 1,
      unit: 'stk',
      isAiGenerated: false,
    };
    onChange([...items, newItem]);
    setEditingId(newItem.id);
  };
  
  // Update item
  const handleUpdateItem = (id: string, updates: Partial<LineItem>) => {
    onChange(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };
  
  // Remove item
  const handleRemoveItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };
  
  // Calculate totals
  const totalEstimate = items.reduce((sum, item) => sum + (item.estimatedTotal || 0), 0);
  
  if (items.length === 0 && readOnly) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Keine Positionen vorhanden
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead className="w-[80px]">Pos.</TableHead>
            <TableHead>Beschreibung</TableHead>
            <TableHead className="w-[100px] text-right">Menge</TableHead>
            <TableHead className="w-[80px]">Einheit</TableHead>
            <TableHead className="w-[120px] text-right">EP (ca.)</TableHead>
            <TableHead className="w-[120px] text-right">Gesamt</TableHead>
            {!readOnly && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={readOnly ? 7 : 8} className="text-center py-8 text-muted-foreground">
                <div className="space-y-2">
                  <p>Keine Positionen vorhanden</p>
                  <p className="text-sm">
                    Starten Sie die KI-Analyse oder fügen Sie Positionen manuell hinzu
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id} className={item.isOptional ? 'opacity-60' : ''}>
                <TableCell>
                  {!readOnly && (
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-sm">{item.position}</span>
                    {item.isAiGenerated && (
                      <Sparkles className="h-3 w-3 text-primary" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {editingId === item.id && !readOnly ? (
                    <Input
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                      onBlur={() => setEditingId(null)}
                      autoFocus
                      className="h-8"
                    />
                  ) : (
                    <div 
                      className={!readOnly ? 'cursor-pointer hover:bg-muted/50 px-2 py-1 rounded -mx-2' : ''}
                      onClick={() => !readOnly && setEditingId(item.id)}
                    >
                      {item.description || <span className="text-muted-foreground italic">Beschreibung eingeben...</span>}
                      {item.isOptional && (
                        <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {readOnly ? (
                    <span>{item.quantity.toLocaleString('de-DE', { minimumFractionDigits: 1 })}</span>
                  ) : (
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, { 
                        quantity: parseFloat(e.target.value) || 0 
                      })}
                      className="h-8 text-right w-20"
                      step="0.1"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    <span>{UNITS.find(u => u.value === item.unit)?.label || item.unit}</span>
                  ) : (
                    <Select
                      value={item.unit}
                      onValueChange={(value) => handleUpdateItem(item.id, { unit: value as LineItem['unit'] })}
                    >
                      <SelectTrigger className="h-8 w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {item.estimatedUnitPrice 
                    ? formatCurrency(item.estimatedUnitPrice / 100) 
                    : <span className="text-muted-foreground">—</span>
                  }
                </TableCell>
                <TableCell className="text-right font-medium">
                  {item.estimatedTotal 
                    ? formatCurrency(item.estimatedTotal / 100) 
                    : <span className="text-muted-foreground">—</span>
                  }
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
          
          {/* Total Row */}
          {items.length > 0 && totalEstimate > 0 && (
            <TableRow className="bg-muted/50 font-medium">
              <TableCell colSpan={6} className="text-right">
                Summe Positionen:
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(totalEstimate / 100)}
              </TableCell>
              {!readOnly && <TableCell />}
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {!readOnly && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddItem}>
            <Plus className="mr-2 h-4 w-4" />
            Position hinzufügen
          </Button>
        </div>
      )}
    </div>
  );
}
