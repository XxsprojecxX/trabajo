// app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import Script from "next/script";
import NavBar from "./api/components/NavBar";

export const metadata = {
  title: "Dashboard de Insights",
  description: "Cerebro de IA + BigQuery",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>  
        <Script id="tailwind-config" strategy="beforeInteractive">
          {`
            tailwind.config = {
              theme: {
                extend: {
                  fontFamily: {
                    sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
                  },
                },
              },
            };
          `}
        </Script>
        <Script
          src="https://cdn.tailwindcss.com?plugins=forms,typography"
          strategy="beforeInteractive"
        />
        {/* Remix Icons (tu UI usa clases ri-...) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
