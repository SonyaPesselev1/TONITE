import { useEffect } from "react";
import type { ReactNode } from "react";
import { IconClose } from "./icons";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet-root" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "Sheet"}>
      <div className="sheet-scrim" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-head">
          <span className="label">{title}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
