import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OCCASIONS, STORES_BY_ID, APPAREL_SIZES, SHOE_SIZES } from "../data/stores";
import type { OccasionId, Product, SlotId, Vibe } from "../data/types";
import { listOf, money } from "../lib/format";
import { load, save } from "../lib/persist";
import { alternatives, buildLooks, DEFAULT_BRIEF, resolveSize } from "../lib/recommend";
import type { Brief, Look, LookPiece } from "../lib/recommend";
import { useInventoryVersion } from "../lib/useInventory";
import { GarmentPlate } from "../components/GarmentPlate";
import { Sheet } from "../components/Sheet";
import { TopBar, Toast } from "../components/Chrome";
import { IconCheck, IconClock, IconSpark, IconSwap } from "../components/icons";
import { useCart } from "../state/CartContext";
import { useProfile } from "../state/ProfileContext";

const BRIEF_KEY = "tonite.brief.v1";

const VIBES: { id: Vibe; name: string; line: string; hue: [string, string] }[] = [
  { id: "noir", name: "Noir", line: "Black, sharp, unbothered", hue: ["#3a3a41", "#121215"] },
  { id: "neutral", name: "Quiet", line: "Bone, ecru, tailoring", hue: ["#ded7c8", "#b3a892"] },
  { id: "bold", name: "Loud", line: "One colour, all the way up", hue: ["#d0512f", "#8d2116"] },
  { id: "metallic", name: "Shine", line: "Chrome, foil, sequin", hue: ["#c9ccd2", "#7b7f88"] },
  { id: "romantic", name: "Soft", line: "Silk, rosette, bias cut", hue: ["#e0bfbb", "#a56d72"] },
];

const URGENCIES: { id: Brief["urgency"]; name: string; line: string }[] = [
  { id: "asap", name: "Right now", line: "Nearest rails only, fastest couriers" },
  { id: "tonight", name: "Before nine", line: "Balanced — range and speed" },
  { id: "flexible", name: "Later tonight", line: "Open it up to every boutique" },
];

const EXTRAS: { id: SlotId; name: string }[] = [
  { id: "shoes", name: "Shoes" },
  { id: "bag", name: "Bag" },
  { id: "jewelry", name: "Jewellery" },
  { id: "layer", name: "A coat" },
];

const BUDGETS = [400, 700, 1000, 1500, 2500];

