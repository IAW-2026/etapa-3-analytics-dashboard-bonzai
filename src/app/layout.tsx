import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Analytics Dashboard — Bonzai",
  description: "Reportes consolidados del ecosistema Bonzai",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" className="h-full antialiased">
        <body style={{ minHeight: "100%", display: "flex", flexDirection: "column", margin: 0 }}>
          <AuthProvider>{children}</AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
