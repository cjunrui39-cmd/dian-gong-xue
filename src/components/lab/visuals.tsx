import { useEffect, useId, useState, type ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtFixed } from "@/lib/ac";
import { Figure } from "@/components/lab/ui";

export type Tone = "copper" | "teal" | "ink";

const toneClass: Record<Tone, string> = {
  copper: "text-copper",
  teal: "text-teal",
  ink: "text-ink",
};

const toneFill: Record<Tone, string> = {
  copper: "var(--color-copper)",
  teal: "var(--color-teal)",
  ink: "var(--color-ink)",
};

function zigzag(x: number, y: number, w: number, h: number, n = 6): string {
  let d = `M ${x} ${y}`;
  for (let i = 0; i < n; i++) {
    const px = x + (w * (i + 0.5)) / n;
    const py = y + (i % 2 === 0 ? -h : h);
    d += ` L ${px.toFixed(2)} ${py.toFixed(2)}`;
  }
  d += ` L ${x + w} ${y}`;
  return d;
}

function coils(x: number, y: number, w: number, n = 4): string {
  const cw = w / n;
  let d = "";
  for (let i = 0; i < n; i++) {
    const start = x + cw * i;
    d += `M ${start} ${y} a ${cw / 2} ${cw / 2} 0 0 1 ${cw} 0 `;
  }
  return d;
}

function Marker({ id, tone }: { id: string; tone: Tone }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
      <path d="M0,0 L8,3 L0,6 Z" fill={toneFill[tone]} />
    </marker>
  );
}

