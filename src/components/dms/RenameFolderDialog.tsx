import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RenameFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onRename: (newName: string) => void;
  isRenaming?: boolean;
}

export function RenameFolderDialog({ open, onOpenChange, currentName, onRename, isRenaming }: RenameFolderDialogProps) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(currentName);
      setError('');
    }
  }, [open, currentName]);

  const validate = (value: string): string => {
    if (!value.trim()) return 'Name darf nicht leer sein';
    if (/[/\\]/.test(value)) return 'Name darf keine Schrägstriche enthalten';
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(name);
    if (err) {
      setError(err);
      return;
    }
    if (name.trim() === currentName) {
      onOpenChange(false);
      return;
    }
    onRename(name.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Ordner umbenennen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-rename">Neuer Name</Label>
            <Input
              id="folder-rename"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              autoFocus
              disabled={isRenaming}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isRenaming}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isRenaming || !name.trim()}>
              {isRenaming ? 'Wird umbenannt…' : 'Umbenennen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
