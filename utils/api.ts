/**
 * API-Funktionen für die Typewriter-App
 */

/**
 * Speichert den Text in der API
 *
 * @param text - Der zu speichernde Text
 * @returns Ein Promise mit der Antwort der API
 */
export const saveText = async (text: string): Promise<{ success: boolean; message: string; id?: number }> => {
  try {
    const response = await fetch("/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Fehler beim Speichern des Textes")
    }

    return {
      success: true,
      message: data.message || "Text erfolgreich gespeichert",
      id: data.id,
    }
  } catch (error) {
    console.error("Fehler beim Speichern des Textes:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unbekannter Fehler beim Speichern",
    }
  }
}

/**
 * Lädt alle gespeicherten Texte aus der API
 *
 * @returns Ein Promise mit der Antwort der API
 */
export const getAllTexts = async (): Promise<{ success: boolean; data?: any[]; message?: string }> => {
  try {
    const response = await fetch("/api/sessions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Fehler beim Laden der Texte")
    }

    return {
      success: true,
      data: data.data || [],
    }
  } catch (error) {
    console.error("Fehler beim Laden der Texte:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unbekannter Fehler beim Laden",
    }
  }
}

/**
 * Lädt die zuletzt gespeicherte Session aus der API
 *
 * @returns Ein Promise mit der Antwort der API
 */
export const getLastSession = async (): Promise<{
  success: boolean
  text?: string
  id?: number
  createdAt?: string
  wordCount?: number
  letterCount?: number
  message?: string
}> => {
  try {
    const response = await fetch("/api/last-session", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Fehler beim Laden der letzten Sitzung")
    }

    return {
      success: true,
      text: data.text || "",
      id: data.id,
      createdAt: data.createdAt,
      wordCount: data.wordCount,
      letterCount: data.letterCount,
      message: "Letzte Sitzung erfolgreich geladen",
    }
  } catch (error) {
    console.error("Fehler beim Laden der letzten Sitzung:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unbekannter Fehler beim Laden",
    }
  }
}
