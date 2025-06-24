"use client"

import "@testing-library/jest-dom"
import { Request as FetchRequest, Headers as FetchHeaders, Response as FetchResponse } from "node-fetch"

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return "/"
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock fetch
global.fetch = jest.fn()
if (typeof global.Request === "undefined") {
  global.Request = FetchRequest
}
if (typeof global.Headers === "undefined") {
  global.Headers = FetchHeaders
}
if (typeof global.Response === "undefined") {
  class PolyfillResponse extends FetchResponse {
    static json(data, init) {
      return new PolyfillResponse(JSON.stringify(data), {
        ...(init || {}),
        headers: { ...(init?.headers || {}), "Content-Type": "application/json" },
      })
    }
  }
  global.Response = PolyfillResponse
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
