import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, IBM_Plex_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const ibmSans = IBM_Plex_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-sans",
});

const ibmMono = IBM_Plex_Mono({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-mono",
});

const ibmDevanagari = IBM_Plex_Sans_Devanagari({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["devanagari", "latin"],
  variable: "--font-ibm-devanagari",
});

export const metadata: Metadata = {
  title: "MECEE-BL Exam Prep Platform",
  description: "Exam prep platform for Nepal MECEE-BL medical/health-science entrance exams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${ibmSans.variable} ${ibmMono.variable} ${ibmDevanagari.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0A] text-[#EDEDED]">
        {children}
      </body>
    </html>
  );
}
