import { type NextRequest, NextResponse } from "next/server"
import { getApiKey } from "@/lib/api-key-storage"
import { getApiUrl } from "@/lib/api-config"

export async function GET(request: NextRequest) {
  try {
    const apiKey = getApiKey()

    if (!apiKey) {
      console.warn("API-Schlüssel nicht gefunden.")
      return NextResponse.json(
        {
          error: "Configuration Error",
          message:
            "API-Schlüssel nicht gefunden. Bitte setzen Sie die API_KEY Umgebungsvariable oder konfigurieren Sie den Schlüssel in den Einstellungen.",
        },
        { status: 400 },
      )
    }

    const apiUrl = getApiUrl("SESSIONS")
    console.log("Sende Anfrage an:", apiUrl)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    })

    if (response.status === 429) {
      await response.text()
      return NextResponse.json(
        {
          error: "Rate Limit",
          message: "Zu viele Anfragen. Bitte später erneut versuchen.",
        },
        { status: 429 },
      )
    }

    try {
      const responseText = await response.text()

      if (!responseText || responseText.trim() === "" || responseText.includes("<!DOCTYPE html>")) {
        console.error("Ungültige API-Antwort:", responseText)
        return NextResponse.json(
          {
            error: "API Error",
            message: "Ungültige Antwort vom Server erhalten",
          },
          { status: 500 },
        )
      }

      try {
        const data = JSON.parse(responseText)

        if (!response.ok) {
          if (
            response.status === 401 ||
            response.status === 403 ||
            (data.message && data.message.includes("API-Schlüssel"))
          ) {
            return NextResponse.json(
              {
                error: "Authentication Error",
                message: "Ungültiger API-Schlüssel. Bitte überprüfen Sie Ihre Konfiguration.",
              },
              { status: 401 },
            )
          }

          return NextResponse.json(
            { error: data.error || "Error", message: data.message || "Fehler beim Abrufen der Texte" },
            { status: response.status },
          )
        }

        return NextResponse.json(
          {
            success: true,
            data: data.data || [],
          },
          { status: 200 },
        )
      } catch (parseError) {
        console.error("Konnte API-Antwort nicht als JSON parsen:", responseText)
        return NextResponse.json(
          {
            error: "API Error",
            message: "Ungültige JSON-Antwort vom Server",
          },
          { status: 500 },
        )
      }
    } catch (e) {
      console.error("Fehler beim Verarbeiten der API-Antwort:", e)
      return NextResponse.json(
        {
          error: "API Error",
          message: "Fehler beim Verarbeiten der API-Antwort",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Fehler beim Abrufen der Texte:", error)
    return NextResponse.json(
      { error: "Internal Server Error", message: "Fehler beim Abrufen der Texte" },
      { status: 500 },
    )
  }
}
