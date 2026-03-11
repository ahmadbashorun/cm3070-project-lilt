import { SearchProvider } from "@/components/Search";
import "@/styles/globals.scss";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Lilt - Stress-Adaptive Email & Task Manager",
  description:
    "An emotion-aware email and task management interface that adapts to your stress levels",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <SearchProvider />
      </body>
    </html>
  );
}
