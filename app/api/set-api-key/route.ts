import { type NextRequest, NextResponse } from "next/server"

// Einfache Lösung ohne komplexe Datenstrukturen
// Wir verwenden eine einfache Variable, die während der Laufzeit des Servers existiert
let temporaryApiKey = ""

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "Bad Request", message: "API-Schlüssel muss angegeben werden" },
        { status: 400 },
      )
    }

    // Speichere den API-Schlüssel in der temporären Variable
    temporaryApiKey = apiKey

    return NextResponse.json(
      {
        success: true,
        message: "API-Schlüssel temporär gespeichert. Die Speicher- und Ladefunktionen sind jetzt verfügbar.",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Fehler beim Setzen des API-Schlüssels:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
      },
      { status: 500 },
    )
  }
}

// Hilfsfunktion zum Abrufen des API-Schlüssels
export function getApiKey(): string {
  // Wenn ein temporärer Schlüssel gesetzt wurde, verwende diesen
  if (temporaryApiKey) {
    return temporaryApiKey
  }

  // Ansonsten verwende die Umgebungsvariable
  return process.env.API_KEY || ""
}
