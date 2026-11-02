import { useMemo } from "react";
import {
  PARALLEL_PRESETS,
  analyzeParallel,
  fmtComplex,
  fmtFixed,
  fmtPolar,
  frequencySweep,
  pfWord,
  phaseTerm,
  sameCircuit,
  toSeriesInput,
  type ParallelState,
} from "@/lib/ac";
import { Card, Chip, Insight, Metrics, Param, StepList } from "@/components/lab/ui";
import {
  CurrentChart,
  Legend,
  ParallelSchematic,
  VectorPlane,
  WavePair,
} from "@/components/lab/visuals";

export function ParallelPanel({
  state,
  onChange,
}: {
  state: ParallelState;
  onChange: (state: ParallelState) => void;
}) {
  const input = toSeriesInput(state);
  const result = analyzeParallel(input);
  const active = PARALLEL_PRESETS.find((item) => sameCircuit(item.state, state));
  const fMax = Math.max(400, Math.ceil(result.f0 * 1.3) || 0, Math.ceil(state.f));
  const atResonance = Math.abs(state.f - result.f0) < 0.05;
  const sweep = useMemo(
    () => frequencySweep((f) => analyzeParallel({ ...input, f }).iRms, result.f0, state.f),
    [input.uRms, input.psiU, input.r, input.l, input.c, result.f0, state.f],
  );
  const checkI = Math.hypot(result.ir, result.ic - result.il);
  const checkS = Math.hypot(result.p, result.q);
  const ilHot = result.il > result.iRms * 1.02;
  const icHot = result.ic > result.iRms * 1.02;
  const xl = state.f > 0 && state.lMh > 0 ? result.omega * (state.lMh / 1000) : Number.NaN;
  const xc = result.bc > 0 ? 1 / result.bc : Number.NaN;

  const steps = [
    {
      k: "写成相量",
      v: `电压加在三条支路两端，Ú = ${fmtPolar(state.u, state.psi)} V。并联用导纳更直接：Y = 1/Z。`,
    },
    {
      k: "电导和电纳",
      v: `G = 1/R = ${fmtFixed(result.g, 4)} S。XL = ${fmtFixed(xl)} Ω，BL = 1/XL = ${fmtFixed(result.bl, 4)} S。XC = ${fmtFixed(xc)} Ω，BC = 1/XC = ${fmtFixed(result.bc, 4)} S。`,
    },
    {
      k: "合成导纳",
      v: `B = BC − BL = ${fmtFixed(result.b, 4)} S。Y = ${fmtComplex(result.g, result.b, 4)} S = ${fmtPolar(result.yMag, result.phiY)} S。电路呈${result.nature}。`,
    },
    {
      k: "求总电流",
      v: `I = U |Y| = ${fmtFixed(result.iRms)} A，ψi = ψu + φY = ${fmtFixed(result.psiI, 1)}°。导纳角是电流超前电压的角度。`,
    },
    {
      k: "分流",
      v: `IR = U/R = ${fmtFixed(result.ir, 2)} A，IL = U/XL = ${fmtFixed(result.il, 2)} A，IC = U/XC = ${fmtFixed(result.ic, 2)} A。İ = İR + İL + İC。`,
    },
    {
      k: "功率",
      v: `P = U²/R = ${fmtFixed(result.p, 1)} W，Q = U²(BL − BC) = ${fmtFixed(result.q, 1)} var（感性为正），S = UI = ${fmtFixed(result.s, 1)} VA，λ = ${fmtFixed(result.pf, 3)}（${pfWord(result.nature)}）。`,
    },
    {
      k: "验算",
      v: `√[IR² + (IC − IL)²] = ${fmtFixed(checkI, 3)} A，应等于总电流。√(P² + Q²) = ${fmtFixed(checkS, 2)} VA，应等于 S。`,
    },
    {
      k: "谐振",
      v: `理想并联 f0 仍是 1/(2π√LC) = ${fmtFixed(result.f0, 2)} Hz。此时 BL = BC，总电流最小且等于 U/R。Q = R/(ω0L) = ${fmtFixed(result.qFactor, 2)}，Δf = 1/(2πRC) = ${fmtFixed(result.bandwidth, 2)} Hz。`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1">
        {PARALLEL_PRESETS.map((preset) => (
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
        {active ? active.hint : "自定义参数。并联时各支路电压相同，电流按导纳分配。"}
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <Card title="参数">
          <div className="space-y-1">
            <Param id="pa-u" label="电压 U" unit="V" value={state.u} min={1} max={380} digits={1} onChange={(u) => onChange({ ...state, u })} />
            <Param id="pa-psi" label="初相 ψu" unit="°" value={state.psi} min={-180} max={180} digits={0} onChange={(psi) => onChange({ ...state, psi })} />
            <Param id="pa-f" label="频率 f" unit="Hz" value={state.f} min={5} max={fMax} digits={2} onChange={(f) => onChange({ ...state, f })} />
            <Param id="pa-r" label="电阻 R" unit="Ω" value={state.r} min={1} max={400} digits={1} onChange={(r) => onChange({ ...state, r })} />
            <Param id="pa-l" label="电感 L" unit="mH" value={state.lMh} min={1} max={800} digits={2} onChange={(lMh) => onChange({ ...state, lMh })} />
            <Param id="pa-c" label="电容 C" unit="μF" value={state.cUf} min={1} max={500} digits={2} onChange={(cUf) => onChange({ ...state, cUf })} />
          </div>
        </Card>
        <div className="min-w-0 space-y-4">
          <ParallelSchematic />
          <div>
            <p className="text-base font-medium text-ink tabular-nums">
              Y = {fmtComplex(result.g, result.b, 4)} S
            </p>
            <p className="text-sm text-muted tabular-nums">= {fmtPolar(result.yMag, result.phiY)} S</p>
          </div>
          <Metrics
            items={[
              { k: "总电流 I", v: `${fmtFixed(result.iRms, 2)} A` },
              { k: "导纳角 φY", v: `${fmtFixed(result.phiY, 1)}°` },
              { k: "|Y|", v: `${fmtFixed(result.yMag, 4)} S` },
              { k: "功率因数", v: fmtFixed(result.pf, 3), s: pfWord(result.nature) },
              { k: "IR", v: `${fmtFixed(result.ir, 2)} A` },
              { k: "IL", v: `${fmtFixed(result.il, 2)} A`, hot: ilHot },
              { k: "IC", v: `${fmtFixed(result.ic, 2)} A`, hot: icHot },
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

      <Insight>{parallelInsight(result, ilHot || icHot)}</Insight>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="相量图">
          <VectorPlane
            label="并联电流相量，电压沿实轴"
            vectors={[
              { re: result.ir, im: 0, tone: "copper", label: "İR" },
              { re: 0, im: -result.il, tone: "ink", label: "İL" },
              { re: 0, im: result.ic, tone: "teal", label: "İC", dashed: true },
              {
                re: result.ir,
                im: result.ic - result.il,
                tone: "copper",
                label: "İ",
                width: 3,
              },
            ]}
          />
          <Legend
            items={[
              { tone: "copper", label: "İR 与总电流 İ" },
              { tone: "ink", label: "İL，滞后 90°" },
              { tone: "teal", label: "İC，超前 90°" },
            ]}
          />
          <p className="mt-2 text-xs text-pretty text-muted">
            实轴就是电压的方向。电感电流向下，电容电流向上，总电流是三条支路合成后的方向。长度按电流画，不和电压放在同一把尺子上。
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
        title="总电流随频率"
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
          <div className="rounded-xl bg-paper px-3 py-2">
            <p className="text-xs text-muted">f0</p>
            <p className="font-medium tabular-nums">{fmtFixed(result.f0, 2)} Hz</p>
          </div>
          <div className="rounded-xl bg-paper px-3 py-2">
            <p className="text-xs text-muted">Q</p>
            <p className="font-medium tabular-nums">{fmtFixed(result.qFactor, 2)}</p>
          </div>
          <div className="rounded-xl bg-paper px-3 py-2">
            <p className="text-xs text-muted">Δf</p>
            <p className="font-medium tabular-nums">{fmtFixed(result.bandwidth, 2)} Hz</p>
          </div>
        </div>
        <CurrentChart rows={sweep} f0={result.f0} marker={{ f: state.f, y: result.iRms }} yLabel="I" />
        <p className="mt-2 text-xs text-pretty text-muted">
          电压源供电时，并联谐振的总电流最小，谷底在 f0。电感电流和电容电流彼此抵消，电源只供给电阻上的有功电流。
        </p>
      </Card>
    </div>
  );
}

function parallelInsight(result: ReturnType<typeof analyzeParallel>, over: boolean): string {
  const bits: string[] = [];
  if (result.nature === "谐振") {
    bits.push(
      `正在谐振：BL = BC，总电流最小，等于电阻电流 ${fmtFixed(result.ir, 2)} A。IL 和 IC 都是 ${fmtFixed(result.il, 2)} A，约为总电流的 Q = ${fmtFixed(result.qFactor, 2)} 倍，但方向相反。`,
    );
  } else if (over) {
    bits.push("支路电流可以大于总电流。İL 与 İC 反相，加总时抵消掉一截，剩下的才是电源送出的电流。");
  }
  if (result.nature === "感性") {
    bits.push(`BL > BC，电流滞后电压 ${fmtFixed(Math.abs(result.phiY), 1)}°。`);
  }
  if (result.nature === "容性") {
    bits.push(`BC > BL，电流超前电压 ${fmtFixed(Math.abs(result.phiY), 1)}°。`);
  }
  bits.push("注意和串联相反：同样是电压源，并联谐振时电流是谷而不是峰。");
  return bits.join("");
}
