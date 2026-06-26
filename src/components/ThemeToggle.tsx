'use client';

import { Moon, Sun } from 'lucide-react';

import { useTheme } from './ThemeProvider';

export function ThemeToggle({ className = '' }: { className?: string }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                text-xs font-medium select-none
                transition-all duration-200 active:scale-[0.96]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
                ${className}
            `}
            style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--text-tertiary)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
        >
            {isDark ? (
                <>
                    <Sun className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Light</span>
                </>
            ) : (
                <>
                    <Moon className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Dark</span>
                </>
            )}
        </button>
    );
}
