import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import { AppThemeProvider } from "@/components/theme-provider";
import { NavBar } from "@/components/nav-bar";
import { validateRequest } from "@/lib/auth-utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Gamified Life RPG",
  description: "Turn your life into an adventure",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await validateRequest();

  return (
    <html lang="en" className={inter.variable}>
      <body>
        <TRPCReactProvider>
          <AppThemeProvider>
            <NavBar user={user} />
            {children}
          </AppThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
