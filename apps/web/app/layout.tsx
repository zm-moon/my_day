import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Days",
  description: "A personal heatmap of my days."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-mono antialiased">{children}</body>
    </html>
  );
}
