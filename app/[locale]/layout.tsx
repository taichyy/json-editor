import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

import { routing } from "../../i18n/routing";

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export const generateStaticParams = async () => {
    return routing.locales.map((locale) => ({ locale }));
};

export const generateMetadata = async (props: Props): Promise<Metadata> => {
    const { locale } = await props.params;

    const isZhTW = locale === 'zh-TW';

    const title = isZhTW ? 'JSON Owl · 簡單好用的 JSON 編輯器' : 'JSON Owl · A simple JSON editor';
    const description = isZhTW
        ? 'JSON Owl 是簡單、直覺的線上 JSON 編輯器：樹狀與表格編輯、程式碼編輯器、差異比較與合併。開源，資料只在你的瀏覽器處理、不會上傳。'
        : 'JSON Owl is a simple online JSON editor with tree and table editing, a code editor, diff and merge. Open source, and your data never leaves your browser.';

    return {
        title,
        description,
        applicationName: 'JSON Owl',
        openGraph: {
            title,
            description,
            siteName: 'JSON Owl',
            type: 'website',
        },
    };
};

const LocaleLayout = async (props: Props) => {
    const { children } = props;
    const { locale } = await props.params;

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

export default LocaleLayout;
