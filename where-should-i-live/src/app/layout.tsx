import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { BackgroundVideo } from "@/components/BackgroundVideo";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Where should you live next?",
  description:
    "Answer a few questions. We’ll find your city. A minimal, shareable decision tool.",
  icons: {
    icon: [
      { url: "/icon-v6.png", type: "image/png" },
      { url: "/favicon-v6.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-ink">
        <BackgroundVideo />
        {children}
      </body>
    </html>
  );
}
