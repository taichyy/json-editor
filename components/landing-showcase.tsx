"use client"

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Network, Table2, Code2, GitCompare, GitMerge } from "lucide-react";

type TView = "tree" | "table" | "monaco" | "diff" | "merge";

const VIEWS: { id: TView; icon: typeof Network }[] = [
    { id: "tree", icon: Network },
    { id: "table", icon: Table2 },
    { id: "monaco", icon: Code2 },
    { id: "diff", icon: GitCompare },
    { id: "merge", icon: GitMerge },
];

const mono = "font-mono text-[12.5px] leading-relaxed";
const key = { color: "var(--accent-text)" };
const str = { color: "#22c55e" };
const num = { color: "#f97316" };
const kw = { color: "#a78bfa" };
const muted = { color: "var(--text-tertiary)" };

const TreePreview = () => (
    <div className={`${mono} space-y-1`}>
        <p><span style={muted}>▾</span> <span style={key}>owner</span> <span style={muted}>{"{2}"}</span></p>
        <p className="pl-5"><span style={key}>name</span><span style={muted}>:</span> <span className="px-1 rounded" style={{ ...str, outline: "1px solid var(--accent)" }}>&quot;Tai&quot;</span></p>
        <p className="pl-5"><span style={key}>role</span><span style={muted}>:</span> <span style={str}>&quot;Frontend engineer&quot;</span></p>
        <p><span style={muted}>▸</span> <span style={key}>tags</span> <span style={muted}>[3]</span></p>
        <p><span style={muted}>▸</span> <span style={key}>users</span> <span style={muted}>[3]</span> <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-text)" }}>table</span></p>
        <p><span style={key}>local</span><span style={muted}>:</span> <span style={kw}>true</span></p>
    </div>
);

