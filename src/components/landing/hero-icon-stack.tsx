import { cn } from "@/lib/utils";

type HeroIcon = {
  id: string;
  ring: string;
  fill?: string;
  children: React.ReactNode;
};

const HERO_ICONS: HeroIcon[] = [
  {
    id: "editor",
    ring: "#3A86FF",
    children: (
      <svg viewBox="0 0 40 40" className="size-full" aria-hidden>
        <circle cx="20" cy="16" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M10 34c2-6 6-9 10-9s8 3 10 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M14 14c1.5-1 3-1 4 0" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "reviewer",
    ring: "#0b0b0b",
    children: (
      <svg viewBox="0 0 40 40" className="size-full" aria-hidden>
        <circle cx="20" cy="15" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17" cy="14" r="1" fill="currentColor" />
        <circle cx="23" cy="14" r="1" fill="currentColor" />
        <path d="M17 18c1.5 1.5 4.5 1.5 6 0" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path
          d="M11 33c2.5-5.5 6-8 9-8s6.5 2.5 9 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "image",
    ring: "#E85D4C",
    fill: "#E85D4C",
    children: (
      <svg viewBox="0 0 40 40" className="size-full text-white" aria-hidden>
        <rect x="11" y="13" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16" cy="18" r="2" fill="currentColor" />
        <path d="M11 24l5-4 4 3 3-2 6 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "video",
    ring: "#ffc94b",
    children: (
      <svg viewBox="0 0 40 40" className="size-full" aria-hidden>
        <rect x="10" y="14" width="14" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M24 17l8-4v14l-8-4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "comment",
    ring: "#0b0b0b",
    children: (
      <svg viewBox="0 0 40 40" className="size-full" aria-hidden>
        <path
          d="M12 12h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9l-5 4v-4h-2a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M16 18h8M16 22h5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "reaction",
    ring: "#3A86FF",
    fill: "#3A86FF",
    children: (
      <svg viewBox="0 0 40 40" className="size-full text-white" aria-hidden>
        <path
          d="M20 30c-6-4-10-8-10-13a6 6 0 0 1 10-4 6 6 0 0 1 10 4c0 5-4 9-10 13z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M14 14c1 2 2.5 3 6 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "project",
    ring: "#E85D4C",
    children: (
      <svg viewBox="0 0 40 40" className="size-full" aria-hidden>
        <path
          d="M12 16h16v14a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V16z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M12 16l8-5 8 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M18 22h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

type HeroIconStackProps = {
  className?: string;
};

export function HeroIconStack({ className }: HeroIconStackProps) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      aria-hidden
    >
      {HERO_ICONS.map((icon, index) => (
        <div
          key={icon.id}
          className={cn(
            "relative -ml-3.5 first:ml-0 flex size-11 items-center justify-center rounded-full border-[2.5px] bg-hub-paper text-hub-espresso shadow-[0_2px_8px_rgba(11,11,11,0.08)] sm:-ml-4 sm:size-12",
          )}
          style={{
            borderColor: icon.ring,
            backgroundColor: icon.fill ?? undefined,
            color: icon.fill ? "#fbf7ee" : "#0b0b0b",
            zIndex: HERO_ICONS.length - index,
          }}
        >
          <div className="size-7 sm:size-8">{icon.children}</div>
        </div>
      ))}
    </div>
  );
}
