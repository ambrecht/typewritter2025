"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Key } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ApiKeyWarning() {
  const [showWarning, setShowWarning] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    // Prüfe, ob der API-Schlüssel gesetzt ist
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/debug")
        const data = await response.json()

        // Wenn der API-Schlüssel nicht existiert oder leer ist
        if (!data.apiKeyExists) {
          setShowWarning(true)
        }
      } catch (error) {
        console.error("Fehler beim Prüfen des API-Schlüssels:", error)
        // Bei einem Fehler zeigen wir die Warnung sicherheitshalber an
        setShowWarning(true)
      }
    }

    checkApiKey()
  }, [])

  // Funktion zum temporären Speichern des API-Schlüssels in der Session
  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: "error", text: "Bitte geben Sie einen API-Schlüssel ein." })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/set-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "API-Schlüssel erfolgreich gespeichert. Seite wird neu geladen..." })
        // Seite nach kurzer Verzögerung neu laden
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setMessage({ type: "error", text: data.message || "Fehler beim Speichern des API-Schlüssels." })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Fehler beim Speichern des API-Schlüssels. Bitte versuchen Sie es später erneut.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!showWarning) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-black p-2 text-center z-50">
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center mb-2">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>
            API-Schlüssel nicht gefunden oder ungültig. Die Speicher- und Ladefunktionen sind nicht verfügbar.
          </span>
        </div>

        {!showInput ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowInput(true)}
            className="bg-white hover:bg-gray-100 text-black"
          >
            <Key className="h-4 w-4 mr-2" />
            API-Schlüssel eingeben
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 items-center mt-2 w-full max-w-md">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API-Schlüssel eingeben"
              className="px-3 py-1 rounded border border-gray-300 flex-grow w-full sm:w-auto"
              disabled={isSubmitting}
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveApiKey}
                disabled={isSubmitting}
                className="bg-white hover:bg-gray-100 text-black"
              >
                {isSubmitting ? "Wird gespeichert..." : "Speichern"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowInput(false)
                  setApiKey("")
                  setMessage(null)
                }}
                disabled={isSubmitting}
                className="bg-transparent hover:bg-amber-600 text-black"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {message && (
          <div className={`mt-2 text-sm ${message.type === "success" ? "text-green-800" : "text-red-800"}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}
