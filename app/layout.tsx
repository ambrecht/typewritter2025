import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import "../styles/android-fixes.css"

export const metadata: Metadata = {
  title: {
    default: "Typewriter App - Ablenkungsfreies Schreiben",
    template: "%s | Typewriter App",
  },
  description:
    "Eine minimalistische Schreibumgebung für konzentriertes Arbeiten. Ohne Ablenkungen, mit intelligenten Zeilenumbrüchen und Dark Mode.",
  keywords: ["Schreiben", "Typewriter", "Minimalistisch", "Produktivität", "Konzentration", "Dark Mode"],
  authors: [{ name: "Typewriter App Team" }],
  creator: "Typewriter App",
  publisher: "Typewriter App",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://typewriter-app.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "/",
    title: "Typewriter App - Ablenkungsfreies Schreiben",
    description:
      "Eine minimalistische Schreibumgebung für konzentriertes Arbeiten. Ohne Ablenkungen, mit intelligenten Zeilenumbrüchen und Dark Mode.",
    siteName: "Typewriter App",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Typewriter App - Ablenkungsfreies Schreiben",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Typewriter App - Ablenkungsfreies Schreiben",
    description: "Eine minimalistische Schreibumgebung für konzentriertes Arbeiten.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
  generator: "Next.js",
  applicationName: "Typewriter App",
  referrer: "origin-when-cross-origin",
  colorScheme: "light dark",
  themeColor: "#f5f5f4",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Typewriter",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <head>
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.ambrecht.de" />

        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://api.ambrecht.de" />
      </head>
      <body>{children}</body>
    </html>
  )
}
