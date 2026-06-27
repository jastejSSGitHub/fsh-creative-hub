import { canvasGlassClass, type CanvasGlassVariant } from "@/lib/canvas/glass-styles";
import { cn } from "@/lib/utils";

type CanvasGlassProps = React.ComponentPropsWithoutRef<"div"> & {
  as?: "div" | "section" | "aside";
  themeMode?: "light" | "dark";
  variant?: CanvasGlassVariant;
};

export function CanvasGlass({
  children,
  className,
  as: Component = "div",
  themeMode = "dark",
  variant = "panel",
  ...props
}: CanvasGlassProps) {
  return (
    <Component
      className={cn(canvasGlassClass(themeMode, variant), className)}
      {...props}
    >
      {children}
    </Component>
  );
}
