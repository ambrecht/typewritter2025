// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals"
import { Request as NodeRequest, Response as NodeResponse } from "node-fetch"

let POST: (req: Request) => Promise<Response>

// Mock the API key storage
jest.mock("@/lib/api-key-storage", () => ({
  getApiKey: jest.fn(() => "test-api-key"),
}))

// Mock the API config
jest.mock("@/lib/api-config", () => ({
  getApiUrl: jest.fn(() => "https://api.test.com/save"),
}))

// Provide Request polyfill for node environment
global.Request = NodeRequest as any
global.Response = NodeResponse as any
beforeAll(async () => {
  const mod = await import("@/app/api/save/route")
  POST = mod.POST
})

describe.skip("/api/save", () => {
  beforeEach(() => {
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("should save text successfully", async () => {
    // Mock successful API response
    ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 123 }), { status: 201 }),
    )

    const request = new Request("http://localhost:3000/api/save", {
      method: "POST",
      body: JSON.stringify({ text: "Test text" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.message).toBe("Text erfolgreich gespeichert")
    expect(data.id).toBe(123)
  })

  it("should return 400 for invalid input", async () => {
    const request = new Request("http://localhost:3000/api/save", {
      method: "POST",
      body: JSON.stringify({ text: "" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Bad Request")
  })

  it("should handle API errors", async () => {
    // Mock API error response
    ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Server error" }), { status: 500 }),
    )

    const request = new Request("http://localhost:3000/api/save", {
      method: "POST",
      body: JSON.stringify({ text: "Test text" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("API Error")
  })
})
