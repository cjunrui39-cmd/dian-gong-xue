import { useEffect, useState } from "react";
import { fmtComplex, fmtFixed, phaseTerm, wrapDeg } from "@/lib/ac";
import { Card, Insight, Param, StepList } from "@/components/lab/ui";
import {
  PlayButton,
  VectorPlane,
  Waveform,
  usePlayhead,
  useReducedMotion,
} from "@/components/lab/visuals";

const METHOD = [
  {
    k: "写成相量",
    v: "u = √2 U sin(ωt + ψ) 记成 Ú = U∠ψ。只有同频率的正弦量，才能画在同一张相量图里相加减。",
  },
  {
    k: "换成阻抗",
    v: "ZR = R，ZL = jωL，ZC = 1/(jωC) = −j/(ωC)。导纳 Y = 1/Z，并联时更好用。",
  },
  {
    k: "照直流列方程",
    v: "KCL、KVL、分压、分流都不变，只是电压电流和阻抗换成复数。",
  },
  {
    k: "解出相量",
    v: "得到模和辐角，例如 İ = I∠ψi。模用有效值，辐角就是初相。",
  },
  {
    k: "回到时间函数",
    v: "i = √2 I sin(ωt + ψi)。相量法到这一步才算把正弦量交回去。",
  },
];

export function IntroPanel() {
  return (
    <div className="space-y-4">
      <Card title="正弦量为什么能当成矢量算">
        <p className="text-sm text-pretty text-muted">
          同频率的正弦电压、电流，差别只剩大小和初相。把这两样写成复数，求导就变成乘
          jω，电路可以按直流的办法算。
        </p>
        <div className="mt-4">
          <StepList items={METHOD} />
        </div>
      </Card>

      <JToy />
      <PhaseCard />

      <Insight>
        本实验台一律用有效值相量，时间函数用 sin：u = √2 U sin(ωt + ψ) 对应 Ú = U∠ψ。
        幅值是有效值的 √2 倍。有的教材用 cos 或最大值相量，角度起点会差一截，公式对上再算。
      </Insight>
    </div>
  );
}

function JToy() {
  const [deg, setDeg] = useState(0);
  const shown = wrapDeg(deg);
  const rad = (shown * Math.PI) / 180;
  const re = Math.cos(rad);
  const im = Math.sin(rad);

  return (
    <Card title="乘以 j，就是转 90°">
      <p className="text-sm text-pretty text-muted">
        从 1∠0° 出发。每按一次，看复平面上的箭头和直角形式一起变。j 的模是 1，所以只转角度，不改变长度。
      </p>
      <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:items-center">
        <VectorPlane
          label="单位相量在复平面上的位置"
          vectors={[{ re, im, tone: "teal", label: "A" }]}
        />
        <div className="min-w-0">
          <p className="text-base font-medium text-ink tabular-nums">
            A = {fmtComplex(re, im)} = 1 ∠ {fmtFixed(shown, 1)}°
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="h-11 rounded-full bg-teal px-4 text-sm font-medium text-sheet" onClick={() => setDeg((value) => value + 90)}>
              × j
            </button>
            <button type="button" className="h-11 rounded-full border border-line bg-sheet px-4 text-sm font-medium text-ink" onClick={() => setDeg((value) => value - 90)}>
              × (−j)
            </button>
            <button type="button" className="h-11 rounded-full border border-line bg-sheet px-4 text-sm font-medium text-ink" onClick={() => setDeg((value) => value + 180)}>
              × (−1)
            </button>
            <button type="button" className="h-11 rounded-full border border-line bg-sheet px-4 text-sm font-medium text-ink" onClick={() => setDeg(0)}>
              复位
            </button>
          </div>
          <p className="mt-3 text-sm text-pretty text-muted">
            电感：Ú = jωL İ，电流乘上 jωL，电压超前电流 90°。电容：Z = −j/(ωC)，电压滞后电流 90°。电阻不转角度。
          </p>
        </div>
      </div>
    </Card>
  );
}

function PhaseCard() {
  const [psi, setPsi] = useState(30);
  const [delta, setDelta] = useState(40);
  const relation =
    Math.abs(delta) < 0.5
      ? "两者同相。"
      : delta > 0
        ? `电压超前电流 ${fmtFixed(delta, 1)}°，电流滞后，电路呈感性时就是这样。`
        : `电压滞后电流 ${fmtFixed(Math.abs(delta), 1)}°，电流超前，电路呈容性时就是这样。`;

  return (
    <Card title="旋转着的箭头，投影就是波形">
      <p className="text-sm text-pretty text-muted">
        箭头逆时针转。它在虚轴上的投影，就是 sin 形式的瞬时值。两条曲线各自归一，只比较谁在前面。
      </p>
      <div className="mt-3 space-y-1">
        <Param id="intro-psi" label="电压初相 ψu" unit="°" value={psi} min={-180} max={180} digits={0} onChange={setPsi} />
        <Param id="intro-delta" label="电压超前电流的角度" unit="°" value={delta} min={-180} max={180} digits={0} onChange={setDelta} />
      </div>
      <p className="mt-2 text-sm text-ink">{relation}</p>
      <p className="mt-1 text-sm text-muted tabular-nums">
        u ~ sin(ωt{phaseTerm(psi)}) ，i ~ sin(ωt{phaseTerm(psi - delta)})
      </p>
      <div className="mt-3">
        <PhaseAnimator psi={psi} delta={delta} />
      </div>
    </Card>
  );
}

function PhaseAnimator({ psi, delta }: { psi: number; delta: number }) {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = usePlayhead(playing);

  useEffect(() => {
    if (!reduced) setPlaying(true);
  }, [reduced]);

  const spin = playhead * 720;
  const arrow = (deg: number, gain: number) => {
    const rad = (wrapDeg(deg) * Math.PI) / 180;
    return { re: Math.cos(rad) * gain, im: Math.sin(rad) * gain };
  };

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <PlayButton playing={playing} onToggle={() => setPlaying((value) => !value)} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <VectorPlane
          project
          label="电压和电流相量正在旋转，虚轴投影对应该时刻的瞬时值"
          vectors={[
            { ...arrow(psi + spin, 1), tone: "teal", label: "Ú" },
            { ...arrow(psi - delta + spin, 0.72), tone: "copper", label: "İ" },
          ]}
        />
        <Waveform
          phaseU={psi}
          phaseI={psi - delta}
          playhead={playhead}
          label="电压电流波形"
        />
      </div>
      <label className="mt-2 block text-xs text-muted" htmlFor="phase-scrub">
        拖动时刻
        <input
          id="phase-scrub"
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
    </div>
  );
}
