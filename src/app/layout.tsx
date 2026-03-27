import type { Metadata } from "next";
import { Merriweather, Space_Grotesk } from "next/font/google";
import Navbar from "../components/Navbar";
import BiologicalHeart from "../components/BiologicalHeart";
import "./globals.css";

const headlineFont = Merriweather({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CardioRisk AI | Health Prediction",
  description:
    "Health tracking frontend using machine learning and deep learning risk estimation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${headlineFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative pt-24 bg-gradient-to-br from-[#fff5f5] to-[#fae6e6] text-[#2d0a11]">
        <BiologicalHeart />
        <div className="ambient-bg" />
        <Navbar />
        <main className="flex-1 flex flex-col relative z-10 w-full pointer-events-none">
          <div className="flex-1 flex flex-col pointer-events-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
