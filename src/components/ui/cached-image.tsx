/**
 * CachedImage — Image component with signed-URL caching and skeleton loading.
 * Uses the centralized imageCache for deduplication and TTL caching.
 */
import { useState, useEffect } from 'react';
import { getCachedSignedUrl } from '@/lib/imageCache';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CachedImageProps {
  filePath: string;
  alt?: string;
  className?: string;
  bucket?: string;
  fallbackIcon?: React.ReactNode;
  /** If a pre-resolved URL is already available, skip cache lookup */
  resolvedUrl?: string;
}

export function CachedImage({
  filePath,
  alt = '',
  className,
  bucket = 'tenant-documents',
  fallbackIcon,
  resolvedUrl,
}: CachedImageProps) {
  const [url, setUrl] = useState<string | null>(resolvedUrl || null);
  const [isLoading, setIsLoading] = useState(!resolvedUrl);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (resolvedUrl) {
      setUrl(resolvedUrl);
      setIsLoading(false);
      return;
    }

    if (!filePath) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    let cancelled = false;

    getCachedSignedUrl(filePath, bucket).then((signedUrl) => {
      if (cancelled) return;
      if (signedUrl) {
        setUrl(signedUrl);
      } else {
        setHasError(true);
      }
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [filePath, bucket, resolvedUrl]);

  if (isLoading) {
    return <Skeleton className={cn('w-full h-full', className)} />;
  }

  if (hasError || !url) {
    return (
      <div className={cn('w-full h-full flex items-center justify-center bg-muted', className)}>
        {fallbackIcon || <ImageIcon className="w-8 h-8 text-muted-foreground" />}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
    />
  );
}
