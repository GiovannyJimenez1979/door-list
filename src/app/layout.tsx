import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Door List Live | Door List",
  description: "Door List Live. 12 de diciembre de 2026 en Teatro Royal Center, Bogotá.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
