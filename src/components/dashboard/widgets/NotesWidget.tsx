import { useState, useEffect, useCallback } from 'react';
import { StickyNote, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Note {
  id: string;
  text: string;
  createdAt: string;
}

const STORAGE_KEY = 'sot-user-notes';

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function NotesWidget() {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [open, setOpen] = useState(false);
  const [newText, setNewText] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const addNote = useCallback(() => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    const note: Note = {
      id: crypto.randomUUID(),
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    setNotes(prev => [note, ...prev]);
    setNewText('');
  }, [newText]);

  const confirmDelete = useCallback(() => {
    if (!deleteId) return;
    setNotes(prev => prev.filter(n => n.id !== deleteId));
    setDeleteId(null);
  }, [deleteId]);

  const latestNote = notes[0];

  return (
    <>
      <Card
        className="aspect-square glass-card cursor-pointer group hover:shadow-lg transition-shadow border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-600/10"
        onClick={() => setOpen(true)}
      >
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-foreground">Notizen</span>
            {notes.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">{notes.length}</span>
            )}
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-hidden">
            {latestNote ? (
              <p className="text-xs text-muted-foreground line-clamp-6 whitespace-pre-wrap">
                {latestNote.text}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic">
                Tippe, um eine Notiz zu erstellen…
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex flex-col w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-amber-500" />
              Notizen
            </SheetTitle>
            <SheetDescription>Deine persoenlichen Notizen</SheetDescription>
          </SheetHeader>

          {/* Input */}
          <div className="flex gap-2 mt-4">
            <Textarea
              placeholder="Neue Notiz…"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              className="min-h-[60px] resize-none flex-1"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  addNote();
                }
              }}
            />
            <Button
              variant="glass"
              size="icon-round"
              onClick={addNote}
              disabled={!newText.trim()}
              className="shrink-0 self-end"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto mt-4 space-y-2">
            {notes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Noch keine Notizen vorhanden
              </p>
            )}
            {notes.map(note => (
              <div
                key={note.id}
                className="group/note flex items-start gap-2 rounded-lg border border-border/50 bg-card/50 p-3"
              >
                <p className="flex-1 text-sm whitespace-pre-wrap break-words">
                  {note.text}
                </p>
                <button
                  onClick={() => setDeleteId(note.id)}
                  className="shrink-0 opacity-0 group-hover/note:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notiz loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Notiz wird unwiderruflich entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Loeschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
