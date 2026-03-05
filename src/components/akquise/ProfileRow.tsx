export function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] px-3 py-2 text-sm">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function formatPriceRange(min?: number | null, max?: number | null): string {
  const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} Mio €` : `${(n / 1_000).toFixed(0)}T €`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `ab ${fmt(min)}`;
  if (max) return `bis ${fmt(max)}`;
  return '–';
}
