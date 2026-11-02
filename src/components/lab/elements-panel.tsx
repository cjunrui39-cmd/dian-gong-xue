import { useMemo, useState, type ReactNode } from "react";
import {
  fmtComplex,
  fmtFixed,
  seriesPreset,
  type SeriesState,
} from "@/lib/ac";
import { Card, Insight, Param } from "@/components/lab/ui";
import { ReactanceChart, SymbolC, SymbolL, SymbolR, VectorPlane } from "@/components/lab/visuals";

export function ElementsPanel() {
  const seed = seriesPreset("inductive");
  const [state, setState] = useState<Pick<SeriesState, "f" | "r" | "lMh" | "cUf">>({
    f: seed.f,
    r: seed.r,
    lMh: seed.lMh,
    cUf: seed.cUf,
  });

  const omega = 2 * Math.PI * state.f;
  const xl = omega * (state.lMh / 1000);
  const xc = 1 / (omega * (state.cUf * 1e-6));
  const f0 = 1 / (2 * Math.PI * Math.sqrt((state.lMh / 1000) * (state.cUf * 1e-6)));

  const rows = useMemo(() => {
    const l = state.lMh / 1000;
    const c = state.cUf * 1e-6;
    const resonance = 1 / (2 * Math.PI * Math.sqrt(l * c));
    let lo = Math.max(5, resonance * 0.25);
    let hi = resonance * 3;
    if (state.f < lo) lo = Math.max(1, state.f * 0.85);
    if (state.f > hi) hi = state.f * 1.1;
    const next: { f: number; xl: number; xc: number }[] = [];
    for (let i = 0; i < 80; i++) {
      const freq = lo + ((hi - lo) * i) / 79;
      const w = 2 * Math.PI * freq;
      next.push({ f: freq, xl: w * l, xc: 1 / (w * c) });
    }
    return next;
  }, [state.f, state.lMh, state.cUf]);

  const patch = (partial: Partial<typeof state>) => setState((prev) => ({ ...prev, ...partial }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-pretty text-muted">
        三个理想元件是相量法的积木。下面都把电流画在实轴上，看电压被转到哪里。
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        <ElementCard
          symbol={<SymbolR />}
          name="电阻 R"
          domain="u = R i"
          phasor="Ú = R İ"
          impedance={`Z = ${fmtFixed(state.r, 2)} Ω`}
          note="电压与电流同相，阻抗是实数，不随频率变。"
          vectors={[
            { re: 1, im: 0, tone: "copper", label: "İ" },
            { re: 0.72, im: 0, tone: "teal", label: "Ú" },
          ]}
        />
        <ElementCard
          symbol={<SymbolL />}
          name="电感 L"
          domain="u = L di/dt"
          phasor="Ú = jωL İ"
          impedance={`Z = j${fmtFixed(xl, 2)} Ω`}
          note="电压超前电流 90°。频率越高，感抗越大。"
          vectors={[
            { re: 1, im: 0, tone: "copper", label: "İ" },
            { re: 0, im: 0.86, tone: "teal", label: "Ú" },
          ]}
        />
        <ElementCard
          symbol={<SymbolC />}
          name="电容 C"
          domain="i = C du/dt"
          phasor="Ú = İ / (jωC)"
          impedance={`Z = −j${fmtFixed(xc, 2)} Ω`}
          note="电压滞后电流 90°。频率越高，容抗越小。"
          vectors={[
            { re: 1, im: 0, tone: "copper", label: "İ" },
            { re: 0, im: -0.86, tone: "teal", label: "Ú" },
          ]}
        />
      </div>

      <Card title="感抗和容抗怎样随频率走">
        <div className="space-y-1">
          <Param id="el-f" label="频率 f" unit="Hz" value={state.f} min={5} max={Math.max(400, state.f, f0 * 1.4)} digits={1} onChange={(f) => patch({ f })} />
          <Param id="el-l" label="电感 L" unit="mH" value={state.lMh} min={1} max={800} digits={1} onChange={(lMh) => patch({ lMh })} />
          <Param id="el-c" label="电容 C" unit="μF" value={state.cUf} min={1} max={500} digits={1} onChange={(cUf) => patch({ cUf })} />
          <Param id="el-r" label="电阻 R" unit="Ω" value={state.r} min={1} max={400} digits={1} onChange={(r) => patch({ r })} />
        </div>
        <div className="mt-3">
          <ReactanceChart rows={rows} f0={f0} f={state.f} />
        </div>
        <p className="mt-2 text-xs text-pretty text-muted">
          铜线是 XL，青线是 XC。青绿竖线是这对 L、C 的谐振频率 f0 = {fmtFixed(f0, 2)} Hz，那里 XL = XC = {fmtFixed(2 * Math.PI * f0 * (state.lMh / 1000), 2)} Ω。虚线是现在的频率。
        </p>
        <div className="mt-3">
          <button
            type="button"
            className="h-11 rounded-full bg-teal px-4 text-sm font-medium text-sheet"
            onClick={() => patch({ f: f0 })}
          >
            把频率调到交点
          </button>
        </div>
      </Card>

      <Insight>
        频率升高时，电感越来越像开路，电容越来越像短路。串联时谁的电抗大，谁就主导相位：感抗大于容抗呈感性，容抗大于感抗呈容性。这组默认 L、C 和串联台的「感性」预设是同一对。
      </Insight>
      <p className="text-xs text-muted tabular-nums">
        当前：ZR = {fmtComplex(state.r, 0)} Ω，ZL = {fmtComplex(0, xl)} Ω，ZC = {fmtComplex(0, -xc)} Ω。
      </p>
    </div>
  );
}

function ElementCard({
  symbol,
  name,
  domain,
  phasor,
  impedance,
  note,
  vectors,
}: {
  symbol: ReactNode;
  name: string;
  domain: string;
  phasor: string;
  impedance: string;
  note: string;
  vectors: { re: number; im: number; tone: "copper" | "teal" | "ink"; label: string }[];
}) {
  return (
    <Card title={name}>
      <div className="flex items-center gap-3">
        {symbol}
        <div className="min-w-0 text-sm">
          <p className="text-muted">{domain}</p>
          <p className="font-medium text-ink">{phasor}</p>
          <p className="tabular-nums text-ink">{impedance}</p>
        </div>
      </div>
      <p className="mt-2 text-sm text-pretty text-muted">{note}</p>
      <div className="mt-2">
        <VectorPlane vectors={vectors} label={`${name}的电压电流相位`} />
      </div>
    </Card>
  );
}
