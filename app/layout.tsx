import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartCompute | Intelligent Budgeting",
  description: "A premium, intelligent budgeting application for managing pay periods, categories, and automated templates.",
};

import { LayoutWrapper } from "@/components/LayoutWrapper";
import { UIProvider } from "@/components/ui/UIProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <UIProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </UIProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
