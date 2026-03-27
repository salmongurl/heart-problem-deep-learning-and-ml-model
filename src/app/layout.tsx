import type { Metadata } from "next";
import { Merriweather, Space_Grotesk } from "next/font/google";
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
  title: "PulseScope | Health Risk Predictor",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
