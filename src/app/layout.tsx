import type { Metadata } from "next";
import { Caveat_Brush, Geist_Mono, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { Providers } from "@/components/providers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n";
import "./globals.css";

// Corpo em sans-serif (padrão do projeto); títulos em letra manuscrita (como nas referências).
const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const display = Caveat_Brush({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Loja & Blog",
  description: "Loja e blog com Next.js",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const stored = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(stored) ? stored : DEFAULT_LOCALE;

  return (
    <html
      lang={locale}
      className={`${body.variable} ${display.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><Providers session={session} locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
