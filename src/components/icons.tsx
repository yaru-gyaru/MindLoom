type IconName =
  | "grid"
  | "map"
  | "layers"
  | "sparkles"
  | "search"
  | "bell"
  | "arrow"
  | "chevron"
  | "clock"
  | "check"
  | "play"
  | "book"
  | "flame"
  | "target"
  | "more"
  | "lock"
  | "info"
  | "download"
  | "sliders";

const shapes: Record<IconName, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  map: <><circle cx="5" cy="6" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="M7 6h10M6 8l5 8m7-8-5 8" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  sparkles: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3ZM19 18l.5 1.5L21 20l-1.5.5L19 22l-.5-1.5L17 20l1.5-.5L19 18Z" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
  arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  play: <path d="m8 5 11 7-11 7V5Z" />,
  book: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H21v18H6.5A2.5 2.5 0 0 0 4 22V4.5Z" /><path d="M4 18a2.5 2.5 0 0 1 2.5-2.5H21" /></>,
  flame: <path d="M12 22c4.4 0 7-3 7-7 0-3-2-5.5-3-6-1 3-3 3-3 3 0-4-1.5-7-4-10 0 5-4 7-4 12 0 5 2.8 8 7 8Z" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  download: <><path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4" /></>,
  sliders: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2" fill="currentColor" stroke="none" /><circle cx="16" cy="17" r="2" fill="currentColor" stroke="none" /></>,
};

export function Icon({ name, size = 20, className = "" }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {shapes[name]}
    </svg>
  );
}
