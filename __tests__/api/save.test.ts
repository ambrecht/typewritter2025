// Mock the API config
jest.mock("@/lib/api-config", () => ({
  getApiUrl: jest.fn(() => "https://api.test.com/save"),
}))

import { POST } from "@/app/api/save/route"
import { NextRequest } from "next/server"

describe("/api/save", () => {
  beforeEach(() => {
    global.fetch = jest.fn()
    process.env.API_KEY = "test-api-key"
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("should save text successfully", async () => {
    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ id: 123 })),
    })

    const req = new Request("http://localhost:3000/api/save", {
      method: "POST",
      body: JSON.stringify({ text: "Test text" }),
      headers: { "Content-Type": "application/json" },
    })
    const request = new NextRequest(req)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.message).toBe("Text erfolgreich gespeichert")
    expect(data.id).toBe(123)
  })

  it("should return 400 for invalid input", async () => {
    const req = new Request("http://localhost:3000/api/save", {
      method: "POST",
      body: JSON.stringify({ text: "" }),
      headers: { "Content-Type": "application/json" },
    })
    const request = new NextRequest(req)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Bad Request")
  })


  it("should propagate rate limit errors", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: () => Promise.resolve("Too many requests"),
    })

    const req = new Request("http://localhost:3000/api/save", {
      method: "POST",
      body: JSON.stringify({ text: "Test" }),
      headers: { "Content-Type": "application/json" },
    })
    const request = new NextRequest(req)

    const response = await POST(request)
    const data = await response.json()

    expect(data.error).toBe("Rate Limit")
    expect(data.message).toBe("Zu viele Anfragen. Bitte später erneut versuchen.")
  })
})
