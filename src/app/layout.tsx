import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const arabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AMAN 360 — Emergency Communication Assurance & Response Intelligence",
    template: "%s · AMAN 360",
  },
  description:
    "Existing systems detect the emergency. AMAN makes sure the right person receives the right verified action — and tells government what happened next.",
  applicationName: "AMAN 360",
};

export const viewport: Viewport = {
  themeColor: "#070b12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} ${arabic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-0 text-ink">{children}</body>
    </html>
  );
}
