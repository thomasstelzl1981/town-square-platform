import { useEffect } from 'react';
import type { FileManagerItem } from '@/components/dms/views/ListView';

interface UseStorageKeyboardOptions {
  selectedItem: FileManagerItem | null;
  onDelete?: (item: FileManagerItem) => void;
  onOpen?: (item: FileManagerItem) => void;
  onClearSelection: () => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

export function useStorageKeyboard({
  selectedItem,
  onDelete,
  onOpen,
  onClearSelection,
  containerRef,
}: UseStorageKeyboardOptions) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handler = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (!selectedItem) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDelete?.(selectedItem);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedItem.type === 'file') {
          onOpen?.(selectedItem);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClearSelection();
      }
    };

    container.addEventListener('keydown', handler);
    return () => container.removeEventListener('keydown', handler);
  }, [selectedItem, onDelete, onOpen, onClearSelection, containerRef]);
}
