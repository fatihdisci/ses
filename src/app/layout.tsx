import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

const playfair = localFont({
  src: "../../node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2",
  variable: "--font-playfair",
  display: "swap",
  weight: "400 900",
});

export const metadata: Metadata = {
  title: "Foot Reading — Ancient Wisdom, Modern Insight",
  description:
    "Upload photos of your feet and receive a mystical Podomancy reading alongside personalised foot care advice, powered by AI vision.",
  openGraph: {
    title: "Foot Reading — Ancient Wisdom, Modern Insight",
    description: "Discover what your feet reveal about your destiny and health.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1c1547",
              border: "1px solid rgba(245, 200, 66, 0.2)",
              color: "#f0f2f8",
            },
          }}
        />
      </body>
    </html>
  );
}
