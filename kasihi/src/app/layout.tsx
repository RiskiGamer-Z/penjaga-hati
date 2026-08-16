import type { Metadata } from "next";
import { Inter, Noto_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import FloatingWhatsApp from "@/components/layout/FloatingWhatsApp";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kasihi - Kami Siap Hadir Mendampingi Pasien Rumah Sakit",
  description: "Platform penyedia jasa pendamping pasien profesional di rumah sakit yang terpercaya.",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${notoSerif.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col font-sans bg-brand-light text-brand-dark">
        <Toaster position="top-center" richColors />
        {children}
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
