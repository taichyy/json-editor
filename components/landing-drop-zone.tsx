"use client"

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, ClipboardPaste, Sparkles, ShieldCheck } from "lucide-react";

import { SAMPLE_JSON, saveForEditor, describeParseError } from "@/lib/json-utils";

type TLandingDropZoneProps = {
    onOpen: () => void;
};

const btnOutline = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
    border transition-colors active:scale-[0.97] hover:bg-[var(--bg-overlay)]`;

export const LandingDropZone = (props: TLandingDropZoneProps) => {
    const { onOpen } = props;

    const t = useTranslations();
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState('');

    const openText = (text: string) => {
        try {
            saveForEditor(JSON.parse(text));
            onOpen();
        } catch (e) {
            const { line, column } = describeParseError(text, e);
            setError(line ? t('dropZone.invalidAt', { line, column: column ?? 1 }) : t('dropZone.invalid'));
        }
    };

    const openFile = (file?: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => openText((e.target?.result as string) || '');
        reader.readAsText(file);
    };

    const paste = async () => {
        try {
            openText(await navigator.clipboard.readText());
        } catch {
            setError(t('dropZone.clipboardDenied'));
        }
    };

    return (
        <div>
            <div
                className="rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer"
                style={{
                    borderColor: dragging ? "var(--accent)" : "var(--border-default)",
                    backgroundColor: dragging ? "var(--accent-subtle)" : "var(--bg-surface)",
                }}
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); openFile(e.dataTransfer.files?.[0]); }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".json,application/json,.txt"
                    className="hidden"
                    onChange={e => { openFile(e.target.files?.[0]); e.target.value = ''; }}
                />
                <Upload className="mx-auto w-6 h-6 mb-3" style={{ color: "var(--accent)" }} strokeWidth={1.75} />
                <p className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{t('dropZone.title')}</p>
                <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>{t('dropZone.subtitle')}</p>

                <div className="flex flex-wrap items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={paste} className={btnOutline} style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                        <ClipboardPaste className="w-3.5 h-3.5" strokeWidth={2} />
                        {t('dropZone.paste')}
                    </button>
                    <button
                        onClick={() => openText(JSON.stringify(SAMPLE_JSON))}
                        className={btnOutline}
                        style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
                    >
                        <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
                        {t('dropZone.sample')}
                    </button>
                </div>

                {error && (
                    <p role="alert" className="mt-4 text-xs" style={{ color: "var(--error)" }}>{error}</p>
                )}
            </div>

            <p className="flex items-center justify-center gap-1.5 mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                {t('landing.localProcessing')}
            </p>
        </div>
    );
};
