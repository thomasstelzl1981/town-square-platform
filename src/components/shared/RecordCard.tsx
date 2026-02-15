/**
 * RecordCard — Universelle Akten-Komponente
 * 
 * Closed: Quadratisches Widget (aspect-square) mit FileDropZone
 * Open: Volle Breite, alle Felder sichtbar + editierbar
 */

import { cn } from '@/lib/utils';
import { RECORD_CARD } from '@/config/designManifest';
import { RECORD_CARD_TYPES, type RecordCardEntityType } from '@/config/recordCardManifest';
import { FileDropZone } from '@/components/dms/FileDropZone';
import { RecordCardGallery } from './RecordCardGallery';
import { EntityStorageTree } from './EntityStorageTree';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, X, Save, Loader2, FileText, Camera } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback } from 'react';

interface RecordCardFile {
  name: string;
  url?: string;
  date?: string;
  mimeType?: string;
}

interface RecordCardProps {
  id: string;
  entityType: RecordCardEntityType;
  isOpen: boolean;
  onToggle: () => void;
  /** Avatar / Thumbnail */
  thumbnailUrl?: string;
  /** Collapsed preview */
  title: string;
  subtitle?: string;
  summary?: { label: string; value: string }[];
  badges?: { label: string; variant?: 'default' | 'secondary' | 'outline' }[];
  /** Open state: All form fields as children */
  children: ReactNode;
  /** Photo gallery */
  photos?: string[];
  onPhotosChange?: (photos: string[]) => void;
  /** Data room files (legacy flat list — used when no tenantId) */
  files?: RecordCardFile[];
  onFileDrop?: (files: File[]) => void;
  /** Entity storage tree (preferred over flat files) */
  tenantId?: string;
  /** Photo drag-and-drop on closed tile */
  onPhotoDrop?: (file: File) => void;
  /** Actions */
  onSave?: () => void;
  onDelete?: () => void;
  saving?: boolean;
  className?: string;
}

export function RecordCard({
  id,
  entityType,
  isOpen,
  onToggle,
  thumbnailUrl,
  title,
  subtitle,
  summary = [],
  badges = [],
  children,
  photos = [],
  onPhotosChange,
  files = [],
  onFileDrop,
  tenantId,
  onPhotoDrop,
  onSave,
  onDelete,
  saving,
  className,
}: RecordCardProps) {
  const config = RECORD_CARD_TYPES[entityType];
  const Icon = config?.icon;

  const initials = title
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ── CLOSED STATE ──
  if (!isOpen) {
    const hasDetailedSummary = summary.length > 2;

    const card = (
      <div
        className={cn(
          hasDetailedSummary
            ? 'glass-card rounded-xl cursor-pointer transition-all hover:shadow-lg overflow-hidden relative'
            : RECORD_CARD.CLOSED,
          className,
        )}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onToggle()}
      >
        {/* Badges top */}
        {badges.length > 0 && (
          <div className="flex gap-1 absolute top-3 left-3 z-10">
            {badges.map((b, i) => (
              <Badge key={i} variant={b.variant || 'secondary'} className="text-[10px]">
                {b.label}
              </Badge>
            ))}
          </div>
        )}

        {hasDetailedSummary ? (
          /* ── Detailed: photo tile left, name + data right ── */
          <div className="p-5 pt-10 text-left">
            <div className="flex gap-4 mb-4">
              {/* Photo tile with drag-and-drop */}
              <div
                className={cn(
                  'h-20 w-20 rounded-xl shrink-0 overflow-hidden',
                  thumbnailUrl
                    ? ''
                    : 'border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 bg-muted/30',
                )}
                onDragOver={onPhotoDrop ? (e) => { e.preventDefault(); e.stopPropagation(); } : undefined}
                onDrop={onPhotoDrop ? (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) onPhotoDrop(file);
                } : undefined}
              >
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <>
                    <Camera className="h-5 w-5 text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground/50">Foto</span>
                  </>
                )}
              </div>

              {/* Name + first summary item (e.g. Geb.) */}
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <p className="text-lg font-semibold leading-tight truncate">{title}</p>
                {summary.slice(0, 1).map((s, i) => (
                  <p key={i} className="text-sm text-muted-foreground mt-0.5 truncate">
                    <span className="opacity-60">{s.label}:</span> {s.value}
                  </p>
                ))}
              </div>
            </div>

            {/* Remaining contact data */}
            <div className="space-y-1">
              {summary.slice(1).map((s, i) => (
                <p key={i} className="text-sm text-muted-foreground truncate">
                  <span className="opacity-60 inline-block w-16 shrink-0">{s.label}:</span>{' '}
                  <span className="text-foreground/90">{s.value}</span>
                </p>
              ))}
            </div>
          </div>
        ) : (
          /* ── Classic square layout ── */
          <div className="flex flex-col items-center justify-center h-full p-4 gap-3">
            <Avatar className={RECORD_CARD.THUMBNAIL}>
              <AvatarImage src={thumbnailUrl} alt={title} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="text-center">
              <p className="text-sm font-semibold leading-tight">{title}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>

            <div className="space-y-0.5 text-center">
              {summary.slice(0, 4).map((s, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  <span className="opacity-60">{s.label}:</span> {s.value}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Open indicator */}
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 absolute bottom-3 right-3" />
      </div>
    );

    if (onFileDrop) {
      return (
        <FileDropZone onDrop={onFileDrop}>
          {card}
        </FileDropZone>
      );
    }

    return card;
  }

  // ── OPEN STATE (volle Breite) ──
  return (
    <div className={cn(RECORD_CARD.OPEN, className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Gallery */}
      {(photos.length > 0 || onPhotosChange) && (
        <div className="mb-6">
          <RecordCardGallery
            photos={photos}
            onPhotosChange={onPhotosChange}
          />
        </div>
      )}

      {/* All form fields (children) — NO accordions, always visible */}
      <div className="space-y-6">
        {children}
      </div>

      {/* Data room — EntityStorageTree when tenantId available, else flat list */}
      {tenantId && config ? (
        <div className="mt-6">
          <p className={RECORD_CARD.SECTION_TITLE}>Datenraum</p>
          <EntityStorageTree
            tenantId={tenantId}
            entityType={entityType}
            entityId={id}
            moduleCode={config.moduleCode}
          />
        </div>
      ) : (files.length > 0 || onFileDrop) ? (
        <div className="mt-6">
          <p className={RECORD_CARD.SECTION_TITLE}>
            Datenraum ({files.length} {files.length === 1 ? 'Datei' : 'Dateien'})
          </p>
          <FileDropZone onDrop={onFileDrop || (() => {})}>
            <div className={RECORD_CARD.DATAROOM}>
              {files.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Dateien hierher ziehen oder klicken zum Hochladen
                </p>
              ) : (
                <div className="space-y-1.5">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{f.name}</span>
                      {f.date && (
                        <span className="text-xs text-muted-foreground shrink-0">{f.date}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FileDropZone>
        </div>
      ) : null}

      {/* Actions */}
      {(onSave || onDelete) && (
        <div className={RECORD_CARD.ACTIONS}>
          {onDelete && (
            <Button type="button" variant="outline" size="sm" onClick={onDelete}>
              Löschen
            </Button>
          )}
          {onSave && (
            <Button type="button" size="sm" onClick={onSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Speichern
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
