import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindLoom — граф знаний",
  description: "Платформа для изучения тем через интерактивные карты знаний.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
