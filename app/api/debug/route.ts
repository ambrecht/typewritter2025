import { NextResponse } from "next/server"
import { getApiKey } from "../set-api-key/route"

export async function GET() {
  // Hole den API-Schlüssel mit der getApiKey-Funktion
  const apiKey = getApiKey()

  return NextResponse.json({
    apiKeyExists: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    // Zeige die ersten und letzten 4 Zeichen des Schlüssels für die Überprüfung (wenn vorhanden)
    apiKeyPreview:
      apiKey && apiKey.length > 8
        ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
        : "nicht vorhanden",
    // Umgebungsvariablen
    envApiKey: process.env.API_KEY ? "vorhanden" : "nicht vorhanden",
    testVar: process.env.TEST_VAR || "nicht gesetzt",
  })
}
