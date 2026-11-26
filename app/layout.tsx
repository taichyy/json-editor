import localFont from "next/font/local";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";

const geistSans = localFont({
    src: './fonts/GeistVF.woff',
    variable: '--font-geist-sans',
    weight: '100 900',
    display: 'swap',
});
const geistMono = localFont({
    src: './fonts/GeistMonoVF.woff',
    variable: '--font-geist-mono',
    weight: '100 900',
    display: 'swap',
});

export const metadata: Metadata = {
    metadataBase: new URL('https://json-editor.heytai.dev'),
    title: 'JSON Owl · A simple JSON editor',
    description:
        'JSON Owl is a simple online JSON editor with tree and table editing, a code editor, diff and merge. Open source, and your data never leaves your browser.',
    applicationName: 'JSON Owl',
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#fafafa' },
        { media: '(prefers-color-scheme: dark)', color: '#09090b' },
    ],
};

const RootLayout = (props: { children: React.ReactNode }) => {
    const { children } = props;

    return (
        <html suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <Analytics />
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}

export default RootLayout;
