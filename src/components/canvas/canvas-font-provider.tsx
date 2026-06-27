"use client";

import { Inter, Lora, Open_Sans, Roboto } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const fontClassName = `${inter.variable} ${roboto.variable} ${openSans.variable} ${lora.variable}`;

export function CanvasFontProvider({ children }: { children: React.ReactNode }) {
  return <div className={fontClassName}>{children}</div>;
}
