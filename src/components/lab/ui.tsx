import type { ReactNode } from "react";
import type { Nature } from "@/lib/ac";
import { fmtFixed } from "@/lib/ac";

export function Card({
  title,
  action,
  children,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-line bg-sheet p-4">
      {title ? (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-lg text-balance text-ink">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "h-11 shrink-0 rounded-full bg-teal px-4 text-sm font-medium text-sheet"
          : "h-11 shrink-0 rounded-full border border-line bg-sheet px-4 text-sm font-medium text-ink"
      }
    >
      {children}
    </button>
  );
}

export function Param({
  id,
  label,
  unit,
  value,
  min,
  max,
  onChange,
  digits = 2,
}: {
  id: string;
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  digits?: number;
}) {
  const shown = Number(value.toFixed(digits));
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="block min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2 text-sm">
          <span className="text-ink">{label}</span>
          <span className="text-muted">{unit}</span>
        </span>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step="any"
          value={Math.min(max, Math.max(min, value))}
          aria-valuetext={`${fmtFixed(value, digits)} ${unit}`}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={digits >= 2 ? 0.1 : 1}
        value={shown}
        aria-label={label}
        autoComplete="off"
        className="h-11 w-28 shrink-0 rounded-xl border border-line bg-paper px-2 text-right text-base text-ink tabular-nums"
        onChange={(event) => {
          const next = Number(event.target.value);
          if (!Number.isFinite(next)) return;
          onChange(Math.min(max, Math.max(min, next)));
        }}
      />
    </div>
  );
}

export function Metrics({
  items,
}: {
  items: { k: string; v: string; s?: string; hot?: boolean }[];
}) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.k} className="bg-sheet px-3 py-3">
          <dt className="text-xs text-muted">{item.k}</dt>
          <dd
            className={`mt-1 text-lg font-medium tabular-nums ${item.hot ? "text-copper" : "text-ink"}`}
          >
            {item.v}
          </dd>
          {item.s ? <p className="text-xs text-teal">{item.s}</p> : null}
        </div>
      ))}
    </dl>
  );
}

export function StepList({ items }: { items: { k: string; v: string }[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={item.k} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-soft text-sm font-medium text-teal tabular-nums">
            {index + 1}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink">{item.k}</span>
            <span className="block text-sm text-pretty break-words text-muted tabular-nums">
              {item.v}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function Insight({ children }: { children: ReactNode }) {
  return (
    <aside className="rounded-2xl border border-line bg-teal-soft px-4 py-3 text-sm text-pretty text-ink">
      {children}
    </aside>
  );
}

export function NatureBadge({ nature }: { nature: Nature }) {
  const className =
    nature === "感性"
      ? "bg-copper-soft text-copper"
      : nature === "容性"
        ? "bg-teal-soft text-teal"
        : "bg-paper text-ink";
  return (
    <span className={`inline-flex h-7 items-center rounded-full px-3 text-sm font-medium ${className}`}>
      {nature}
    </span>
  );
}

export function Figure({ children }: { children: ReactNode }) {
  return <div className="rounded-xl bg-paper p-2">{children}</div>;
}
