import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Concerti Italia",
  description:
    "Scopri concerti ed eventi musicali in Italia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
