// Vereinfachte API-Schlüssel-Verwaltung - nur aus Environment Variables
import { cookies } from "next/headers"

const API_KEY_COOKIE_NAME = "typewriter_api_key"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 Tage

// In-Memory Fallback für Serverless-Umgebungen
let memoryApiKey = ""

export async function setApiKey(apiKey: string): Promise<void> {
  // Speichere in Memory als Fallback
  memoryApiKey = apiKey

  // Versuche in Cookies zu speichern (nur wenn verfügbar)
  try {
    const cookieStore = (await cookies()) as any
    if (cookieStore?.set) {
      cookieStore.set(API_KEY_COOKIE_NAME, apiKey, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
    }
  } catch (error) {
    // Cookies nicht verfügbar, verwende nur Memory
    console.warn("Cookies nicht verfügbar, verwende Memory-Speicherung")
  }
}

export function getApiKey(): string {
  // Immer aus Umgebungsvariable lesen
  return process.env.API_KEY || ""
}

export function hasApiKey(): boolean {
  return !!process.env.API_KEY
}

export async function clearApiKey(): Promise<void> {
  memoryApiKey = ""

  try {
    const cookieStore = (await cookies()) as any
    if (cookieStore?.delete) {
      cookieStore.delete(API_KEY_COOKIE_NAME)
    }
  } catch (error) {
    // Cookies nicht verfügbar
  }
}
