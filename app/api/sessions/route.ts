import { type NextRequest, NextResponse } from "next/server"
import { getApiKey } from "../set-api-key/route"

// Korrigierte API-Basis-URL
const API_BASE_URL = "https://api.ambrecht.de"
// Verwende den korrekten Pfad für den Endpunkt
const API_ENDPOINT = "/api/typewriter/sessions"

export async function GET(request: NextRequest) {
  try {
    // Verwende die getApiKey-Funktion, um den API-Schlüssel zu erhalten
    const apiKey = getApiKey()

    // Prüfe, ob der API-Schlüssel vorhanden ist
    if (!apiKey) {
      console.warn("API-Schlüssel nicht gefunden. Bitte setzen Sie die API_KEY Umgebungsvariable.")
      return NextResponse.json(
        {
          error: "Configuration Error",
          message: "API-Schlüssel nicht gefunden. Bitte setzen Sie die API_KEY Umgebungsvariable.",
        },
        { status: 400 },
      )
    }

    console.log("Sende Anfrage an:", `${API_BASE_URL}${API_ENDPOINT}`)

    // Sende die Anfrage an den externen API-Endpunkt mit dem API-Schlüssel im Header
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    })

    // Verarbeite die Antwort
    try {
      // Hole zuerst den Antworttext
      const responseText = await response.text()

      // Prüfe, ob der Text leer ist oder nicht wie JSON aussieht
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
        // Versuche, den Text als JSON zu parsen
        const data = JSON.parse(responseText)

        if (!response.ok) {
          // Wenn der API-Schlüssel ungültig ist, gib eine spezifischere Fehlermeldung zurück
          if (
            response.status === 401 ||
            response.status === 403 ||
            (data.message && data.message.includes("API-Schlüssel"))
          ) {
            return NextResponse.json(
              {
                error: "Authentication Error",
                message: "Ungültiger API-Schlüssel. Bitte überprüfen Sie Ihre API_KEY Umgebungsvariable.",
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