export default function BuildLook() {
  const { profile, setSizes } = useProfile();
  const { addMany } = useCart();
  const navigate = useNavigate();
  const version = useInventoryVersion();

  const [brief, setBrief] = useState<Brief>(() => ({
    ...load(BRIEF_KEY, DEFAULT_BRIEF),
    sizes: profile.sizes,
  }));
  const [step, setStep] = useState(0);
  const [seed, setSeed] = useState(1);
  const [done, setDone] = useState(false);
  const [swapping, setSwapping] = useState<{ look: Look; piece: LookPiece } | null>(null);
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    save(BRIEF_KEY, brief);
  }, [brief]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const patch = (p: Partial<Brief>) => setBrief((b) => ({ ...b, ...p }));

  // `version` is the live-inventory clock: the stylist reads the shop floor, so a
  // sell-out has to restyle the set even though the brief has not changed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const baseLooks = useMemo(() => (done ? buildLooks(brief, seed) : []), [
    done,
    brief,
    seed,
    version,
  ]);

  /** User swaps are applied on top of the generated set. */
  const looks: Look[] = useMemo(
    () =>
      baseLooks.map((look) => {
        const pieces = look.pieces.map((piece) => {
          const swapId = swaps[`${look.id}:${piece.slot}:${piece.product.category}`];
          if (!swapId) return piece;
          const replacement = alternatives(look, piece.slot, brief).find((p) => p.id === swapId);
          if (!replacement) return piece;
          const size = resolveSize(replacement, brief);
          if (!size) return piece;
          return { product: replacement, size: size.size, exact: size.exact, slot: piece.slot };
        });
        return {
          ...look,
          pieces,
          total: pieces.reduce((n, p) => n + p.product.price, 0),
          storeIds: [...new Set(pieces.map((p) => p.product.storeId))],
        };
      }),
    [baseLooks, swaps, brief],
  );

  const addLook = useCallback(
    (look: Look) => {
      const res = addMany(
        look.pieces.map((p) => ({ productId: p.product.id, size: p.size })),
        { lookTitle: look.title },
      );
      setToast(
        res.missed
          ? `${res.added} pieces held — ${res.missed} sold out while you decided`
          : `“${look.title}” is in your bag, held for 20 minutes`,
      );
    },
    [addMany],
  );

  if (!done) {
    return (
      <BriefWizard
        brief={brief}
        step={step}
        setStep={setStep}
        patch={patch}
        onSizes={(s) => {
          setSizes(s);
          patch({ sizes: { ...brief.sizes, ...s } });
        }}
        onFinish={() => {
          setSeed((n) => n + 1);
          setDone(true);
        }}
      />
    );
  }

  return (
    <div className="screen look">
      <TopBar title="Build my look" back={false} />
      <header className="pad look-head">
        <p className="eyebrow">
          {OCCASIONS.find((o) => o.id === brief.occasion)?.name} ·{" "}
          {VIBES.find((v) => v.id === brief.vibe)?.name} · under {money(brief.budget)}
        </p>
        <h1 className="display d2">
          Three looks,
          <br />
          <span className="italic">all deliverable tonight.</span>
        </h1>
        <div className="look-head-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setDone(false)}>
            Edit brief
          </button>
          <button
            className="btn btn-quiet btn-sm"
            onClick={() => {
              setSwaps({});
              setSeed((n) => n + 1);
            }}
          >
            <IconSpark size={14} /> Restyle
          </button>
        </div>
      </header>

      {!looks.length && (
        <div className="pad empty-block">
          <p className="display d3">Nothing clears the brief.</p>
          <p className="meta">
            Widen the budget or the timing — the rails within range are thin in your size right now.
          </p>
          <button className="btn btn-primary btn-block" onClick={() => setDone(false)}>
            Edit the brief
          </button>
        </div>
      )}

      <div className="look-list">
        {looks.map((look) => (
          <LookCard
            key={look.id}
            look={look}
            budget={brief.budget}
            onSwap={(piece) => setSwapping({ look, piece })}
            onAdd={() => addLook(look)}
          />
        ))}
      </div>

      {looks.length > 0 && (
        <div className="pad look-foot">
          <p className="meta">
            Every piece above is held on a real rail in your size. Sizes shown are live — if one goes
            while you are deciding, the look restyles itself.
          </p>
          <button className="btn btn-ghost btn-block" onClick={() => navigate("/shop")}>
            Browse everything instead
          </button>
        </div>
      )}

      <Sheet
        open={Boolean(swapping)}
        onClose={() => setSwapping(null)}
        title={swapping ? `Swap ${swapping.piece.product.category}` : ""}
      >
        {swapping && (
          <SwapList
            options={alternatives(swapping.look, swapping.piece.slot, brief)}
            currentId={swapping.piece.product.id}
            onPick={(p) => {
              setSwaps((s) => ({
                ...s,
                [`${swapping.look.id}:${swapping.piece.slot}:${swapping.piece.product.category}`]: p.id,
              }));
              setSwapping(null);
            }}
          />
        )}
      </Sheet>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

/* ── The look card ──────────────────────────────────────────────────── */

function LookCard({
  look,
  budget,
  onSwap,
  onAdd,
}: {
  look: Look;
  budget: number;
  onSwap: (piece: LookPiece) => void;
  onAdd: () => void;
}) {
  const [added, setAdded] = useState(false);
  const stores = look.storeIds.map((id) => STORES_BY_ID[id]?.name).filter(Boolean) as string[];

  return (
    <article className="look-card">
      <header className="look-card-head">
        <div>
          <h2 className="display d3">{look.title}</h2>
          <p className="meta">{look.line}</p>
        </div>
        <span className="look-match num">{look.match}%</span>
      </header>

      <div className="look-strip">
        {look.pieces.map((piece) => (
          <div key={`${piece.slot}-${piece.product.id}`} className="look-piece">
            <Link to={`/product/${piece.product.id}`} className="look-piece-plate">
              <GarmentPlate
                category={piece.product.category}
                colorway={piece.product.colorway}
                ratio="3 / 4"
              />
            </Link>
            <button className="look-piece-swap" onClick={() => onSwap(piece)} aria-label="Swap piece">
              <IconSwap size={13} />
            </button>
            <p className="eyebrow look-piece-slot">{piece.slot === "anchor" ? piece.product.category : piece.slot}</p>
            <p className="look-piece-name">{piece.product.name}</p>
            <p className="meta">
              {piece.size}
              {!piece.exact && <span className="look-piece-flag"> · nearest fit</span>} ·{" "}
              {money(piece.product.price)}
            </p>
          </div>
        ))}
      </div>

      <p className="look-caption meta">{look.note}</p>

      <footer className="look-card-foot">
        <div>
          <p className="display d4">
            {money(look.total)}
            {look.total > budget && (
              <span className="look-over"> {money(look.total - budget)} over</span>
            )}
          </p>
          <p className="meta">
            <IconClock size={12} /> {look.etaLow}–{look.etaHigh} min · {listOf(stores)}
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            onAdd();
            setAdded(true);
            setTimeout(() => setAdded(false), 2400);
          }}
        >
          {added ? (
            <>
              <IconCheck size={14} /> Added
            </>
          ) : (
            `Add all ${look.pieces.length}`
          )}
        </button>
      </footer>
    </article>
  );
}

