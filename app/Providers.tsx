"use client";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider } from "next-themes";

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <HeroUIProvider>{children}</HeroUIProvider>
    </ThemeProvider>
  );
}
