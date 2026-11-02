import { useEffect, useState } from "react";
import { Card, StepList } from "@/components/lab/ui";

const BEST_KEY = "phasor-lab-best";

const COMPARE: [string, string, string][] = [
  ["计算用", "阻抗 Z", "导纳 Y"],
  ["谐振条件", "XL = XC", "BL = BC"],
  ["谐振频率", "1/(2π√LC)", "理想时相同"],
  ["电压源下", "电流最大", "总电流最小"],
  ["可以更大", "UL、UC 可大于 U", "IL、IC 可大于 I"],
  ["品质因数", "Q = ω0L / R", "Q = R / (ω0L)"],
  ["通频带", "Δf = R / (2πL)", "Δf = 1 / (2πRC)"],
  ["常取参考", "电流", "电压"],
];

const QUESTIONS: {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  answer: number;
  why: string;
}[] = [
  {
    id: "j",
    topic: "j 的意义",
    prompt: "相量法里，一个相量乘以 j，相当于？",
    options: ["逆时针旋转 90°", "顺时针旋转 90°", "只把模变成原来的 j 倍", "频率提高一倍"],
    answer: 0,
    why: "j = 1∠90°。它的模是 1，所以不改变长度，只把相量逆时针转 90°。再乘 −j 就顺时针转 90°。",
  },
  {
    id: "rms",
    topic: "有效值相量",
    prompt: "有效值相量 Ú = 220∠30° V，对应的正弦瞬时值是？",
    options: [
      "u = 220 sin(ωt + 30°) V",
      "u = 220√2 sin(ωt + 30°) V",
      "u = 220√2 sin(ωt − 30°) V",
      "u = 110 sin(ωt + 30°) V",
    ],
    answer: 1,
    why: "本课约定 u = √2 U sin(ωt + ψ)。220 是有效值，峰值要乘 √2，初相原样放进正弦函数。",
  },
  {
    id: "cap",
    topic: "电容相位",
    prompt: "理想电容上，电压和电流的相位关系是？",
    options: ["电压超前电流 90°", "电流超前电压 90°", "两者同相", "两者反相"],
    answer: 1,
    why: "İ = jωC Ú，电流比电压多乘了一个 j，所以电流超前电压 90°。也可以记 ZC = −jXC，电压滞后。",
  },
  {
    id: "freq",
    topic: "电抗随频率",
    prompt: "频率升高时，感抗 XL 和容抗 XC 怎样变？",
    options: ["XL 增大，XC 减小", "两者都增大", "两者都减小", "XL 减小，XC 增大"],
    answer: 0,
    why: "XL = ωL，和频率成正比。XC = 1/(ωC)，和频率成反比。两条曲线的交点就是这对 L、C 的谐振频率。",
  },
  {
    id: "z",
    topic: "串联阻抗",
    prompt: "串联电路 R = 40 Ω，XL = 80 Ω，XC = 50 Ω。性质和 |Z| 是？",
    options: ["感性，|Z| = 50 Ω", "容性，|Z| = 50 Ω", "感性，|Z| = 170 Ω", "谐振，|Z| = 40 Ω"],
    answer: 0,
    why: "X = 80 − 50 = 30 Ω > 0，呈感性。|Z| = √(40² + 30²) = 50 Ω。电抗不能和电阻直接相加。",
  },
  {
    id: "kvl",
    topic: "分电压",
    prompt: "串联电路电源 220 V，测得电感电压 352 V。这是否可能？",
    options: [
      "不可能，违反基尔霍夫电压定律",
      "可能。ÚL 与 ÚC 反相，分电压可以大于总电压",
      "只在并联电路里可能",
      "只在直流电路里可能",
    ],
    answer: 1,
    why: "KVL 约束的是相量和，不是有效值相加。ÚL 向上、ÚC 向下，抵消之后剩下的才等于电源电压。",
  },
  {
    id: "series-res",
    topic: "串联谐振",
    prompt: "关于串联谐振，哪一句是错的？",
    options: [
      "电流达到最大",
      "阻抗等于 R，电压电流同相",
      "UL、UC 可以远大于电源电压",
      "电阻越大，谐振频率越高",
    ],
    answer: 3,
    why: "f0 = 1/(2π√LC)，与 R 无关。R 影响的是电流大小、品质因数和通频带，不移动谐振点。",
  },
  {
    id: "parallel-res",
    topic: "并联谐振",
    prompt: "理想并联 RLC 由电压源供电，谐振时总电流怎样？",
    options: [
      "最大，因为各支路电流都最大",
      "最小，等于 U/R，IL 与 IC 互相抵消",
      "一定等于零",
      "等于 IL 与 IC 的算术和",
    ],
    answer: 1,
    why: "BL = BC 时，电感电流和电容电流等大反向，对电源互相抵消。电源只供给电阻上的电流，总电流最小。",
  },
  {
    id: "pf",
    topic: "功率因数",
    prompt: "功率因数 λ = cosφ 里的 φ，指的是？",
    options: ["电压与电流的相位差", "频率和周期的差", "电阻除以电抗的商，不是角度", "只由电容决定的一个常数"],
    answer: 0,
    why: "φ 就是电压相对电流的相位差，也是阻抗角。感性时电流滞后，容性时电流超前。λ 也等于 P/S，以及串联时的 R/|Z|。",
  },
  {
    id: "freq-mix",
    topic: "同频率",
    prompt: "i1 = sin(100t) A 和 i2 = sin(200t) A，能不能直接用相量相加成总电流？",
    options: [
      "能，相量法对所有正弦都成立",
      "不能，相量法要求它们是同一个频率",
      "能，只要都写成角度的形式",
      "不能，因为两个幅值都是 1",
    ],
    answer: 1,
    why: "相量把 ω 藏起来了。频率不同，就不能放进同一个复数方程里相加，只能回到时间函数逐点相加。",
  },
];

