import React from 'react';

interface AcqSectionHeaderProps {
  number: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function AcqSectionHeader({ number, title, description, icon }: AcqSectionHeaderProps) {
  return (
    <div className="flex items-start gap-3 pt-2">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
        {number}
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
