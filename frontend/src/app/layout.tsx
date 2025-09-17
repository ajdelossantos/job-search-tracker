import "@/client"; // ensures generated client (and runtime config) is loaded once
import Providers from "@/components/providers";
import { Roboto } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${roboto.className} min-h-screen bg-white text-gray-900 antialiased`}
      >
        <Providers>
          <div className="grid min-h-screen grid-rows-[4rem_1fr_2rem]">
            <Header />

            <main className="w-full">
              <div className="app-shell mx-auto w-full max-w-screen-2xl px-6 pt-8 pb-4">
                {children}
              </div>
            </main>

            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