const TablePreview = () => (
    <table className="w-full text-left text-xs">
        <thead>
            <tr style={{ color: "var(--text-tertiary)" }}>
                {["id", "name", "email", "active"].map(h => (
                    <th key={h} className="font-mono font-medium py-1.5 pr-3" style={{ borderBottom: "1px solid var(--border-default)" }}>{h}</th>
                ))}
            </tr>
        </thead>
        <tbody className="font-mono" style={{ color: "var(--text-secondary)" }}>
            {[[1, "Alice", "alice@example.com", true], [2, "Bob", "bob@example.com", false], [3, "Carol", "carol@example.com", true]].map(row => (
                <tr key={String(row[0])}>
                    {row.map((c, i) => (
                        <td key={i} className="py-1.5 pr-3" style={{ borderBottom: "1px solid var(--border-subtle)", ...(typeof c === "number" ? num : typeof c === "boolean" ? kw : {}) }}>
                            {String(c)}
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    </table>
);

const MonacoPreview = () => {
    const t = useTranslations();

    return (
    <div className={mono}>
        {[
            <><span style={muted}>{"{"}</span></>,
            <>&nbsp;&nbsp;<span style={key}>&quot;project&quot;</span><span style={muted}>: </span><span style={str}>&quot;json.tools&quot;</span><span style={muted}>,</span></>,
            <>&nbsp;&nbsp;<span style={key}>&quot;version&quot;</span><span style={muted}>: </span><span style={str}>&quot;2.0&quot;</span><span style={muted}>,</span></>,
            <>&nbsp;&nbsp;<span style={key}>&quot;local&quot;</span><span style={muted}>: </span><span style={kw}>true</span><span className="underline decoration-wavy" style={{ textDecorationColor: "var(--error)" }}>&nbsp;</span></>,
            <>&nbsp;&nbsp;<span style={key}>&quot;tags&quot;</span><span style={muted}>: [</span><span style={str}>&quot;editor&quot;</span><span style={muted}>]</span></>,
            <><span style={muted}>{"}"}</span></>,
        ].map((line, i) => (
            <p key={i}><span className="inline-block w-6 select-none" style={{ color: "var(--text-muted)" }}>{i + 1}</span>{line}</p>
        ))}
        <p className="mt-3 text-[11px]" style={{ color: "var(--error)" }}>{t('showcase.errorSample')}</p>
    </div>
    );
};

const DiffPreview = () => (
    <div className={`${mono} grid grid-cols-2 gap-3`}>
        <div className="space-y-0.5">
            <p><span style={key}>&quot;version&quot;</span>: <span style={str}>&quot;2.0&quot;</span></p>
            <p className="px-1 -mx-1 rounded" style={{ backgroundColor: "rgba(239,68,68,0.12)" }}><span style={key}>&quot;local&quot;</span>: <span style={kw}>false</span></p>
            <p className="px-1 -mx-1 rounded" style={{ backgroundColor: "rgba(239,68,68,0.12)" }}><span style={key}>&quot;beta&quot;</span>: <span style={kw}>true</span></p>
        </div>
        <div className="space-y-0.5">
            <p><span style={key}>&quot;version&quot;</span>: <span style={str}>&quot;2.0&quot;</span></p>
            <p className="px-1 -mx-1 rounded" style={{ backgroundColor: "rgba(34,197,94,0.14)" }}><span style={key}>&quot;local&quot;</span>: <span style={kw}>true</span></p>
            <p>&nbsp;</p>
        </div>
    </div>
);

const MergePreview = () => (
    <div className={`${mono} space-y-2`}>
        <p><span style={muted}>base     </span>{"{ "}<span style={key}>&quot;theme&quot;</span>: <span style={str}>&quot;light&quot;</span>, <span style={key}>&quot;size&quot;</span>: <span style={num}>12</span>{" }"}</p>
        <p><span style={muted}>override </span>{"{ "}<span style={key}>&quot;theme&quot;</span>: <span style={str}>&quot;dark&quot;</span>{" }"}</p>
        <p className="pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <span style={muted}>result   </span>{"{ "}<span style={key}>&quot;theme&quot;</span>: <span style={str}>&quot;dark&quot;</span>, <span style={key}>&quot;size&quot;</span>: <span style={num}>12</span>{" }"}
        </p>
    </div>
);

const PREVIEWS: Record<TView, () => JSX.Element> = {
    tree: TreePreview,
    table: TablePreview,
    monaco: MonacoPreview,
    diff: DiffPreview,
    merge: MergePreview,
};

export const LandingShowcase = () => {
    const t = useTranslations();
    const [active, setActive] = useState<TView>("tree");

    const Preview = PREVIEWS[active];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 lg:gap-12 items-start">
            {/* Left: list of views */}
            <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
                    {t('showcase.title')}
                </h2>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>{t('showcase.subtitle')}</p>

                <div role="tablist" aria-orientation="vertical" className="flex flex-col gap-1">
                    {VIEWS.map(({ id, icon: Icon }) => {
                        const selected = active === id;
                        return (
                            <button
                                key={id}
                                role="tab"
                                aria-selected={selected}
                                onClick={() => setActive(id)}
                                onMouseEnter={() => setActive(id)}
                                className="flex items-start gap-3 text-left px-3 py-2.5 rounded-lg transition-colors"
                                style={{
                                    backgroundColor: selected ? "var(--bg-surface)" : "transparent",
                                    boxShadow: selected ? "var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.06))" : "none",
                                    border: `1px solid ${selected ? "var(--border-default)" : "transparent"}`,
                                }}
                            >
                                <Icon
                                    className="w-4 h-4 mt-0.5 shrink-0"
                                    style={{ color: selected ? "var(--accent)" : "var(--text-tertiary)" }}
                                    strokeWidth={1.75}
                                />
                                <span>
                                    <span className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                        {t(`features.${id}.title`)}
                                    </span>
                                    <span className="block text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                        {t(`features.${id}.description`)}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>

                <p className="text-xs mt-5 px-3" style={{ color: "var(--text-muted)" }}>{t('features.export.description')}</p>
            </div>

            {/* Right: live preview of the selected view */}
            <div
                role="tabpanel"
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-lg)" }}
            >
                <div
                    className="flex items-center gap-1.5 px-4 py-3"
                    style={{ borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--bg-secondary)" }}
                >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#f87171" }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#fbbf24" }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#4ade80" }} />
                    <span className="ml-3 text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                        {t(`features.${active}.title`)}
                    </span>
                </div>
                <div className="p-5 min-h-[240px] overflow-x-auto">
                    <Preview />
                </div>
            </div>
        </div>
    );
};
