import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import SplashWrapper from "@/components/SplashWrapper";

export const viewport: Viewport = {
  themeColor: "#dc2626",
};

export const metadata: Metadata = {
  title: "PAC KAWUNGANTEN APP",
  description: "Sistem Informasi Basis Data PAC KAWUNGANTEN",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PAC KAWUNGANTEN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PAC KAWUNGANTEN" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body>
        <Providers>
          <SplashWrapper>
            {children}
          </SplashWrapper>
        </Providers>
      </body>
    </html>
  );
}
