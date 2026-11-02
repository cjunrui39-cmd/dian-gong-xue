export type Nature = "感性" | "容性" | "谐振";

export type SeriesState = {
  u: number;
  psi: number;
  f: number;
  r: number;
  lMh: number;
  cUf: number;
};

export type ParallelState = SeriesState;

export type SeriesInput = {
  uRms: number;
  psiU: number;
  f: number;
  r: number;
  l: number;
  c: number;
};

export type SeriesResult = {
  omega: number;
  xl: number;
  xc: number;
  x: number;
  zMag: number;
  phi: number;
  nature: Nature;
  iRms: number;
  psiI: number;
  ur: number;
  ul: number;
  uc: number;
  p: number;
  q: number;
  s: number;
  pf: number;
  f0: number;
  qFactor: number;
  bandwidth: number;
};

export type ParallelResult = {
  omega: number;
  g: number;
  bl: number;
  bc: number;
  b: number;
  yMag: number;
  phiY: number;
  nature: Nature;
  iRms: number;
  psiI: number;
  ir: number;
  il: number;
  ic: number;
  p: number;
  q: number;
  s: number;
  pf: number;
  f0: number;
  qFactor: number;
  bandwidth: number;
};

const W50 = 2 * Math.PI * 50;

function mH(ohm: number): number {
  return (ohm / W50) * 1000;
}

function uF(ohm: number): number {
  return (1 / (W50 * ohm)) * 1e6;
}

export const SERIES_PRESETS: {
  id: "inductive" | "capacitive" | "resonance";
  label: string;
  hint: string;
  state: SeriesState;
}[] = [
  {
    id: "inductive",
    label: "感性",
    hint: "XL = 80 Ω，XC = 50 Ω，和 R = 40 Ω 组成 3-4-5，|Z| = 50 Ω。",
    state: { u: 220, psi: 0, f: 50, r: 40, lMh: mH(80), cUf: uF(50) },
  },
  {
    id: "capacitive",
    label: "容性",
    hint: "课本例题：U = 100 V，R = 30 Ω，XL = 40 Ω，XC = 80 Ω。",
    state: { u: 100, psi: 0, f: 50, r: 30, lMh: mH(40), cUf: uF(80) },
  },
  {
    id: "resonance",
    label: "谐振",
    hint: "XL = XC = 60 Ω，Q = 3。谐振时电感、电容电压都是电源的 3 倍。",
    state: { u: 220, psi: 30, f: 50, r: 20, lMh: mH(60), cUf: uF(60) },
  },
];

export const PARALLEL_PRESETS: {
  id: "inductive" | "capacitive" | "resonance";
  label: string;
  hint: string;
  state: ParallelState;
}[] = [
  {
    id: "inductive",
    label: "感性",
    hint: "U = 220 V，R = 40 Ω，XL = 25 Ω，XC = 100 Ω。电感支路电流大于总电流。",
    state: { u: 220, psi: 0, f: 50, r: 40, lMh: mH(25), cUf: uF(100) },
  },
  {
    id: "capacitive",
    label: "容性",
    hint: "R = 50 Ω，XL = 80 Ω，XC = 40 Ω。电流超前电压。",
    state: { u: 220, psi: 0, f: 50, r: 50, lMh: mH(80), cUf: uF(40) },
  },
  {
    id: "resonance",
    label: "谐振",
    hint: "XL = XC = 25 Ω，R = 100 Ω，Q = 4。总电流最小，支路电流是它的 4 倍。",
    state: { u: 220, psi: 0, f: 50, r: 100, lMh: mH(25), cUf: uF(25) },
  },
];

export function seriesPreset(id: SeriesStateId): SeriesState {
  const found = SERIES_PRESETS.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return { ...found.state };
}

export function parallelPreset(id: SeriesStateId): ParallelState {
  const found = PARALLEL_PRESETS.find((item) => item.id === id);
  return { ...found!.state };
}

export type SeriesStateId = (typeof SERIES_PRESETS)[number]["id"];

export function toSeriesInput(state: SeriesState): SeriesInput {
  return {
    uRms: state.u,
    psiU: state.psi,
    f: state.f,
    r: state.r,
    l: state.lMh / 1000,
    c: state.cUf * 1e-6,
  };
}

export function wrapDeg(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  if (Math.abs(d) < 1e-9) return 0;
  return d;
}

export function natureOf(inductiveMinusCap: number, scale: number): Nature {
  const eps = 1e-4 * Math.max(1, scale);
  if (Math.abs(inductiveMinusCap) <= eps) return "谐振";
  return inductiveMinusCap > 0 ? "感性" : "容性";
}

export function pfWord(nature: Nature): "滞后" | "超前" | "同相" {
  if (nature === "谐振") return "同相";
  if (nature === "感性") return "滞后";
  return "超前";
}

export function fmtFixed(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const v = Math.abs(n) < 5 * 10 ** -(digits + 1) ? 0 : n;
  return v.toFixed(digits);
}

export function fmtComplex(re: number, im: number, digits = 2): string {
  const real = fmtFixed(re, digits);
  if (Math.abs(im) < 5 * 10 ** -(digits + 1)) return `${real} + j0`;
  const imag = fmtFixed(Math.abs(im), digits);
  return im >= 0 ? `${real} + j${imag}` : `${real} − j${imag}`;
}

