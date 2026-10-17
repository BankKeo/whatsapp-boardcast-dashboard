import type { Metadata } from "next";
import { Inter, Noto_Sans_Lao } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/session";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoLao = Noto_Sans_Lao({
  variable: "--font-noto-lao",
  subsets: ["lao"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Partner Club Overview",
    template: "%s · Partner Club",
  },
  description:
    "Partner Club WhatsApp Marketing System for Lao Brewery Co., Ltd. — manage outlets, build audiences, and monitor WhatsApp campaigns from one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoLao.variable} h-full antialiased`}
    >
      {/*
        `suppressHydrationWarning` only silences attribute mismatches on this
        element and is required because browser extensions (for example
        ColorZilla adding `cz-shortcut-listen`) inject attributes into <body>
        before React hydrates. Nothing managed by the app is suppressed.
      */}
      <body
        className="min-h-full bg-background text-foreground"
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
