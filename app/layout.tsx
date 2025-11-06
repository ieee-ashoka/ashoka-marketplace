import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";
import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/nav/Footer";
import Topbar from "@/components/nav/Topbar";
import BottomBar from "@/components/nav/Bottombar";

export const metadata: Metadata = {
  title: "Ashoka Marketplace",
  description: "A marketplace for Ashoka students to buy and sell secondhand items.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <main className="flex min-h-screen flex-col bg-background">
            <Topbar />
            <Navbar />
            {children}
            <Footer />
            <BottomBar />
          </main>
        </Providers>
      </body>
    </html>
  );
}
