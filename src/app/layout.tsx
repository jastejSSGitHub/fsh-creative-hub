import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";

import { AuthTransitionProvider } from "@/components/auth/auth-transition-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteUrl } from "@/lib/site-url";

import "./globals.css";

const siteDescription =
  "Internal creative collaboration for FSH Design — projects, initiatives, assets, and team consensus.";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FSH Creative Hub",
  description:
    "Internal creative collaboration for FSH Design — projects, initiatives, assets, and team consensus.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=location.pathname;if(p==="/"||p==="/landing"){var r=document.documentElement;r.classList.remove("dark");r.classList.add("light");r.style.colorScheme="light";}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-hub-paper text-hub-foreground font-sans">
        <ThemeProvider>
          <AuthTransitionProvider>{children}</AuthTransitionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
