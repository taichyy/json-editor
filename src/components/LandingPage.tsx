'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, GitCompare, Network, Table2, Code2, Download } from 'lucide-react';

import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

interface LandingPageProps {
    onEnter: () => void;
}

// ── Animated JSON preview ─────────────────────────────────────────────────────
const SAMPLE_JSON = `{
  "project": "json.tools",
  "version": "2.0",
  "features": [
    "tree editor",
    "table view",
    "diff compare"
  ],
  "local": true,
  "privacy": "no data leaves your browser"
}`;

function JsonPreview() {
    const [visibleChars, setVisibleChars] = useState(0);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (visibleChars >= SAMPLE_JSON.length) {
            setDone(true);
            return;
        }
        const delay = visibleChars < 10 ? 40 : 18;
        const t = setTimeout(() => setVisibleChars(v => v + 1), delay);
        return () => clearTimeout(t);
    }, [visibleChars]);

    const visible = SAMPLE_JSON.slice(0, visibleChars);

    return (
        <div
            className="relative rounded-xl overflow-hidden h-full"
            style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                boxShadow: 'var(--shadow-lg)',
            }}
        >
            {/* Window chrome */}
            <div
                className="flex items-center gap-1.5 px-4 py-3"
                style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-secondary)' }}
            >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f87171' }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#fbbf24' }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#4ade80' }} />
                <span className="ml-3 text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>data.json</span>
            </div>

            {/* Code body */}
            <pre
                className="p-5 text-[13px] font-mono leading-relaxed overflow-hidden"
                style={{ color: 'var(--text-secondary)' }}
            >
                <SyntaxHighlight code={visible} />
                {!done && (
                    <span
                        className="inline-block w-[2px] h-[1em] ml-[1px] align-middle"
                        style={{ backgroundColor: 'var(--accent)', animation: 'blink 1s step-end infinite' }}
                    />
                )}
            </pre>

            {/* Ambient glow */}
            <div
                className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ backgroundColor: 'var(--accent)' }}
            />

            <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
        </div>
    );
}

function SyntaxHighlight({ code }: { code: string }) {
    const tokens: { type: string; value: string }[] = [];
    let i = 0;
    while (i < code.length) {
        if (code[i] === '"') {
            let j = i + 1;
            while (j < code.length && (code[j] !== '"' || code[j - 1] === '\\')) j++;
            const raw = code.slice(i, j + 1);
            const rest = code.slice(j + 1).trimStart();
            tokens.push({ type: rest.startsWith(':') ? 'key' : 'string', value: raw });
            i = j + 1;
            continue;
        }
        if (code.slice(i).match(/^(true|false|null)/)) {
            const m = code.slice(i).match(/^(true|false|null)/)![0];
            tokens.push({ type: 'keyword', value: m });
            i += m.length;
            continue;
        }
        if (code[i].match(/[\d\-]/)) {
            const m = code.slice(i).match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?/)?.[0];
            if (m) { tokens.push({ type: 'number', value: m }); i += m.length; continue; }
        }
        tokens.push({ type: 'punct', value: code[i] });
        i++;
    }

    const colors: Record<string, string> = {
        key: 'var(--accent-text)',
        string: '#22c55e',
        number: '#f97316',
        keyword: '#a78bfa',
        punct: 'var(--text-tertiary)',
    };

    return (
        <>
            {tokens.map((t, idx) => (
                <span key={idx} style={{ color: colors[t.type] || 'inherit' }}>{t.value}</span>
            ))}
        </>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export function LandingPage({ onEnter }: LandingPageProps) {
    const t = useTranslations();

    const features = [
        { icon: Network, title: t('features.tree.title'), description: t('features.tree.description') },
        { icon: Table2, title: t('features.table.title'), description: t('features.table.description') },
        { icon: Code2, title: t('features.monaco.title'), description: t('features.monaco.description') },
        { icon: GitCompare, title: t('features.diff.title'), description: t('features.diff.description') },
        { icon: Download, title: t('features.export.title'), description: t('features.export.description') },
    ];

    return (
        <div
            className="min-h-[100dvh] flex flex-col"
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >

            {/* ── Nav ── */}
            <nav
                className="sticky top-0 z-50 flex items-center justify-between px-6 h-14 max-w-6xl mx-auto w-full"
                style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-primary)',
                }}
            >
                <span className="font-mono text-sm font-semibold tracking-tight select-none">
                    json<span style={{ color: 'var(--accent)' }}>.</span>tools
                </span>

                <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <button
                        onClick={onEnter}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold
              transition-all active:scale-[0.97]"
                        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
                    >
                        {t('nav.openEditor')}
                    </button>
                </div>
            </nav>

            {/* ── Hero — split screen ── */}
            <main className="flex-1 w-full max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100dvh-56px)] py-16 lg:py-0">

                    {/* Left: copy */}
                    <div className="flex flex-col justify-center">
                        <p
                            className="text-xs font-mono uppercase tracking-[0.18em] mb-6"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            {t('landing.badge')}
                        </p>

                        <h1
                            className="text-4xl md:text-5xl lg:text-[3.25rem] font-semibold tracking-tight leading-[1.08] mb-5 text-balance"
                            style={{ color: 'var(--text-primary)', whiteSpace: 'pre-line' }}
                        >
                            {t('landing.headline')}
                        </h1>

                        <p
                            className="text-base leading-relaxed mb-8 text-pretty"
                            style={{ color: 'var(--text-secondary)', maxWidth: '44ch' }}
                        >
                            {t('landing.subheadline')}
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onEnter}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm
                  transition-all active:scale-[0.97] shadow-sm"
                                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
                            >
                                {t('landing.startEditing')}
                                <ArrowRight className="w-4 h-4" strokeWidth={2} />
                            </button>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {t('landing.noSignup')}
                            </span>
                        </div>
                    </div>

                    {/* Right: JSON preview */}
                    <div className="hidden lg:flex items-center justify-center">
                        <div className="w-full max-w-md h-80">
                            <JsonPreview />
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Features ── */}
            <section
                className="w-full max-w-6xl mx-auto px-6 py-16"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px"
                    style={{ backgroundColor: 'var(--border-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}
                >
                    {features.map(({ icon: Icon, title, description }) => (
                        <div
                            key={title}
                            className="flex flex-col gap-2.5 p-6"
                            style={{ backgroundColor: 'var(--bg-surface)' }}
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: 'var(--accent-subtle)' }}
                            >
                                <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} strokeWidth={1.75} />
                            </div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{description}</p>
                        </div>
                    ))}

                    {/* Last cell — CTA tile */}
                    <div
                        className="flex flex-col justify-between gap-4 p-6"
                        style={{ backgroundColor: 'var(--accent-subtle)' }}
                    >
                        <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--accent-text)' }}>
                            {t('landing.localProcessing')}
                        </p>
                        <button
                            onClick={onEnter}
                            className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold
                transition-all active:scale-[0.97]"
                            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
                        >
                            {t('nav.openEditor')}
                            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer
                className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
                <span className="font-mono text-xs font-semibold select-none" style={{ color: 'var(--text-muted)' }}>
                    json<span style={{ color: 'var(--accent)' }}>.</span>tools
                </span>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {t('landing.noDataSent')}
                </p>
            </footer>
        </div>
    );
}
