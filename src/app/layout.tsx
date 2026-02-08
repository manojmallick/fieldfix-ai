import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "FieldFix AI - Equipment Service Assistant",
  description: "AI-powered field service equipment analysis and repair planning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="bg-blue-600 text-white shadow-md">
            <div className="container py-4">
              <Link href="/live" className="inline-flex flex-col">
                <span className="text-2xl font-bold">FieldFix AI</span>
                <span className="text-blue-100 text-sm">Powered by Gemini</span>
              </Link>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-gray-100 dark:bg-gray-900 py-4 mt-8">
            <div className="container text-center text-sm text-gray-600 dark:text-gray-400">
              © 2026 FieldFix AI. Demo application.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
