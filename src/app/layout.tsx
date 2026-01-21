import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CGT Brain - Capital Gains Tax Property Timeline",
  description: "Interactive timeline for managing property events and capital gains tax calculations",
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster
          position="bottom-center"
          theme="system"
          richColors
          duration={6000}
          closeButton
        />
      </body>
    </html>
  );
}
