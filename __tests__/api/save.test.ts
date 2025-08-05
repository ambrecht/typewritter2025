jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => body,
    }),
  },
}))

import { POST } from "@/app/api/save/route"

// Mock the API key storage
jest.mock("@/lib/api-key-storage", () => ({
  getApiKey: jest.fn(() => "test-api-key"),
}))

// Mock the API config
jest.mock("@/lib/api-config", () => ({
  getApiUrl: jest.fn(() => "https://api.test.com/save"),
}))

describe("/api/save", () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should save text successfully", async () => {
    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ id: 123 })),
    })

    const request = {
      json: async () => ({ text: "Test text" }),
    } as any

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.message).toBe("Text erfolgreich gespeichert")
    expect(data.id).toBe(123)
  })

  it("should return 400 for invalid input", async () => {
    const request = {
      json: async () => ({ text: "" }),
    } as any

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Bad Request")
  })

  it("should handle API errors", async () => {
    // Mock API error response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve(JSON.stringify({ message: "Server error" })),
    })

    const request = {
      json: async () => ({ text: "Test text" }),
    } as any

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("API Error")
  })
})
