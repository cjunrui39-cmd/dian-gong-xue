import { useMemo } from "react";
import {
  SERIES_PRESETS,
  analyzeSeries,
  fmtComplex,
  fmtFixed,
  fmtPolar,
  frequencySweep,
  pfWord,
  phaseTerm,
  sameCircuit,
  toSeriesInput,
  type SeriesState,
} from "@/lib/ac";
import { Card, Chip, Insight, Metrics, Param, StepList } from "@/components/lab/ui";
import {
  CurrentChart,
  Legend,
  SeriesSchematic,
  VectorPlane,
  WavePair,
} from "@/components/lab/visuals";

export function SeriesPanel({
  state,
  onChange,
}: {
  state: SeriesState;
  onChange: (state: SeriesState) => void;
}) {
  const input = toSeriesInput(state);
  const result = analyzeSeries(input);
  const active = SERIES_PRESETS.find((item) => sameCircuit(item.state, state));
  const fMax = Math.max(400, Math.ceil(result.f0 * 1.3) || 0, Math.ceil(state.f));
  const atResonance = Math.abs(state.f - result.f0) < 0.05;
  const sweep = useMemo(
    () =>
      frequencySweep((f) => analyzeSeries({ ...input, f }).iRms, result.f0, state.f),
    [input.uRms, input.psiU, input.r, input.l, input.c, result.f0, state.f],
  );
  const checkV = Math.hypot(result.ur, result.ul - result.uc);
  const checkS = Math.hypot(result.p, result.q);
  const ulHot = result.ul > state.u * 1.02;
  const ucHot = result.uc > state.u * 1.02;

  const steps = [
    {
      k: "写成相量",
      v: `Ú = ${fmtPolar(state.u, state.psi)} V，即 u = ${fmtFixed(state.u * Math.SQRT2, 1)} sin(2π·${fmtFixed(state.f, 2)} t${phaseTerm(state.psi)}) V。`,
    },
    {
      k: "算电抗",
      v: `L = ${fmtFixed(state.lMh, 2)} mH = ${fmtFixed(state.lMh / 1000, 4)} H，XL = ωL = ${fmtFixed(result.xl)} Ω。C = ${fmtFixed(state.cUf, 2)} μF，XC = 1/(ωC) = ${fmtFixed(result.xc)} Ω。`,
    },
    {
      k: "合成阻抗",
      v: `X = XL − XC = ${fmtFixed(result.x)} Ω，电路呈${result.nature}。Z = ${fmtComplex(state.r, result.x)} Ω = ${fmtPolar(result.zMag, result.phi)} Ω。`,
    },
    {
      k: "求电流",
      v: `I = U / |Z| = ${fmtFixed(result.iRms)} A，ψi = ψu − φ = ${fmtFixed(result.psiI, 1)}°。İ = ${fmtPolar(result.iRms, result.psiI)} A。`,
    },
    {
      k: "分压",
      v: `UR = IR = ${fmtFixed(result.ur, 1)} V，UL = IXL = ${fmtFixed(result.ul, 1)} V，UC = IXC = ${fmtFixed(result.uc, 1)} V。三者满足 Ú = ÚR + ÚL + ÚC。`,
    },
    {
      k: "功率",
      v: `P = I²R = ${fmtFixed(result.p, 1)} W，Q = I²X = ${fmtFixed(result.q, 1)} var（感性为正），S = UI = ${fmtFixed(result.s, 1)} VA，λ = cosφ = ${fmtFixed(result.pf, 3)}（${pfWord(result.nature)}）。`,
    },
    {
      k: "验算",
      v: `√[UR² + (UL − UC)²] = ${fmtFixed(checkV, 2)} V，应等于 U。√(P² + Q²) = ${fmtFixed(checkS, 2)} VA，应等于 S。`,
    },
    {
      k: "谐振",
      v: `f0 = 1/(2π√LC) = ${fmtFixed(result.f0, 2)} Hz，与 R 无关。Q = ω0L / R = ${fmtFixed(result.qFactor, 2)}，通频带 Δf = R/(2πL) = ${fmtFixed(result.bandwidth, 2)} Hz。`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1">
        {SERIES_PRESETS.map((preset) => (
          <Chip
            key={preset.id}
            active={active?.id === preset.id}
            onClick={() => onChange({ ...preset.state })}
          >
            {preset.label}
          </Chip>
        ))}
      </div>
      <p className="text-sm text-pretty text-muted">
        {active ? active.hint : "自定义参数。串联电路各元件电流相同，电压按阻抗分配。"}
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <Card title="参数">
          <div className="space-y-1">
            <Param id="se-u" label="电压 U" unit="V" value={state.u} min={1} max={380} digits={1} onChange={(u) => onChange({ ...state, u })} />
            <Param id="se-psi" label="初相 ψu" unit="°" value={state.psi} min={-180} max={180} digits={0} onChange={(psi) => onChange({ ...state, psi })} />
            <Param id="se-f" label="频率 f" unit="Hz" value={state.f} min={5} max={fMax} digits={2} onChange={(f) => onChange({ ...state, f })} />
            <Param id="se-r" label="电阻 R" unit="Ω" value={state.r} min={1} max={400} digits={1} onChange={(r) => onChange({ ...state, r })} />
            <Param id="se-l" label="电感 L" unit="mH" value={state.lMh} min={1} max={800} digits={2} onChange={(lMh) => onChange({ ...state, lMh })} />
            <Param id="se-c" label="电容 C" unit="μF" value={state.cUf} min={1} max={500} digits={2} onChange={(cUf) => onChange({ ...state, cUf })} />
          </div>
        </Card>
        <div className="min-w-0 space-y-4">
          <SeriesSchematic />
          <div>
            <p className="text-base font-medium text-ink tabular-nums">
              Z = {fmtComplex(state.r, result.x)} Ω
            </p>
            <p className="text-sm text-muted tabular-nums">= {fmtPolar(result.zMag, result.phi)} Ω</p>
          </div>
          <Metrics
            items={[
              { k: "电流 I", v: `${fmtFixed(result.iRms, 2)} A` },
              { k: "阻抗角 φ", v: `${fmtFixed(result.phi, 1)}°` },
              { k: "|Z|", v: `${fmtFixed(result.zMag, 2)} Ω` },
              { k: "功率因数", v: fmtFixed(result.pf, 3), s: pfWord(result.nature) },
              { k: "UR", v: `${fmtFixed(result.ur, 1)} V` },
              { k: "UL", v: `${fmtFixed(result.ul, 1)} V`, hot: ulHot },
              { k: "UC", v: `${fmtFixed(result.uc, 1)} V`, hot: ucHot },
              { k: "性质", v: result.nature },
            ]}
          />
          <p className="text-sm text-muted tabular-nums">
            P = {fmtFixed(result.p, 1)} W · Q = {fmtFixed(result.q, 1)} var · S = {fmtFixed(result.s, 1)} VA
          </p>
          <p className="text-sm text-pretty text-ink tabular-nums">
            u = {fmtFixed(state.u * Math.SQRT2, 1)} sin(2π·{fmtFixed(state.f, 2)} t{phaseTerm(state.psi)}) V
            <br />
            i = {fmtFixed(result.iRms * Math.SQRT2, 2)} sin(2π·{fmtFixed(state.f, 2)} t{phaseTerm(result.psiI)}) A
          </p>
        </div>
      </div>

      <Insight>{seriesInsight(state, result, ulHot || ucHot)}</Insight>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="相量图">
          <VectorPlane
            label="串联电压相量，电流沿实轴"
            vectors={[
              { re: result.ur, im: 0, tone: "copper", label: "ÚR" },
              { re: 0, im: result.ul, tone: "ink", label: "ÚL" },
              { re: 0, im: -result.uc, tone: "teal", label: "ÚC", dashed: true },
              {
                re: result.ur,
                im: result.ul - result.uc,
                tone: "teal",
                label: "Ú",
                width: 3,
              },
            ]}
          />
          <Legend
            items={[
              { tone: "copper", label: "ÚR，与电流同相" },
              { tone: "ink", label: "ÚL，超前 90°" },
              { tone: "teal", label: "ÚC（虚线）与总电压 Ú" },
            ]}
          />
          <p className="mt-2 text-xs text-pretty text-muted">
            实轴就是电流的方向。各电压从同一点画出：ÚL 向上，ÚC 向下，Ú 是它们和 ÚR 合成后的方向，不是三段长度直接相加。
          </p>
        </Card>
        <Card title="谁超前">
          <WavePair phaseU={state.psi} phaseI={result.psiI} />
        </Card>
      </div>

      <Card title="求解步骤">
        <StepList items={steps} />
      </Card>

      <Card
        title="电流随频率"
        action={
          <button
            type="button"
            disabled={atResonance}
            className="h-11 rounded-full bg-teal px-4 text-sm font-medium text-sheet disabled:opacity-50"
            onClick={() => onChange({ ...state, f: result.f0 })}
          >
            {atResonance ? "已在谐振" : "调到谐振"}
          </button>
        }
      >
        <div className="mb-3 grid grid-cols-3 gap-2 text-sm">
          <Stat k="f0" v={`${fmtFixed(result.f0, 2)} Hz`} />
          <Stat k="Q" v={fmtFixed(result.qFactor, 2)} />
          <Stat k="Δf" v={`${fmtFixed(result.bandwidth, 2)} Hz`} />
        </div>
        <CurrentChart
          rows={sweep}
          f0={result.f0}
          marker={{ f: state.f, y: result.iRms }}
          yLabel="I"
        />
        <p className="mt-2 text-xs text-pretty text-muted">
          纵轴是电流有效值。青绿竖线是 f0，虚线是当前频率。串联谐振时阻抗最小，电流最大，而且只剩下电阻。
        </p>
      </Card>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-paper px-3 py-2">
      <p className="text-xs text-muted">{k}</p>
      <p className="font-medium text-ink tabular-nums">{v}</p>
    </div>
  );
}

function seriesInsight(
  state: SeriesState,
  result: ReturnType<typeof analyzeSeries>,
  over: boolean,
): string {
  const bits: string[] = [];
  if (result.nature === "谐振") {
    bits.push(
      `正在谐振：XL = XC，İ 与 Ú 同相，电源电压全部落在电阻上。Q = ${fmtFixed(result.qFactor, 2)}，所以 UL 和 UC 仍有 ${fmtFixed(result.ul, 1)} V。`,
    );
  } else if (over) {
    bits.push(
      "分电压大于电源是正常的。ÚL 与 ÚC 反相，相加时互相抵消，总电压只等于没抵消完的那一段。",
    );
  }
  if (result.nature === "感性") {
    bits.push(`XL > XC，电流滞后电压 ${fmtFixed(Math.abs(result.phi), 1)}°。`);
  }
  if (result.nature === "容性") {
    bits.push(`XC > XL，电流超前电压 ${fmtFixed(Math.abs(result.phi), 1)}°。`);
  }
  bits.push(`有功只消耗在电阻上，P = ${fmtFixed(result.p, 1)} W；电抗只和电源交换无功。`);
  void state;
  return bits.join("");
}
