import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppKitProvider } from '@/components/providers/AppKitProvider'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "peterpan.pro",
  description: "Token-to-equity startup fundraising platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Persona KYC SDK */}
        <script src="https://cdn.withpersona.com/dist/persona-v4.9.0.js"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <AppKitProvider>
          {children}
        </AppKitProvider>
      </body>
    </html>
  );
}
