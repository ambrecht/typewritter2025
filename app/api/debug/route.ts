import { NextResponse } from "next/server"
import { getApiKey } from "@/lib/api-key-storage"

export async function GET() {
  const apiKey = getApiKey()

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    apiKeyConfigured: !!apiKey,
    timestamp: new Date().toISOString(),
  })
}
