import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Barton Chores",
  description: "Family chores and pocket money tracker"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-mist">
          <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <div className="text-lg font-semibold">Barton Chores</div>
            <div className="text-sm text-slate-500">Family ledger + approvals</div>
          </header>
          <main className="mx-auto max-w-5xl px-4 pb-16">{children}</main>
        </div>
      </body>
    </html>
  );
}
