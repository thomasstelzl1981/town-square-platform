import { File, FileText, Image, FileSpreadsheet, type LucideIcon } from 'lucide-react';

/** Unified file icon based on MIME type */
export function getFileIcon(mime?: string): LucideIcon {
  if (!mime) return File;
  if (mime.startsWith('image/')) return Image;
  if (mime.includes('pdf')) return FileText;
  if (mime.includes('sheet') || mime.includes('excel')) return FileSpreadsheet;
  return File;
}

/** Format bytes to human-readable size */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/** Format date short: 10.02.2026 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Format date with time: 10.02.2026, 14:30 */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format MIME type to short label */
export function formatType(mime?: string): string {
  if (!mime) return '—';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.startsWith('image/')) return mime.split('/')[1]?.toUpperCase() || 'Bild';
  if (mime.includes('sheet') || mime.includes('excel')) return 'Excel';
  if (mime.includes('word') || mime.includes('document')) return 'Word';
  return mime.split('/')[1]?.toUpperCase() || '—';
}
