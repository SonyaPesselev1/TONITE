interface P {
  size?: number;
  className?: string;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconBack = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const IconChevron = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export const IconClose = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconHome = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M4 10.5L12 4l8 6.5V20H4z" />
  </svg>
);

export const IconRail = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M4 6h16M4 12h16M4 18h10" />
  </svg>
);

export const IconSpark = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
    <path d="M18 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
  </svg>
);

export const IconBag = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M5 8h14l-1 12H6z" />
    <path d="M9 8V6.5a3 3 0 016 0V8" />
  </svg>
);

export const IconRoute = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <circle cx="6" cy="6" r="2.2" />
    <circle cx="18" cy="18" r="2.2" />
    <path d="M8 6h6a4 4 0 010 8H10a4 4 0 000 8h6" />
  </svg>
);

export const IconClock = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconPin = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
);

export const IconCheck = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

export const IconSwap = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" />
  </svg>
);

export const IconPlus = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconMinus = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M5 12h14" />
  </svg>
);

export const IconStar = ({ size = 13, className }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true" fill="currentColor" strokeWidth={0}>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.7l5.9-.9z" />
  </svg>
);
