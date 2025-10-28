import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SolanaProvider from "@/providers/solana-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flexanon",
  description: "ANONYMOUS IDENTITY ON SOLANA POWERED BY ZERION",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Sansation:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap"
        />
      <body
        className={` ${geistMono.variable} antialiased font-mono`}
      >
        <ThemeProvider attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            disableTransitionOnChange>
                <Toaster position="bottom-right" />

         <SolanaProvider>{children}</SolanaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
