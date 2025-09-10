import "@/client"; // ensures generated client (and runtime config) is loaded once
import Providers from "@/components/providers";
import { Roboto } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Job Search Tracker - Frontend",
  description: "A frontend application for tracking job searches",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.className} antialiased`}>
        <div className="flex min-h-screen flex-col items-left justify-center py-2">
          <Header />
          <Providers>{children}</Providers>
          <Footer />
        </div>
      </body>
    </html>
  );
}
