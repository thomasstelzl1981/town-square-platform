/**
 * MobileAttachMenu — Upload popover for mobile Armstrong input
 * 
 * Provides 3 options: File attach, Photo library, Camera capture.
 * Returns selected files via callback.
 */

import * as React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, Paperclip, Image, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileAttachMenuProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function MobileAttachMenu({ onFilesSelected, disabled }: MobileAttachMenuProps) {
  const [open, setOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    e.target.value = '';
    setOpen(false);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFiles}
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            disabled={disabled}
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95',
              'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Plus className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="w-52 p-1.5 rounded-xl"
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted/60 transition-colors"
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span>Datei anfügen</span>
          </button>
          <button
            onClick={() => photoInputRef.current?.click()}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted/60 transition-colors"
          >
            <Image className="h-4 w-4 text-muted-foreground" />
            <span>Foto aus Mediathek</span>
          </button>
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted/60 transition-colors"
          >
            <Camera className="h-4 w-4 text-muted-foreground" />
            <span>Fotografieren</span>
          </button>
        </PopoverContent>
      </Popover>
    </>
  );
}
