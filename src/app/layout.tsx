import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

import Providers from "@/components/providers";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Life RPG - Gamified Personal Development",
  description: "Turn personal development into a gamified RPG experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={roboto.className}>
        <Providers>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <main style={{ flexGrow: 1 }}>{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
