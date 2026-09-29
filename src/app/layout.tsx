import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SuperLearn — Unified Cognitive Study Engine",
  description:
    "Autonomous closed-loop learning workspace integrating Dynamic Syllabus, Mental Schema Canvas, and Adaptive Bloom's Testing.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