export function PracticePanel({
  onUseSeries,
  onUseParallel,
}: {
  onUseSeries: () => void;
  onUseParallel: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card title="例题 · 串联容性">
        <p className="text-sm text-pretty text-muted">
          u = 100√2 sin(314t) V，R = 30 Ω，XL = 40 Ω，XC = 80 Ω。314 rad/s 就是工频 50 Hz。
        </p>
        <div className="mt-3">
          <StepList
            items={[
              { k: "读正弦量", v: "有效值 U = 100 V，初相 ψu = 0°。Ú = 100∠0° V。" },
              { k: "电抗", v: "X = XL − XC = 40 − 80 = −40 Ω，电容占上风，电路呈容性。" },
              { k: "阻抗", v: "|Z| = √(30² + 40²) = 50 Ω。φ = arctan(X/R) = −53.13°。Z = 30 − j40 Ω = 50∠−53.13° Ω。" },
              { k: "电流", v: "I = 100 / 50 = 2 A。ψi = 0 − (−53.13°) = 53.13°。电流超前电压。i = 2√2 sin(314t + 53.13°) A。" },
              { k: "分压", v: "UR = 60 V，UL = 80 V，UC = 160 V。UC 大于电源，因为 UL 与 UC 反相抵消。" },
              { k: "功率", v: "P = I²R = 120 W，Q = I²X = −160 var，S = UI = 200 VA。λ = R/|Z| = 0.6（超前）。" },
            ]}
          />
        </div>
        <button
          type="button"
          className="mt-4 h-11 rounded-full bg-teal px-4 text-sm font-medium text-sheet"
          onClick={onUseSeries}
        >
          到串联台核对这道题
        </button>
      </Card>

      <Card title="例题 · 并联感性">
        <p className="text-sm text-pretty text-muted">
          U = 220 V，ψu = 0，f = 50 Hz，R = 40 Ω，XL = 25 Ω，XC = 100 Ω。
        </p>
        <div className="mt-3">
          <StepList
            items={[
              { k: "导纳元件", v: "G = 1/40 = 0.025 S，BL = 1/25 = 0.04 S，BC = 1/100 = 0.01 S。" },
              { k: "总导纳", v: "B = BC − BL = −0.03 S。|Y| = √(0.025² + 0.03²) = 0.03905 S。φY = −50.19°，电流滞后。" },
              { k: "电流", v: "I = 220 × 0.03905 = 8.591 A。IR = 5.5 A，IL = 8.8 A，IC = 2.2 A。电感支路比总电流还大。" },
              { k: "功率", v: "P = U²/R = 1210 W，Q = U²(BL − BC) = 1452 var，S = UI = 1890 VA，λ = 0.640（滞后）。" },
            ]}
          />
        </div>
        <button
          type="button"
          className="mt-4 h-11 rounded-full border border-line bg-sheet px-4 text-sm font-medium text-ink"
          onClick={onUseParallel}
        >
          到并联台核对这道题
        </button>
      </Card>

      <Card title="串联和并联对照">
        <ul className="divide-y divide-line">
          <li className="grid grid-cols-3 gap-2 pb-2 text-sm font-medium text-ink">
            <span />
            <span>串联</span>
            <span>并联</span>
          </li>
          {COMPARE.map((row) => (
            <li key={row[0]} className="grid grid-cols-3 gap-2 py-2 text-sm">
              <span className="text-muted">{row[0]}</span>
              <span className="text-pretty text-ink">{row[1]}</span>
              <span className="text-pretty text-ink">{row[2]}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Quiz />
    </div>
  );
}

function Quiz() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [best, setBest] = useState<number | null>(null);
  const done = index >= QUESTIONS.length;
  const question = QUESTIONS[index];

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BEST_KEY);
      if (stored) setBest(Number(stored));
    } catch {
      /* 成绩只是本地记一下，写不进去也不影响做题 */
    }
  }, []);

  const finish = (score: number) => {
    setBest((prev) => {
      const next = prev === null ? score : Math.max(prev, score);
      try {
        window.localStorage.setItem(BEST_KEY, String(next));
      } catch {
        /* 忽略无法写入的本地存储 */
      }
      return next;
    });
  };

  const choose = (option: number) => {
    if (!question || picked !== null) return;
    setPicked(option);
    const hit = option === question.answer;
    const score = correct + (hit ? 1 : 0);
    if (hit) setCorrect(score);
    else setMissed((list) => [...list, question.topic]);
    if (index === QUESTIONS.length - 1) finish(score);
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setCorrect(0);
    setMissed([]);
  };

  if (done || !question) {
    return (
      <Card title="自测结果">
        <p className="font-serif text-3xl text-ink tabular-nums">
          {correct} / {QUESTIONS.length}
        </p>
        <p className="mt-2 text-sm text-muted">
          {best !== null ? `这台设备上的最好成绩 ${best} / ${QUESTIONS.length}。` : null}
          {missed.length === 0
            ? "十题都稳了。回到串联或并联，改一个参数，用验算式自己再核一遍。"
            : `还可以再看：${missed.join("、")}。`}
        </p>
        <button
          type="button"
          className="mt-4 h-11 rounded-full bg-teal px-4 text-sm font-medium text-sheet"
          onClick={restart}
        >
          再做一次
        </button>
      </Card>
    );
  }

  return (
    <Card
      title={`自测 ${index + 1} / ${QUESTIONS.length}`}
      action={
        best !== null ? (
          <span className="text-xs text-muted tabular-nums">最好 {best}/{QUESTIONS.length}</span>
        ) : null
      }
    >
      <p className="text-base text-pretty text-ink">{question.prompt}</p>
      <div className="mt-3 space-y-2">
        {question.options.map((option, optionIndex) => {
          const selected = picked === optionIndex;
          const isAnswer = picked !== null && optionIndex === question.answer;
          const wrong = selected && optionIndex !== question.answer;
          const tone = isAnswer
            ? "border-teal bg-teal-soft text-ink"
            : wrong
              ? "border-copper bg-copper-soft text-ink"
              : "border-line bg-sheet text-ink";
          return (
            <button
              key={option}
              type="button"
              disabled={picked !== null}
              onClick={() => choose(optionIndex)}
              className={`min-h-11 w-full rounded-xl border px-3 py-2 text-left text-sm ${tone}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        <div className="mt-3">
          <p className="text-sm text-pretty text-ink">{question.why}</p>
          <button
            type="button"
            className="mt-3 h-11 rounded-full bg-teal px-4 text-sm font-medium text-sheet"
            onClick={() => {
              setIndex((value) => value + 1);
              setPicked(null);
            }}
          >
            {index === QUESTIONS.length - 1 ? "看结果" : "下一题"}
          </button>
        </div>
      ) : null}
    </Card>
  );
}
