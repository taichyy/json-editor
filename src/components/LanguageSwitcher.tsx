'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const toggle = () => {
        const next = locale === 'en' ? 'zh-TW' : 'en';
        startTransition(() => {
            router.replace(pathname, { locale: next });
        });
    };

    return (
        <button
            onClick={toggle}
            disabled={isPending}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent',
                opacity: isPending ? 0.6 : 1,
                minWidth: '52px',
                justifyContent: 'center',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-overlay)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            title={locale === 'en' ? '切換至繁體中文' : 'Switch to English'}
            aria-label={locale === 'en' ? 'Switch to Traditional Chinese' : 'Switch to English'}
        >
            {locale === 'en' ? '中文' : 'EN'}
        </button>
    );
}
