import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./site.css";

export const metadata: Metadata = {
  title: "Conexão Circular",
  description: "Conectando, consumo consciente.",
  applicationName: "Conexão Circular",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Conexão Circular",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#364437",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
