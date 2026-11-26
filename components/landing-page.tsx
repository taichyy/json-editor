"use client"

import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

import { Brand } from "./owl-logo";
import { REPO_URL } from "@/lib/site";
import { GitHubLink } from "./github-link";
import { ThemeToggle } from "./theme-toggle";
import { LandingShowcase } from "./landing-showcase";
import { LandingDropZone } from "./landing-drop-zone";
import { LanguageSwitcher } from "./language-switcher";

interface LandingPageProps {
    onEnter: () => void;
}

// ── Animated JSON preview ─────────────────────────────────────────────────────
const SAMPLE_JSON = `{
  "project": "JSON Owl",
  "version": "2.0",
  "features": [
    "tree editor",
    "table view",
    "diff compare"
  ],
  "local": true,
  "privacy": "no data leaves your browser"
}`;

const JsonPreview = () => {
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
                boxShadow: 'var(--shadow-md)',
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


            <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
        </div>
    );
}

const SyntaxHighlight = (props: { code: string }) => {
    const { code } = props;

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
export const LandingPage = (props: LandingPageProps) => {
    const { onEnter } = props;

    const t = useTranslations();


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
                <Brand />

                <div className="flex items-center gap-2">
                    <GitHubLink label={t('nav.github')} className="hidden sm:inline-flex" />
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <button
                        onClick={onEnter}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold
              transition-all active:scale-[0.97]"
                        style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
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
                                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
                            >
                                {t('landing.startEditing')}
                                <ArrowRight className="w-4 h-4" strokeWidth={2} />
                            </button>
                            <a
                                href={REPO_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline-offset-4 hover:underline"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {t('landing.viewSource')}
                            </a>
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

            {/* ── Views showcase ── */}
            <section
                className="w-full max-w-6xl mx-auto px-6 py-16 lg:py-20"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
                <LandingShowcase />
            </section>

            {/* ── Start here: drop zone ── */}
            <section className="w-full max-w-3xl mx-auto px-6 pb-20">
                <LandingDropZone onOpen={onEnter} />
            </section>

            {/* ── Footer ── */}
            <footer
                className="w-full max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
                <Brand size={18} />
                <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>{t('landing.noDataSent')}</span>
                    <a
                        href={REPO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-4 hover:underline"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {t('landing.openSource')}
                    </a>
                </div>
            </footer>
        </div>
    );
};
