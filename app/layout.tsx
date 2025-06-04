import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import "../styles/android-fixes.css"

export const metadata: Metadata = {
  title: "Typewriter App",
  description: "A distraction-free writing experience",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>{/* Preload sound files as resources but don't create audio elements in head */}</head>
      <body>{children}</body>
    </html>
  )
}
