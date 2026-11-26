"use client"

import Editor from "@monaco-editor/react";
import { useTranslations } from "next-intl";
import { Copy, Check, Code, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import {
    TIndent,
    stringify,
    deepMerge,
    TArrayStrategy,
    describeParseError,
    EDITOR_STORAGE_KEYS,
} from "@/lib/json-utils";
import { useMediaQuery, MOBILE_QUERY } from "@/lib/use-media-query";

type TJsonMergeProps = {
    monacoTheme: string;
    indent: TIndent;
    onOpenInEditor: (data: unknown) => void;
};

const btnOutline = `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium
    border transition-colors active:scale-[0.97] hover:bg-[var(--bg-overlay)]`;

const editorOptions = {
    minimap: { enabled: false },
    fontSize: 12,
    lineNumbers: "on" as const,
    automaticLayout: true,
    wordWrap: "on" as const,
    scrollbar: { verticalScrollbarSize: 6 },
};

const parse = (text: string) => {
    if (!text.trim()) return { value: undefined, error: "" };
    try {
        return { value: JSON.parse(text), error: "" };
    } catch (e) {
        return { value: undefined, error: describeParseError(text, e).message };
    }
};

export const JsonMerge = (props: TJsonMergeProps) => {
    const { monacoTheme, indent, onOpenInEditor } = props;

    const t = useTranslations("editor");
    const isMobile = useMediaQuery(MOBILE_QUERY);
    const direction = isMobile ? "vertical" : "horizontal";
    const handleClass = isMobile ? "h-[3px]" : "w-[3px]";
    const [base, setBase] = useState("");
    const [override, setOverride] = useState("");
    const [arrays, setArrays] = useState<TArrayStrategy>("replace");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        try {
            setBase(localStorage.getItem(EDITOR_STORAGE_KEYS.mergeBase) || "");
            setOverride(localStorage.getItem(EDITOR_STORAGE_KEYS.mergeOverride) || "");
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(EDITOR_STORAGE_KEYS.mergeBase, base);
            localStorage.setItem(EDITOR_STORAGE_KEYS.mergeOverride, override);
        } catch { /* ignore */ }
    }, [base, override]);

    const left = parse(base);
    const right = parse(override);
    const ready = left.value !== undefined && right.value !== undefined;

    const merged = useMemo(
        () => (ready ? deepMerge(left.value, right.value, arrays) : undefined),
        [ready, left.value, right.value, arrays]
    );
    const mergedText = merged === undefined ? "" : stringify(merged, indent);

    const copy = () => {
        navigator.clipboard.writeText(mergedText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    const pane = (label: string, value: string, onChange: (v: string) => void, error: string) => (
        <div className="h-full flex flex-col" style={{ backgroundColor: "var(--bg-surface)" }}>
            <div
                className="flex items-center justify-between px-4 py-2.5 shrink-0"
                style={{ borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--bg-secondary)" }}
            >
                <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
                {error && (
                    <span
                        className="text-[10px] px-2 py-0.5 rounded"
                        style={{ backgroundColor: "var(--error-subtle)", color: "var(--error)" }}
                        title={error}
                    >
                        {t('invalidJson')}
                    </span>
                )}
            </div>
            <div className="flex-1 overflow-hidden">
                <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={value}
                    theme={monacoTheme}
                    onChange={v => onChange(v || '')}
                    options={editorOptions}
                />
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            <div
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 shrink-0"
                style={{ borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)" }}
            >
                <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t('jsonMerge')}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{t('jsonMergeHint')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {t('arrays')}
                        <select
                            value={arrays}
                            onChange={e => setArrays(e.target.value as TArrayStrategy)}
                            className="px-2 py-1 rounded text-xs outline-none"
                            style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                        >
                            <option value="replace">{t('arraysReplace')}</option>
                            <option value="concat">{t('arraysConcat')}</option>
                        </select>
                    </label>
                    <button
                        onClick={() => { setBase(''); setOverride(''); }}
                        className={btnOutline}
                        style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
                    >
                        <X className="w-3 h-3" strokeWidth={2} />
                        {t('clear')}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <PanelGroup key={direction} direction={direction}>
                    <Panel defaultSize={33} minSize={20}>
                        {pane(t('mergeBase'), base, setBase, left.error)}
                    </Panel>
                    <PanelResizeHandle className={handleClass} style={{ backgroundColor: "var(--border-default)" }} />
                    <Panel defaultSize={33} minSize={20}>
                        {pane(t('mergeOverride'), override, setOverride, right.error)}
                    </Panel>
                    <PanelResizeHandle className={handleClass} style={{ backgroundColor: "var(--border-default)" }} />
                    <Panel defaultSize={34} minSize={20}>
                        <div className="h-full flex flex-col" style={{ backgroundColor: "var(--bg-surface)" }}>
                            <div
                                className="flex items-center justify-between px-4 py-2 shrink-0"
                                style={{ borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--bg-secondary)" }}
                            >
                                <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{t('mergeResult')}</p>
                                {ready && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => onOpenInEditor(merged)}
                                            className={btnOutline}
                                            style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
                                        >
                                            <Code className="w-3 h-3" strokeWidth={2} />
                                            {t('openInEditor')}
                                        </button>
                                        <button
                                            onClick={copy}
                                            className={btnOutline}
                                            style={{
                                                borderColor: copied ? "var(--success)" : "var(--border-default)",
                                                color: copied ? "var(--success)" : "var(--text-secondary)",
                                            }}
                                        >
                                            {copied ? <Check className="w-3 h-3" strokeWidth={2.5} /> : <Copy className="w-3 h-3" strokeWidth={2} />}
                                            {copied ? t('copied') : t('copy')}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                {ready ? (
                                    <Editor
                                        height="100%"
                                        defaultLanguage="json"
                                        value={mergedText}
                                        theme={monacoTheme}
                                        options={{ ...editorOptions, readOnly: true }}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center px-6 text-center">
                                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                                            {t('mergeEmpty')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
};
