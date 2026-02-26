/**
 * AddWidgetMenu — "+" Dropdown mit Widget-Kategorien
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Home, Camera, Zap, Shield, Eye } from 'lucide-react';

interface AddWidgetMenuProps {
  onAddHome: () => void;
  onAddCamera: () => void;
  onAddContract: (category: string) => void;
  hiddenWidgetIds: string[];
  onShowWidget: (id: string) => void;
  allWidgets: Array<{ id: string; label: string; type: string }>;
}

export function AddWidgetMenu({
  onAddHome,
  onAddCamera,
  onAddContract,
  hiddenWidgetIds,
  onShowWidget,
  allWidgets,
}: AddWidgetMenuProps) {
  const hiddenWidgets = allWidgets.filter(w => hiddenWidgetIds.includes(w.id));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="glass" size="icon-round">
          <Plus className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Neu hinzufügen</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddHome}>
          <Home className="h-4 w-4 mr-2" />
          Neues Zuhause anlegen
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddCamera}>
          <Camera className="h-4 w-4 mr-2" />
          Neue Kamera hinzufügen
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Versorgungsvertrag</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onAddContract('strom')}>
          <Zap className="h-4 w-4 mr-2" />Stromvertrag
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddContract('gas')}>
          <Zap className="h-4 w-4 mr-2" />Gasvertrag
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddContract('wasser')}>
          <Zap className="h-4 w-4 mr-2" />Wasservertrag
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddContract('internet')}>
          <Zap className="h-4 w-4 mr-2" />Internet & Telefon
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Versicherung</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onAddContract('hausrat')}>
          <Shield className="h-4 w-4 mr-2" />Hausratversicherung
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddContract('haftpflicht')}>
          <Shield className="h-4 w-4 mr-2" />Haftpflichtversicherung
        </DropdownMenuItem>

        {hiddenWidgets.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Ausgeblendete Widgets</DropdownMenuLabel>
            {hiddenWidgets.map(w => (
              <DropdownMenuItem key={w.id} onClick={() => onShowWidget(w.id)}>
                <Eye className="h-4 w-4 mr-2" />{w.label}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
