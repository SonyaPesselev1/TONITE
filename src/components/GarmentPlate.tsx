import { useId } from "react";
import type { CategoryId, Colorway } from "../data/types";

/**
 * Every piece is rendered as a studio plate: a drawn silhouette filled with
 * the real colourway. No photography, no network — the catalogue ships with
 * the app and still reads as a lookbook.
 */
export function GarmentPlate({
  category,
  colorway,
  ratio = "4 / 5",
  dim = false,
}: {
  category: CategoryId;
  colorway: Colorway;
  ratio?: string;
  dim?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  // Silver and chrome disappear on a bone backdrop, so metals get a deeper one.
  const backdrop = colorway.finish === "metal" ? "#d3cfc6" : "var(--plate-bg, #eceae4)";
  const g = `g-${uid}`;
  const sheen = `s-${uid}`;
  const shade = `d-${uid}`;

  return (
    <div className="plate" style={{ aspectRatio: ratio }} data-dim={dim || undefined}>
      <svg viewBox="0 0 300 400" role="img" aria-label={`${colorway.name} ${category}`}>
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colorway.to} />
            <stop offset="52%" stopColor={colorway.from} />
            <stop offset="100%" stopColor={colorway.to} />
          </linearGradient>
          <linearGradient id={sheen} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.34" />
            <stop offset="38%" stopColor="#fff" stopOpacity="0" />
            <stop offset="72%" stopColor="#fff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id={shade} cx="0.5" cy="0.42" r="0.75">
            <stop offset="0%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.14" />
          </radialGradient>
        </defs>

        <rect width="300" height="400" fill={backdrop} />
        <rect width="300" height="400" fill={`url(#${shade})`} />

        <g fill={`url(#${g})`} stroke="rgba(0,0,0,0.16)" strokeWidth="0.75">
          <Silhouette category={category} />
        </g>

        {colorway.finish !== "matte" && (
          <g clipPath="none" opacity={colorway.finish === "metal" ? 0.85 : 0.7}>
            <g fill={`url(#${sheen})`}>
              <Silhouette category={category} />
            </g>
          </g>
        )}

        <g stroke="rgba(0,0,0,0.14)" strokeWidth="0.9" fill="none">
          <Folds category={category} />
        </g>
      </svg>
    </div>
  );
}

function Silhouette({ category }: { category: CategoryId }) {
  switch (category) {
    case "dresses":
      return (
        <path d="M120 86c10 9 50 9 60 0l16 14c8 7 10 14 8 24l-12 46 16 174c1 8-4 12-12 12H104c-8 0-13-4-12-12l16-174-12-46c-2-10 0-17 8-24z" />
      );
    case "tops":
      return (
        <path d="M118 96c10 8 54 8 64 0l26 16c7 4 9 10 7 17l-11 34-6-4 6 96c0 6-3 9-9 9h-90c-6 0-9-3-9-9l6-96-6 4-11-34c-2-7 0-13 7-17z" />
      );
    case "bottoms":
      return (
        <path d="M104 108h92l6 32-10 4-4 200c0 6-3 8-9 8h-22c-6 0-8-3-9-8l-4-104-4 104c-1 5-3 8-9 8h-22c-6 0-9-2-9-8l-4-200-10-4z" />
      );
    case "outerwear":
      return (
        <path d="M124 84c8 10 44 10 52 0l32 18c9 5 12 12 12 22l4 78-22 6 8 158c1 8-4 12-12 12H102c-8 0-13-4-12-12l8-158-22-6 4-78c0-10 3-17 12-22z" />
      );
    case "shoes":
      return (
        <path d="M56 292c0-16 8-25 25-30 38-12 68-33 89-64 16-24 26-50 30-74h44c5 42 3 80-6 114-4 16-9 30-14 42H70c-9 0-14-4-14-12zM202 274h20l14 84h-22z" />
      );
    case "bags":
      return (
        <path d="M92 168h116c9 0 14 5 15 14l14 130c1 10-4 16-14 16H77c-10 0-15-6-14-16l14-130c1-9 6-14 15-14z" />
      );
    case "jewelry":
      return (
        <path d="M150 128c34 0 62 28 62 63s-28 63-62 63-62-28-62-63 28-63 62-63zm0 34c-16 0-29 13-29 29s13 29 29 29 29-13 29-29-13-29-29-29z" />
      );
    default:
      return null;
  }
}

function Folds({ category }: { category: CategoryId }) {
  switch (category) {
    case "dresses":
      return (
        <>
          <path d="M150 96v270" />
          <path d="M126 150c-4 60-8 140-10 214" />
          <path d="M174 150c4 60 8 140 10 214" />
        </>
      );
    case "tops":
      return (
        <>
          <path d="M118 96c8 16 46 16 64 0" />
          <path d="M150 116v130" />
        </>
      );
    case "bottoms":
      return (
        <>
          <path d="M104 140h92" />
          <path d="M150 148v96" />
        </>
      );
    case "outerwear":
      return (
        <>
          <path d="M124 84l26 46 26-46" />
          <path d="M150 130v218" />
          <path d="M110 200h-6M196 200h6" />
        </>
      );
    case "shoes":
      return (
        <>
          <path d="M200 124c-6 34-14 62-24 84" />
          <path d="M60 280h136" />
        </>
      );
    case "bags":
      return (
        <>
          <path d="M107 168v-22c0-24 19-42 43-42s43 18 43 42v22" strokeWidth="7" />
          <path d="M63 214h174" />
        </>
      );
    case "jewelry":
      return <path d="M150 128c0-22-4-34-14-40" strokeWidth="4" />;
    default:
      return null;
  }
}
