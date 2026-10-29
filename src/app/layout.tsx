import type { Metadata } from "next";
import { Caveat, Fraunces, Geist_Mono, Work_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { Providers } from "@/components/providers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n";
import "./globals.css";

// Tema do protótipo (spec 0011): corpo Work Sans (sans-serif, como pedido na 0006/0010), títulos em Fraunces
// (serifa, só títulos curtos) e Caveat como acento manuscrito de uma linha. Fontes variáveis: sem `weight`.
const body = Work_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  // Eixo de tamanho óptico (spec 0013): sem ele não existe o corte de display (hastes finas) do título gigante.
  axes: ["opsz"],
  display: "swap",
});

const hand = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
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
      className={`${body.variable} ${display.variable} ${hand.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><Providers session={session} locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
