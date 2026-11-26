import type { Metadata } from "next";
import localFont from "next/font/local";
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
    title: 'json.tools — JSON Editor',
    description:
        'A fast, local JSON editor with tree view, table view, Monaco code editor, and diff comparison. Your data never leaves your browser.',
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
