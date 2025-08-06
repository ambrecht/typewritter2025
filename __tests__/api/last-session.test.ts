import { GET } from "@/app/api/last-session/route"
import { NextRequest } from "next/server"
import { jest } from "@jest/globals"

jest.mock("@/lib/api-key-storage", () => ({
  getApiKey: jest.fn(() => "test-api-key"),
}))

jest.mock("@/lib/api-config", () => ({
  getApiUrl: jest.fn(() => "https://api.test.com/last-session"),
}))

describe("/api/last-session", () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("should handle rate limit errors", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: () => Promise.resolve("Rate limit"),
    })

    const request = new Request(
      "http://localhost:3000/api/last-session"
    ) as any
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe("Rate Limit")
    expect(data.message).toBe(
      "Zu viele Anfragen. Bitte später erneut versuchen."
    )
  })
})
