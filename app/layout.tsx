import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bellschain Game",
  description: "On-chain game on Bellschain",
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

