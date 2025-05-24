import { cn } from "@/lib/utils";

export interface MaterialTypeBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  color: string;
}

export function MaterialTypeBadge({
  className,
  name,
  color,
  ...props
}: MaterialTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-1 text-xs font-medium text-white rounded-full",
        className
      )}
      style={{ backgroundColor: color }}
      {...props}
    >
      {name}
    </span>
  );
}

export default MaterialTypeBadge;