import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpaceX Air · Booking",
  description:
    "Search, flights, seats, travelers, review, and checkout — full booking flow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body
        className={`${GeistSans.className} min-h-full bg-[#07080a] font-sans text-zinc-100`}
      >
        {children}
      </body>
    </html>
  );
}
