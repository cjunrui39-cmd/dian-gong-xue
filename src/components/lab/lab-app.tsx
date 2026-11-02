import { useEffect, useState } from "react";
import { Cable, NotebookPen, Orbit, Split, Zap } from "lucide-react";
import { parallelPreset, seriesPreset, type ParallelState, type SeriesState } from "@/lib/ac";
import { ElementsPanel } from "@/components/lab/elements-panel";
import { IntroPanel } from "@/components/lab/intro-panel";
import { ParallelPanel } from "@/components/lab/parallel-panel";
import { PracticePanel } from "@/components/lab/practice-panel";
import { SeriesPanel } from "@/components/lab/series-panel";

type TabId = "intro" | "elements" | "series" | "parallel" | "practice";

const TABS: { id: TabId; label: string; icon: typeof Orbit }[] = [
  { id: "intro", label: "相量", icon: Orbit },
  { id: "elements", label: "元件", icon: Zap },
  { id: "series", label: "串联", icon: Cable },
  { id: "parallel", label: "并联", icon: Split },
  { id: "practice", label: "练习", icon: NotebookPen },
];

export function LabApp() {
  const [tab, setTab] = useState<TabId>("intro");
  const [series, setSeries] = useState<SeriesState>(() => seriesPreset("inductive"));
  const [parallel, setParallel] = useState<ParallelState>(() => parallelPreset("inductive"));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  return (
    <div className="nav-pad">
      <header className="mx-auto w-full max-w-5xl px-4 pt-5 pb-4">
        <p className="text-sm font-medium text-teal">电工学 · 正弦稳态</p>
        <h1 className="mt-1 font-serif text-3xl text-balance text-ink">相量实验台</h1>
        <p className="mt-2 max-w-xl text-sm text-pretty text-muted">
          把正弦电路换成复数来算。拖动 R、L、C 和频率，看阻抗、相量图、波形和谐振怎么一起变。
        </p>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-5xl px-4">
        {tab === "intro" ? <IntroPanel /> : null}
        {tab === "elements" ? <ElementsPanel /> : null}
        {tab === "series" ? <SeriesPanel state={series} onChange={setSeries} /> : null}
        {tab === "parallel" ? <ParallelPanel state={parallel} onChange={setParallel} /> : null}
        {tab === "practice" ? (
          <PracticePanel
            onUseSeries={() => {
              setSeries(seriesPreset("capacitive"));
              setTab("series");
            }}
            onUseParallel={() => {
              setParallel(parallelPreset("inductive"));
              setTab("parallel");
            }}
          />
        ) : null}
        <p className="px-1 py-6 text-xs text-pretty text-muted">
          理想集总元件，关联参考方向，正弦稳态。电压电流用有效值，时间函数用 sin。无功功率按感性为正。
        </p>
      </main>

      <nav
        className="dock-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-sheet"
        aria-label="章节"
      >
        <ul className="mx-auto grid w-full max-w-5xl grid-cols-5">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-16 w-full flex-col items-center justify-center gap-1 text-xs ${
                    active ? "text-teal" : "text-muted"
                  }`}
                >
                  <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
