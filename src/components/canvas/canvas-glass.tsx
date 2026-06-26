import { cn } from "@/lib/utils";

type CanvasGlassProps = React.ComponentPropsWithoutRef<"div"> & {
  as?: "div" | "section" | "aside";
};

export function CanvasGlass({
  children,
  className,
  as: Component = "div",
  ...props
}: CanvasGlassProps) {
  return (
    <Component
      className={cn(
        "border border-white/10 bg-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
