import { useEffect, useRef, useState } from "react";

const PATH = "M34 148 C 96 148, 92 92, 150 84 S 226 76, 288 34";

/** An abstract courier route: boutique, city, doorstep. */
export function RouteMap({ fraction, label }: { fraction: number; label: string }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pt, setPt] = useState({ x: 34, y: 148 });

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    const p = path.getPointAtLength(len * Math.min(1, Math.max(0, fraction)));
    setPt({ x: p.x, y: p.y });
  }, [fraction]);

  return (
    <div className="routemap">
      <svg viewBox="0 0 320 180" role="img" aria-label={`Courier route — ${label}`}>
        <g stroke="rgba(247,245,241,0.09)" strokeWidth="1">
          {[24, 60, 96, 132, 168].map((y) => (
            <line key={y} x1="0" y1={y} x2="320" y2={y} />
          ))}
          {[40, 96, 152, 208, 264].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="180" />
          ))}
        </g>
        <g fill="rgba(247,245,241,0.05)">
          <rect x="46" y="28" width="42" height="26" rx="1" />
          <rect x="176" y="104" width="56" height="34" rx="1" />
          <rect x="232" y="60" width="30" height="22" rx="1" />
        </g>

        <path ref={pathRef} d={PATH} fill="none" stroke="rgba(247,245,241,0.22)" strokeWidth="1.5" strokeDasharray="3 5" pathLength={1} />
        <path
          d={PATH}
          fill="none"
          stroke="var(--bone)"
          strokeWidth="1.8"
          pathLength={1}
          strokeDasharray={`${Math.min(1, Math.max(0, fraction))} 1`}
        />

        <g>
          <circle cx="34" cy="148" r="4.5" fill="none" stroke="var(--bone)" strokeWidth="1.4" />
          <text x="34" y="168" className="routemap-label" textAnchor="middle">
            BOUTIQUE
          </text>
        </g>
        <g>
          <circle cx="288" cy="34" r="4.5" fill="var(--bone)" />
          <text x="288" y="18" className="routemap-label" textAnchor="middle">
            YOU
          </text>
        </g>

        <g className="routemap-courier" transform={`translate(${pt.x} ${pt.y})`}>
          <circle r="11" fill="rgba(216,64,47,0.18)" />
          <circle r="5" fill="var(--signal)" />
        </g>
      </svg>
    </div>
  );
}
