import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import AppShell from "@/components/AppShell";
import { AppDataProvider } from "@/providers/AppDataProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "МедГрафт — Личный кабинет",
  description: "Запись на приём, документы, чекапы",
  applicationName: "МедГрафт",
  manifest: "/manifest.webmanifest",
  // ⚠️ themeColor и viewport — НЕ здесь (Next ругался), см. export viewport ниже
  formatDetection: { telephone: true, date: false, address: false, email: false, url: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "МедГрафт",
  },
};

// ✔️ выносим viewport + themeColor сюда, по требованиям Next
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A58F5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" style={{ WebkitTapHighlightColor: "transparent" }}>
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#F7FAFF] antialiased`}>
        {/* pwa-bip Script — оставить как есть */}
        <Script id="pwa-bip" strategy="beforeInteractive">
          {`
            (function () {
              try {
                window.__deferredPrompt = null;
                window.addEventListener('beforeinstallprompt', function (e) {
                  e.preventDefault();
                  window.__deferredPrompt = e;
                  window.dispatchEvent(new Event('pwa:bip-available'));
                }, { once: false });
              } catch (e) {}
            })();
          `}
        </Script>
        <AppDataProvider>
          <AppShell>{children}</AppShell>
        </AppDataProvider>

     </body>
    </html>
  );
}
