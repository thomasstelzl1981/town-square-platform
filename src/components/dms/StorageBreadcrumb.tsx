import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

interface BreadcrumbSegment {
  id: string | null;
  label: string;
}

interface StorageBreadcrumbProps {
  segments: BreadcrumbSegment[];
  onNavigate: (nodeId: string | null) => void;
}

export function StorageBreadcrumb({ segments, onNavigate }: StorageBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {segments.length === 0 ? (
            <BreadcrumbPage className="flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" />
              Alle Dokumente
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate(null); }}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" />
              Alle Dokumente
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {segments.map((seg, i) => (
          <span key={seg.id ?? i} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {i === segments.length - 1 ? (
                <BreadcrumbPage>{seg.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href="#"
                  onClick={(e) => { e.preventDefault(); onNavigate(seg.id); }}
                  className="cursor-pointer"
                >
                  {seg.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