function SwapList({
  options,
  currentId,
  onPick,
}: {
  options: Product[];
  currentId: string;
  onPick: (p: Product) => void;
}) {
  if (!options.length) return <p className="empty">Nothing else in your size tonight.</p>;
  return (
    <div className="swap-list">
      {options.map((p) => (
        <button key={p.id} className="swap-row" onClick={() => onPick(p)} disabled={p.id === currentId}>
          <span className="swap-plate">
            <GarmentPlate category={p.category} colorway={p.colorway} ratio="1 / 1" />
          </span>
          <span className="swap-body">
            <span className="eyebrow">{STORES_BY_ID[p.storeId]?.name}</span>
            <span className="p-name">{p.name}</span>
            <span className="meta">
              {money(p.price)} · {p.colorway.name}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── The brief ──────────────────────────────────────────────────────── */

function BriefWizard({
  brief,
  step,
  setStep,
  patch,
  onSizes,
  onFinish,
}: {
  brief: Brief;
  step: number;
  setStep: (n: number) => void;
  patch: (p: Partial<Brief>) => void;
  onSizes: (s: Partial<Brief["sizes"]>) => void;
  onFinish: () => void;
}) {
  const steps = 5;
  const next = () => (step === steps - 1 ? onFinish() : setStep(step + 1));

  return (
    <div className="screen wizard">
      <TopBar
        title={`Step ${step + 1} of ${steps}`}
        back={false}
        right={
          <button className="icon-btn label" onClick={onFinish}>
            Skip
          </button>
        }
      />
      <div className="wizard-progress">
        {Array.from({ length: steps }, (_, i) => (
          <span key={i} className="wizard-tick" data-on={i <= step} />
        ))}
      </div>

      <div className="pad wizard-body">
        {step === 0 && (
          <>
            <h1 className="display d2">Where are you going?</h1>
            <p className="meta wizard-sub">The room decides the shape of everything else.</p>
            <div className="opt-list">
              {OCCASIONS.map((o) => (
                <button
                  key={o.id}
                  className="opt"
                  data-on={brief.occasion === o.id}
                  onClick={() => patch({ occasion: o.id as OccasionId })}
                >
                  <span className="opt-main">{o.name}</span>
                  <span className="meta">{o.kicker}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="display d2">How do you want to read?</h1>
            <p className="meta wizard-sub">One direction — we will hold the rest of the look to it.</p>
            <div className="vibe-grid">
              {VIBES.map((v) => (
                <button
                  key={v.id}
                  className="vibe"
                  data-on={brief.vibe === v.id}
                  onClick={() => patch({ vibe: v.id })}
                >
                  <span
                    className="vibe-swatch"
                    style={{ background: `linear-gradient(150deg, ${v.hue[0]}, ${v.hue[1]})` }}
                  />
                  <span className="opt-main">{v.name}</span>
                  <span className="meta">{v.line}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="display d2">Your sizes.</h1>
            <p className="meta wizard-sub">
              We only propose pieces that are physically on a rail in these sizes.
            </p>
            <SizeRow
              label="Tops & dresses"
              scale={APPAREL_SIZES}
              value={brief.sizes.top}
              onChange={(v) => onSizes({ top: v })}
            />
            <SizeRow
              label="Bottoms"
              scale={APPAREL_SIZES}
              value={brief.sizes.bottom}
              onChange={(v) => onSizes({ bottom: v })}
            />
            <SizeRow
              label="Shoes (EU)"
              scale={SHOE_SIZES}
              value={brief.sizes.shoe}
              onChange={(v) => onSizes({ shoe: v })}
            />
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="display d2">What is the ceiling?</h1>
            <p className="meta wizard-sub">Total for the whole look, delivery included later.</p>
            <div className="budget-list">
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  className="opt"
                  data-on={brief.budget === b}
                  onClick={() => patch({ budget: b })}
                >
                  <span className="opt-main">Under {money(b)}</span>
                  <span className="meta">
                    {b <= 400
                      ? "One good piece and the right shoe"
                      : b <= 700
                        ? "A complete look with room to move"
                        : b <= 1000
                          ? "Designer anchor, considered finish"
                          : "No compromises anywhere"}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="display d2">When do you need it?</h1>
            <div className="opt-list">
              {URGENCIES.map((u) => (
                <button
                  key={u.id}
                  className="opt"
                  data-on={brief.urgency === u.id}
                  onClick={() => patch({ urgency: u.id })}
                >
                  <span className="opt-main">{u.name}</span>
                  <span className="meta">{u.line}</span>
                </button>
              ))}
            </div>
            <p className="label wizard-extras-label">Finish it with</p>
            <div className="tag-row">
              {EXTRAS.map((e) => (
                <button
                  key={e.id}
                  className="chip"
                  data-on={e.id === "shoes" || brief.extras.includes(e.id)}
                  disabled={e.id === "shoes"}
                  onClick={() =>
                    patch({
                      extras: brief.extras.includes(e.id)
                        ? brief.extras.filter((x) => x !== e.id)
                        : [...brief.extras, e.id],
                    })
                  }
                >
                  {e.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="sticky-bar">
        {step > 0 ? (
          <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
            Back
          </button>
        ) : (
          <span />
        )}
        <button className="btn btn-primary sticky-bar-btn" onClick={next}>
          {step === steps - 1 ? "Style me" : "Continue"}
        </button>
      </div>
    </div>
  );
}

function SizeRow({
  label,
  scale,
  value,
  onChange,
}: {
  label: string;
  scale: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="size-row">
      <p className="label size-row-label">{label}</p>
      <div className="size-row-scale">
        {scale.map((s) => (
          <button key={s} className="size-pill" data-on={value === s} onClick={() => onChange(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
