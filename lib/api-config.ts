// Zentrale API-Konfiguration
export const API_CONFIG = {
  BASE_URL: "https://api.ambrecht.de",
  ENDPOINTS: {
    SAVE: "/api/typewriter/save",
    SESSIONS: "/api/typewriter/sessions",
    LAST_SESSION: "/api/typewriter/last",
  },
} as const

// Hilfsfunktion für vollständige URLs
export function getApiUrl(endpoint: keyof typeof API_CONFIG.ENDPOINTS): string {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[endpoint]}`
}
