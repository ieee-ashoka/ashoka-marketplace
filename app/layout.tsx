import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./Providers";
import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/nav/Footer";
import Topbar from "@/components/nav/Topbar";
import BottomBar from "@/components/nav/Bottombar";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import { AuthProvider } from "./context/AuthContext";

export const metadata: Metadata = {
  title: {
    default: "Ashoka Marketplace",
    template: "%s | Ashoka Marketplace"
  },
  description: "A marketplace for Ashoka University students to buy and sell second-hand items on campus.",
  applicationName: "Ashoka Marketplace",
  keywords: ["ashoka", "marketplace", "secondhand", "student", "buy", "sell", "campus", "university"],
  authors: [{ name: "IEEE Ashoka Student Branch", url: "https://ieee-ashoka.in" }],
  creator: "IEEE Ashoka Student Branch",
  publisher: "IEEE Ashoka Student Branch",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ashoka Market",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Ashoka Marketplace",
    title: "Ashoka Marketplace - Campus Second-Hand Trading",
    description: "Buy and sell second-hand items on campus with fellow Ashoka students.",
    url: "https://marketplace.ashoka.edu.in",
    images: [
      {
        url: "/images/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Ashoka Marketplace Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Ashoka Marketplace",
    description: "Buy and sell second-hand items on campus",
    images: ["/images/android-chrome-512x512.png"],
  },
  icons: {
    icon: [
      { url: "/images/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/images/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f39f6" },
    { media: "(prefers-color-scheme: dark)", color: "#4f39f6" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
          <AuthProvider>
            <main className="flex min-h-screen flex-col bg-background">
              <InstallPrompt />
              <Topbar />
              <Navbar />
              {children}
              <Footer />
              <BottomBar />
            </main>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
