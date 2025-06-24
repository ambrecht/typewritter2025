import { type NextRequest, NextResponse } from "next/server"
import { getApiKey } from "@/lib/api-key-storage"
import { getApiUrl } from "@/lib/api-config"

// Logging-Funktion für Produktion
const log = (level: "info" | "warn" | "error", message: string, data?: any) => {
  if (process.env.NODE_ENV === "development") {
    console[level](message, data)
  } else if (level === "error") {
    // In Produktion nur Fehler loggen
    console.error(message, data)
    // Hier könnte Sentry oder anderes Monitoring integriert werden
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json(
        { error: "Bad Request", message: "Der Inhalt muss ein gültiger Text sein" },
        { status: 400 },
      )
    }

    const apiKey = getApiKey()

    if (!apiKey) {
      log("warn", "API-Schlüssel nicht gefunden.")
      return NextResponse.json(
        {
          error: "Configuration Error",
          message:
            "API-Schlüssel nicht gefunden. Bitte setzen Sie die API_KEY Umgebungsvariable oder konfigurieren Sie den Schlüssel in den Einstellungen.",
        },
        { status: 400 },
      )
    }

    const apiUrl = getApiUrl("SAVE")
    log("info", "Sende Anfrage an:", apiUrl)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ text: body.text }),
    })

    if (response.status === 429) {
      const text = await response.text().catch(() => "")
      log("warn", "Rate limit reached:", text)
      return NextResponse.json(
        {
          error: "Rate Limit",
          message: "Zu viele Anfragen. Bitte später erneut versuchen.",
        },
        { status: 429 },
      )
    }

    if (!response.ok) {
      let errorMessage = "Fehler beim Speichern des Textes"
      let errorData = {}

      try {
        const responseText = await response.text()

        if (!responseText || responseText.trim() === "" || responseText.includes("<!DOCTYPE html>")) {
          log("error", "Ungültige API-Antwort:", responseText)
          errorMessage = "Ungültige Antwort vom Server erhalten"
        } else {
          try {
            const data = JSON.parse(responseText)
            errorMessage = data.message || errorMessage
            errorData = data
            log("error", "API-Fehler:", data)
          } catch (parseError) {
            log("error", "Konnte API-Antwort nicht als JSON parsen:", responseText)
            errorMessage = "Ungültige JSON-Antwort vom Server"
          }
        }
      } catch (e) {
        log("error", "Fehler beim Verarbeiten der API-Antwort:", e)
      }

      if (response.status === 401 || response.status === 403 || errorMessage.includes("API-Schlüssel")) {
        return NextResponse.json(
          {
            error: "Authentication Error",
            message: "Ungültiger API-Schlüssel. Bitte überprüfen Sie Ihre Konfiguration.",
          },
          { status: 401 },
        )
      }

      return NextResponse.json(
        {
          error: "API Error",
          message: errorMessage,
          details: errorData,
          status: response.status,
        },
        { status: response.status },
      )
    }

    try {
      const responseText = await response.text()

      if (!responseText || responseText.trim() === "") {
        log("error", "Leere API-Antwort erhalten")
        return NextResponse.json(
          {
            error: "API Error",
            message: "Leere Antwort vom Server erhalten",
          },
          { status: 500 },
        )
      }

      try {
        const data = JSON.parse(responseText)

        return NextResponse.json(
          {
            success: true,
            message: "Text erfolgreich gespeichert",
            id: data.id,
          },
          { status: 201 },
        )
      } catch (parseError) {
        log("error", "Konnte API-Antwort nicht als JSON parsen:", responseText)
        return NextResponse.json(
          {
            error: "API Error",
            message: "Ungültige JSON-Antwort vom Server",
          },
          { status: 500 },
        )
      }
    } catch (e) {
      log("error", "Fehler beim Verarbeiten der API-Antwort:", e)
      return NextResponse.json(
        {
          error: "API Error",
          message: "Fehler beim Verarbeiten der API-Antwort",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    log("error", "Fehler beim Speichern des Textes:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unbekannter Fehler beim Speichern",
      },
      { status: 500 },
    )
  }
}
