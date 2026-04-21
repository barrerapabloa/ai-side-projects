/** Bold SpaceX Air logotype with tight tracking (brand only — body copy stays neutral). */
export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-[-0.09em] ${className}`}>SpaceX Air</span>
  );
}