export function fmtPolar(mag: number, deg: number): string {
  return `${fmtFixed(mag, 2)} ∠ ${fmtFixed(deg, 1)}°`;
}

export function phaseTerm(deg: number): string {
  const d = wrapDeg(deg);
  if (Math.abs(d) < 0.05) return "";
  return d > 0 ? ` + ${fmtFixed(d, 1)}°` : ` − ${fmtFixed(Math.abs(d), 1)}°`;
}

export function analyzeSeries(input: SeriesInput): SeriesResult {
  const omega = 2 * Math.PI * input.f;
  const xl = omega * input.l;
  const xc = omega > 0 && input.c > 0 ? 1 / (omega * input.c) : Number.POSITIVE_INFINITY;
  const x = xl - xc;
  const zMag = Math.hypot(input.r, Number.isFinite(x) ? x : 0);
  const phi = (Math.atan2(Number.isFinite(x) ? x : 0, input.r) * 180) / Math.PI;
  const nature = natureOf(x, Math.max(xl, Number.isFinite(xc) ? xc : xl));
  const iRms = zMag > 0 ? input.uRms / zMag : Number.POSITIVE_INFINITY;
  const psiI = wrapDeg(input.psiU - phi);
  const ur = iRms * input.r;
  const ul = iRms * xl;
  const uc = iRms * xc;
  const p = iRms * iRms * input.r;
  const q = iRms * iRms * x;
  const s = input.uRms * iRms;
  const pf = zMag > 0 ? input.r / zMag : 1;
  const f0 =
    input.l > 0 && input.c > 0 ? 1 / (2 * Math.PI * Math.sqrt(input.l * input.c)) : Number.NaN;
  const qFactor = input.r > 0 && Number.isFinite(f0) ? (2 * Math.PI * f0 * input.l) / input.r : Number.NaN;
  const bandwidth = input.l > 0 ? input.r / (2 * Math.PI * input.l) : Number.NaN;
  return {
    omega,
    xl,
    xc,
    x,
    zMag,
    phi,
    nature,
    iRms,
    psiI,
    ur,
    ul,
    uc,
    p,
    q,
    s,
    pf,
    f0,
    qFactor,
    bandwidth,
  };
}

export function analyzeParallel(input: SeriesInput): ParallelResult {
  const omega = 2 * Math.PI * input.f;
  const g = input.r > 0 ? 1 / input.r : Number.POSITIVE_INFINITY;
  const bl = omega > 0 && input.l > 0 ? 1 / (omega * input.l) : Number.POSITIVE_INFINITY;
  const bc = omega * input.c;
  const b = bc - bl;
  const yMag = Math.hypot(Number.isFinite(g) ? g : 0, Number.isFinite(b) ? b : 0);
  const phiY = (Math.atan2(Number.isFinite(b) ? b : 0, Number.isFinite(g) ? g : 0) * 180) / Math.PI;
  const nature = natureOf(bl - bc, Math.max(bl, bc));
  const iRms = input.uRms * yMag;
  const psiI = wrapDeg(input.psiU + phiY);
  const ir = input.uRms * g;
  const il = input.uRms * bl;
  const ic = input.uRms * bc;
  const p = input.uRms * input.uRms * g;
  const q = input.uRms * input.uRms * (bl - bc);
  const s = input.uRms * iRms;
  const pf = yMag > 0 ? g / yMag : 1;
  const f0 =
    input.l > 0 && input.c > 0 ? 1 / (2 * Math.PI * Math.sqrt(input.l * input.c)) : Number.NaN;
  const omega0 = Number.isFinite(f0) ? 2 * Math.PI * f0 : Number.NaN;
  const qFactor = input.l > 0 && Number.isFinite(omega0) ? input.r / (omega0 * input.l) : Number.NaN;
  const bandwidth =
    input.r > 0 && input.c > 0 ? 1 / (2 * Math.PI * input.r * input.c) : Number.NaN;
  return {
    omega,
    g,
    bl,
    bc,
    b,
    yMag,
    phiY,
    nature,
    iRms,
    psiI,
    ir,
    il,
    ic,
    p,
    q,
    s,
    pf,
    f0,
    qFactor,
    bandwidth,
  };
}

export function frequencySweep(
  sample: (f: number) => number,
  f0: number,
  fOp: number,
  count = 100,
): { f: number; y: number }[] {
  const anchor = Number.isFinite(f0) && f0 > 0 ? f0 : Math.max(fOp, 1);
  let lo = Math.max(1, anchor * 0.15);
  let hi = anchor * 1.85;
  if (fOp < lo) lo = Math.max(1, fOp * 0.9);
  if (fOp > hi) hi = fOp * 1.08;
  if (!(hi > lo)) hi = lo + 1;
  const out: { f: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const f = lo + ((hi - lo) * i) / (count - 1);
    const y = sample(f);
    out.push({ f, y: Number.isFinite(y) ? y : 0 });
  }
  return out;
}

export function sameCircuit(a: SeriesState, b: SeriesState): boolean {
  const keys: (keyof SeriesState)[] = ["u", "psi", "f", "r", "lMh", "cUf"];
  return keys.every((key) => Math.abs(a[key] - b[key]) < 1e-6);
}
