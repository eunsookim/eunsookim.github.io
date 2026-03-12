import { cn } from "@/lib/utils";

interface GlassmorphismCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassmorphismCard({
  children,
  className,
  hover = true,
}: GlassmorphismCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl p-4 transition-all duration-300",
        hover && "hover:-translate-y-1 hover:glow-primary-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
