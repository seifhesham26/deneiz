import type { Metadata } from "next";
import { Cairo, Poppins } from "next/font/google";
import { cookies } from "next/headers";
import { AppProviders } from "@/components/providers/app-providers";
import { DEFAULT_LOCALE, LOCALE_COOKIE } from "@/lib/constants";
import { SUPPORTED_LOCALES, type Locale } from "@/types/shared";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Deneiz — Accessories",
    template: "%s | Deneiz",
  },
  description:
    "Handpicked accessories — rings, bracelets, and more. إكسسوارات منتقاة بعناية.",
};

function readLocaleCookie(value: string | undefined): Locale {
  return SUPPORTED_LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Locale lives in a cookie so SSR emits the correct lang/dir and the
  // client never fights a hydration mismatch after switching languages
  const cookieStore = await cookies();
  const locale = readLocaleCookie(cookieStore.get(LOCALE_COOKIE)?.value);

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${poppins.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <AppProviders initialLocale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
