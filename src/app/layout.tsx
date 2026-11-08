import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { SWRProvider } from "@/lib/swr-provider";
import { ThemeProvider, themeInitScript } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Showcase — Contrate músicos para seu evento",
  description: "Plataforma de contratação de músicos e artistas para eventos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <SWRProvider>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </SWRProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}