import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';

import { routing } from '@/i18n/routing';

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const isZhTW = locale === 'zh-TW';

    return {
        title: isZhTW ? 'json.tools — JSON 編輯器' : 'json.tools — JSON Editor',
        description: isZhTW
            ? '快速的本機 JSON 編輯器，支援樹狀視圖、表格視圖、Monaco 程式碼編輯器與差異比較。您的資料絕不離開瀏覽器。'
            : 'A fast, local JSON editor with tree view, table view, Monaco code editor, and diff comparison. Your data never leaves your browser.',
        openGraph: {
            title: isZhTW ? 'json.tools — JSON 編輯器' : 'json.tools — JSON Editor',
            description: isZhTW
                ? '流暢編輯 JSON 資料。樹狀視圖、表格視圖、Monaco 編輯器與差異比較，完全本機運作。'
                : 'Edit JSON without friction. Tree view, table view, Monaco editor, and diff comparison. All local, all fast.',
            type: 'website',
        },
    };
}

export default async function LocaleLayout({ children, params }: Props) {
    const { locale } = await params;

    // Validate locale
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    // Pass locale explicitly so getMessages loads the correct file
    const messages = await getMessages({ locale });

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
        </NextIntlClientProvider>
    );
}
