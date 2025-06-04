import Link from "next/link"
import { FileText, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3efe9] dark:bg-gray-900">
      <div className="text-center p-8 max-w-md mx-auto">
        <div className="mb-8">
          <FileText className="h-24 w-24 mx-auto text-gray-400 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 font-serif">404</h1>
          <h2 className="text-xl text-gray-600 dark:text-gray-300 mb-4 font-serif">Seite nicht gefunden</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-serif">
            Die angeforderte Seite konnte nicht gefunden werden. Möglicherweise wurde sie verschoben oder gelöscht.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-serif transition-colors duration-200"
        >
          <Home className="h-4 w-4" />
          Zurück zur Typewriter App
        </Link>
      </div>
    </div>
  )
}