export function SymbolR() {
  return (
    <svg viewBox="0 0 72 36" className="h-10 w-16 text-copper" aria-hidden="true">
      <path d={zigzag(6, 18, 60, 8)} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function SymbolL() {
  return (
    <svg viewBox="0 0 72 36" className="h-10 w-16 text-ink" aria-hidden="true">
      <path d={coils(6, 12, 60, 4)} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function SymbolC() {
  return (
    <svg viewBox="0 0 72 36" className="h-10 w-16 text-teal" aria-hidden="true">
      <line x1="4" y1="18" x2="30" y2="18" stroke="currentColor" strokeWidth="2" />
      <line x1="30" y1="7" x2="30" y2="29" stroke="currentColor" strokeWidth="2" />
      <line x1="38" y1="7" x2="38" y2="29" stroke="currentColor" strokeWidth="2" />
      <line x1="38" y1="18" x2="68" y2="18" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

type Vector = {
  re: number;
  im: number;
  tone: Tone;
  label: string;
  dashed?: boolean;
  width?: number;
};

export function VectorPlane({
  vectors,
  project = false,
  label,
}: {
  vectors: Vector[];
  project?: boolean;
  label: string;
}) {
  const uid = useId().replace(/:/g, "");
  const width = 320;
  const height = 260;
  const cx = 160;
  const cy = 128;
  const radius = 96;
  const reach = Math.max(1e-6, ...vectors.map((vector) => Math.hypot(vector.re, vector.im)));
  const mapPoint = (re: number, im: number) => {
    const x = cx + (re / reach) * radius;
    const y = cy - (im / reach) * radius;
    return [x, y] as const;
  };

  return (
    <Figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={label}>
        <defs>
          <Marker id={`${uid}-copper`} tone="copper" />
          <Marker id={`${uid}-teal`} tone="teal" />
          <Marker id={`${uid}-ink`} tone="ink" />
        </defs>
        <line x1="36" y1={cy} x2="284" y2={cy} stroke="var(--color-line)" />
        <line x1={cx} y1="28" x2={cx} y2="228" stroke="var(--color-line)" />
        {project
          ? vectors.map((vector) => {
              const [x, y] = mapPoint(vector.re, vector.im);
              return (
                <line
                  key={`${vector.label}-proj`}
                  x1={x}
                  y1={y}
                  x2={cx}
                  y2={y}
                  stroke={toneFill[vector.tone]}
                  strokeDasharray="3 4"
                  strokeWidth="1"
                  opacity="0.7"
                />
              );
            })
          : null}
        {vectors.map((vector, index) => {
          const [x, y] = mapPoint(vector.re, vector.im);
          const dx = x - cx;
          const dy = y - cy;
          const norm = Math.hypot(dx, dy) || 1;
          const side = index % 2 === 0 ? 1 : -1;
          const lx = clamp(x + (dx / norm) * 6 + (-dy / norm) * 16 * side, 18, width - 18);
          const ly = clamp(y + (dy / norm) * 6 + (dx / norm) * 16 * side, 16, height - 16);
          return (
            <g key={vector.label} className={toneClass[vector.tone]}>
              <line
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="currentColor"
                strokeWidth={vector.width ?? 2.25}
                strokeDasharray={vector.dashed ? "5 4" : undefined}
                markerEnd={`url(#${uid}-${vector.tone})`}
              />
              <text x={lx} y={ly} textAnchor="middle" fontSize="13" fill="currentColor">
                {vector.label}
              </text>
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}

export function ChainDiagram({
  arms,
  resultLabel,
  resultTone,
  referenceLabel,
  referenceTone,
  label,
}: {
  arms: Vector[];
  resultLabel: string;
  resultTone: Tone;
  referenceLabel?: string;
  referenceTone?: Tone;
  label: string;
}) {
  const uid = useId().replace(/:/g, "");
  const width = 320;
  const height = 280;
  const cx = 160;
  const cy = 142;
  const radius = 104;
  const points: { re: number; im: number }[] = [{ re: 0, im: 0 }];
  for (const arm of arms) {
    const prev = points[points.length - 1]!;
    points.push({ re: prev.re + arm.re, im: prev.im + arm.im });
  }
  const end = points[points.length - 1]!;
  const reach = Math.max(
    1e-6,
    ...points.flatMap((point) => [Math.abs(point.re), Math.abs(point.im)]),
  );
  const map = (re: number, im: number) =>
    [cx + (re / reach) * radius, cy - (im / reach) * radius] as const;
  const resultLen = Math.hypot(end.re, end.im);

  return (
    <Figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={label}>
        <defs>
          <Marker id={`${uid}-copper`} tone="copper" />
          <Marker id={`${uid}-teal`} tone="teal" />
          <Marker id={`${uid}-ink`} tone="ink" />
        </defs>
        <line x1="28" y1={cy} x2="292" y2={cy} stroke="var(--color-line)" />
        <line x1={cx} y1="22" x2={cx} y2="246" stroke="var(--color-line)" />
        {resultLen > reach * 0.02 ? (
          <line
            x1={map(0, 0)[0]}
            y1={map(0, 0)[1]}
            x2={map(end.re, end.im)[0]}
            y2={map(end.re, end.im)[1]}
            className={toneClass[resultTone]}
            stroke="currentColor"
            strokeWidth="3"
            markerEnd={`url(#${uid}-${resultTone})`}
          />
        ) : null}
        {arms.map((arm, index) => {
          const a = points[index]!;
          const b = points[index + 1]!;
          const len = Math.hypot(arm.re, arm.im);
          if (len < reach * 0.015) return null;
          const [x1, y1] = map(a.re, a.im);
          const [x2, y2] = map(b.re, b.im);
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const norm = Math.hypot(dx, dy) || 1;
          const flip = index % 2 === 0 ? 1 : -1;
          const ox = (-dy / norm) * 16 * flip;
          const oy = (dx / norm) * 16 * flip;
          return (
            <g key={arm.label} className={toneClass[arm.tone]}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={arm.dashed ? "5 4" : undefined}
                markerEnd={`url(#${uid}-${arm.tone})`}
              />
              <text
                x={clamp(mx + ox, 16, width - 16)}
                y={clamp(my + oy, 16, height - 12)}
                textAnchor="middle"
                fontSize="12"
                fill="currentColor"
              >
                {arm.label}
              </text>
            </g>
          );
        })}
        {resultLen > reach * 0.02 ? (
          <text
            x={clamp(map(end.re, end.im)[0] + 10, 20, width - 28)}
            y={clamp(map(end.re, end.im)[1] - 12, 18, height - 18)}
            fontSize="13"
            fill={toneFill[resultTone]}
          >
            {resultLabel}
          </text>
        ) : null}
        {referenceLabel && referenceTone ? (
          <text x={18} y={cy + 20} fontSize="12" fill={toneFill[referenceTone]}>
            {referenceLabel}
          </text>
        ) : null}
      </svg>
    </Figure>
  );
}

const CYCLES = 2;

export function Waveform({
  phaseU,
  phaseI,
  playhead,
  label,
}: {
  phaseU: number;
  phaseI: number;
  playhead: number;
  label: string;
}) {
  const plot = { x: 28, y: 16, w: 304, h: 96 };
  const zero = plot.y + plot.h / 2;
  const pathFor = (phase: number) => {
    let d = "";
    const samples = 160;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const value = Math.sin(2 * Math.PI * CYCLES * t + (phase * Math.PI) / 180);
      const x = plot.x + plot.w * t;
      const y = zero - value * (plot.h / 2) * 0.86;
      d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)} `;
    }
    return d;
  };
  const dot = (phase: number) => {
    const value = Math.sin(2 * Math.PI * CYCLES * playhead + (phase * Math.PI) / 180);
    return {
      x: plot.x + plot.w * playhead,
      y: zero - value * (plot.h / 2) * 0.86,
    };
  };
  const uDot = dot(phaseU);
  const iDot = dot(phaseI);

  return (
    <Figure>
      <svg viewBox="0 0 360 148" className="h-auto w-full" role="img" aria-label={label}>
        <line
          x1={plot.x}
          y1={zero}
          x2={plot.x + plot.w}
          y2={zero}
          stroke="var(--color-line)"
        />
        {[0, 0.5, 1].map((mark) => (
          <line
            key={mark}
            x1={plot.x + plot.w * mark}
            y1={plot.y}
            x2={plot.x + plot.w * mark}
            y2={plot.y + plot.h}
            stroke="var(--color-line)"
          />
        ))}
        <path d={pathFor(phaseU)} fill="none" stroke="var(--color-teal)" strokeWidth="2" />
        <path d={pathFor(phaseI)} fill="none" stroke="var(--color-copper)" strokeWidth="2" />
        <line
          x1={uDot.x}
          y1={plot.y}
          x2={uDot.x}
          y2={plot.y + plot.h}
          stroke="var(--color-ink)"
          strokeDasharray="3 3"
        />
        <circle cx={uDot.x} cy={uDot.y} r="4" fill="var(--color-teal)" />
        <circle cx={iDot.x} cy={iDot.y} r="4" fill="var(--color-copper)" />
        <text x={plot.x} y="136" fontSize="12" fill="var(--color-muted)">
          0
        </text>
        <text x={plot.x + plot.w / 2} y="136" textAnchor="middle" fontSize="12" fill="var(--color-muted)">
          T
        </text>
        <text x={plot.x + plot.w} y="136" textAnchor="end" fontSize="12" fill="var(--color-muted)">
          2T
        </text>
      </svg>
    </Figure>
  );
}

export function usePlayhead(playing: boolean) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setPhase((value) => (value + dt * 0.16) % 1);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  return [phase, setPhase] as const;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function PlayButton({
  playing,
  onToggle,
}: {
  playing: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="h-11 rounded-full border border-line bg-sheet px-4 text-sm font-medium text-ink"
    >
      {playing ? "暂停" : "播放"}
    </button>
  );
}

export function WavePair({ phaseU, phaseI }: { phaseU: number; phaseI: number }) {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = usePlayhead(playing);
  useEffect(() => {
    if (!reduced) setPlaying(true);
  }, [reduced]);

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-ink">波形</h3>
        <PlayButton playing={playing} onToggle={() => setPlaying((value) => !value)} />
      </div>
      <Waveform
        phaseU={phaseU}
        phaseI={phaseI}
        playhead={playhead}
        label="电压与电流波形，两条曲线各自按峰值归一，只用来比较相位"
      />
      <label className="mt-2 block text-xs text-muted" htmlFor="wave-scrub">
        拖动时刻
        <input
          id="wave-scrub"
          type="range"
          min={0}
          max={1}
          step="any"
          value={playhead}
          onChange={(event) => {
            setPlaying(false);
            setPlayhead(Number(event.target.value));
          }}
        />
      </label>
      <p className="text-xs text-pretty text-muted">
        青线是电压，铜线是电流。纵轴各自归一，不代表真实幅值。谁先到波峰，谁的相位超前。
      </p>
    </div>
  );
}

export function SeriesSchematic() {
  return (
    <Figure>
      <svg viewBox="0 0 420 150" className="h-auto w-full text-ink" role="img" aria-label="RLC 串联电路">
        <path
          d="M48 28 H92 M168 28 H188 M292 28 H320 M332 28 H380 V122 H48 V108 M48 68 V28"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="48" cy="88" r="20" fill="var(--color-paper)" stroke="currentColor" strokeWidth="2" />
        <path d={miniSine(48, 88)} fill="none" stroke="var(--color-teal)" strokeWidth="1.6" />
        <path d={zigzag(92, 28, 76, 8)} fill="none" className="text-copper" stroke="currentColor" strokeWidth="2" />
        <path d={coils(188, 28, 104, 4)} fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="320" y1="12" x2="320" y2="44" className="text-teal" stroke="currentColor" strokeWidth="2" />
        <line x1="332" y1="12" x2="332" y2="44" className="text-teal" stroke="currentColor" strokeWidth="2" />
        <text x="130" y="18" textAnchor="middle" fontSize="13" fill="var(--color-copper)">
          R
        </text>
        <text x="240" y="14" textAnchor="middle" fontSize="13" fill="var(--color-ink)">
          L
        </text>
        <text x="326" y="58" textAnchor="middle" fontSize="13" fill="var(--color-teal)">
          C
        </text>
        <text x="48" y="124" textAnchor="middle" fontSize="12" fill="var(--color-muted)">
          u
        </text>
        <text x="210" y="112" textAnchor="middle" fontSize="12" fill="var(--color-copper)">
          i →
        </text>
      </svg>
    </Figure>
  );
}

export function ParallelSchematic() {
  return (
    <Figure>
      <svg viewBox="0 0 420 196" className="h-auto w-full text-ink" role="img" aria-label="RLC 并联电路">
        <path
          d="M56 98 H64 M64 36 H150 M230 36 H360 V160 H64 V36 M64 98 H150 M250 98 H360 M64 160 H184 M198 160 H360"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="36" cy="98" r="20" fill="var(--color-paper)" stroke="currentColor" strokeWidth="2" />
        <path d="M36 78 V118" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d={miniSine(36, 98)} fill="none" stroke="var(--color-teal)" strokeWidth="1.6" />
        <path d={zigzag(150, 36, 80, 8)} fill="none" className="text-copper" stroke="currentColor" strokeWidth="2" />
        <path d={coils(150, 98, 100, 4)} fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="184" y1="146" x2="184" y2="174" className="text-teal" stroke="currentColor" strokeWidth="2" />
        <line x1="198" y1="146" x2="198" y2="174" className="text-teal" stroke="currentColor" strokeWidth="2" />
        <text x="190" y="24" textAnchor="middle" fontSize="13" fill="var(--color-copper)">
          R
        </text>
        <text x="200" y="86" textAnchor="middle" fontSize="13" fill="var(--color-ink)">
          L
        </text>
        <text x="191" y="190" textAnchor="middle" fontSize="13" fill="var(--color-teal)">
          C
        </text>
        <text x="36" y="132" textAnchor="middle" fontSize="12" fill="var(--color-muted)">
          u
        </text>
      </svg>
    </Figure>
  );
}

function miniSine(cx: number, cy: number): string {
  const w = 22;
  const h = 7;
  let d = "";
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    const x = cx - w / 2 + w * t;
    const y = cy - Math.sin(t * Math.PI * 2) * h;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d;
}

export function Legend({
  items,
}: {
  items: { tone: Tone; label: string }[];
}) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className={`inline-block h-0.5 w-4 rounded-full ${swatch(item.tone)}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function swatch(tone: Tone): string {
  if (tone === "copper") return "bg-copper";
  if (tone === "teal") return "bg-teal";
  return "bg-ink";
}

function ChartFrame({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return <div className="h-56 w-full min-w-0">{ready ? children : null}</div>;
}

const tooltipStyle = {
  background: "var(--color-sheet)",
  border: "1px solid var(--color-line)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--color-ink)",
};

export function ReactanceChart({
  rows,
  f0,
  f,
}: {
  rows: { f: number; xl: number; xc: number }[];
  f0: number;
  f: number;
}) {
  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-line)" />
          <XAxis
            dataKey="f"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(value: number) => fmtFixed(value, 0)}
            stroke="var(--color-muted)"
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
          />
          <YAxis
            width={48}
            tickFormatter={(value: number) => fmtFixed(value, 0)}
            stroke="var(--color-muted)"
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
          />
          <Tooltip
            formatter={(value, name) => [
              `${fmtFixed(Number(value), 1)} Ω`,
              name === "xl" ? "XL" : "XC",
            ]}
            labelFormatter={(label) => `${fmtFixed(Number(label), 1)} Hz`}
            contentStyle={tooltipStyle}
          />
          <ReferenceLine x={f0} stroke="var(--color-teal)" />
          <ReferenceLine x={f} stroke="var(--color-ink)" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="xl"
            name="xl"
            stroke="var(--color-copper)"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="xc"
            name="xc"
            stroke="var(--color-teal)"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function CurrentChart({
  rows,
  f0,
  marker,
  yLabel,
}: {
  rows: { f: number; y: number }[];
  f0: number;
  marker: { f: number; y: number };
  yLabel: string;
}) {
  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-line)" />
          <XAxis
            dataKey="f"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(value: number) => fmtFixed(value, 0)}
            stroke="var(--color-muted)"
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
          />
          <YAxis
            width={48}
            tickFormatter={(value: number) => fmtFixed(value, 1)}
            stroke="var(--color-muted)"
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => [`${fmtFixed(Number(value), 3)} A`, yLabel]}
            labelFormatter={(label) => `${fmtFixed(Number(label), 1)} Hz`}
            contentStyle={tooltipStyle}
          />
          <ReferenceLine x={f0} stroke="var(--color-teal)" />
          <ReferenceLine x={marker.f} stroke="var(--color-ink)" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="y"
            name="i"
            stroke="var(--color-copper)"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <ReferenceDot
            x={marker.f}
            y={marker.y}
            r={4}
            fill="var(--color-copper)"
            stroke="var(--color-sheet)"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
