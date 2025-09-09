import '@/client' // ensures generated client (and runtime config) is loaded once
import Providers from "@/components/providers";
import { Roboto } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
