import { NextResponse } from "next/server"

// Diese Route ist nicht mehr nötig, da wir nur Environment Variables verwenden
export async function POST() {
  return NextResponse.json(
    {
      error: "Not Implemented",
      message:
        "API-Schlüssel wird automatisch aus Umgebungsvariablen gelesen. Setzen Sie API_KEY in Ihrer .env.local Datei.",
    },
    { status: 501 },
  )
}
