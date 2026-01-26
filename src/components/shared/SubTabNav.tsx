import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SubTab {
  title: string;
  route: string;
}

interface SubTabNavProps {
  tabs: SubTab[];
  className?: string;
}

export function SubTabNav({ tabs, className }: SubTabNavProps) {
  const location = useLocation();
  
  if (tabs.length === 0) return null;

  return (
    <nav className={cn('flex gap-1 rounded-lg bg-muted p-1', className)}>
      {tabs.map(tab => {
        const isActive = location.pathname === tab.route;
        return (
          <Link
            key={tab.route}
            to={tab.route}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition-colors',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            {tab.title}
          </Link>
        );
      })}
    </nav>
  );
}
