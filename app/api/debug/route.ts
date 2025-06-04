import { NextResponse } from "next/server"
import { getApiKey } from "@/lib/api-key-storage"

export async function GET() {
  // Nur in Development-Umgebung verfügbar
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 })
  }

  const apiKey = getApiKey()

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    apiKeyConfigured: !!apiKey,
    timestamp: new Date().toISOString(),
  })
}
