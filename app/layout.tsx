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
    startupImage: [
      {
        url: "/icons/apple-touch-icon-180x180.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icons/apple-touch-icon-167x167.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
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
        url: "/icons/icon-512x512.png",
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
    images: ["/icons/icon-512x512.png"],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/icons/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" },
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
