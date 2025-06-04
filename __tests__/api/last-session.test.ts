jest.mock("@/lib/api-config", () => ({
  getApiUrl: jest.fn(() => "https://api.test.com/last"),
}))

import { GET } from "@/app/api/last-session/route"
import { NextRequest } from "next/server"

describe("/api/last-session", () => {
  beforeEach(() => {
    global.fetch = jest.fn()
    process.env.API_KEY = "test-api-key"
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("should propagate rate limit errors", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: () => Promise.resolve("Too many requests"),
    })

    const req = new Request("http://localhost:3000/api/last-session")
    const request = new NextRequest(req)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe("Rate Limit")
    expect(data.message).toBe("Zu viele Anfragen. Bitte später erneut versuchen.")
  })
})
