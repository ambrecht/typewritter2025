"use client"

import "@testing-library/jest-dom"
import { TextEncoder, TextDecoder } from "util"
import { ReadableStream } from "stream/web"
const { MessageChannel } = require("worker_threads")
const channel = new MessageChannel()

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream
global.MessageChannel = MessageChannel
global.MessagePort = channel.port1.constructor

const { fetch, Headers, Request, Response } = require("undici")

global.fetch = fetch
global.Headers = Headers
global.Request = Request
global.Response = Response

// Provide minimal Request implementation for next/server
global.Request = class {}

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

// Mock fetch and provide Web API classes using node-fetch
const nodeFetch = require("node-fetch")
global.fetch = jest.fn()
global.Request = nodeFetch.Request
global.Response = nodeFetch.Response
global.Headers = nodeFetch.Headers

if (typeof global.Response.json !== "function") {
  global.Response.json = (body, init) => {
    const headers = new global.Headers(init && init.headers)
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }
    return new global.Response(JSON.stringify(body), {
      ...init,
      headers,
    })
  }
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock Canvas getContext
HTMLCanvasElement.prototype.getContext = () => ({
  measureText: () => ({ width: 0 }),
})
