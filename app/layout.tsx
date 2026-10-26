import type { Metadata } from "next";
import type { ReactNode } from "react";
import "bulma/css/bulma.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Code Generator",
  description: "Create QR codes for websites, Wi-Fi, contacts, WhatsApp and more.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
