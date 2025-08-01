"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3efe9] dark:bg-gray-900">
      <div className="text-center p-8 max-w-md mx-auto">
        <div className="mb-8">
          <AlertTriangle className="h-24 w-24 mx-auto text-red-500 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 font-serif">Oops!</h1>
          <h2 className="text-xl text-gray-600 dark:text-gray-300 mb-4 font-serif">Etwas ist schiefgelaufen</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-serif">
            Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder kehren Sie zur Startseite
            zurück.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-serif transition-colors duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            Erneut versuchen
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-serif transition-colors duration-200"
          >
            <Home className="h-4 w-4" />
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
