/**
 * Inline-editing helpers for the website preview.
 * EditableText: contentEditable span that calls onChange on blur.
 * EditableImage: click-to-replace image via file input or URL prompt.
 */
import { useRef, useCallback, useState } from 'react';
import { ImagePlus } from 'lucide-react';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
}

export function EditableText({
  value,
  onChange,
  tag: Tag = 'span',
  className,
  style,
  placeholder = 'Text eingeben...',
  multiline = false,
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null);

  const handleBlur = useCallback(() => {
    if (!ref.current) return;
    const newVal = ref.current.innerText.trim();
    if (newVal !== value) onChange(newVal);
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      ref.current?.blur();
    }
  }, [multiline]);

  return (
    <Tag
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${className || ''} outline-none focus:ring-2 focus:ring-primary/40 focus:rounded cursor-text transition-shadow`}
      style={style}
      data-placeholder={placeholder}
    >
      {value || placeholder}
    </Tag>
  );
}

interface EditableImageProps {
  src: string;
  alt?: string;
  onChange: (url: string) => void;
  className?: string;
  aspectRatio?: string;
}

export function EditableImage({ src, alt, onChange, className, aspectRatio }: EditableImageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hovering, setHovering] = useState(false);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // For now, create an object URL. In production this would upload to storage.
    // The parent component should handle actual upload logic.
    const url = URL.createObjectURL(file);
    onChange(url);
    e.target.value = '';
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Prompt for URL or file
    const choice = window.confirm('URL einfügen? (OK = URL eingeben, Abbrechen = Datei hochladen)');
    if (choice) {
      const url = window.prompt('Bild-URL eingeben:', src);
      if (url && url !== src) onChange(url);
    } else {
      inputRef.current?.click();
    }
  };

  return (
    <div
      className={`relative group cursor-pointer ${className || ''}`}
      onClick={handleClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {src ? (
        <img src={src} alt={alt || ''} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted/30 min-h-[120px]">
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      {/* Overlay */}
      <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${hovering ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-white text-sm font-medium flex items-center gap-2">
          <ImagePlus className="h-5 w-5" />
          Bild ändern
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
    </div>
  );
}
